import { Logger } from "../core/logger.js";
import { Utils } from "../core/utils.js";
import { API, SELECTORS } from "../config.js";
import { ConfigManager } from "../core/config-manager.js";

export class ExamSolver {
    constructor(ui) {
        this.ui = ui;
        this.running = false;
    }
    async start() {
        if (this.running) return;
        this.running = true;
        this.ui.updateStatus("开始搜题...");
        Logger.info("开始搜题...");
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
            if ([1, 2, 3].includes(type)) {
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
                const cleanAnswer = (answer.match(/[A-Za-z]/g) || []).join("").toUpperCase();
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
                            "content": "只说选项号，不要说理由。\n" + question
                        }
                    ]
                }),
                onload: (res) => {
                    if (res.status === 200) {
                        try {
                            const json = JSON.parse(res.responseText);
                            resolve(json.choices[0].message.content);
                        } catch {
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
