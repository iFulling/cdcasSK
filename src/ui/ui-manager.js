import { Logger } from "../core/logger.js";
import { ConfigManager } from "../core/config-manager.js";
import { LocalOcrEngine } from "../features/ocr-engine.js";
import {
    AiClient,
    PROVIDERS,
    getBaseUrlHint,
    getDefaultProviderForProtocol,
    getProvider,
    getProvidersForProtocol
} from "../ai/index.js";
import { renderPanel, renderToolbar } from "./panel-template.js";
import styles from "./styles.css?inline";
import brandIcon from "../assets/icon.png";

export class UIManager {
    constructor() {
        this.panel = null;
        this.statusText = null;
        this.logPopup = null;
        this.logContent = null;
        this.logCountEl = null;
        this.consoleStatus = null;
        this._isDragging = false;
        this._dragOffset = { x: 0, y: 0 };
        this._statusAnimationTimer = null;
    }
    init() {
        this._registerMenus();
        this._injectStyles();
        this._createStatusPanel();
        this._createLogPopup();
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
        div.setAttribute("role", "status");
        div.setAttribute("aria-live", "polite");
        div.innerHTML = '<span class="sk-panel-indicator" aria-hidden="true"></span><span class="sk-panel-text">刷课助手准备就绪</span>';
        document.body.appendChild(div);
        this.panel = div;
        this.statusText = div.querySelector(".sk-panel-text");
    }
    _createLogPopup() {
        const popup = document.createElement("div");
        popup.id = "sk-log-popup";
        popup.className = "sk-log-popup";
        popup.setAttribute("role", "dialog");
        popup.setAttribute("aria-label", "英华刷课助手控制台");
        popup.setAttribute("aria-hidden", "false");
        popup.innerHTML = renderPanel();
        document.body.appendChild(popup);
        this.logPopup = popup;
        this.logContent = popup.querySelector(".sk-log-content");
        this.logCountEl = popup.querySelector("#sk-log-count");
        this.consoleStatus = popup.querySelector("#sk-console-status");
        const icon = document.createElement("button");
        icon.type = "button";
        icon.id = "sk-min-icon";
        icon.className = "sk-min-icon hidden";
        icon.innerHTML = `<img src="${brandIcon}" alt=""><span class="sk-min-label">刷课助手</span><i aria-hidden="true"></i>`;
        icon.title = "打开刷课助手";
        icon.setAttribute("aria-label", "打开刷课助手控制台");
        icon.setAttribute("aria-controls", "sk-log-popup");
        icon.setAttribute("aria-hidden", "true");
        document.body.appendChild(icon);
        this.minIcon = icon;
        this.panel?.classList.add("is-console-open");
        const dragHandle = popup.querySelector(".sk-log-topbar");
        dragHandle.addEventListener("pointerdown", (e) => this._onDragStart(e));
        document.addEventListener("pointermove", (e) => this._onDragMove(e));
        document.addEventListener("pointerup", () => this._onDragEnd());
        window.addEventListener("resize", () => this._keepPanelInViewport());
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !this.logPopup?.classList.contains("hidden")) {
                this.toggleLogPopup();
            }
        });
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
                    sn.dataset.state = onnx ? "ready" : "missing";
                    sj.textContent = json ? "已就绪" : "未导入";
                    sj.dataset.state = json ? "ready" : "missing";
                    sw.textContent = wasm ? "已就绪" : "未导入";
                    sw.dataset.state = wasm ? "ready" : "missing";
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
        const tabs = Array.from(popup.querySelectorAll(".sk-tab-btn"));
        tabs.forEach((btn, index) => {
            btn.addEventListener("click", () => this._activateTab(popup, btn));
            btn.addEventListener("keydown", (e) => {
                let nextIndex = null;
                if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
                if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
                if (e.key === "Home") nextIndex = 0;
                if (e.key === "End") nextIndex = tabs.length - 1;
                if (nextIndex === null) return;
                e.preventDefault();
                this._activateTab(popup, tabs[nextIndex], true);
            });
        });
        this._bindConfigNavigation(popup);
        this._bindAiConfig(popup);
        const saveButton = popup.querySelector("#cfg-save");
        saveButton.addEventListener("click", () => {
            ConfigManager.timeoutMinutes = parseInt(popup.querySelector("#cfg-timeout").value) || 0;
            ConfigManager.saveAiSettings({
                providerId: popup.querySelector("#cfg-ai-provider").value,
                protocolId: popup.querySelector("#cfg-ai-protocol").value,
                baseUrl: popup.querySelector("#cfg-ai-baseurl").value.trim(),
                model: popup.querySelector("#cfg-ai-model").value.trim(),
                apiKey: popup.querySelector("#cfg-apikey").value.trim()
            });
            ConfigManager.aiRetry = parseInt(popup.querySelector("#cfg-ai-retry").value) || 0;
            ConfigManager.autoLoginCaptcha = popup.querySelector("#cfg-auto-login").checked;
            ConfigManager.autoImportModels = popup.querySelector("#cfg-auto-import").checked;
            ConfigManager.autoFillAccount = popup.querySelector("#cfg-auto-fill-account").checked;
            ConfigManager.loginAccount = popup.querySelector("#cfg-login-account")?.value || "";
            ConfigManager.loginPassword = popup.querySelector("#cfg-login-password")?.value || "";
            const rawUrls = popup.querySelector("#cfg-urls").value;
            ConfigManager.urls = rawUrls.split('\n').map(u => u.trim()).filter(u => u).join('|');
            saveButton.disabled = true;
            saveButton.setAttribute("aria-busy", "true");
            saveButton.textContent = "配置已保存";
            this.notify("成功", "配置已保存，刷新页面生效");
            setTimeout(() => location.reload(), 1000);
        });
    }
    _bindConfigNavigation(popup) {
        const tabs = Array.from(popup.querySelectorAll(".sk-config-nav-btn"));
        tabs.forEach((button, index) => {
            button.addEventListener("click", () => this._activateConfigPane(popup, button));
            button.addEventListener("keydown", (e) => {
                let nextIndex = null;
                if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
                if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
                if (e.key === "Home") nextIndex = 0;
                if (e.key === "End") nextIndex = tabs.length - 1;
                if (nextIndex === null) return;
                e.preventDefault();
                this._activateConfigPane(popup, tabs[nextIndex], true);
            });
        });
    }
    _activateConfigPane(popup, button, focus = false) {
        const pane = button.dataset.configPane;
        popup.querySelectorAll(".sk-config-nav-btn").forEach(item => {
            const isActive = item === button;
            item.classList.toggle("active", isActive);
            item.setAttribute("aria-selected", String(isActive));
            item.tabIndex = isActive ? 0 : -1;
        });
        popup.querySelectorAll(".sk-config-pane").forEach(content => {
            const isActive = content.id === `sk-config-${pane}`;
            content.classList.toggle("active", isActive);
            content.hidden = !isActive;
        });
        const configTab = popup.querySelector("#sk-tab-config");
        if (configTab) configTab.scrollTop = 0;
        if (focus) button.focus();
    }
    /**
     * 搜题配置区的联动：
     * 先按接口格式筛选服务商预设，再同步地址、模型和密钥。
     * 模型列表与连通性测试都直接使用面板当前值，不要求先保存。
     */
    _bindAiConfig(popup) {
        const providerSel = popup.querySelector("#cfg-ai-provider");
        const protocolSel = popup.querySelector("#cfg-ai-protocol");
        const baseUrlInput = popup.querySelector("#cfg-ai-baseurl");
        const baseUrlHint = popup.querySelector("#cfg-ai-baseurl-hint");
        const modelInput = popup.querySelector("#cfg-ai-model");
        const modelFetchBtn = popup.querySelector("#cfg-ai-fetch-models");
        const modelSelect = popup.querySelector("#cfg-ai-model-select");
        const modelListResult = popup.querySelector("#cfg-ai-model-list-result");
        const modelHint = popup.querySelector("#cfg-ai-model-hint");
        const keyLabel = popup.querySelector("#cfg-ai-key-label");
        const keyInput = popup.querySelector("#cfg-apikey");
        const testBtn = popup.querySelector("#cfg-ai-test");
        const testResult = popup.querySelector("#cfg-ai-test-result");
        if (!providerSel) return;

        const drafts = new Map();
        let activeProviderId = providerSel.value;
        const readFields = () => ({
            baseUrl: baseUrlInput.value.trim(),
            apiKey: keyInput.value.trim(),
            model: modelInput.value.trim()
        });
        const readForm = () => ({
            providerId: activeProviderId,
            protocolId: protocolSel.value,
            ...readFields()
        });
        const setTestResult = (text, state = "neutral") => {
            if (!testResult) return;
            testResult.textContent = text;
            testResult.dataset.state = state;
        };
        const setModelListResult = (text, state = "neutral") => {
            if (!modelListResult) return;
            modelListResult.textContent = text;
            modelListResult.dataset.state = state;
        };
        const clearModelList = () => {
            if (modelSelect) {
                modelSelect.replaceChildren(new Option("请选择模型", ""));
                modelSelect.hidden = true;
            }
            setModelListResult("");
        };
        const syncProviderMeta = () => {
            const provider = getProvider(activeProviderId);
            baseUrlInput.placeholder = provider.baseUrl || "例如 https://你的域名/v1";
            modelInput.placeholder = provider.model || "请填写模型名称";
            if (modelHint) modelHint.textContent = provider.modelHint || "";
            if (keyLabel) keyLabel.textContent = `${provider.keyLabel || "API Key"}：`;
            if (baseUrlHint) {
                baseUrlHint.textContent = getBaseUrlHint(activeProviderId, protocolSel.value);
            }
            setTestResult("");
        };
        const loadProviderFields = id => {
            const settings = drafts.get(id) || ConfigManager.getAiSettings(id);
            baseUrlInput.value = settings.baseUrl;
            modelInput.value = settings.model;
            keyInput.value = settings.apiKey;
            syncProviderMeta();
            clearModelList();
        };
        const renderProviderOptions = (protocolId, preferredId) => {
            const providerIds = getProvidersForProtocol(protocolId);
            providerSel.replaceChildren(...providerIds.map(id => new Option(PROVIDERS[id].label, id)));
            const nextId = providerIds.includes(preferredId)
                ? preferredId
                : getDefaultProviderForProtocol(protocolId);
            providerSel.value = nextId;
            return nextId;
        };

        providerSel.addEventListener("change", () => {
            drafts.set(activeProviderId, readFields());
            activeProviderId = providerSel.value;
            loadProviderFields(activeProviderId);
        });
        protocolSel.addEventListener("change", () => {
            drafts.set(activeProviderId, readFields());
            const nextProviderId = renderProviderOptions(protocolSel.value, activeProviderId);
            if (nextProviderId !== activeProviderId) {
                activeProviderId = nextProviderId;
                loadProviderFields(activeProviderId);
            } else {
                syncProviderMeta();
                clearModelList();
            }
        });
        baseUrlInput.addEventListener("input", clearModelList);
        keyInput.addEventListener("input", clearModelList);
        modelInput.addEventListener("input", () => {
            if (!modelSelect || modelSelect.hidden) return;
            const hasValue = Array.from(modelSelect.options)
                .some(option => option.value === modelInput.value.trim());
            modelSelect.value = hasValue ? modelInput.value.trim() : "";
        });
        modelSelect?.addEventListener("change", () => {
            if (!modelSelect.value) return;
            modelInput.value = modelSelect.value;
            setModelListResult(`已选择：${modelSelect.value}`, "success");
        });

        modelFetchBtn?.addEventListener("click", async () => {
            const client = new AiClient(readForm());
            const invalid = client.validateModelList();
            if (invalid) {
                setModelListResult(invalid, "error");
                return;
            }
            modelFetchBtn.disabled = true;
            modelFetchBtn.setAttribute("aria-busy", "true");
            setModelListResult("正在获取模型列表...", "loading");
            try {
                const models = await client.listModels();
                const firstOption = new Option(`请选择模型（共 ${models.length} 个）`, "");
                const options = models.map(model => new Option(model, model));
                modelSelect.replaceChildren(firstOption, ...options);
                const currentModel = modelInput.value.trim() || client.resolve().model;
                modelSelect.value = models.includes(currentModel) ? currentModel : "";
                modelSelect.hidden = false;
                setModelListResult(`已获取 ${models.length} 个模型`, "success");
                Logger.info(`已从 ${getProvider(activeProviderId).label} 获取 ${models.length} 个模型`);
            } catch (err) {
                clearModelList();
                setModelListResult(err.message, "error");
                Logger.error("获取模型列表失败：" + err.message);
            } finally {
                modelFetchBtn.disabled = false;
                modelFetchBtn.removeAttribute("aria-busy");
            }
        });

        if (testBtn) {
            testBtn.addEventListener("click", async () => {
                // 用面板上当前填的值测试，不依赖是否已保存
                const client = new AiClient(readForm());
                const invalid = client.validate();
                if (invalid) {
                    setTestResult(invalid, "error");
                    return;
                }
                testBtn.disabled = true;
                testBtn.setAttribute("aria-busy", "true");
                setTestResult("测试中...", "loading");
                try {
                    const reply = await client.ask("1+1等于几？只回答数字。", "你是一个测试助手，简短回答。");
                    setTestResult(`连通正常，返回：${reply.slice(0, 20)}`, "success");
                    Logger.info(`搜题接口测试成功，返回：${reply.slice(0, 50)}`);
                } catch (err) {
                    setTestResult(err.message, "error");
                    Logger.error("搜题接口测试失败：" + err.message);
                } finally {
                    testBtn.disabled = false;
                    testBtn.removeAttribute("aria-busy");
                }
            });
        }
    }
    _activateTab(popup, button, focus = false) {
        const tab = button.dataset.tab;
        popup.querySelectorAll(".sk-tab-btn").forEach(item => {
            const isActive = item === button;
            item.classList.toggle("active", isActive);
            item.setAttribute("aria-selected", String(isActive));
            item.tabIndex = isActive ? 0 : -1;
        });
        popup.querySelectorAll(".sk-tab-content").forEach(content => {
            const isActive = content.id === `sk-tab-${tab}`;
            content.classList.toggle("active", isActive);
            content.hidden = !isActive;
        });
        if (focus) button.focus();
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
        if (e.button !== 0 || e.target.closest("button, a, input, select, textarea, label")) return;
        this._isDragging = true;
        const rect = this.logPopup.getBoundingClientRect();
        this._dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.logPopup.classList.add("is-dragging");
        e.preventDefault();
    }
    _onDragMove(e) {
        if (!this._isDragging) return;
        const rect = this.logPopup.getBoundingClientRect();
        const maxX = Math.max(0, window.innerWidth - rect.width);
        const maxY = Math.max(0, window.innerHeight - Math.min(rect.height, window.innerHeight));
        const x = Math.min(maxX, Math.max(0, e.clientX - this._dragOffset.x));
        const y = Math.min(maxY, Math.max(0, e.clientY - this._dragOffset.y));
        this.logPopup.style.left = `${x}px`;
        this.logPopup.style.top = `${y}px`;
        this.logPopup.style.right = "auto";
        this.logPopup.style.bottom = "auto";
    }
    _onDragEnd() {
        this._isDragging = false;
        this.logPopup?.classList.remove("is-dragging");
    }
    _keepPanelInViewport() {
        if (!this.logPopup || this.logPopup.classList.contains("hidden")) return;
        const rect = this.logPopup.getBoundingClientRect();
        const maxX = Math.max(0, window.innerWidth - rect.width);
        const maxY = Math.max(0, window.innerHeight - Math.min(rect.height, window.innerHeight));
        this.logPopup.style.left = `${Math.min(maxX, Math.max(0, rect.left))}px`;
        this.logPopup.style.top = `${Math.min(maxY, Math.max(0, rect.top))}px`;
    }
    _injectStyles() {
        GM_addStyle(styles);
    }
    addLog(msg, level = 'info') {
        if (!this.logContent) return;
        this.logContent.querySelector(".sk-log-empty")?.remove();
        const item = document.createElement("div");
        item.className = `sk-log-item ${level}`;
        item.textContent = msg;
        this.logContent.appendChild(item);
        this._updateLogCount();
        this.logContent.scrollTop = this.logContent.scrollHeight;
    }
    clearLog() {
        if (this.logContent) {
            const empty = document.createElement("div");
            empty.className = "sk-log-empty";
            empty.textContent = "等待任务日志";
            this.logContent.replaceChildren(empty);
            this._updateLogCount();
        }
    }
    _updateLogCount() {
        if (!this.logCountEl || !this.logContent) return;
        this.logCountEl.textContent = String(this.logContent.querySelectorAll(".sk-log-item").length);
    }
    toggleLogPopup() {
        if (this.logPopup) {
            const isHidden = this.logPopup.classList.toggle("hidden");
            this.logPopup.setAttribute("aria-hidden", String(isHidden));
            this.logPopup.inert = isHidden;
            this.panel?.classList.toggle("is-console-open", !isHidden);
            if (this.minIcon) {
                this.minIcon.classList.toggle("hidden", !isHidden);
                this.minIcon.setAttribute("aria-hidden", String(!isHidden));
                if (isHidden) {
                    this.minIcon.focus();
                } else {
                    requestAnimationFrame(() => this.logPopup.querySelector(".sk-log-close")?.focus());
                }
            }
        }
    }
    updateStatus(text) {
        if (this.panel) {
            if (this.statusText) this.statusText.textContent = text;
            if (this.consoleStatus) this.consoleStatus.textContent = text;
            this.panel.style.display = "block";
            this.panel.classList.remove("is-updating");
            void this.panel.offsetWidth;
            this.panel.classList.add("is-updating");
            clearTimeout(this._statusAnimationTimer);
            this._statusAnimationTimer = setTimeout(() => this.panel?.classList.remove("is-updating"), 420);
        }
    }
    notify(title, text) {
        GM_notification({ title, text, timeout: 3000 });
    }
}
