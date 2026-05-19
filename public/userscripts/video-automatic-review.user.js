// ==UserScript==
// @name         视频自动审核工具
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  自动审核视频（刷新后继续，防止自动播放被拦截）
// @match        http://v.admin.eol.com.cn/*
// @updateURL    https://tool-hub-2vw.pages.dev/userscripts/video-automatic-review.user.js
// @downloadURL  https://tool-hub-2vw.pages.dev/userscripts/video-automatic-review.user.js
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const WAIT = ms => new Promise(r => setTimeout(r, ms));
    const RANDOM_SEGMENTS = 4;      // 每个视频随机抽查段数
    const SEGMENT_DURATION = 2;     // 每段播放时长（秒）
    const BETWEEN_VIDEOS_DELAY = 800;
    const PAGE_LOAD_WAIT = 1500;

    async function waitFor(selector, timeout = 10000) {
        const interval = 500;
        let elapsed = 0;
        while (elapsed < timeout) {
            const el = document.querySelector(selector);
            if (el) return el;
            await WAIT(interval);
            elapsed += interval;
        }
        return null;
    }

    function getAuditButtons() {
        return Array.from(document.querySelectorAll('a[title="审核"]'))
            .filter(btn => btn.offsetParent !== null);
    }

    async function tryPlay(video) {
        try {
            await video.play();
        } catch (e) {
            console.warn("⚠️ 自动播放被拦截，模拟点击解决...");
            // 模拟一次用户点击触发播放
            const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            video.dispatchEvent(event);
            await WAIT(200);
            try {
                await video.play();
            } catch (e2) {
                console.warn("❌ 播放仍被阻止，跳过本段", e2);
            }
        }
    }

    async function handleVideo(button) {
        console.log(`👉 正在处理视频`);
        button.click();
        await WAIT(1000);

        const video = await waitFor("video", 5000);
        if (!video) {
            console.warn("⚠️ 未找到视频，跳过");
            return;
        }

        await new Promise(resolve => {
            if (video.readyState >= 1) return resolve();
            video.addEventListener("loadedmetadata", resolve, { once: true });
        });

        const duration = video.duration;
        for (let s = 0; s < RANDOM_SEGMENTS; s++) {
            const t = Math.random() * (duration - SEGMENT_DURATION);
            video.currentTime = t;
            video.muted = true;
            await tryPlay(video);
            console.log(`▶️ 抽查片段 ${s+1}: ${t.toFixed(1)} 秒`);
            await WAIT(SEGMENT_DURATION * 1000);
            video.pause();
        }

        const confirmBtn = await waitFor("a.btn.btn-primary.form_submit", 3000);
        if (confirmBtn) confirmBtn.click();
        console.log("✅ 视频审核完成");

        await WAIT(BETWEEN_VIDEOS_DELAY);
        location.reload();
    }

    async function runAudit() {
        const buttons = getAuditButtons();
        if (!buttons.length) return;
        await handleVideo(buttons[0]);
    }

    // 监听 Vue Router URL 变化（刷新后也自动启动）
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(runAudit, 2000);
        }
    }).observe(document, { subtree: true, childList: true });

    setTimeout(runAudit, 2000);

})(); 