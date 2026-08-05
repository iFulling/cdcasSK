import { Logger } from "../core/logger.js";
import { ConfigManager } from "../core/config-manager.js";
import { LocalOcrEngine } from "../features/ocr-engine.js";
import { renderPanel, renderToolbar } from "./panel-template.js";
import styles from "./styles.css?inline";

export class UIManager {
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
        div.textContent = "刷课助手准备就绪";
        document.body.appendChild(div);
        this.panel = div;
    }
    _createLogPopup() {
        const popup = document.createElement("div");
        popup.id = "sk-log-popup";
        popup.className = "sk-log-popup";
        popup.innerHTML = renderPanel();
        document.body.appendChild(popup);
        this.logPopup = popup;
        this.logContent = popup.querySelector(".sk-log-content");
        const icon = document.createElement("div");
        icon.id = "sk-min-icon";
        icon.className = "sk-min-icon hidden";
        icon.innerHTML = "刷课<br />助手";
        icon.title = "打开刷课助手";
        document.body.appendChild(icon);
        this.minIcon = icon;
        const header = popup.querySelector(".sk-log-header");
        header.addEventListener("mousedown", (e) => this._onDragStart(e));
        document.addEventListener("mousemove", (e) => this._onDragMove(e));
        document.addEventListener("mouseup", () => this._onDragEnd());
        popup.querySelector(".sk-log-close").addEventListener("click", () => this.toggleLogPopup());
        popup.querySelector(".sk-log-clear").addEventListener("click", () => this.clearLog());
        const recaptchaBtn = popup.querySelector(".sk-recaptcha");
        if (recaptchaBtn) {
            recaptchaBtn.addEventListener("click", () => {
                document.dispatchEvent(new CustomEvent("sk:recaptcha_login"));
            });
        }
        const examStartBtn = popup.querySelector(".sk-exam-start");
        const examStopBtn = popup.querySelector(".sk-exam-stop");
        if (examStartBtn) {
            examStartBtn.addEventListener("click", () => {
                document.dispatchEvent(new CustomEvent("sk:exam_start"));
            });
        }
        if (examStopBtn) {
            examStopBtn.addEventListener("click", () => {
                document.dispatchEvent(new CustomEvent("sk:exam_stop"));
            });
        }

        const checkModels = async () => {
            try {
                const engine = new LocalOcrEngine(this);
                const sn = popup.querySelector("#status-onnx");
                const sj = popup.querySelector("#status-json");
                const sw = popup.querySelector("#status-wasm");

                if (sn && sj && sw) {
                    const onnx = await engine._getFromDB("common.onnx");
                    const json = await engine._getFromDB("charsets.json");
                    const wasm = await engine._getFromDB("ort-wasm.wasm");
                    sn.textContent = onnx ? "已就绪" : "未导入";
                    sn.style.color = onnx ? "#4ec9b0" : "#f48771";
                    sj.textContent = json ? "已就绪" : "未导入";
                    sj.style.color = json ? "#4ec9b0" : "#f48771";
                    sw.textContent = wasm ? "已就绪" : "未导入";
                    sw.style.color = wasm ? "#4ec9b0" : "#f48771";
                }
                const autoFillTip = popup.querySelector("#cfg-auto-fill-tip");
                const autoFillFields = popup.querySelector("#cfg-auto-fill-fields");
                const autoFillFieldsPwd = popup.querySelector("#cfg-auto-fill-fields-pwd");
                const syncVisibility = () => {
                    const show = popup.querySelector("#cfg-auto-fill-account")?.checked;
                    if (autoFillTip) autoFillTip.style.display = show ? "block" : "none";
                    if (autoFillFields) autoFillFields.style.display = show ? "block" : "none";
                    if (autoFillFieldsPwd) autoFillFieldsPwd.style.display = show ? "block" : "none";
                };
                syncVisibility();
            } catch { }
        };

        const autoImportVisualModels = async (force = false) => {
            if (!force && !ConfigManager.autoImportModels) {
                const engine = new LocalOcrEngine(this);
                const [onnx, json, wasm] = await Promise.all([
                    engine._getFromDB("common.onnx"),
                    engine._getFromDB("charsets.json"),
                    engine._getFromDB("ort-wasm.wasm")
                ]);
                if (onnx && json && wasm) return;
                Logger.warn("自动导入已关闭，检测到模型缺失，请手动导入");
                return;
            }
            try {
                const engine = new LocalOcrEngine(this);
                const [onnx, json, wasm] = await Promise.all([
                    engine._getFromDB("common.onnx"),
                    engine._getFromDB("charsets.json"),
                    engine._getFromDB("ort-wasm.wasm")
                ]);
                const missing = [];
                if (!onnx) missing.push({ key: "common.onnx", type: "arraybuffer", name: "视觉特征模型(ONNX)" });
                if (!json) missing.push({ key: "charsets.json", type: "json", name: "字符集(JSON)" });
                if (!wasm) missing.push({ key: "ort-wasm.wasm", type: "arraybuffer", name: "推理引擎(WASM)" });
                if (!missing.length) {
                    Logger.info("视觉模型已存在，无需自动导入");
                    await checkModels();
                    return;
                }
                if (!ConfigManager.autoImportModels) {
                    Logger.info("自动导入视觉模型已关闭，但当前页面仍需要模型，请手动在配置面板中导入");
                    await checkModels();
                    return;
                }
                this.notify("准备导入", "正在自动导入视觉模型...");
                for (const item of missing) {
                    const urls = item.type === "json" ? engine.charsetsUrls : (item.key === "ort-wasm.wasm" ? [
                        "https://registry.npmmirror.com/onnxruntime-web/1.17.0/files/dist/ort-wasm.wasm",
                        "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm.wasm",
                        "https://unpkg.com/onnxruntime-web@1.17.0/dist/ort-wasm.wasm"
                    ] : engine.modelUrls);
                    const data = await engine.fetchWithFallback(urls, item.type, item.key);
                    if (!data) throw new Error(`${item.name} 下载失败`);
                    Logger.info(`自动导入成功：${item.name}`);
                }
                this.notify("导入成功", "视觉模型自动导入完成！");
            } catch (err) {
                Logger.warn(`自动导入视觉模型失败：${err.message}`);
                this.notify("自动导入失败", err.message);
            } finally {
                await checkModels();
            }
        };
        setTimeout(async () => {
            await checkModels();
            await autoImportVisualModels();
        }, 500);

        const bindImport = (btnId, fileId, key, isJson, name) => {
            const btn = popup.querySelector(btnId);
            const fileInput = popup.querySelector(fileId);
            if (btn && fileInput) {
                btn.addEventListener("click", () => fileInput.click());
                fileInput.addEventListener("change", async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                        this.notify("准备导入", `正在读取 ${name} 文件...`);
                        let data;
                        if (isJson) {
                            const text = await file.text();
                            data = JSON.parse(text);
                        } else {
                            data = await file.arrayBuffer();
                        }
                        const engine = new LocalOcrEngine(this);
                        const success = await engine._saveToDB(key, data);
                        if (success) {
                            this.notify("导入成功", `${name} 导入完成！将会在下次触发验证码时生效。`);
                            Logger.info(`已通过本地文件导入 ${name}`);
                            await checkModels();
                        } else {
                            this.notify("导入失败", "写入本地缓存失败！");
                        }
                    } catch (err) {
                        this.notify("导入失败", "读取文件或格式错误：" + err.message);
                        Logger.error(`导入 ${name} 异常: ` + err.message);
                    }
                    fileInput.value = '';
                });
            }
        };

        bindImport("#btn-import-onnx", "#file-import-onnx", "common.onnx", false, "视觉特征模型(ONNX)");
        bindImport("#btn-import-json", "#file-import-json", "charsets.json", true, "字符集(JSON)");
        bindImport("#btn-import-wasm", "#file-import-wasm", "ort-wasm.wasm", false, "推理引擎(WASM)");

        const autoImportSwitch = popup.querySelector("#cfg-auto-import");
        if (autoImportSwitch) {
            autoImportSwitch.addEventListener("change", () => {
                ConfigManager.autoImportModels = autoImportSwitch.checked;
                if (autoImportSwitch.checked) {
                    autoImportVisualModels(true);
                } else {
                    this.notify("已关闭", "自动导入视觉模型已关闭，后续不会自动补全缺失模型");
                    Logger.info("自动导入视觉模型已关闭");
                }
            });
        }

        const autoFillSwitch = popup.querySelector("#cfg-auto-fill-account");
        const autoFillTip = popup.querySelector("#cfg-auto-fill-tip");
        const autoFillFields = popup.querySelector("#cfg-auto-fill-fields");
        const autoFillFieldsPwd = popup.querySelector("#cfg-auto-fill-fields-pwd");
        const updateAutoFillVisibility = () => {
            const show = !!autoFillSwitch?.checked;
            if (autoFillTip) autoFillTip.style.display = show ? "block" : "none";
            if (autoFillFields) autoFillFields.style.display = show ? "block" : "none";
            if (autoFillFieldsPwd) autoFillFieldsPwd.style.display = show ? "block" : "none";
        };
        if (autoFillSwitch) {
            autoFillSwitch.addEventListener("change", updateAutoFillVisibility);
            updateAutoFillVisibility();
        }

        icon.addEventListener("click", () => {
            this.toggleLogPopup();
            if (!this.logPopup.classList.contains("hidden")) checkModels();
        });
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
            ConfigManager.autoImportModels = popup.querySelector("#cfg-auto-import").checked;
            ConfigManager.autoFillAccount = popup.querySelector("#cfg-auto-fill-account").checked;
            ConfigManager.loginAccount = popup.querySelector("#cfg-login-account")?.value || "";
            ConfigManager.loginPassword = popup.querySelector("#cfg-login-password")?.value || "";
            const rawUrls = popup.querySelector("#cfg-urls").value;
            ConfigManager.urls = rawUrls.split('\n').map(u => u.trim()).filter(u => u).join('|');
            this.notify("成功", "配置已保存，刷新页面生效");
            setTimeout(() => location.reload(), 1000);
        });
    }
    updateToolbar() {
        const toolbar = this.logPopup?.querySelector(".sk-log-toolbar");
        if (!toolbar) return;
        toolbar.innerHTML = renderToolbar();
        const clearBtn = toolbar.querySelector(".sk-log-clear");
        if (clearBtn) clearBtn.onclick = () => this.clearLog();
        const recaptchaBtn = toolbar.querySelector(".sk-recaptcha");
        if (recaptchaBtn) {
            recaptchaBtn.onclick = () => document.dispatchEvent(new CustomEvent("sk:recaptcha_login"));
        }
        const examStartBtn = toolbar.querySelector(".sk-exam-start");
        const examStopBtn = toolbar.querySelector(".sk-exam-stop");
        if (examStartBtn) {
            examStartBtn.onclick = () => document.dispatchEvent(new CustomEvent("sk:exam_start"));
        }
        if (examStopBtn) {
            examStopBtn.onclick = () => document.dispatchEvent(new CustomEvent("sk:exam_stop"));
        }
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
        GM_addStyle(styles);
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
