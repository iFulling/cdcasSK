import { Logger } from "../core/logger.js";
import { Utils } from "../core/utils.js";
import { SELECTORS } from "../config.js";
import { ConfigManager } from "../core/config-manager.js";
import { LocalOcrEngine } from "./ocr-engine.js";

export class CaptchaHandler {
    constructor(ui) {
        this.ui = ui;
        this.observer = null;
        this.isRecognizing = false;
        this.isLoginRecognizing = false;
        this.ocrEngine = new LocalOcrEngine(ui);
    }
    startObserver() {
        if (this.observer) return;
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    const layer = node.matches(SELECTORS.CAPTCHA_LAYER) ? node : node.querySelector(SELECTORS.CAPTCHA_LAYER);
                    if (layer && layer.querySelector("img") && layer.querySelector("input")) {
                        Logger.info("MutationObserver 检测到验证码弹窗");
                        this.checkAndSolve();
                    }
                }
            }
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
        Logger.info("已启动 MutationObserver 监听验证码");
    }
    async checkAndSolve() {
        if (this.isRecognizing) return false;
        const layer = document.querySelector(SELECTORS.CAPTCHA_LAYER);
        if (!layer || layer.offsetParent === null || !layer.querySelector("img") || !layer.querySelector("input")) {
            return false;
        }
        this.isRecognizing = true;
        try {
            this.ui.updateStatus("检测到验证码，准备识别...");
            await Utils.pause(2);
            const imgs = document.querySelectorAll(SELECTORS.CAPTCHA_IMG);
            let img = null;
            if (imgs.length > 0) {
                img = imgs[0].style.opacity === '0' && imgs.length > 1 ? imgs[1] : imgs[0];
            }
            if (!img) {
                this.isRecognizing = false;
                return false;
            }
            const code = await this.ocrEngine.recognize(img);
            if (code) {
                this.ui.updateStatus(`识别结果: ${code}，正在提交...`);
                Logger.info(`验证码识别结果: ${code}`);
                const inputs = document.querySelectorAll(SELECTORS.CAPTCHA_INPUT);
                let input = null;
                if (inputs.length > 0) {
                    input = inputs[0].style.display === 'none' && inputs.length > 1 ? inputs[1] : inputs[0];
                }
                if (input) {
                    input.dispatchEvent(new MouseEvent('mousedown'));
                    input.value = code;
                    input.dispatchEvent(new Event('input'));
                    await Utils.pause(1);
                    const btn = document.querySelector(SELECTORS.PLAY_BUTTON);
                    if (btn) {
                        btn.click();
                        this.ui.updateStatus("验证码已提交，等待系统确认...");
                        for (let i = 0; i < 8; i++) {
                            await Utils.pause(0.5);
                            const checkLayer = document.querySelector(SELECTORS.CAPTCHA_LAYER);
                            if (!checkLayer || checkLayer.offsetParent === null) break;
                        }
                    }
                    this.ui.updateStatus("视频播放中...");
                    this.isRecognizing = false;
                    return true;
                }
            }
            this.isRecognizing = false;
            return false;
        } catch {
            this.isRecognizing = false;
            return false;
        }
    }
    async checkAndSolveLogin() {
        if (!ConfigManager.autoLoginCaptcha || this.isLoginRecognizing) return;
        this.isLoginRecognizing = true;
        this.ui.updateStatus("正在等待登录验证码加载...");

        const getElements = () => {
            let img = document.querySelector("#codeImg") || document.querySelector(".captcha-image img");
            let input = document.querySelector("#code") || document.querySelector('input[placeholder="请输入验证码"]');
            return { img, input };
        };

        let { img, input } = getElements();
        let attempts = 0;
        while ((!img || !input) && attempts < 20) {
            await Utils.pause(0.5);
            ({ img, input } = getElements());
            attempts++;
        }
        if (img && input) {
            this.ui.updateStatus("检测到登录验证码，准备识别...");
            await Utils.pause(1);
            const code = await this.ocrEngine.recognize(img);
            const currentHref = window.location.href;
            if (!currentHref.includes("/login")) {
                this.isLoginRecognizing = false;
                return;
            }

            if (code) {
                this.ui.updateStatus(`登录验证码识别结果: ${code}`);
                Logger.info(`登录验证码识别结果: ${code}`);
                input.value = code;
                input.dispatchEvent(new Event('input'));
            }
        } else {
            this.ui.updateStatus("未检测到登录验证码");
        }
        this.isLoginRecognizing = false;
    }
    async solveLoginCaptcha() {
        Logger.info("手动触发重新识别登录验证码");
        const img = document.querySelector("#codeImg") || document.querySelector(".captcha-image img");
        const input = document.querySelector("#code") || document.querySelector('input[placeholder="请输入验证码"]');
        if (!img || !input) {
            this.ui.updateStatus("未检测到登录验证码元素");
            return;
        }
        img.click();
        await Utils.pause(1.5);
        this.ui.updateStatus("正在重新识别验证码...");
        const code = await this.ocrEngine.recognize(img);
        if (code) {
            this.ui.updateStatus(`登录验证码识别结果: ${code}`);
            Logger.info(`登录验证码识别结果: ${code}`);
            input.value = code;
            input.dispatchEvent(new Event('input'));
        } else {
            this.ui.updateStatus("验证码识别失败");
            Logger.warn("手动重新识别验证码失败");
        }
    }

}
