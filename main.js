// ==UserScript==
// @name         跨平台 Web 自动化执行工具
// @namespace    https://github.com/iFulling/cdcasSK
// @version      3.0.1
// @description  跨平台 Web 自动化执行工具
// @author       iFulling
// @match        *://*/*
// @connect      ca.zwhyzzz.top
// @connect      ark.cn-beijing.volces.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_getResourceURL
// @license      MIT
// @run-at       document-idle
// @noframes
// ==/UserScript==

/* ==UserConfig==
RuntimeOptions:
  urls:
    title: 网站配置
    description: 添加可用的网站（用|分隔）
    type: textarea
    default: github.com
  auto_login_captcha:
    title: 自动识别验证码
    description: 是否自动识别并填充登录页面的验证码
    type: checkbox
    default: false
  timeout_minutes:
    title: 页面超时时间
    description: 页面停留最大时间（分钟），0为禁用
    type: number
    default: 40
    min: 0
    max: 240
    unit: 分钟
AIOptions:
  endpoint_id:
    title: 接入点ID
    description: 豆包AI接入点ID
    type: text
    default: ""
  apikey:
    title: API Key
    description: 豆包AI API Key
    type: text
    password: true
    default: ""
==/UserConfig== */


const CONFIG = {
    VERSION: "3.0.1",
    DEFAULT: {
        URLS: "github.com",
        TIMEOUT_MINUTES: 40
    },
    THRESHOLDS: {
        VIDEO_STUCK_CHECK_INTERVAL: 30000,
        VIDEO_STUCK_MIN_DIFF: 0.5,
        VIDEO_LOAD_TIMEOUT: 60,
        CAPTCHA_CHECK_INTERVAL: 1000,
        RELOAD_DELAY: 5000
    }
};
const API = {
    CAPTCHA: "http://ca.zwhyzzz.top:8092/identify_GeneralCAPTCHA",
    AI_CHAT: "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
};
const SELECTORS = {
    VIDEO: "video",
    CAPTCHA_LAYER: ".layui-layer-content",
    CAPTCHA_IMG: ".layui-layer-content img",
    CAPTCHA_INPUT: ".layui-layer-content input",
    PLAY_BUTTON: ".layui-layer-btn0",
    COURSE_LINKS: 'a[target="_self"]',
    TOPIC_HEAD: ".topic-head",
    TOPIC_TAB_PREFIX: "#topic-tab-",
    CONTENT_MAIN: ".courseexamcon-main",
    INTRO_LIST: ".courseexamcon-intro ul li",
    ERROR_TEXT: "body, html"
};
class Logger {
    static _uiManager = null;
    static setUIManager(ui) {
        this._uiManager = ui;
    }
    static _log(level, msg) {
        const time = new Date().toLocaleTimeString();
        const formatted = `[${time}] [${level}] ${msg}`;
        if (this._uiManager) {
            this._uiManager.addLog(formatted, level.toLowerCase());
        }
    }
    static info(msg) {
        this._log('INFO', msg);
    }
    static error(msg) {
        this._log('ERROR', msg);
    }
    static warn(msg) {
        this._log('WARN', msg);
    }
}
class Utils {
    static async pause(min, max) {
        if (max === undefined) {
            return new Promise(resolve => setTimeout(resolve, min * 1000));
        }
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
    static getBase64FromImage(img) {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        return canvas.toDataURL("image/png").split("base64,")[1];
    }
}
class ConfigManager {
    static get(key, defaultValue) {
        return GM_getValue(key, defaultValue);
    }
    static set(key, value) {
        GM_setValue(key, value);
    }
    static get urls() {
        const val = this.get("RuntimeOptions.urls", CONFIG.DEFAULT.URLS);
        return val.split("|").map(u => u.trim()).filter(u => u);
    }
    static set urls(value) {
        this.set("RuntimeOptions.urls", value);
    }
    static get timeoutMinutes() {
        return this.get("RuntimeOptions.timeout_minutes", CONFIG.DEFAULT.TIMEOUT_MINUTES);
    }
    static set timeoutMinutes(value) {
        this.set("RuntimeOptions.timeout_minutes", value);
    }
    static get endpointId() {
        return this.get("AIOptions.endpoint_id", "");
    }
    static set endpointId(value) {
        this.set("AIOptions.endpoint_id", value);
    }
    static get apiKey() {
        return this.get("AIOptions.apikey", "");
    }
    static set apiKey(value) {
        this.set("AIOptions.apikey", value);
    }
    static get autoLoginCaptcha() {
        return this.get("RuntimeOptions.auto_login_captcha", false);
    }
    static set autoLoginCaptcha(value) {
        this.set("RuntimeOptions.auto_login_captcha", value);
    }
    static get videoStage() {
        return this.get("RuntimeOptions.video_stage", 1);
    }
    static set videoStage(value) {
        this.set("RuntimeOptions.video_stage", value);
    }
}
class UIManager {
    constructor() {
        this.panel = null;
        this.logPopup = null;
        this.logContent = null;
        this._isDragging = false;
        this._dragOffset = { x: 0, y: 0 };
    }
    init() {
        this._registerMenus();
        this._createStatusPanel();
        this._createLogPopup();
        this._injectStyles();
        Logger.setUIManager(this);
        Logger.info("UI初始化完成");
    }
    _registerMenus() {
        GM_registerMenuCommand("显示/隐藏日志", () => this.toggleLogPopup());
    }
    _createStatusPanel() {
        const div = document.createElement("div");
        div.id = "sk-status-panel";
        div.className = "sk-panel";
        div.textContent = "工具准备就绪";
        document.body.appendChild(div);
        this.panel = div;
    }
    _createLogPopup() {
        const popup = document.createElement("div");
        popup.id = "sk-log-popup";
        popup.className = "sk-log-popup";
        popup.innerHTML = `
            <div class="sk-log-header">
                <span class="sk-log-title">工具控制台 v${CONFIG.VERSION}</span>
                <div class="sk-log-actions">
                    <button class="sk-log-btn sk-tab-btn active" data-tab="log">日志</button>
                    <button class="sk-log-btn sk-tab-btn" data-tab="config">配置</button>
                    <button class="sk-log-btn sk-tab-btn" data-tab="tutorial">教程</button>
                    <button class="sk-log-btn sk-tab-btn" data-tab="about">说明</button>
                    <button class="sk-log-btn sk-log-close">✕</button>
                </div>
            </div>
            <div class="sk-tab-content active" id="sk-tab-log">
                <div class="sk-log-toolbar">
                    <button class="sk-log-btn sk-log-clear">清空日志</button>
                </div>
                <div class="sk-log-content"></div>
            </div>
            <div class="sk-tab-content" id="sk-tab-config">
                <div class="sk-config-item">
                    <label>页面停留最大时间，小于等于0则禁用（分钟）：</label>
                    <input type="number" id="cfg-timeout" value="${ConfigManager.timeoutMinutes}">
                </div>
                <div class="sk-config-item">
                    <label>3.x 版本尚未测试答题，若无法答题请联系作者，或退回到 2.x 版本<br /><br />豆包接入点 ID（获取 ID 看教程）：</label>
                    <input type="text" id="cfg-endpoint" value="${ConfigManager.endpointId}">
                </div>
                <div class="sk-config-item">
                    <label>豆包 API Key（获取 API Key 看教程）：<br /></label>
                    <input type="text" id="cfg-apikey" value="${ConfigManager.apiKey}">
                </div>
                <div class="sk-config-item" style="display: flex; align-items: center; justify-content: space-between;">
                    <label style="margin-bottom: 0;">自动识别登录验证码：</label>
                    <label class="sk-switch">
                        <input type="checkbox" id="cfg-auto-login" ${ConfigManager.autoLoginCaptcha ? "checked" : ""}>
                        <span class="sk-slider"></span>
                    </label>
                </div>
                <div class="sk-config-item">
                    <label>启用平台域名（每行一个）：</label>
                    <textarea id="cfg-urls" rows="5">${ConfigManager.get("RuntimeOptions.urls", CONFIG.DEFAULT.URLS).split('|').join('\n')}</textarea>
                </div>
                <div class="sk-config-actions">
                    <button class="sk-log-btn primary" id="cfg-save">保存配置</button>
                </div>
            </div>
            <div class="sk-tab-content" id="sk-tab-tutorial">
                <div class="sk-log-content" style="padding: 15px; line-height: 1.6; color: #fff;">
                    <h4 style="margin-top: 0; color: #4ec9b0;">技术文档 & 开发指南</h4>
                    <p>1. <b>运行环境</b>：本框架基于 UserScript 规范设计，需要在 Chrome/Edge 等浏览器配合脚本管理器运行。</p>
                    <p>2. <b>网络配置</b>：若涉及跨域 API 调用（如 AI 辅助），请确保网络通畅或从系统层面排除代理干扰。</p>
                    <p>3. <b>版本兼容</b>：本框架v3.x版本引入了架构更新，建议通过控制台手动迁移旧版配置。</p>
                    <p>4. <b>性能优化</b>：如果遇到高资源占用情况，建议通过配置面板降低 DOM 监听频率或关闭非核心功能。</p>
                    
                    <h4 style="margin-top: 15px; color: #4ec9b0;">API 接入说明</h4>
                    <p>1. <b>AI 服务集成</b>：本框架支持通过配置 Endpoint ID 和 API Key 接入豆包模型服务，具体协议请参考 <a target='_blank' href='https://console.volcengine.com/ark/region:ark+cn-beijing/model?vendor=Bytedance&view=LIST_VIEW' style="color: #4ec9b0; text-decoration: underline;">火山方舟管理控制台</a>。</p>
                    <p>2. <b>OCR 接口</b>：验证码处理模块已预留标准 HTTP 接口，可自行配置 OCR 服务并修改 API 配置进行对接。</p>
                    
                    <h4 style="margin-top: 15px; color: #4ec9b0;">GitHub & 社区</h4>
                    <p>项目源码已开源，欢迎提交 PR 或 Issue：
                        <a target='_blank' href='https://github.com/iFulling/cdcasSK' style="color: #4ec9b0; text-decoration: underline;">GitHub Repository</a>
                    </p>
                </div>
                </div>
            </div>
            <div class="sk-tab-content" id="sk-tab-about">
                <div class="sk-log-content" style="padding: 15px; line-height: 1.6; color: #fff;">
                    <h4 style="text-align: center; margin-bottom: 10px; color: #fff;">跨平台 Web 自动化执行工具 - 使用说明</h4>
                    <p>1. <b>免责声明</b>：本项目仅供前端技术研究与自动化测试学习交流使用（For Technical Research & Educational Purpose Only）。</p>
                    <p>2. <b>技术验证</b>：项目旨在验证 DOM 监听、浏览器指纹模拟及事件流劫持等技术在复杂 Web 环境下的可行性。</p>
                    <p>3. <b>合规使用</b>：请勿将本项目代码用于任何违反目标平台用户协议的商业活动或不正当用途。</p>
                    <p>4. <b>风险提示</b>：使用者应自行承担使用本工具可能带来的风险。</p>
                    <p>5. <b>开源协议</b>：本项目遵循 MIT License 开源协议，您可以在遵循协议的前提下自由使用、修改和分发源码。</p>
                    <p>6. <b>版权归属</b>：Copyright © 2024-2026 iFulling. All Rights Reserved.</p>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        this.logPopup = popup;
        this.logContent = popup.querySelector(".sk-log-content");
        const icon = document.createElement("div");
        icon.id = "sk-min-icon";
        icon.className = "sk-min-icon hidden";
        icon.innerHTML = "还原<br />窗口";
        icon.title = "还原工具窗口";
        document.body.appendChild(icon);
        this.minIcon = icon;
        const header = popup.querySelector(".sk-log-header");
        header.addEventListener("mousedown", (e) => this._onDragStart(e));
        document.addEventListener("mousemove", (e) => this._onDragMove(e));
        document.addEventListener("mouseup", () => this._onDragEnd());
        popup.querySelector(".sk-log-close").addEventListener("click", () => this.toggleLogPopup());
        popup.querySelector(".sk-log-clear").addEventListener("click", () => this.clearLog());
        icon.addEventListener("click", () => this.toggleLogPopup());
        popup.querySelectorAll(".sk-tab-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const tab = e.target.dataset.tab;
                popup.querySelectorAll(".sk-tab-btn").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                popup.querySelectorAll(".sk-tab-content").forEach(c => c.classList.remove("active"));
                popup.querySelector(`#sk-tab-${tab}`).classList.add("active");
            });
        });
        popup.querySelector("#cfg-save").addEventListener("click", () => {
            ConfigManager.timeoutMinutes = parseInt(popup.querySelector("#cfg-timeout").value) || 0;
            ConfigManager.endpointId = popup.querySelector("#cfg-endpoint").value;
            ConfigManager.apiKey = popup.querySelector("#cfg-apikey").value;
            ConfigManager.autoLoginCaptcha = popup.querySelector("#cfg-auto-login").checked;
            const rawUrls = popup.querySelector("#cfg-urls").value;
            ConfigManager.urls = rawUrls.split('\n').map(u => u.trim()).filter(u => u).join('|');
            this.notify("成功", "配置已保存，刷新页面生效");
            setTimeout(() => location.reload(), 1000);
        });
    }
    _onDragStart(e) {
        if (e.target.tagName === 'BUTTON') return;
        this._isDragging = true;
        const rect = this.logPopup.getBoundingClientRect();
        this._dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.logPopup.style.cursor = "grabbing";
    }
    _onDragMove(e) {
        if (!this._isDragging) return;
        const x = e.clientX - this._dragOffset.x;
        const y = e.clientY - this._dragOffset.y;
        this.logPopup.style.left = `${Math.max(0, x)}px`;
        this.logPopup.style.top = `${Math.max(0, y)}px`;
        this.logPopup.style.right = "auto";
        this.logPopup.style.bottom = "auto";
    }
    _onDragEnd() {
        this._isDragging = false;
        if (this.logPopup) {
            this.logPopup.style.cursor = "default";
        }
    }
    _injectStyles() {
        GM_addStyle(`
            .sk-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
                padding: 10px 15px;
                border-radius: 8px;
                z-index: 999999;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                transition: all 0.3s;
                max-width: 300px;
                pointer-events: none;
            }
            .sk-log-popup {
                position: fixed;
                top: 20px;
                left: 20px;
                width: 420px;
                max-height: 500px;
                background: #1e1e1e;
                border: 1px solid #3c3c3c;
                border-radius: 8px;
                z-index: 999998;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .sk-log-popup.hidden {
                display: none;
            }
            .sk-log-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: #2d2d2d;
                border-bottom: 1px solid #3c3c3c;
                cursor: grab;
                user-select: none;
            }
            .sk-log-title {
                color: #fff;
                font-weight: bold;
            }
            .sk-log-actions {
                display: flex;
                gap: 8px;
            }
            .sk-log-btn {
                background: #3c3c3c;
                color: #fff;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
            }
            .sk-log-btn.active {
                background: #0e639c;
            }
            .sk-log-btn.primary {
                background: #0e639c;
                width: 100%;
                padding: 8px;
                margin-top: 10px;
            }
            .sk-log-btn:hover {
                opacity: 0.8;
            }
            .sk-tab-content {
                display: none;
                flex: 1;
                overflow-y: auto;
                padding: 0;
                max-height: 420px;
            }
            .sk-tab-content.active {
                display: flex;
                flex-direction: column;
            }
            .sk-log-toolbar {
                padding: 4px 8px;
                border-bottom: 1px solid #2d2d2d;
                background: #252526;
            }
            .sk-log-content {
                flex: 1;
                overflow-y: auto;
                padding: 8px 12px;
                min-height: 150px;
            }
            .sk-config-item {
                padding: 8px 12px;
                border-bottom: 1px solid #2d2d2d;
            }
            .sk-config-item label {
                display: block;
                color: #ccc;
                margin-bottom: 4px;
            }
            .sk-config-item input, .sk-config-item textarea {
                width: 100%;
                background: #2d2d2d;
                border: 1px solid #3c3c3c;
                color: #fff;
                padding: 4px;
                border-radius: 4px;
                box-sizing: border-box;
            }
            .sk-config-actions {
                padding: 12px;
            }
            .sk-log-item {
                padding: 4px 0;
                border-bottom: 1px solid #2d2d2d;
                word-break: break-all;
            }
            .sk-log-item.info { color: #9cdcfe; }
            .sk-log-item.warn { color: #dcdcaa; }
            .sk-log-item.error { color: #f48771; }
            .sk-min-icon {
                position: fixed;
                top: 20px;
                left: 20px;
                width: 40px;
                height: 40px;
                background: #1e1e1e;
                border: 1px solid #3c3c3c;
                border-radius: 50%;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 999998;
                font-size: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                transition: transform 0.2s;
            }
            .sk-min-icon:hover {
                transform: scale(1.1);
                background: #2d2d2d;
            }
            
            /* 滚动条美化 */
            .sk-tab-content::-webkit-scrollbar,
            .sk-log-content::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            .sk-tab-content::-webkit-scrollbar-track,
            .sk-log-content::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
            }
            .sk-tab-content::-webkit-scrollbar-thumb,
            .sk-log-content::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
            }
            .sk-tab-content::-webkit-scrollbar-thumb:hover,
            .sk-log-content::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
            }
            .sk-min-icon.hidden {
                display: none;
            }
            
            /* Switch 开关样式 */
            .sk-switch {
                position: relative;
                display: inline-block;
                width: 40px;
                height: 20px;
            }
            .sk-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .sk-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 20px;
            }
            .sk-slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            input:checked + .sk-slider {
                background-color: #0e639c;
            }
            input:checked + .sk-slider:before {
                transform: translateX(20px);
            }
        `);
    }
    addLog(msg, level = 'info') {
        if (!this.logContent) return;
        const item = document.createElement("div");
        item.className = `sk-log-item ${level}`;
        item.textContent = msg;
        this.logContent.appendChild(item);
        this.logContent.scrollTop = this.logContent.scrollHeight;
    }
    clearLog() {
        if (this.logContent) {
            this.logContent.innerHTML = '';
        }
    }
    toggleLogPopup() {
        if (this.logPopup) {
            const isHidden = this.logPopup.classList.toggle("hidden");
            if (this.minIcon) {
                this.minIcon.classList.toggle("hidden", !isHidden);
            }
        }
    }
    updateStatus(text) {
        if (this.panel) {
            this.panel.textContent = text;
            this.panel.style.display = "block";
        }
    }
    notify(title, text) {
        GM_notification({ title, text, timeout: 3000 });
    }
}
class VideoPlayer {
    constructor(ui) {
        this.ui = ui;
        this.video = null;
        this.stuckTimer = null;
        this.lastTime = 0;
        this.stuckCount = 0;
    }
    async start() {
        this.video = document.querySelector(SELECTORS.VIDEO);
        if (!this.video) return false;
        this._setupVideo();
        this._startStuckCheck();
        try {
            await this.video.play();
            this.ui.updateStatus("媒体流接管成功，正在播放...");
            Logger.info("HTML5 MediaElement 控制权已获取");
        } catch (e) {
            Logger.error("媒体流启动异常: " + e.message);
        }
        return true;
    }
    _setupVideo() {
        this.video.muted = true;
        this.video.playbackRate = 1.0;
        this.video.onended = () => this._onEnded();
    }
    _onEnded() {
        Logger.info("媒体流播放结束事件触发");
        this.ui.updateStatus("播放结束，执行后续任务...");
        this._stopStuckCheck();
        document.dispatchEvent(new CustomEvent("sk:video_ended"));
    }
    _startStuckCheck() {
        this._stopStuckCheck();
        this.lastTime = this.video.currentTime;
        this.stuckCount = 0;
        this.stuckTimer = setInterval(() => {
            if (!this.video) return;
            const currentTime = this.video.currentTime;
            const diff = Math.abs(currentTime - this.lastTime);
            if (diff < CONFIG.THRESHOLDS.VIDEO_STUCK_MIN_DIFF && !this.video.paused) {
                this.stuckCount++;
                this.ui.updateStatus(`流状态异常检测 (${this.stuckCount})`);
                if (this.stuckCount > 3) {
                    this.ui.notify("警告", "流媒体连接超时，尝试重连");
                    setTimeout(() => location.reload(), 2000);
                }
            } else {
                this.stuckCount = 0;
            }
            this.lastTime = currentTime;
        }, CONFIG.THRESHOLDS.VIDEO_STUCK_CHECK_INTERVAL);
    }
    _stopStuckCheck() {
        if (this.stuckTimer) {
            clearInterval(this.stuckTimer);
            this.stuckTimer = null;
        }
    }
}
class CaptchaHandler {
    constructor(ui) {
        this.ui = ui;
        this.observer = null;
    }
    startObserver() {
        if (this.observer) return;
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && (node.matches(SELECTORS.CAPTCHA_LAYER) || node.querySelector(SELECTORS.CAPTCHA_LAYER))) {
                        Logger.info("检测到验证码弹窗");
                        this.checkAndSolve();
                    }
                }
            }
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
        Logger.info("已启动监听验证码");
    }
    async checkAndSolve() {
        const layer = document.querySelector(SELECTORS.CAPTCHA_LAYER);
        if (!layer || layer.offsetParent === null) return false;
        this.ui.updateStatus("检测到验证码，准备识别...");
        await Utils.pause(2);
        const imgs = document.querySelectorAll(SELECTORS.CAPTCHA_IMG);
        let img = null;
        if (imgs.length > 0) {
            img = imgs[0].style.opacity === '0' && imgs.length > 1 ? imgs[1] : imgs[0];
        }
        if (!img) return false;
        const base64 = Utils.getBase64FromImage(img);
        if (!base64) return false;
        const code = await this._solveApi(base64);
        if (code) {
            this.ui.updateStatus(`验证码识别结果: ${code}`);
            Logger.info(`验证码识别结果: ${code}`);
            const inputs = document.querySelectorAll(SELECTORS.CAPTCHA_INPUT);
            let input = null;
            if (inputs.length > 0) {
                input = inputs[0].style.display === 'none' && inputs.length > 1 ? inputs[1] : inputs[0];
            }
            if (input) {
                input.value = code;
                input.dispatchEvent(new Event('input'));
                await Utils.pause(1);
                const btn = document.querySelector(SELECTORS.PLAY_BUTTON);
                if (btn) btn.click();
                return true;
            }
        }
        return false;
    }
    async checkAndSolveLogin() {
        if (!ConfigManager.autoLoginCaptcha) return;
        this.ui.updateStatus("正在等待登录验证码加载...");
        let img = document.querySelector("#codeImg");
        let input = document.querySelector("#code");
        let attempts = 0;
        while ((!img || !input) && attempts < 20) {
            await Utils.pause(0.5);
            img = document.querySelector("#codeImg");
            input = document.querySelector("#code");
            attempts++;
        }
        if (img && input) {
            this.ui.updateStatus("检测到登录验证码，准备识别...");
            await Utils.pause(1);
            const base64 = Utils.getBase64FromImage(img);
            if (!base64) return;
            const code = await this._solveApi(base64);
            if (code) {
                this.ui.updateStatus(`登录验证码识别结果: ${code}`);
                Logger.info(`登录验证码识别结果: ${code}`);
                input.value = code;
                input.dispatchEvent(new Event('input'));
            }
        } else {
            this.ui.updateStatus("未检测到登录验证码");
        }
    }
    _solveApi(base64) {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: "POST",
                url: API.CAPTCHA,
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({ ImageBase64: base64 }),
                onload: (res) => {
                    try {
                        const json = JSON.parse(res.responseText);
                        resolve(json.result || null);
                    } catch (e) {
                        Logger.error("验证码解析失败");
                        resolve(null);
                    }
                },
                onerror: () => resolve(null)
            });
        });
    }
}
class ContentSolver {
    constructor(ui) {
        this.ui = ui;
        this.running = false;
    }
    async start() {
        if (this.running) return;
        this.running = true;
        this.ui.updateStatus("初始化内容解析引擎...");
        Logger.info("内容解析服务已启动");
        await this._solveLoop();
    }
    stop() {
        this.running = false;
        this.ui.updateStatus("解析任务挂起");
        Logger.info("内容解析服务已停止");
    }
    async _solveLoop() {
        const introList = document.querySelectorAll(SELECTORS.INTRO_LIST);
        let currentIndex = this._getCurrentIndex();
        for (; currentIndex < introList.length; currentIndex++) {
            if (!this.running) break;
            const tab = document.querySelector(SELECTORS.TOPIC_TAB_PREFIX + currentIndex);
            if (!tab) continue;
            this.ui.updateStatus(`正在解析 DOM 节点 [Index: ${currentIndex + 1}]...`);
            Logger.info(`开始分析第 ${currentIndex + 1} 个内容块`);
            await Utils.pause(1);
            const type = parseInt(tab.querySelector(SELECTORS.CONTENT_MAIN)?.dataset.type);
            if ([1, 2, 3].includes(type)) {
                await this._handleQuestion(tab, type, currentIndex);
            } else {
                this.ui.updateStatus("非结构化数据，跳过处理...");
            }
            await Utils.pause(3);
            this._nextQuestion(tab, currentIndex);
        }
        this.running = false;
        this.ui.updateStatus("批量解析任务完成");
        Logger.info("所有队列任务执行完毕");
    }
    _getCurrentIndex() {
        const onHead = document.querySelector(SELECTORS.TOPIC_HEAD + ".on");
        return onHead ? parseInt(onHead.textContent) - 1 : 0;
    }
    async _handleQuestion(tab, type, index) {
        if (type === 2) {
            tab.querySelectorAll("label input").forEach(input => input.checked = false);
        }
        try {
            const questionEl = tab.querySelector(SELECTORS.CONTENT_MAIN);
            const question = questionEl.innerText.replace(/\n\.\n/g, ".");
            const answer = await this._getAnswer(question);
            if (answer) {
                const cleanAnswer = answer.match(/[a-zA-Z]+/)?.[0] || "";
                this.ui.updateStatus(`内容匹配结果 [Index: ${index + 1}]: ${cleanAnswer}`);
                Logger.info(`内容匹配结果 [Index: ${index + 1}]: ${cleanAnswer}`);
                const answerList = cleanAnswer.split("");
                tab.querySelectorAll("label").forEach(label => {
                    if (answerList.some(item => label.innerText.includes(item))) {
                        const input = label.querySelector("input");
                        if (input) input.checked = true;
                    }
                });
            }
        } catch (e) {
            Logger.error("API 响应解析异常: " + e.message);
            this.ui.updateStatus("非标准数据格式，自动跳过...");
        }
    }
    _getAnswer(question) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: API.AI_CHAT,
                headers: {
                    "Authorization": "Bearer " + ConfigManager.apiKey,
                    "Content-Type": "application/json"
                },
                data: JSON.stringify({
                    "model": ConfigManager.endpointId,
                    "messages": [
                        {
                            "role": "user",
                            "content": "仅输出标识符，无需解释。\n" + question
                        }
                    ]
                }),
                onload: (res) => {
                    if (res.status === 200) {
                        try {
                            const json = JSON.parse(res.responseText);
                            resolve(json.choices[0].message.content);
                        } catch (e) {
                            reject("解析失败");
                        }
                    } else {
                        reject("API错误: " + res.status);
                    }
                },
                onerror: () => reject("网络错误")
            });
        });
    }
    _nextQuestion(tab, index) {
        const saveBtn = tab.querySelector("input.save");
        if (saveBtn && saveBtn.offsetParent !== null) {
            saveBtn.click();
            const nextLink = document.querySelectorAll(SELECTORS.INTRO_LIST)[index + 1]?.querySelector("a");
            if (nextLink) nextLink.click();
        } else {
            const nextBtn = tab.querySelector("input.next");
            if (nextBtn) nextBtn.click();
        }
    }
}
class App {
    constructor() {
        this.ui = new UIManager();
        this.videoPlayer = new VideoPlayer(this.ui);
        this.captchaHandler = new CaptchaHandler(this.ui);
        this.ContentSolver = new ContentSolver(this.ui);
        this.checkTimer = null;
        this.isVideoMode = false;
    }
    init() {
        if (!this._checkFirstUse()) return;
        this.ui.init();
        Logger.info(`安装过老版本的需要把老版本删除或者禁用。`);
        Logger.info(`自动化执行工具 v${CONFIG.VERSION} 启动`);
        this._setupPageTimeout();
        this._initVisibilityListener();
        this.captchaHandler.startObserver();
        this._checkUrl();
    }
    _initVisibilityListener() {
        document.addEventListener("visibilitychange", () => {
            if (!this.isVideoMode) return;
            if (document.hidden) {
                Logger.warn("检测到页面被隐藏 (最小化或切换标签)");
            } else {
                Logger.info("页面恢复可见");
            }
        });
        window.addEventListener("blur", () => {
            if (!this.isVideoMode) return;
            Logger.warn("检测到窗口失去焦点 (切屏)");
        });
        window.addEventListener("focus", () => {
            if (!this.isVideoMode) return;
            Logger.info("窗口重新获得焦点");
        });
    }
    _checkFirstUse() {
        const isFirstUse = GM_getValue("firstUse", true);
        if (isFirstUse) {
            const mzsm = prompt("跨平台 Web 自动化执行工具\n若要使用，请阅读并同意以下声明。\n\n" +
                "1. 本项目仅供前端技术研究与自动化测试学习交流使用（For Technical Research & Educational Purpose Only）。\n" +
                "2. 项目旨在验证 DOM 监听、浏览器指纹模拟及事件流劫持等技术在复杂 Web 环境下的可行性。\n" +
                "3. 请勿将本项目代码用于任何违反目标平台用户协议的商业活动或不正当用途。\n" +
                "4. 使用者应自行承担使用本工具可能带来的风险。\n\n" +
                "若您同意以上内容，请输入“我已阅读并同意以上内容” 然后开始使用。", "");
            if (mzsm === "我已阅读并同意以上内容") {
                GM_setValue("firstUse", false);
                return true;
            } else {
                alert("免责条款未同意，工具停止运行。\n若不想使用，请自行禁用工具，以免每个页面都弹出该提示。");
                return false;
            }
        }
        return true;
    }
    _checkUrl() {
        const href = window.location.href;
        if (href.includes("/node")) {
            this._startVideoMode();
        } else if (href.includes("/exam")) {
            this._startAnalysisMode();
        } else if (href.includes("/user/login")) {
            this.captchaHandler.checkAndSolveLogin();
        } else if (href.includes("/user/study_record")) {
            this._checkStudyRecord();
        } else {
            this.ui.updateStatus("系统就绪，等待用户操作...");
        }
    }
    async _checkStudyRecord() {
        if (ConfigManager.videoStage !== 2) return;
        this.ui.updateStatus("正在审计执行进度...");
        Logger.info("启动进度核查程序");
        await Utils.pause(2);
        const progressEl = document.querySelector(".score-table td");
        if (progressEl && progressEl.innerText.includes("100%")) {
            Logger.info("任务队列执行率达成 100%");
            this.ui.notify("完成", "所有任务指标已达成 100%");
            this.ui.updateStatus("全流程任务结束");
            ConfigManager.videoStage = 1;
            this.isVideoMode = false;
            return;
        }
        const rows = document.querySelectorAll("table#list tbody tr");
        let foundUnfinished = false;
        for (const row of rows) {
            const status = row.querySelector("td:last-child span")?.innerText;
            if (status && !status.includes("已")) {
                const link = row.querySelector("td:first-child a");
                if (link) {
                    Logger.info(`发现挂起任务: ${link.innerText}，准备重新调度...`);
                    this.ui.updateStatus(`重试任务: ${link.innerText}`);
                    foundUnfinished = true;
                    await Utils.pause(1);
                    link.click();
                    return;
                }
            }
        }

        if (!foundUnfinished) {
            const nextBtn = document.querySelector(".page-btn.next");
            if (nextBtn && !nextBtn.classList.contains("disabled")) {
                Logger.info("当前页任务通过，加载下一页...");
                this.ui.updateStatus("分页数据加载中...");
                await Utils.pause(1);
                nextBtn.click();
                setTimeout(() => this._checkStudyRecord(), 3000);
            } else {
                Logger.warn("未发现挂起任务，但总指标未达 100%，请人工复核");
                this.ui.notify("警告", "自动审计结束，请人工复核异常项");
                ConfigManager.videoStage = 1;
                this.isVideoMode = false;
            }
        }
    }
    async _startVideoMode() {
        this.isVideoMode = true;
        this.ui.updateStatus("媒体流处理模式已启动");
        Logger.info("媒体流处理模式已启动");
        GM_registerMenuCommand("启动自动执行", () => this._videoLoop());
        GM_registerMenuCommand("停止自动执行", () => this._stopVideoLoop());
        document.addEventListener("sk:video_ended", () => {
            if (ConfigManager.videoStage === 2) {
                this._returnToStudyRecord();
            } else {
                this._playNextVideo();
            }
        });
        await Utils.pause(3);
        this._videoLoop();
    }
    async _returnToStudyRecord() {
        this.ui.updateStatus("单元任务完成，返回控制中心...");
        Logger.info("单元任务完成，返回控制中心执行审计");
        await Utils.pause(2);
        this._navigateToStudyRecord();
    }
    _navigateToStudyRecord() {
        let courseId = new URLSearchParams(location.search).get("courseId");
        if (!courseId) {
            const input = document.querySelector('input[name="courseId"]');
            if (input) {
                courseId = input.value;
            }
        }
        if (courseId) {
            location.href = `/user/study_record?courseId=${courseId}`;
        } else {
            Logger.error("路由参数丢失，任务终止");
            this.ui.updateStatus("路由参数丢失，任务终止");
            ConfigManager.videoStage = 1;
            this.isVideoMode = false;
        }
    }
    _startAnalysisMode() {
        this.ui.updateStatus("结构化数据解析模式已启动");
        Logger.info("结构化数据解析模式已启动");
        GM_registerMenuCommand("启动解析任务", () => this.ContentSolver.start());
        GM_registerMenuCommand("停止解析任务", () => this.ContentSolver.stop());
    }
    async _videoLoop() {
        if (this.checkTimer) clearInterval(this.checkTimer);
        this.checkTimer = setInterval(async () => {
            const solved = await this.captchaHandler.checkAndSolve();
            if (solved) return;
            const video = document.querySelector(SELECTORS.VIDEO);
            if (video && video.paused) {
                await this.videoPlayer.start();
            }
        }, CONFIG.THRESHOLDS.CAPTCHA_CHECK_INTERVAL);
    }
    _stopVideoLoop() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
        this.ui.updateStatus("自动执行引擎挂起");
    }
    async _playNextVideo() {
        this._stopVideoLoop();
        const links = document.querySelectorAll(SELECTORS.COURSE_LINKS);
        let current = -1;
        links.forEach((link, index) => {
            if (link.classList.contains("on")) current = index;
        });
        if (current !== -1 && current < links.length - 1) {
            this.ui.updateStatus("调度下一个媒体资源...");
            await Utils.pause(3);
            links[current + 1].click();
            setTimeout(() => this._videoLoop(), 2000);
        } else {
            this.ui.notify("完成", "当前列表资源处理完毕");
            this.ui.updateStatus("资源遍历结束，启动审计程序...");
            Logger.info("资源遍历结束，启动审计程序");
            ConfigManager.videoStage = 2;
            await Utils.pause(2);
            this._navigateToStudyRecord();
        }
    }
    _setupPageTimeout() {
        const minutes = ConfigManager.timeoutMinutes;
        if (minutes > 0) {
            setTimeout(() => {
                if (this.isVideoMode) {
                    this.ui.notify("超时", "页面停留超时，即将刷新");
                    setTimeout(() => location.reload(), 5000);
                }
            }, minutes * 60 * 1000);
        }
    }
}
function matchUrl() {
    let iconLink = document.querySelector("link[rel='shortcut icon']");
    if (iconLink && /ifulling/.test(iconLink.getAttribute("href"))) {
        return true;
    }
    const urls = ConfigManager.urls;
    const currentUrl = window.location.hostname;
    for (let i = 0; i < urls.length; i++) {
        if (currentUrl.includes(urls[i].trim())) {
            return true;
        }
    }
    return false;
}
function quick502Check() {
    const errorText = document.body.innerText || document.documentElement.innerText || "";
    const title = document.title || "";
    if (/Internal Server Error|Service Unavailable|Bad Gateway/i.test(errorText + title)) {
        setTimeout(() => {
            location.reload();
        }, 5000);
        return true;
    }
    return false;
}
(function () {
    'use strict';
    if (!matchUrl()) return;
    if (quick502Check()) return;
    const app = new App();
    window.addEventListener("load", () => app.init());
})();
