// ==UserScript==
// @name         学业桥分数同步 - 半自动
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  面板输入学校和省份后，第1步自动选中该省份并自动确定；第2/3步自动恢复省份并自动确定；支持刷新续跑；主页面学校输入后自动搜索；修复连续流程重复刷新
// @match        http://data.admin.eol.com.cn/*
// @updateURL    https://tool-hub-2vw.pages.dev/userscripts/academic-bridge-score-synchronization.user.js
// @downloadURL  https://tool-hub-2vw.pages.dev/userscripts/academic-bridge-score-synchronization.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        defaultSchoolName: '大连职业技术学院',
        year: '2025',
        debug: true,
        waitTimeout: 25000,
        pollInterval: 120,
        flowGap: 300,
        autoResumeDelay: 500,
        autoSubmitDelay: 150,
        afterSearchDelay: 500,
        schoolSearchDebounce: 900,
        storageKey: '__XYQ_SCORE_HELPER_STATE__'
    };

    const DEFAULT_STATE = {
        flowRunning: false,
        stopRequested: false,
        currentStep: 0,
        nextStep: 0,
        rememberedProvinceValue: '',
        rememberedProvinceText: '',
        waitingUserConfirm: false,
        lastActionText: '',
        needListSearchAfterRefresh: false,
        panelSchoolName: CONFIG.defaultSchoolName,
        panelProvinceName: '',
        panelCollapsed: false,
        panelLeft: '',
        panelTop: '',
        updatedAt: 0
    };

    const STEP_TEXTS = {
        1: '同步学业桥开启数据',
        2: '校验中间表数据',
        3: '校验成功数据入库'
    };

    let STATE = loadState();
    let schoolSearchTimer = null;
    let schoolSearchRunning = false;

    const TARGET_PROTOCOL = 'http:';
const TARGET_HOST = 'data.admin.eol.com.cn';
const TARGET_HASH_PREFIX = '#/xyq/score/lists';

function isTargetPage() {
    return location.protocol === TARGET_PROTOCOL &&
           location.host === TARGET_HOST &&
           location.hash.startsWith(TARGET_HASH_PREFIX);
}

