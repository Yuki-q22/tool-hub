// ==UserScript==
// @name         掌上高考数据更新链接助手
// @namespace    https://www.gaokao.cn/
// @version      1.1.0
// @description  在掌上高考页面生成常用数据更新链接，输入学校ID后自动替换链接中的数字，支持按分类Tab复制/打开。
// @author       Yuki
// @match        https://www.gaokao.cn/
// @match        https://www.gaokao.cn/*
// @updateURL    https://tool-hub-2vw.pages.dev/userscripts/gaokao-update-link-helper.user.js
// @downloadURL  https://tool-hub-2vw.pages.dev/userscripts/gaokao-update-link-helper.user.js
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  /************************************************************
   * 一、链接配置区
   * 后续如果文档新增链接，只需要改这里
   ************************************************************/
  const LINK_DATA = [
    {
      tab: '普通高考',
      groups: [
        {
          title: '学校开设专业',
          desc: '更新完成后，把对应静态 json 链接中的学校 ID 替换后发群。',
          updateLinks: [],
          staticLinks: [
            {
              name: 'PC 学校开设专业',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/pc_special.json?a=www.gaokao.cn',
            },
            {
              name: '移动端专业列表',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/special/list.json?a=m.gaokao.cn',
            },
            {
              name: '专业列表原始 JSON',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/special/list.json',
            },
          ],
        },
        {
          title: '院系设置',
          desc: '院系设置静态 json 链接。',
          updateLinks: [],
          staticLinks: [
            {
              name: 'PC 院系设置',
              url: 'https://static-data.gaokao.cn/www/2.0/school/department/{id}.json?a=www.gaokao.cn',
            },
            {
              name: '移动端院系设置',
              url: 'https://static-data.gaokao.cn/www/2.0/school/department/{id}.json?a=m.gaokao.cn',
            },
            {
              name: '院系设置原始 JSON',
              url: 'https://static-data.gaokao.cn/www/2.0/school/department/{id}.json',
            },
          ],
        },
        {
          title: '专业分',
          desc: '先访问更新链接；更新完成后复制静态 json 链接。',
          updateLinks: [
            {
              name: '更新专业分',
              url: 'http://data.admin.eol.com.cn/bin/updatees/esupdatespecialscore?start_school_id={id}&end_school_id={id}',
            },
          ],
          staticLinks: [
            {
              name: 'PC 专业分',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/dic/professionalscore.json?a=www.gaokao.cn',
            },
            {
              name: '移动端专业分',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/dic/professionalscore.json?a=m.gaokao.cn',
            },
            {
              name: '专业分原始 JSON',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/dic/professionalscore.json',
            },
          ],
        },
        {
          title: '院校分',
          desc: '先访问更新链接；更新完成后复制静态 json 链接。',
          updateLinks: [
            {
              name: '更新院校分',
              url: 'http://data.admin.eol.com.cn/bin/updatees/esupdateprovincescore?start_school_id={id}&end_school_id={id}',
            },
          ],
          staticLinks: [
            {
              name: 'PC 院校分',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/dic/provincescore.json?a=www.gaokao.cn',
            },
            {
              name: '移动端院校分',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/dic/provincescore.json?a=m.gaokao.cn',
            },
            {
              name: '院校分原始 JSON',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/dic/provincescore.json',
            },
          ],
        },
        {
          title: '招生计划',
          desc: '先访问更新链接；更新完成后复制静态 json 链接。',
          updateLinks: [
            {
              name: '更新招生计划',
              url: 'http://data.admin.eol.com.cn/bin/updatees/esupdatespecialplan?start_school_id={id}&end_school_id={id}',
            },
          ],
          staticLinks: [
            {
              name: 'PC 招生计划',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/dic/specialplan.json?a=www.gaokao.cn',
            },
            {
              name: '移动端招生计划',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/dic/specialplan.json?a=m.gaokao.cn',
            },
            {
              name: '招生计划原始 JSON',
              url: 'https://static-data.gaokao.cn/www/2.0/school/{id}/dic/specialplan.json',
            },
          ],
        },
      ],
    },
    {
      tab: '高职单招',
      groups: [
        {
          title: '学校开设专业',
          desc: '更新完成后，把对应静态 json 链接中的学校 ID 替换后发群。',
          updateLinks: [],
          staticLinks: [
            {
              name: 'PC 单招专业列表',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/special/single_type_list.json?a=www.gaokao.cn',
            },
            {
              name: '移动端单招专业列表',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/special/single_type_list.json?a=m.gaokao.cn',
            },
            {
              name: '单招专业列表原始 JSON',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/special/single_type_list.json',
            },
          ],
        },
        {
          title: '招生计划',
          desc: '先访问更新链接；更新完成后复制静态 json 链接。',
          updateLinks: [
            {
              name: '更新单招招生计划',
              url: 'http://data.admin.eol.com.cn/bin/updatees/update_single_plan?start_school_id={id}&end_school_id={id}',
            },
          ],
          staticLinks: [
            {
              name: 'PC 单招招生计划',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/dic/specialplan.json?a=www.gaokao.cn',
            },
            {
              name: '移动端单招招生计划',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/dic/specialplan.json?a=m.gaokao.cn',
            },
            {
              name: '单招招生计划原始 JSON',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/dic/specialplan.json',
            },
          ],
        },
        {
          title: '专业分',
          desc: '先访问更新链接；更新完成后复制静态 json 链接。',
          updateLinks: [
            {
              name: '更新单招专业分',
              url: 'http://data.admin.eol.com.cn/bin/updatees/update_single_score?start_school_id={id}&end_school_id={id}',
            },
          ],
          staticLinks: [
            {
              name: 'PC 单招专业分',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/dic/specialscore.json?a=www.gaokao.cn',
            },
            {
              name: '移动端单招专业分',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/dic/specialscore.json?a=m.gaokao.cn',
            },
            {
              name: '单招专业分原始 JSON',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/dic/specialscore.json',
            },
          ],
        },
        {
          title: '专业组分',
          desc: '文档中“院校分 / 专业组分”对应的静态 json 链接。',
          updateLinks: [
            {
              name: '更新单招专业组分',
              url: 'http://data.admin.eol.com.cn/bin/updatees/update_single_score?start_school_id={id}&end_school_id={id}',
            },
          ],
          staticLinks: [
            {
              name: 'PC 单招专业组分',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/dic/specialgroupscore.json?a=www.gaokao.cn',
            },
            {
              name: '移动端单招专业组分',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/dic/specialgroupscore.json?a=m.gaokao.cn',
            },
            {
              name: '单招专业组分原始 JSON',
              url: 'https://static-data.gaokao.cn/www/2.0/single/school/{id}/dic/specialgroupscore.json',
            },
          ],
        },
      ],
    },
  ];

  const STORAGE_KEY = 'gaokao_update_link_helper_school_id';
  const PANEL_VISIBLE_KEY = 'gaokao_update_link_helper_visible_v2';

  let currentTabIndex = 0;

  /************************************************************
   * 二、基础方法
   ************************************************************/
  function getSchoolId() {
    const input = document.querySelector('#gk-link-helper-school-id');
    return input ? input.value.trim() : '';
  }

  function isValidSchoolId(id) {
    return /^\d+$/.test(String(id || '').trim());
  }

  function buildUrl(template, id) {
    return String(template).replaceAll('{id}', id);
  }

  function getLinksFromGroup(group, id, type = 'all') {
    const result = [];

    if (type === 'all' || type === 'update') {
      group.updateLinks.forEach((item) => {
        result.push({
          ...item,
          url: buildUrl(item.url, id),
          linkType: '更新链接',
          linkClass: 'update',
        });
      });
    }

    if (type === 'all' || type === 'static') {
      group.staticLinks.forEach((item) => {
        result.push({
          ...item,
          url: buildUrl(item.url, id),
          linkType: '静态链接',
          linkClass: 'static',
        });
      });
    }

    return result;
  }

  function getLinksFromTab(tabData, id, type = 'all') {
    return tabData.groups.flatMap((group) => getLinksFromGroup(group, id, type));
  }

  function formatLinksForCopy(links) {
    return links.map((item) => item.url).join('\n');
  }

  async function copyText(text) {
    if (!text) {
      toast('没有可复制的内容');
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else if (typeof GM_setClipboard === 'function') {
        GM_setClipboard(text, 'text');
      } else {
        fallbackCopy(text);
      }
      toast('已复制');
    } catch (error) {
      console.warn('[数据更新链接助手] 复制失败，尝试 fallback：', error);
      fallbackCopy(text);
      toast('已复制');
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  function openLinks(links) {
    if (!links.length) {
      toast('没有可打开的链接');
      return;
    }

    links.forEach((item, index) => {
      setTimeout(() => {
        window.open(item.url, '_blank');
      }, index * 260);
    });

    toast(`已尝试打开 ${links.length} 个链接`);
  }

  function toast(message) {
    let el = document.querySelector('#gk-link-helper-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gk-link-helper-toast';
      document.body.appendChild(el);
    }

    el.textContent = message;
    el.classList.add('show');

    clearTimeout(el.__timer);
    el.__timer = setTimeout(() => {
      el.classList.remove('show');
    }, 1800);
  }

  function requireSchoolId() {
    const id = getSchoolId();

    if (!isValidSchoolId(id)) {
      toast('请先输入数字格式的学校 ID');
      const input = document.querySelector('#gk-link-helper-school-id');
      if (input) input.focus();
      return '';
    }

    return id;
  }

  function showPanel() {
    const panel = document.querySelector('#gk-link-helper-panel');
    const trigger = document.querySelector('#gk-link-helper-trigger');

    if (panel) panel.style.display = 'block';
    if (trigger) trigger.style.display = 'none';

    localStorage.setItem(PANEL_VISIBLE_KEY, '1');
  }

  function hidePanel() {
    const panel = document.querySelector('#gk-link-helper-panel');
    const trigger = document.querySelector('#gk-link-helper-trigger');

    if (panel) panel.style.display = 'none';
    if (trigger) trigger.style.display = 'block';

    localStorage.setItem(PANEL_VISIBLE_KEY, '0');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  /************************************************************
   * 三、样式
   ************************************************************/
  const style = document.createElement('style');
  style.textContent = `
    #gk-link-helper-trigger {
      position: fixed;
      right: 18px;
      top: 42%;
      z-index: 999999;
      width: 46px;
      padding: 12px 8px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(180deg, #ff7a1a, #ff6600);
      color: #fff;
      font-size: 14px;
      line-height: 18px;
      cursor: pointer;
      box-shadow: 0 10px 26px rgba(255, 102, 0, 0.32);
      writing-mode: vertical-rl;
      letter-spacing: 2px;
    }

    #gk-link-helper-panel {
      position: fixed;
      right: 18px;
      top: 58px;
      z-index: 999999;
      width: 760px;
      max-width: calc(100vw - 36px);
      max-height: calc(100vh - 80px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 18px 52px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", Arial, sans-serif;
      color: #222;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    #gk-link-helper-panel * {
      box-sizing: border-box;
    }

    .gk-helper-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 52px;
      padding: 0 16px 0 18px;
      background: linear-gradient(135deg, #ff7a1a, #ff6600);
      color: #fff;
    }

    .gk-helper-title {
      font-size: 17px;
      font-weight: 700;
    }

    .gk-helper-close {
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.22);
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      line-height: 30px;
      text-align: center;
    }

    .gk-helper-body {
      padding: 14px 16px 16px;
      overflow-y: auto;
      max-height: calc(100vh - 132px);
      background: #f7f7f7;
    }

    .gk-helper-id-row {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 12px;
      padding: 12px;
      background: #fff;
      border-radius: 14px;
      border: 1px solid #eee;
    }

    .gk-helper-id-row label {
      font-weight: 700;
      white-space: nowrap;
      color: #222;
    }

    #gk-link-helper-school-id {
      flex: 1;
      height: 38px;
      min-width: 140px;
      padding: 0 12px;
      border: 1px solid #ddd;
      border-radius: 9px;
      font-size: 15px;
      outline: none;
      background: #fff;
      color: #222;
    }

    #gk-link-helper-school-id:focus {
      border-color: #ff6600;
      box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.12);
    }

    .gk-helper-btn {
      height: 34px;
      padding: 0 13px;
      border: none;
      border-radius: 9px;
      background: #ff6600;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }

    .gk-helper-btn:hover {
      opacity: 0.9;
    }

    .gk-helper-btn.secondary {
      background: #f0f0f0;
      color: #333;
    }

    .gk-helper-btn.danger {
      background: #fff1e8;
      color: #e65700;
    }

    .gk-helper-btn.small {
      height: 30px;
      padding: 0 10px;
      font-size: 12px;
      border-radius: 8px;
    }

    .gk-helper-tabs {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .gk-helper-tab {
      height: 38px;
      border: 1px solid #e9e9e9;
      border-radius: 10px;
      background: #fff;
      color: #333;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
    }

    .gk-helper-tab.active {
      background: #fff4ed;
      color: #ff6600;
      border-color: rgba(255, 102, 0, 0.45);
      box-shadow: inset 0 0 0 1px rgba(255, 102, 0, 0.12);
    }

    .gk-helper-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .gk-helper-group {
      background: #fff;
      border: 1px solid #e9e9e9;
      border-radius: 15px;
      margin-bottom: 14px;
      overflow: hidden;
    }

    .gk-helper-group-head {
      padding: 13px 14px 11px;
      border-bottom: 1px solid #f0f0f0;
      background: #fff;
    }

    .gk-helper-group-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 6px;
    }

    .gk-helper-group-title strong {
      font-size: 16px;
      color: #222;
    }

    .gk-helper-group-desc {
      font-size: 13px;
      color: #777;
      line-height: 1.55;
    }

    .gk-helper-group-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 10px;
    }

    .gk-helper-link-list {
      padding: 12px 14px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #fff;
    }

    .gk-helper-link-card {
      border: 1px solid #ededed;
      border-radius: 12px;
      background: #fafafa;
      padding: 10px 11px;
    }

    .gk-helper-link-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }

    .gk-helper-link-name {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      min-width: 0;
    }

    .gk-helper-badge {
      display: inline-flex;
      align-items: center;
      height: 22px;
      padding: 0 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .gk-helper-badge.update {
      color: #d94a00;
      background: #fff1e8;
    }

    .gk-helper-badge.static {
      color: #666;
      background: #eeeeee;
    }

    .gk-helper-link-title {
      font-size: 13px;
      color: #333;
      font-weight: 700;
    }

    .gk-helper-link-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .gk-helper-mini-btn {
      height: 26px;
      padding: 0 9px;
      border: none;
      border-radius: 7px;
      background: #fff;
      color: #ff6600;
      border: 1px solid rgba(255, 102, 0, 0.28);
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      line-height: 24px;
    }

    .gk-helper-mini-btn:hover {
      background: #fff4ed;
    }

    .gk-helper-url {
      width: 100%;
      padding: 9px 10px;
      border-radius: 9px;
      background: #fff;
      border: 1px solid #eeeeee;
      color: #333;
      font-family: Consolas, Monaco, "Courier New", monospace;
      font-size: 12px;
      line-height: 1.55;
      word-break: break-all;
      white-space: normal;
      user-select: text;
    }

    .gk-helper-url.update {
      border-color: rgba(255, 102, 0, 0.28);
      background: #fffaf6;
    }

    .gk-helper-empty {
      padding: 18px;
      text-align: center;
      color: #999;
      background: #fff;
      border-radius: 14px;
      border: 1px solid #eee;
    }

    #gk-link-helper-toast {
      position: fixed;
      left: 50%;
      top: 78px;
      transform: translateX(-50%) translateY(-12px);
      z-index: 1000000;
      padding: 9px 15px;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      font-size: 13px;
      opacity: 0;
      pointer-events: none;
      transition: all 0.18s ease;
    }

    #gk-link-helper-toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    @media (max-width: 820px) {
      #gk-link-helper-panel {
        left: 12px;
        right: 12px;
        width: auto;
        top: 52px;
      }

      .gk-helper-id-row {
        flex-wrap: wrap;
      }

      .gk-helper-actions {
        display: grid;
        grid-template-columns: 1fr;
      }

      .gk-helper-actions .gk-helper-btn {
        width: 100%;
      }

      .gk-helper-link-top {
        align-items: flex-start;
        flex-direction: column;
      }

      .gk-helper-link-actions {
        width: 100%;
      }

      .gk-helper-mini-btn {
        flex: 1;
        text-align: center;
      }
    }
  `;
  document.head.appendChild(style);

  /************************************************************
   * 四、创建页面
   ************************************************************/
  function createUI() {
    if (document.querySelector('#gk-link-helper-panel')) return;

    const trigger = document.createElement('button');
    trigger.id = 'gk-link-helper-trigger';
    trigger.textContent = '数据更新链接';
    trigger.addEventListener('click', showPanel);
    document.body.appendChild(trigger);

    const savedId = localStorage.getItem(STORAGE_KEY) || '';

    const panel = document.createElement('div');
    panel.id = 'gk-link-helper-panel';
    panel.innerHTML = `
      <div class="gk-helper-header">
        <div class="gk-helper-title">掌上高考数据更新链接助手</div>
        <button class="gk-helper-close" type="button" title="收起">×</button>
      </div>

      <div class="gk-helper-body">
        <div class="gk-helper-id-row">
          <label for="gk-link-helper-school-id">学校 ID</label>
          <input
            id="gk-link-helper-school-id"
            type="text"
            inputmode="numeric"
            placeholder="输入需要替换的学校 ID，例如：1061"
            value="${escapeHtml(savedId)}"
          />
          <button class="gk-helper-btn secondary" id="gk-helper-clear-id" type="button">清空</button>
        </div>

        <div class="gk-helper-tabs" id="gk-helper-tabs"></div>

        <div class="gk-helper-actions">
          <button class="gk-helper-btn" id="gk-copy-tab-static" type="button">复制当前 Tab 静态链接</button>
          <button class="gk-helper-btn secondary" id="gk-copy-tab-all" type="button">复制当前 Tab 全部链接</button>
          <button class="gk-helper-btn danger" id="gk-open-tab-update" type="button">打开当前 Tab 更新链接</button>
        </div>

        <div id="gk-helper-content"></div>
      </div>
    `;

    document.body.appendChild(panel);

    panel.querySelector('.gk-helper-close').addEventListener('click', hidePanel);

    const input = panel.querySelector('#gk-link-helper-school-id');

    input.addEventListener('input', () => {
      const id = input.value.trim();
      localStorage.setItem(STORAGE_KEY, id);
      renderContent();
    });

    panel.querySelector('#gk-helper-clear-id').addEventListener('click', () => {
      input.value = '';
      localStorage.setItem(STORAGE_KEY, '');
      renderContent();
      input.focus();
    });

    panel.querySelector('#gk-copy-tab-static').addEventListener('click', () => {
      const id = requireSchoolId();
      if (!id) return;

      const tabData = LINK_DATA[currentTabIndex];
      const links = getLinksFromTab(tabData, id, 'static');
      copyText(formatLinksForCopy(links));
    });

    panel.querySelector('#gk-copy-tab-all').addEventListener('click', () => {
      const id = requireSchoolId();
      if (!id) return;

      const tabData = LINK_DATA[currentTabIndex];
      const links = getLinksFromTab(tabData, id, 'all');
      copyText(formatLinksForCopy(links));
    });

    panel.querySelector('#gk-open-tab-update').addEventListener('click', () => {
      const id = requireSchoolId();
      if (!id) return;

      const tabData = LINK_DATA[currentTabIndex];
      const links = getLinksFromTab(tabData, id, 'update');
      openLinks(links);
    });

    renderTabs();
    renderContent();

    const visible = localStorage.getItem(PANEL_VISIBLE_KEY);
    if (visible === '0') {
      hidePanel();
    } else {
      showPanel();
    }
  }

  function renderTabs() {
    const tabsEl = document.querySelector('#gk-helper-tabs');
    if (!tabsEl) return;

    tabsEl.innerHTML = LINK_DATA.map((item, index) => {
      return `
        <button
          class="gk-helper-tab ${index === currentTabIndex ? 'active' : ''}"
          type="button"
          data-tab-index="${index}"
        >
          ${escapeHtml(item.tab)}
        </button>
      `;
    }).join('');

    tabsEl.querySelectorAll('.gk-helper-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTabIndex = Number(btn.dataset.tabIndex || 0);
        renderTabs();
        renderContent();
      });
    });
  }

  function renderContent() {
    const content = document.querySelector('#gk-helper-content');
    if (!content) return;

    const id = getSchoolId();
    const tabData = LINK_DATA[currentTabIndex];

    if (!isValidSchoolId(id)) {
      content.innerHTML = `
        <div class="gk-helper-empty">
          请先输入数字格式的学校 ID。输入后，下方所有链接会自动替换。
        </div>
      `;
      return;
    }

    content.innerHTML = tabData.groups.map((group, groupIndex) => {
      const updateLinks = getLinksFromGroup(group, id, 'update');
      const staticLinks = getLinksFromGroup(group, id, 'static');
      const allLinks = [...updateLinks, ...staticLinks];

      return `
        <div class="gk-helper-group" data-group-index="${groupIndex}">
          <div class="gk-helper-group-head">
            <div class="gk-helper-group-title">
              <strong>${escapeHtml(group.title)}</strong>
            </div>
            <div class="gk-helper-group-desc">${escapeHtml(group.desc || '')}</div>

            <div class="gk-helper-group-actions">
              ${
                updateLinks.length
                  ? `<button class="gk-helper-btn small danger js-open-update" type="button">打开本组更新链接</button>`
                  : ''
              }
              ${
                staticLinks.length
                  ? `<button class="gk-helper-btn small js-copy-static" type="button">复制本组静态链接</button>`
                  : ''
              }
              ${
                allLinks.length
                  ? `<button class="gk-helper-btn small secondary js-copy-all" type="button">复制本组全部链接</button>`
                  : ''
              }
            </div>
          </div>

          <div class="gk-helper-link-list">
            ${
              allLinks.length
                ? allLinks.map((item) => {
                    return `
                      <div class="gk-helper-link-card">
                        <div class="gk-helper-link-top">
                          <div class="gk-helper-link-name">
                            <span class="gk-helper-badge ${escapeAttr(item.linkClass)}">${escapeHtml(item.linkType)}</span>
                            <span class="gk-helper-link-title">${escapeHtml(item.name)}</span>
                          </div>
                          <div class="gk-helper-link-actions">
                            <button class="gk-helper-mini-btn js-copy-one" type="button" data-url="${escapeAttr(item.url)}">复制</button>
                            <a class="gk-helper-mini-btn" href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">打开</a>
                          </div>
                        </div>
                        <div class="gk-helper-url ${escapeAttr(item.linkClass)}">${escapeHtml(item.url)}</div>
                      </div>
                    `;
                  }).join('')
                : `<div class="gk-helper-empty">本组暂无链接</div>`
            }
          </div>
        </div>
      `;
    }).join('');

    bindGroupEvents();
  }

  function bindGroupEvents() {
    const content = document.querySelector('#gk-helper-content');
    if (!content) return;

    const id = getSchoolId();
    const tabData = LINK_DATA[currentTabIndex];

    content.querySelectorAll('.gk-helper-group').forEach((groupEl) => {
      const groupIndex = Number(groupEl.dataset.groupIndex || 0);
      const group = tabData.groups[groupIndex];

      const openUpdateBtn = groupEl.querySelector('.js-open-update');
      if (openUpdateBtn) {
        openUpdateBtn.addEventListener('click', () => {
          const links = getLinksFromGroup(group, id, 'update');
          openLinks(links);
        });
      }

      const copyStaticBtn = groupEl.querySelector('.js-copy-static');
      if (copyStaticBtn) {
        copyStaticBtn.addEventListener('click', () => {
          const links = getLinksFromGroup(group, id, 'static');
          copyText(formatLinksForCopy(links));
        });
      }

      const copyAllBtn = groupEl.querySelector('.js-copy-all');
      if (copyAllBtn) {
        copyAllBtn.addEventListener('click', () => {
          const links = getLinksFromGroup(group, id, 'all');
          copyText(formatLinksForCopy(links));
        });
      }
    });

    content.querySelectorAll('.js-copy-one').forEach((btn) => {
      btn.addEventListener('click', () => {
        copyText(btn.dataset.url || '');
      });
    });
  }

  /************************************************************
   * 五、初始化
   ************************************************************/
  function init() {
    createUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();