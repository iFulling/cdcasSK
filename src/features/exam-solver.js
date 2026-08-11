import { Logger } from "../core/logger.js";
import { Utils } from "../core/utils.js";
import { SELECTORS } from "../config.js";
import { ConfigManager } from "../core/config-manager.js";
import { AiClient } from "../ai/index.js";

/** 题型：1 单选、2 多选、3 判断 */
const SUPPORTED_TYPES = [1, 2, 3];

/** 系统提示。要求只回选项号，避免解析时被解释文字里的字母干扰 */
const SYSTEM_PROMPT = "你是考试答题助手。只输出选项字母，多选连写（如 ABD），不要输出理由、标点或任何多余文字。";

/** 从不同模型的简短回复里提取 A-H 选项，并保持原顺序去重 */
export function extractChoiceAnswer(rawAnswer) {
    const text = String(rawAnswer || "").trim().toUpperCase();
    if (!text) return "";

    const direct = /^[A-H\s,，、/和及]+$/.test(text) ? text : "";
    const labelled = text.match(
        /(?:答案|ANSWER)\s*(?:是|为|[:：])?\s*([A-H](?:[\s,，、/和及]*[A-H])*)/
    )?.[1];
    const isolated = Array.from(
        text.matchAll(/(?:^|[^A-Z])([A-H])(?=$|[^A-Z])/g),
        match => match[1]
    ).join("");
    const letters = (direct || labelled || isolated).match(/[A-H]/g) || [];
    return [...new Set(letters)].join("");
}

export class ExamSolver {
    constructor(ui) {
        this.ui = ui;
        this.running = false;
    }
    async start() {
        if (this.running) return;
        // 配置没填全就别开始了，直接提示用户去配置面板
        const client = new AiClient(ConfigManager.aiSettings);
        const invalid = client.validate();
        if (invalid) {
            this.ui.updateStatus("搜题配置不完整");
            Logger.error(invalid);
            this.ui.notify("无法开始搜题", invalid);
            return;
        }
        this.client = client;
        this.running = true;
        const { provider, model } = client.resolve();
        this.ui.updateStatus("开始搜题...");
        Logger.info(`开始搜题，使用 ${provider.label} · ${model}`);
        await this._solveLoop();
    }
    stop() {
        this.running = false;
        this.ui.updateStatus("搜题已停止");
        Logger.info("检测到手动停止，等待本题搜索完毕");
    }
    async _solveLoop() {
        const introList = document.querySelectorAll(SELECTORS.EXAM_INTRO_LIST);
        let currentIndex = this._getCurrentIndex();
        for (; currentIndex < introList.length; currentIndex++) {
            if (!this.running) break;
            const tab = document.querySelector(SELECTORS.TOPIC_TAB_PREFIX + currentIndex);
            if (!tab) continue;
            this.ui.updateStatus(`正在搜索第 ${currentIndex + 1} 题...`);
            Logger.info(`正在搜索第 ${currentIndex + 1} 题...`);
            await Utils.pause(1);
            const type = parseInt(tab.querySelector(SELECTORS.EXAM_MAIN)?.dataset.type);
            if (SUPPORTED_TYPES.includes(type)) {
                await this._handleQuestion(tab, type, currentIndex);
            } else {
                this.ui.updateStatus("未知题型，跳过...");
            }
            await Utils.pause(3);
            this._nextQuestion(tab, currentIndex);
        }
        this.running = false;
        this.ui.updateStatus("搜题结束");
        Logger.info("搜题结束");
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
            const questionEl = tab.querySelector(SELECTORS.EXAM_MAIN);
            const question = questionEl.innerText.replace(/\n\.\n/g, ".");
            const answer = await this._getAnswer(question);
            if (answer) {
                const cleanAnswer = extractChoiceAnswer(answer);
                if (!cleanAnswer) throw new Error(`无法从 AI 返回中识别选项：${answer.slice(0, 50)}`);
                this.ui.updateStatus(`第 ${index + 1} 题答案: ${cleanAnswer}`);
                Logger.info(`第 ${index + 1} 题答案: ${cleanAnswer}`);
                const answerList = cleanAnswer.split("");
                tab.querySelectorAll("label").forEach(label => {
                    if (answerList.some(item => label.innerText.includes(item))) {
                        const input = label.querySelector("input");
                        if (input) input.checked = true;
                    }
                });
            }
        } catch (e) {
            Logger.error("搜题出错: " + e.message);
            this.ui.updateStatus("搜题出错，跳过...");
        }
    }
    /**
     * 向 AI 提问。失败会按配置重试，网络抖动或限流时不至于整题跳过。
     * 具体走哪家接口由 AiClient 决定，这里不关心。
     */
    async _getAnswer(question) {
        const maxRetry = ConfigManager.aiRetry;
        let lastError;
        for (let attempt = 0; attempt <= maxRetry; attempt++) {
            if (!this.running) break;
            try {
                return await this.client.ask(question, SYSTEM_PROMPT);
            } catch (e) {
                lastError = e;
                if (attempt < maxRetry && e?.retryable === true) {
                    Logger.warn(`请求失败（${e.message}），准备第 ${attempt + 1} 次重试`);
                    await Utils.pause(2);
                } else {
                    break;
                }
            }
        }
        throw lastError || new Error("请求失败");
    }
    _nextQuestion(tab, index) {
        const saveBtn = tab.querySelector("input[value='保存修改']");
        if (saveBtn && saveBtn.offsetParent !== null) {
            saveBtn.click();
            const nextLink = document.querySelectorAll(SELECTORS.EXAM_INTRO_LIST)[index + 1]?.querySelector("a");
            if (nextLink) nextLink.click();
        } else {
            const nextBtn = tab.querySelector("input[value='继续下一题']");
            if (nextBtn) nextBtn.click();
        }
    }
}