function removeHelperUI() {
    clearTimeout(schoolSearchTimer);

    const panel = document.getElementById('xyq-helper-panel');
    if (panel) panel.remove();

    const toast = document.getElementById('xyq-helper-toast');
    if (toast) toast.remove();
}

    function log(...args) {
        if (CONFIG.debug) console.log('[学业桥助手]', ...args);
    }

    function warn(...args) {
        console.warn('[学业桥助手]', ...args);
    }

    function err(...args) {
        console.error('[学业桥助手]', ...args);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function normalizeText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    function looseNormalizeText(text) {
        return normalizeText(text).replace(/\s+/g, '');
    }

    function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               el.offsetParent !== null;
    }

    function isInsideHelperOrModal(el) {
        return !!(el && el.closest && el.closest('#xyq-helper-panel, #xyq-helper-toast, #popAE'));
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(CONFIG.storageKey);
            if (!raw) return { ...DEFAULT_STATE };
            const parsed = JSON.parse(raw);
            return { ...DEFAULT_STATE, ...parsed };
        } catch (e) {
            err('读取状态失败，使用默认状态', e);
            return { ...DEFAULT_STATE };
        }
    }

    function saveState(patch = {}) {
        STATE = {
            ...STATE,
            ...patch,
            updatedAt: Date.now()
        };
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(STATE));
        updatePanelInputsUI();
        updateRememberedProvinceUI();
        updateFlowStatusUI();
        updatePanelCollapsedUI();
        updatePanelPositionUI();
        log('状态已保存：', STATE);
    }

    function clearState() {
        const keepPanelLeft = STATE.panelLeft;
        const keepPanelTop = STATE.panelTop;
        const keepPanelCollapsed = STATE.panelCollapsed;

        STATE = {
            ...DEFAULT_STATE,
            panelLeft: keepPanelLeft,
            panelTop: keepPanelTop,
            panelCollapsed: keepPanelCollapsed
        };

        localStorage.setItem(CONFIG.storageKey, JSON.stringify(STATE));
        updatePanelInputsUI();
        updateRememberedProvinceUI();
        updateFlowStatusUI();
        updatePanelCollapsedUI();
        updatePanelPositionUI();
        log('状态已清空');
    }

    async function waitFor(fn, timeout = CONFIG.waitTimeout, interval = CONFIG.pollInterval, desc = '目标') {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            try {
                const result = fn();
                if (result) return result;
            } catch (_) {}
            await sleep(interval);
        }
        throw new Error(`等待超时：${desc}`);
    }

    function realClick(el) {
        if (!el) return false;
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return true;
    }

    function setNativeValue(el, value) {
        if (!el) return;
        const prototype = Object.getPrototypeOf(el);
        const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
        if (descriptor && descriptor.set) {
            descriptor.set.call(el, value);
        } else {
            el.value = value;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('keyup', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    function setSelect2SearchValue(input, value) {
        if (!input) return;

        input.focus();
        setNativeValue(input, value);

        const keyboardEvents = [
            new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: value.slice(-1) || 'a', keyCode: 65, which: 65 }),
            new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: value.slice(-1) || 'a', keyCode: 65, which: 65 }),
            new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: value.slice(-1) || 'a', keyCode: 65, which: 65 })
        ];

        keyboardEvents.forEach(evt => input.dispatchEvent(evt));

        if (window.jQuery) {
            try {
                window.jQuery(input)
                    .val(value)
                    .trigger('input')
                    .trigger('change')
                    .trigger('keyup');
            } catch (_) {}
        }
    }

    function setNativeSelectValue(select, value) {
        if (!select) return false;
        const target = Array.from(select.options).find(opt => String(opt.value).trim() === String(value).trim());
        if (!target) return false;

        select.value = target.value;
        target.selected = true;

        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('blur', { bubbles: true }));

        if (window.jQuery) {
            try {
                window.jQuery(select).val(target.value).trigger('change');
            } catch (_) {}
        }

        return true;
    }

    function showToast(message, isError = false) {
        let toast = document.getElementById('xyq-helper-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'xyq-helper-toast';
            toast.style.position = 'fixed';
            toast.style.right = '20px';
            toast.style.bottom = '20px';
            toast.style.zIndex = '999999';
            toast.style.maxWidth = '540px';
            toast.style.padding = '12px 16px';
            toast.style.borderRadius = '8px';
            toast.style.color = '#fff';
            toast.style.fontSize = '14px';
            toast.style.lineHeight = '1.6';
            toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
            toast.style.transition = 'all .3s ease';
            document.body.appendChild(toast);
        }

        toast.style.background = isError ? '#d9534f' : '#5cb85c';
        toast.textContent = message;
        toast.style.opacity = '1';

        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.style.opacity = '0';
        }, 4500);
    }

    function getModal() {
        return document.querySelector('#popAE');
    }

    function isModalVisible() {
        const modal = getModal();
        if (!modal) return false;
        return modal.classList.contains('in') || isVisible(modal);
    }

    async function waitModalVisible() {
        return await waitFor(() => {
            const modal = getModal();
            if (!modal) return null;
            return (modal.classList.contains('in') || isVisible(modal)) ? modal : null;
        }, CONFIG.waitTimeout, CONFIG.pollInterval, '弹窗出现');
    }

    function findActionButtonByText(text) {
        const btns = Array.from(document.querySelectorAll('a.btn'));
        return btns.find(el => normalizeText(el.textContent).includes(text));
    }

    function findFormGroupByLabel(modal, labelKeyword) {
        if (!modal) return null;

        const rows = Array.from(modal.querySelectorAll('.form-group, .row, .control-group'));
        for (const row of rows) {
            const text = normalizeText(row.textContent);
            if (text.includes(labelKeyword)) return row;
        }

        const all = Array.from(modal.querySelectorAll('label, .control-label, td, div, span'));
        for (const el of all) {
            const text = normalizeText(el.textContent);
            if (text === labelKeyword || text.includes(labelKeyword)) {
                let p = el;
                for (let i = 0; i < 4 && p; i++) {
                    if (p.querySelector && (
                        p.querySelector('input') ||
                        p.querySelector('select') ||
                        p.querySelector('.select2-container')
                    )) {
                        return p;
                    }
                    p = p.parentElement;
                }
            }
        }

        return null;
    }

    function findSchoolContainerInModal(modal) {
        const schoolRow = findFormGroupByLabel(modal, '学校');
        if (!schoolRow) return null;

        const candidates = Array.from(
            schoolRow.querySelectorAll('.select2-container, .select2-choice, [id^="s2id_"]')
        ).filter(isVisible);

        return candidates[0] || null;
    }

    function findYearSelectInModal(modal) {
        if (!modal) return null;

        let select = modal.querySelector('select[name="year"]');
        if (select && isVisible(select)) return select;

        const yearRow = findFormGroupByLabel(modal, '年份');
        if (yearRow) {
            const s = Array.from(yearRow.querySelectorAll('select')).find(isVisible);
            if (s) return s;
        }

        const allSelects = Array.from(modal.querySelectorAll('select')).filter(isVisible);
        for (const s of allSelects) {
            const values = Array.from(s.options).map(o => String(o.value || '').trim() || normalizeText(o.textContent));
            if (values.includes('2025') && values.includes('2026')) {
                return s;
            }
        }

        return null;
    }

    function findProvinceSelectInModal(modal) {
        if (!modal) return null;

        let select = modal.querySelector('select[name="province_id"]');
        if (select && isVisible(select)) return select;

        select = modal.querySelector('#province1');
        if (select && isVisible(select)) return select;

        select = modal.querySelector('select.form-control.form-select[name="province_id"]');
        if (select && isVisible(select)) return select;

        const provinceRow = findFormGroupByLabel(modal, '省份');
        if (provinceRow) {
            const s = Array.from(provinceRow.querySelectorAll('select')).find(isVisible);
            if (s) return s;
        }

        const allSelects = Array.from(modal.querySelectorAll('select')).filter(isVisible);
        for (const s of allSelects) {
            if (s.name === 'province_id' || s.id === 'province1') return s;
        }

        return null;
    }

    function findSubmitButtonInModal(modal) {
        if (!modal) return null;

        let btn = modal.querySelector('#form_submit');
        if (btn && isVisible(btn)) return btn;

        btn = Array.from(modal.querySelectorAll('a.btn.btn-primary, button.btn.btn-primary'))
            .find(el => isVisible(el) && normalizeText(el.textContent) === '确定');
        if (btn) return btn;

        return null;
    }

    function findListSearchButton() {
        let btn = document.querySelector('#submit-btn');
        if (btn && isVisible(btn) && !isInsideHelperOrModal(btn)) return btn;

        btn = Array.from(document.querySelectorAll('input[type="submit"], button, a'))
            .find(el => !isInsideHelperOrModal(el) && isVisible(el) && (
                el.id === 'submit-btn' ||
                normalizeText(el.value) === '搜索' ||
                normalizeText(el.textContent) === '搜索'
            ));

        return btn || null;
    }

    function findListProvinceSelect() {
        let select = document.querySelector('select#province[name="province_id"]');
        if (select && isVisible(select) && !isInsideHelperOrModal(select)) return select;

        select = document.querySelector('#province');
        if (select && isVisible(select) && !isInsideHelperOrModal(select)) return select;

        select = document.querySelector('select[name="province_id"]#province');
        if (select && isVisible(select) && !isInsideHelperOrModal(select)) return select;

        return null;
    }

    function findListFormGroupByLabel(labelKeyword) {
        const labels = Array.from(document.querySelectorAll('label, .control-label, td, div, span'))
            .filter(el => !isInsideHelperOrModal(el) && isVisible(el))
            .filter(el => {
                const text = normalizeText(el.textContent);
                return text === labelKeyword || text.includes(labelKeyword);
            });

        for (const label of labels) {
            let p = label;
            for (let i = 0; i < 8 && p; i++) {
                if (p.querySelector) {
                    const hasControl = p.querySelector('.select2-container, [id^="s2id_"], select, input');
                    const textLen = normalizeText(p.textContent).length;
                    if (hasControl && textLen < 800) {
                        return p;
                    }
                }
                p = p.parentElement;
            }
        }

        return null;
    }

    function findNearestControlByLabel(labelKeyword, controlSelector) {
        const labels = Array.from(document.querySelectorAll('label, .control-label, td, div, span'))
            .filter(el => !isInsideHelperOrModal(el) && isVisible(el))
            .filter(el => normalizeText(el.textContent).includes(labelKeyword));

        const controls = Array.from(document.querySelectorAll(controlSelector))
            .filter(el => !isInsideHelperOrModal(el) && isVisible(el));

        let best = null;
        let bestScore = Infinity;

        for (const label of labels) {
            const lr = label.getBoundingClientRect();

            for (const control of controls) {
                const cr = control.getBoundingClientRect();

                const verticalDistance = Math.abs((cr.top + cr.height / 2) - (lr.top + lr.height / 2));
                const horizontalDistance = Math.abs(cr.left - lr.right);

                if (verticalDistance > 45) continue;
                if (cr.left < lr.left - 20) continue;

                const score = verticalDistance * 10 + horizontalDistance;
                if (score < bestScore) {
                    bestScore = score;
                    best = control;
                }
            }
        }

        return best;
    }

    function findListSchoolContainer() {
        const directSelectors = [
            '#s2id_school_id',
            '#s2id_school',
            '#s2id_university_id',
            '#s2id_university',
            '#s2id_university_name',
            '#s2id_university_id',
            '#s2id_college_id',
            '#s2id_college',
            '[id^="s2id_"][id*="school"]',
            '[id^="s2id_"][id*="university"]',
            '[id^="s2id_"][id*="college"]'
        ];

        for (const selector of directSelectors) {
            const el = document.querySelector(selector);
            if (el && isVisible(el) && !isInsideHelperOrModal(el)) return el;
        }

        const row =
            findListFormGroupByLabel('学校名称') ||
            findListFormGroupByLabel('学校');

        if (row) {
            const candidates = Array.from(row.querySelectorAll('.select2-container, [id^="s2id_"]'))
                .filter(el => isVisible(el) && !isInsideHelperOrModal(el));
            if (candidates.length) return candidates[0];
        }

        const nearest =
            findNearestControlByLabel('学校名称', '.select2-container, [id^="s2id_"]') ||
            findNearestControlByLabel('学校', '.select2-container, [id^="s2id_"]');

        if (nearest) return nearest;

        return null;
    }

    function findListSchoolSelect() {
        const selectors = [
            'select[name="school_id"]',
            'select#school_id',
            'select[name="university_id"]',
            'select#university_id',
            'select[name="college_id"]',
            'select#college_id',
            'select[name="school"]',
            'select#school'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && !isInsideHelperOrModal(el)) return el;
        }

        const row =
            findListFormGroupByLabel('学校名称') ||
            findListFormGroupByLabel('学校');

        if (row) {
            const select = Array.from(row.querySelectorAll('select'))
                .find(el => !isInsideHelperOrModal(el));
            if (select) return select;
        }

        const nearest =
            findNearestControlByLabel('学校名称', 'select') ||
            findNearestControlByLabel('学校', 'select');

        return nearest || null;
    }

    function findListSchoolTextInput() {
        const row =
            findListFormGroupByLabel('学校名称') ||
            findListFormGroupByLabel('学校');

        if (row) {
            const input = Array.from(row.querySelectorAll('input[type="text"], input:not([type])'))
                .find(el => !isInsideHelperOrModal(el) && !el.classList.contains('select2-input'));
            if (input) return input;
        }

        const nearest =
            findNearestControlByLabel('学校名称', 'input[type="text"], input:not([type])') ||
            findNearestControlByLabel('学校', 'input[type="text"], input:not([type])');

        if (nearest && !nearest.classList.contains('select2-input')) return nearest;

        return null;
    }

    function getVisibleSchoolOptions() {
        const raw = Array.from(document.querySelectorAll(
            '.select2-results li, .select2-results .select2-result-label, .select2-result-label'
        )).filter(isVisible);

        return raw.filter(el => {
            const text = normalizeText(el.textContent);
            if (!text) return false;
            if (/searching/i.test(text)) return false;
            if (text.includes('请输入')) return false;
            if (text.includes('没有找到')) return false;
            if (text.includes('正在搜索')) return false;
            return true;
        });
    }

    function pickExactSchoolOption(options, schoolName) {
        const target = normalizeText(schoolName);
        const looseTarget = looseNormalizeText(schoolName);

        let exact = options.find(el => normalizeText(el.textContent) === target);
        if (exact) return exact;

        exact = options.find(el => looseNormalizeText(el.textContent) === looseTarget);
        if (exact) return exact;

        const contains = options.filter(el => {
            const text = normalizeText(el.textContent);
            const looseText = looseNormalizeText(el.textContent);
            return text.includes(target) || looseText.includes(looseTarget);
        });

        if (contains.length === 1) return contains[0];

        return null;
    }

    function getClickableSelect2Option(optionEl) {
        if (!optionEl) return null;
        return optionEl.closest('.select2-result-selectable') ||
               optionEl.closest('li') ||
               optionEl;
    }

    async function fillSchoolBySelect2Container(container, schoolName, desc) {
        log(`开始填写${desc}学校：`, schoolName);

        const trigger =
            container.querySelector('.select2-choice') ||
            container.querySelector('.select2-chosen') ||
            container;

        realClick(trigger);
        await sleep(180);

        const input = await waitFor(() => {
            const inputs = Array.from(document.querySelectorAll(
                '.select2-drop-active .select2-input, .select2-drop-active input, .select2-search input, input.select2-input'
            )).filter(isVisible);
            return inputs[0] || null;
        }, 5000, 80, `${desc}学校搜索输入框`);

        setSelect2SearchValue(input, schoolName);
        await sleep(500);

        const option = await waitFor(() => {
            const options = getVisibleSchoolOptions();
            return pickExactSchoolOption(options, schoolName);
        }, 8000, 120, `${desc}学校精确候选项：${schoolName}`);

        const optionText = normalizeText(option.textContent);
        const clickable = getClickableSelect2Option(option);

        realClick(clickable);
        await sleep(300);

        const shownText = normalizeText(
            container.querySelector('.select2-chosen')?.textContent ||
            container.textContent
        );

        if (shownText !== normalizeText(schoolName) &&
            looseNormalizeText(shownText) !== looseNormalizeText(schoolName) &&
            !looseNormalizeText(shownText).includes(looseNormalizeText(schoolName))) {
            throw new Error(`${desc}学校最终选中值校验失败，候选项：${optionText}，当前显示：${shownText}`);
        }

        log(`${desc}学校填写完成：`, shownText);
        return true;
    }

    function trySetListSchoolBySelectText(schoolName) {
        const select = findListSchoolSelect();
        if (!select) return false;

        const target = normalizeText(schoolName);
        const looseTarget = looseNormalizeText(schoolName);

        const option = Array.from(select.options || []).find(opt => {
            const text = normalizeText(opt.textContent);
            const looseText = looseNormalizeText(opt.textContent);
            return text === target || looseText === looseTarget;
        });

        if (!option) return false;

        select.value = option.value;
        option.selected = true;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('blur', { bubbles: true }));

        if (window.jQuery) {
            try {
                window.jQuery(select).val(option.value).trigger('change');
            } catch (_) {}
        }

        log('已通过原生 select 设置主页面学校：', schoolName, option.value);
        return true;
    }

    function trySetListSchoolByTextInput(schoolName) {
        const input = findListSchoolTextInput();
        if (!input) return false;

        setNativeValue(input, schoolName);

        if (window.jQuery) {
            try {
                window.jQuery(input).val(schoolName).trigger('input').trigger('change').trigger('keyup');
            } catch (_) {}
        }

        log('已通过文本输入框设置主页面学校：', schoolName);
        return true;
    }

    async function applyListSchoolAndSearchFromPanel(options = {}) {
        const silent = !!options.silent;
        const schoolName = getPanelSchoolName();

        if (!schoolName) return false;

        if (STATE.flowRunning || STATE.waitingUserConfirm) {
            log('连续流程运行中，跳过主页面学校自动搜索，避免额外刷新');
            return false;
        }

        if (isModalVisible()) {
            log('当前有弹窗，跳过主页面学校自动搜索');
            return false;
        }

        if (schoolSearchRunning) {
            log('主页面学校搜索正在执行中，跳过重复触发');
            return false;
        }

        schoolSearchRunning = true;

        try {
            updateFlowStatus(`正在切换主页面学校：${schoolName}`);

            let done = false;

            const container = findListSchoolContainer();
            if (container) {
                done = await fillSchoolBySelect2Container(container, schoolName, '主页面');
            }

            if (!done) {
                done = trySetListSchoolBySelectText(schoolName);
            }

            if (!done) {
                done = trySetListSchoolByTextInput(schoolName);
            }

            if (!done) {
                throw new Error('未找到主页面“学校名称”筛选框，或未匹配到学校候选项');
            }

            const searchBtn = await waitFor(
                () => findListSearchButton(),
                6000,
                100,
                '主页面搜索按钮'
            );

            realClick(searchBtn);
            log('学校输入后已自动点击主页面搜索按钮');

            await sleep(CONFIG.afterSearchDelay);
            updateFlowStatusUI();

            if (!silent) {
                showToast(`已自动切换主页面学校为【${schoolName}】并执行搜索`);
            }

            return true;
        } catch (e) {
            err('主页面学校自动搜索失败：', e);
            updateFlowStatusUI();

            if (!silent) {
                showToast(`主页面学校自动搜索失败：${e.message}`, true);
            }

            return false;
        } finally {
            schoolSearchRunning = false;
        }
    }

    function scheduleApplyListSchoolFromPanel() {
        clearTimeout(schoolSearchTimer);

        const schoolName = getPanelSchoolName();
        if (!schoolName) return;

        schoolSearchTimer = setTimeout(() => {
            applyListSchoolAndSearchFromPanel({ silent: false });
        }, CONFIG.schoolSearchDebounce);
    }

    async function restoreListProvinceWithoutSearch() {
        if (!STATE.rememberedProvinceValue) return false;

        const provinceSelect = findListProvinceSelect();
        if (!provinceSelect) return false;

        const ok = setNativeSelectValue(provinceSelect, STATE.rememberedProvinceValue);
        if (!ok) return false;

        const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
        const selectedText = selectedOption ? normalizeText(selectedOption.textContent) : '';

        log('已静默恢复列表页省份，不点击搜索：', {
            value: provinceSelect.value,
            text: selectedText
        });

        return true;
    }

    async function fillSchoolInModal(modal, schoolName) {
        const schoolContainer = findSchoolContainerInModal(modal);
        if (!schoolContainer) {
            throw new Error('未找到“学校”对应的选择框容器');
        }

        await fillSchoolBySelect2Container(schoolContainer, schoolName, '弹窗');
    }

    async function fillYearInModal(modal, year) {
        log('开始选择年份：', year);

        const yearSelect = findYearSelectInModal(modal);
        if (!yearSelect) {
            throw new Error('未找到年份下拉框');
        }

        const ok = setNativeSelectValue(yearSelect, year);
        if (!ok) {
            throw new Error(`年份设置失败：${year}`);
        }

        await sleep(150);
        log('年份选择完成');
    }

    function captureProvinceFromModal(modal) {
        const provinceSelect = findProvinceSelectInModal(modal);
        if (!provinceSelect) {
            warn('未找到省份下拉框，无法记忆省份');
            return false;
        }

        const value = String(provinceSelect.value || '').trim();
        const selectedIndex = provinceSelect.selectedIndex;
        const option = provinceSelect.options[selectedIndex];
        const text = option ? normalizeText(option.textContent) : '';

        log('正在读取弹窗省份：', {
            value,
            text,
            selectedIndex,
            id: provinceSelect.id,
            name: provinceSelect.name
        });

        if (!value || text === '全部' || value === '0') {
            return false;
        }

        saveState({
            rememberedProvinceValue: value,
            rememberedProvinceText: text
        });

        return true;
    }

    async function restoreProvinceInModal(modal) {
        if (!STATE.rememberedProvinceValue) {
            warn('没有已记忆的省份，跳过恢复');
            return false;
        }

        const provinceSelect = findProvinceSelectInModal(modal);
        if (!provinceSelect) {
            throw new Error('未找到弹窗省份下拉框，无法恢复');
        }

        const ok = setNativeSelectValue(provinceSelect, STATE.rememberedProvinceValue);
        if (!ok) {
            throw new Error(`弹窗省份恢复失败，未找到 value=${STATE.rememberedProvinceValue} 的选项`);
        }

        const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
        const selectedText = selectedOption ? normalizeText(selectedOption.textContent) : '';

        saveState({
            rememberedProvinceValue: provinceSelect.value,
            rememberedProvinceText: selectedText
        });

        log('弹窗省份已恢复：', {
            value: provinceSelect.value,
            text: selectedText
        });

        return true;
    }

    function findProvinceOptionByName(select, provinceName) {
        if (!select || !provinceName) return null;

        const target = normalizeText(provinceName);
        const looseTarget = looseNormalizeText(provinceName);

        return Array.from(select.options).find(opt => {
            const text = normalizeText(opt.textContent);
            const looseText = looseNormalizeText(opt.textContent);
            if (!text || text === '全部') return false;
            return text === target || looseText === looseTarget;
        }) || null;
    }

    async function setProvinceInStep1FromPanel(modal) {
        const provinceName = normalizeText(STATE.panelProvinceName || '');
        if (!provinceName) {
            log('面板未填写省份，第1步跳过自动选省份');
            return false;
        }

        const provinceSelect = findProvinceSelectInModal(modal);
        if (!provinceSelect) {
            throw new Error('第1步未找到省份下拉框');
        }

        const targetOption = findProvinceOptionByName(provinceSelect, provinceName);
        if (!targetOption) {
            throw new Error(`第1步省份自动选择失败：未找到省份【${provinceName}】`);
        }

        provinceSelect.value = targetOption.value;
        targetOption.selected = true;
        provinceSelect.dispatchEvent(new Event('input', { bubbles: true }));
        provinceSelect.dispatchEvent(new Event('change', { bubbles: true }));
        provinceSelect.dispatchEvent(new Event('blur', { bubbles: true }));

        if (window.jQuery) {
            try {
                window.jQuery(provinceSelect).val(targetOption.value).trigger('change');
            } catch (_) {}
        }

        saveState({
            rememberedProvinceValue: targetOption.value,
            rememberedProvinceText: normalizeText(targetOption.textContent)
        });

        log('第1步已按面板输入自动选中省份：', {
            value: targetOption.value,
            text: normalizeText(targetOption.textContent)
        });

        return true;
    }

    async function autoSubmitCurrentModal(modal, stepIndex) {
        const submitBtn = await waitFor(() => findSubmitButtonInModal(modal), 5000, 80, '确定按钮');
        if (!submitBtn) {
            throw new Error(`第${stepIndex}步未找到确定按钮`);
        }

        log(`第${stepIndex}步准备自动点击确定按钮`);
        await sleep(CONFIG.autoSubmitDelay);
        realClick(submitBtn);
    }

    async function waitForModalCloseOrRefresh(modal, stepIndex) {
        const start = Date.now();
        while (true) {
            if (!isModalVisible()) {
                log(`第${stepIndex}步弹窗已关闭，等待页面刷新/续跑`);
                break;
            }

            if (stepIndex === 1) {
                captureProvinceFromModal(modal);
            }

            if (Date.now() - start > CONFIG.waitTimeout * 6) {
                throw new Error(`等待第${stepIndex}步提交完成超时`);
            }

            await sleep(120);
        }
    }

    function getPanelSchoolName() {
        return normalizeText(STATE.panelSchoolName || '');
    }

    async function openAndFill(actionText, stepIndex) {
        log(`准备执行：${actionText}`);

        const btn = findActionButtonByText(actionText);
        if (!btn) {
            throw new Error(`未找到按钮：${actionText}`);
        }

        const schoolName = getPanelSchoolName();
        if (!schoolName) {
            throw new Error('请先在助手面板中填写学校名称');
        }

        saveState({
            currentStep: stepIndex,
            lastActionText: actionText
        });

        realClick(btn);
        log('已点击功能按钮，等待弹窗...');

        const modal = await waitModalVisible();
        await sleep(250);

        await fillSchoolInModal(modal, schoolName);
        await fillYearInModal(modal, CONFIG.year);

        if (stepIndex >= 2) {
            await restoreProvinceInModal(modal);
        }

        saveState({
            waitingUserConfirm: true,
            nextStep: stepIndex + 1,
            needListSearchAfterRefresh: false
        });

        return modal;
    }

    async function executeStep(stepIndex) {
        const actionText = STEP_TEXTS[stepIndex];
        if (!actionText) {
            throw new Error(`无效步骤：${stepIndex}`);
        }

        const modal = await openAndFill(actionText, stepIndex);

        if (stepIndex === 1) {
            const autoSelected = await setProvinceInStep1FromPanel(modal);

            if (autoSelected) {
                updateFlowStatus(`第1步进行中：已自动选择省份，准备自动点击确定`);
                showToast(`第1步已自动选择省份【${STATE.rememberedProvinceText}】，正在自动点击确定`);
            } else {
                updateFlowStatus(`第1步进行中：未填写省份，保持当前选择，准备自动点击确定`);
                showToast('第1步未填写省份，将按当前弹窗中的省份直接自动点击确定');
            }

            await autoSubmitCurrentModal(modal, stepIndex);
            await waitForModalCloseOrRefresh(modal, stepIndex);
        } else {
            updateFlowStatus(`第${stepIndex}步进行中：已自动恢复省份，准备自动点击确定`);
            showToast(`第${stepIndex}步已自动恢复省份，正在自动点击确定`);
            await autoSubmitCurrentModal(modal, stepIndex);
            await waitForModalCloseOrRefresh(modal, stepIndex);
        }
    }

    function updateFlowStatus(text) {
        const el = document.getElementById('xyq-helper-flow-status');
        if (el) el.textContent = text;
    }

    function updatePanelInputsUI() {
        const schoolInput = document.getElementById('xyq-helper-school-input');
        if (schoolInput && document.activeElement !== schoolInput) {
            schoolInput.value = STATE.panelSchoolName || '';
        }

        const provinceInput = document.getElementById('xyq-helper-province-input');
        if (provinceInput && document.activeElement !== provinceInput) {
            provinceInput.value = STATE.panelProvinceName || '';
        }
    }

    function updateFlowStatusUI() {
        const el = document.getElementById('xyq-helper-flow-status');
        if (!el) return;

        if (!STATE.flowRunning) {
            el.textContent = '空闲';
            return;
        }

        const stepText = STATE.currentStep ? `第 ${STATE.currentStep} 步` : '未开始';
        const waitText = STATE.waitingUserConfirm ? '，等待提交/刷新续跑' : '';
        el.textContent = `运行中：${stepText}${waitText}`;
    }

    function updateRememberedProvinceUI() {
        const el = document.getElementById('xyq-helper-province-memory');
        if (!el) return;

        if (STATE.rememberedProvinceValue) {
            el.innerHTML = `已记忆省份：<b>${STATE.rememberedProvinceText}</b>（value=${STATE.rememberedProvinceValue}）`;
        } else {
            el.innerHTML = `已记忆省份：<b>无</b>`;
        }
    }

    function updatePanelCollapsedUI() {
        const panel = document.getElementById('xyq-helper-panel');
        const body = document.getElementById('xyq-helper-panel-body');
        const toggleBtn = document.getElementById('xyq-helper-toggle-panel');
        const titleText = document.getElementById('xyq-helper-title-text');

        if (!panel || !body || !toggleBtn || !titleText) return;

        if (STATE.panelCollapsed) {
            body.style.display = 'none';
            panel.style.width = '142px';
            panel.style.minWidth = '142px';
            panel.style.maxHeight = 'none';
            panel.style.overflow = 'hidden';
            panel.style.padding = '8px 10px';
            toggleBtn.textContent = '展开';
            titleText.textContent = '学业桥助手';
        } else {
            body.style.display = 'block';
            panel.style.width = '330px';
            panel.style.minWidth = '300px';
            panel.style.maxHeight = '76vh';
            panel.style.overflow = 'auto';
            panel.style.padding = '12px';
            toggleBtn.textContent = '收起';
            titleText.textContent = '学业桥分数半自动助手';
        }
    }

    function updatePanelPositionUI() {
        const panel = document.getElementById('xyq-helper-panel');
        if (!panel) return;

        if (STATE.panelLeft !== '' && STATE.panelTop !== '') {
            panel.style.left = `${STATE.panelLeft}px`;
            panel.style.top = `${STATE.panelTop}px`;
            panel.style.bottom = 'auto';
        }
    }

    function toggleFlowButtons(running) {
        const startBtn = document.getElementById('xyq-helper-start-flow');
        const stopBtn = document.getElementById('xyq-helper-stop-flow');
        const clearBtn = document.getElementById('xyq-helper-clear-state');

        if (startBtn) {
            startBtn.disabled = running;
            startBtn.style.opacity = running ? '0.6' : '1';
            startBtn.style.cursor = running ? 'not-allowed' : 'pointer';
        }

        if (stopBtn) {
            stopBtn.disabled = !running;
            stopBtn.style.opacity = running ? '1' : '0.6';
            stopBtn.style.cursor = running ? 'pointer' : 'not-allowed';
        }

        if (clearBtn) {
            clearBtn.disabled = running;
            clearBtn.style.opacity = running ? '0.6' : '1';
            clearBtn.style.cursor = running ? 'not-allowed' : 'pointer';
        }
    }

    function syncButtonsByState() {
        toggleFlowButtons(STATE.flowRunning);
    }

    function stopSequentialFlow() {
        saveState({
            flowRunning: false,
            stopRequested: true,
            waitingUserConfirm: false,
            currentStep: 0,
            nextStep: 0,
            lastActionText: '',
            needListSearchAfterRefresh: false
        });

        showToast('已停止连续流程');
        syncButtonsByState();
    }

    function finishFlow() {
        const rememberedProvinceValue = STATE.rememberedProvinceValue;
        const rememberedProvinceText = STATE.rememberedProvinceText;
        const panelSchoolName = STATE.panelSchoolName;
        const panelProvinceName = STATE.panelProvinceName;
        const panelCollapsed = STATE.panelCollapsed;
        const panelLeft = STATE.panelLeft;
        const panelTop = STATE.panelTop;

        clearState();

        saveState({
            rememberedProvinceValue,
            rememberedProvinceText,
            panelSchoolName,
            panelProvinceName,
            panelCollapsed,
            panelLeft,
            panelTop,
            flowRunning: false,
            waitingUserConfirm: false,
            currentStep: 0,
            nextStep: 0,
            needListSearchAfterRefresh: false
        });

        updateFlowStatus('已完成：1→2→3 全部执行完毕');
        showToast('连续流程已完成：1→2→3 全部执行完毕');
        syncButtonsByState();
    }

    function startSequentialFlow() {
        clearTimeout(schoolSearchTimer);

        saveState({
            flowRunning: true,
            stopRequested: false,
            currentStep: 0,
            nextStep: 1,
            waitingUserConfirm: false,
            lastActionText: '',
            rememberedProvinceValue: '',
            rememberedProvinceText: '',
            needListSearchAfterRefresh: false
        });

        syncButtonsByState();
        showToast('连续流程已启动，将从第1步开始');
        runAutoResumeFlow();
    }

    async function runAutoResumeFlow() {
        try {
            if (!STATE.flowRunning) {
                syncButtonsByState();
                return;
            }

            if (STATE.needListSearchAfterRefresh) {
                saveState({
                    needListSearchAfterRefresh: false
                });
            }

            await restoreListProvinceWithoutSearch();

            if (STATE.waitingUserConfirm) {
                const next = STATE.nextStep || 0;

                if (next > 3) {
                    finishFlow();
                    return;
                }

                log('检测到刷新后的自动续跑，下一步：', next);
                updateFlowStatus(`检测到页面刷新，准备自动续跑第 ${next} 步`);
                showToast(`检测到页面刷新，准备自动续跑第 ${next} 步`);

                await sleep(CONFIG.autoResumeDelay);

                saveState({
                    waitingUserConfirm: false,
                    currentStep: 0,
                    needListSearchAfterRefresh: false
                });

                await executeStep(next);
                return;
            }

            let stepToRun = STATE.nextStep || 1;
            if (stepToRun > 3) {
                finishFlow();
                return;
            }

            updateFlowStatus(`准备执行第 ${stepToRun} 步`);
            await sleep(100);
            await executeStep(stepToRun);
        } catch (e) {
            err('自动续跑失败：', e);
            showToast(`连续流程中断：${e.message}`, true);
            saveState({
                flowRunning: false,
                waitingUserConfirm: false,
                currentStep: 0,
                nextStep: 0,
                lastActionText: '',
                needListSearchAfterRefresh: false
            });
            syncButtonsByState();
        }
    }

    async function runSingleStep(stepIndex) {
        try {
            await executeStep(stepIndex);
        } catch (e) {
            err(e);
            showToast(`执行失败：${e.message}`, true);
        }
    }

    function createButton(text, onClick, bgColor, id = '') {
        const btn = document.createElement('button');
        if (id) btn.id = id;
        btn.textContent = text;
        btn.style.display = 'block';
        btn.style.width = '100%';
        btn.style.marginBottom = '7px';
        btn.style.padding = '8px 10px';
        btn.style.border = 'none';
        btn.style.borderRadius = '6px';
        btn.style.background = bgColor;
        btn.style.color = '#fff';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '13px';
        btn.style.lineHeight = '1.4';
        btn.addEventListener('click', onClick);
        btn.addEventListener('mouseenter', () => {
            if (!btn.disabled) btn.style.opacity = '0.9';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.opacity = btn.disabled ? '0.6' : '1';
        });
        return btn;
    }

    function createTextInput(labelText, placeholder, value, onInput, id = '', onEnter = null) {
        const box = document.createElement('div');
        box.style.marginBottom = '10px';

        const label = document.createElement('div');
        label.textContent = labelText;
        label.style.fontSize = '12px';
        label.style.color = '#444';
        label.style.marginBottom = '5px';
        label.style.fontWeight = 'bold';

        const input = document.createElement('input');
        if (id) input.id = id;
        input.type = 'text';
        input.placeholder = placeholder;
        input.value = value || '';
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
        input.style.padding = '7px 9px';
        input.style.border = '1px solid #ddd';
        input.style.borderRadius = '6px';
        input.style.fontSize = '13px';
        input.style.outline = 'none';

        input.addEventListener('input', onInput);

        if (onEnter) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onEnter(e);
                }
            });
        }

        box.appendChild(label);
        box.appendChild(input);
        return box;
    }

    function enablePanelDrag(panel, handle) {
        let dragging = false;
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;

        handle.addEventListener('mousedown', (e) => {
            if (e.target && e.target.closest && e.target.closest('button, input, textarea, select, a')) {
                return;
            }

            dragging = true;
            const rect = panel.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startLeft = rect.left;
            startTop = rect.top;
            panel.style.bottom = 'auto';
            panel.style.left = `${startLeft}px`;
            panel.style.top = `${startTop}px`;
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const panelRect = panel.getBoundingClientRect();
            const maxLeft = Math.max(0, window.innerWidth - panelRect.width - 10);
            const maxTop = Math.max(0, window.innerHeight - 40);

            const nextLeft = Math.min(Math.max(0, startLeft + dx), maxLeft);
            const nextTop = Math.min(Math.max(0, startTop + dy), maxTop);

            panel.style.left = `${nextLeft}px`;
            panel.style.top = `${nextTop}px`;
        });

        document.addEventListener('mouseup', () => {
            if (!dragging) return;

            dragging = false;
            document.body.style.userSelect = '';

            const rect = panel.getBoundingClientRect();
            saveState({
                panelLeft: Math.round(rect.left),
                panelTop: Math.round(rect.top)
            });
        });
    }

    function createPanel() {
        if (document.getElementById('xyq-helper-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'xyq-helper-panel';
        panel.style.position = 'fixed';
        panel.style.left = '12px';
        panel.style.bottom = '18px';
        panel.style.width = '330px';
        panel.style.minWidth = '300px';
        panel.style.maxHeight = '76vh';
        panel.style.overflow = 'auto';
        panel.style.background = '#fff';
        panel.style.border = '1px solid #ddd';
        panel.style.borderRadius = '10px';
        panel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
        panel.style.zIndex = '999999';
        panel.style.padding = '12px';
        panel.style.fontSize = '13px';
        panel.style.color = '#333';

        const titleBar = document.createElement('div');
        titleBar.id = 'xyq-helper-title-bar';
        titleBar.style.display = 'flex';
        titleBar.style.alignItems = 'center';
        titleBar.style.justifyContent = 'space-between';
        titleBar.style.gap = '8px';
        titleBar.style.cursor = 'move';
        titleBar.style.marginBottom = '8px';

        const title = document.createElement('div');
        title.id = 'xyq-helper-title-text';
        title.textContent = '学业桥分数半自动助手';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '14px';
        title.style.whiteSpace = 'nowrap';
        title.style.overflow = 'hidden';
        title.style.textOverflow = 'ellipsis';

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'xyq-helper-toggle-panel';
        toggleBtn.textContent = '收起';
        toggleBtn.style.flex = '0 0 auto';
        toggleBtn.style.border = '1px solid #ddd';
        toggleBtn.style.background = '#f7f7f7';
        toggleBtn.style.color = '#333';
        toggleBtn.style.borderRadius = '5px';
        toggleBtn.style.padding = '3px 7px';
        toggleBtn.style.fontSize = '12px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.addEventListener('click', () => {
            saveState({
                panelCollapsed: !STATE.panelCollapsed
            });
        });

        titleBar.appendChild(title);
        titleBar.appendChild(toggleBtn);

        const body = document.createElement('div');
        body.id = 'xyq-helper-panel-body';

        const desc = document.createElement('div');
        desc.style.fontSize = '12px';
        desc.style.color = '#666';
        desc.style.lineHeight = '1.5';
        desc.style.marginBottom = '10px';
        desc.innerHTML = `
            学校：<b>手动输入后自动搜索</b><br>
            年份：<b>${CONFIG.year}</b><br>
            第1步：<b>选省份 + 自动确定</b><br>
            第2/3步：<b>恢复省份 + 自动确定</b>
        `;

        const schoolInputBox = createTextInput(
            '学校名称',
            '例如：广州城市理工学院',
            STATE.panelSchoolName || '',
            (e) => {
                saveState({
                    panelSchoolName: e.target.value || ''
                });
                scheduleApplyListSchoolFromPanel();
            },
            'xyq-helper-school-input',
            () => {
                clearTimeout(schoolSearchTimer);
                applyListSchoolAndSearchFromPanel({ silent: false });
            }
        );

        const schoolSearchBtn = createButton(
            '立即搜索学校',
            () => {
                clearTimeout(schoolSearchTimer);
                applyListSchoolAndSearchFromPanel({ silent: false });
            },
            '#337ab7'
        );

        const provinceInputBox = createTextInput(
            '第1步自动选省份',
            '例如：安徽',
            STATE.panelProvinceName || '',
            (e) => {
                saveState({
                    panelProvinceName: e.target.value || ''
                });
            },
            'xyq-helper-province-input'
        );

        const memoryBox = document.createElement('div');
        memoryBox.id = 'xyq-helper-province-memory';
        memoryBox.style.fontSize = '12px';
        memoryBox.style.color = '#444';
        memoryBox.style.lineHeight = '1.5';
        memoryBox.style.marginBottom = '10px';
        memoryBox.style.padding = '7px 9px';
        memoryBox.style.background = '#f8f8f8';
        memoryBox.style.border = '1px solid #eee';
        memoryBox.style.borderRadius = '6px';
        memoryBox.innerHTML = `已记忆省份：<b>无</b>`;

        const flowBox = document.createElement('div');
        flowBox.style.border = '1px solid #eee';
        flowBox.style.borderRadius = '8px';
        flowBox.style.padding = '9px';
        flowBox.style.marginBottom = '10px';
        flowBox.style.background = '#fafafa';

        const flowTitle = document.createElement('div');
        flowTitle.textContent = '连续流程';
        flowTitle.style.fontWeight = 'bold';
        flowTitle.style.marginBottom = '7px';

        const flowStatus = document.createElement('div');
        flowStatus.id = 'xyq-helper-flow-status';
        flowStatus.textContent = '空闲';
        flowStatus.style.fontSize = '12px';
        flowStatus.style.color = '#666';
        flowStatus.style.lineHeight = '1.5';
        flowStatus.style.marginBottom = '8px';

        const startFlowBtn = createButton(
            '连续执行 1 → 2 → 3',
            () => startSequentialFlow(),
            '#f0ad4e',
            'xyq-helper-start-flow'
        );

        const stopFlowBtn = createButton(
            '停止连续流程',
            () => stopSequentialFlow(),
            '#777',
            'xyq-helper-stop-flow'
        );

        const clearStateBtn = createButton(
            '清空记忆/重置状态',
            () => {
                clearState();
                showToast('已清空记忆和流程状态');
                syncButtonsByState();
            },
            '#999',
            'xyq-helper-clear-state'
        );

        flowBox.appendChild(flowTitle);
        flowBox.appendChild(flowStatus);
        flowBox.appendChild(startFlowBtn);
        flowBox.appendChild(stopFlowBtn);
        flowBox.appendChild(clearStateBtn);

        const singleTitle = document.createElement('div');
        singleTitle.textContent = '单步执行';
        singleTitle.style.fontWeight = 'bold';
        singleTitle.style.margin = '7px 0';

        const btn1 = createButton('1. 同步学业桥开启数据', () => runSingleStep(1), '#5cb85c');
        const btn2 = createButton('2. 校验中间表数据', () => runSingleStep(2), '#5cb85c');
        const btn3 = createButton('3. 校验成功数据入库', () => runSingleStep(3), '#337ab7');

        const footer = document.createElement('div');
        footer.style.marginTop = '7px';
        footer.style.fontSize = '12px';
        footer.style.color = '#888';
        footer.style.lineHeight = '1.5';
        footer.innerHTML = `
            说明：<br>
            1. 输入学校名称后会自动同步主页面学校筛选并搜索。<br>
            2. 若自动搜索未触发，可点击“立即搜索学校”。<br>
            3. 连续流程运行中不会额外点击主页面搜索，避免重复刷新。<br>
            4. 面板顶部可拖动；点“收起”可缩小面板。
        `;

        body.appendChild(desc);
        body.appendChild(schoolInputBox);
        body.appendChild(schoolSearchBtn);
        body.appendChild(provinceInputBox);
        body.appendChild(memoryBox);
        body.appendChild(flowBox);
        body.appendChild(singleTitle);
        body.appendChild(btn1);
        body.appendChild(btn2);
        body.appendChild(btn3);
        body.appendChild(footer);

        panel.appendChild(titleBar);
        panel.appendChild(body);

        document.body.appendChild(panel);

        enablePanelDrag(panel, titleBar);

        updatePanelInputsUI();
        updateRememberedProvinceUI();
        updateFlowStatusUI();
        updatePanelCollapsedUI();
        updatePanelPositionUI();
        syncButtonsByState();

        log('控制面板已创建');
    }

    async function autoResumeIfNeeded() {
        if (!STATE.flowRunning) return;

        log('检测到存在未完成流程，准备自动恢复：', STATE);
        showToast('检测到未完成的连续流程，正在自动恢复...');
        await sleep(CONFIG.autoResumeDelay);
        await runAutoResumeFlow();
    }

    let initRunning = false;

async function init() {
    if (!isTargetPage()) {
        removeHelperUI();
        log('当前页面不是目标页面，脚本不启用：', location.href);
        return;
    }

    if (initRunning) return;
    initRunning = true;

    try {
        log('脚本启动');
        await waitFor(() => document.body, 10000, 120, '页面主体');

        if (!isTargetPage()) {
            removeHelperUI();
            return;
        }

        createPanel();
        await autoResumeIfNeeded();
    } finally {
        initRunning = false;
    }
}

function watchRouteChange() {
    const rerun = () => {
        setTimeout(() => {
            if (isTargetPage()) {
                init();
            } else {
                removeHelperUI();
                log('离开目标页面，已移除助手面板：', location.href);
            }
        }, 80);
    };

    window.addEventListener('hashchange', rerun);

    const rawPushState = history.pushState;
    history.pushState = function (...args) {
        const result = rawPushState.apply(this, args);
        rerun();
        return result;
    };

    const rawReplaceState = history.replaceState;
    history.replaceState = function (...args) {
        const result = rawReplaceState.apply(this, args);
        rerun();
        return result;
    };
}

watchRouteChange();
init();
})();