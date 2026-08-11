import { getProtocol } from "./protocols/index.js";
import { getProvider, getProviderProtocols } from "./providers.js";
import { extractApiError } from "./utils.js";

/** 单次请求的超时时间，搜题是逐题串行的，太长会卡住整个流程 */
const REQUEST_TIMEOUT = 60000;

export class AiRequestError extends Error {
    constructor(message, { status = 0, retryable = false } = {}) {
        super(message);
        this.name = "AiRequestError";
        this.status = status;
        this.retryable = retryable;
    }
}

/**
 * 统一的 AI 请求入口。
 *
 * 上层（搜题）只管把题目文字交进来，不关心用的是哪家接口：
 * 选协议、拼报文、发请求、解析返回、归类错误都在这里完成。
 */
export class AiClient {
    /**
     * @param {object} settings 来自 ConfigManager.aiSettings
     */
    constructor(settings) {
        this.settings = settings || {};
    }

    /** 配置是否填全了，缺哪项直接告诉用户，省得白跑一趟请求 */
    validate() {
        const { apiKey, baseUrl, model } = this.resolve();
        if (!baseUrl) return "请先在配置面板里填写接口地址";
        if (!apiKey) return "请先在配置面板里填写 API Key";
        if (!model) return "请先在配置面板里填写模型名称";
        return null;
    }

    /** 获取模型列表不需要先填写模型名称 */
    validateModelList() {
        const { apiKey, baseUrl } = this.resolve();
        if (!baseUrl) return "请先填写接口地址";
        if (!apiKey) return "请先填写 API Key";
        return null;
    }

    /**
     * 把「厂商预设 + 用户填写」合并成本次请求真正用的参数。
     * 用户填了就用用户的，没填就回退到预设，这样切厂商后不用重新填一遍。
     */
    resolve() {
        const { providerId, baseUrl, apiKey, model, protocolId } = this.settings;
        const provider = getProvider(providerId);
        const allowed = getProviderProtocols(providerId);
        return {
            provider,
            protocolId: allowed.includes(protocolId) ? protocolId : provider.protocol,
            baseUrl: (baseUrl || provider.baseUrl || "").trim(),
            apiKey: (apiKey || "").trim(),
            model: (model || provider.model || "").trim()
        };
    }

    /**
     * 提问并拿到纯文本回答。
     * @param {string} question 题目文字
     * @param {string} system 系统提示
     * @returns {Promise<string>}
     */
    async ask(question, system) {
        const invalid = this.validate();
        if (invalid) throw new Error(invalid);

        const { protocolId, baseUrl, apiKey, model } = this.resolve();
        const protocol = getProtocol(protocolId);
        if (!protocol) throw new Error(`未知的接口协议：${protocolId}`);

        const request = protocol.buildRequest({
            baseUrl,
            apiKey,
            model,
            system,
            user: question
        });

        const responseText = await this._send(request);
        let json;
        try {
            json = JSON.parse(responseText);
        } catch {
            throw new Error("接口返回的不是合法 JSON，请检查接口地址是否填对");
        }

        const answer = protocol.parseResponse(json);
        if (!answer) throw new Error("接口没有返回有效内容，请检查模型名称或账号额度");
        return answer;
    }

    /** 从当前接口读取可用模型，供配置面板下拉选择 */
    async listModels() {
        const invalid = this.validateModelList();
        if (invalid) throw new Error(invalid);

        const { protocolId, baseUrl, apiKey } = this.resolve();
        const protocol = getProtocol(protocolId);
        if (!protocol?.buildModelListRequest || !protocol?.parseModelListResponse) {
            throw new Error("当前接口格式不支持获取模型列表");
        }

        const request = protocol.buildModelListRequest({ baseUrl, apiKey });
        const responseText = await this._send(request);
        let json;
        try {
            json = JSON.parse(responseText);
        } catch {
            throw new Error("模型列表接口返回的不是合法 JSON，请检查接口地址");
        }

        const models = protocol.parseModelListResponse(json);
        const normalized = [...new Set(
            (Array.isArray(models) ? models : [])
                .map(item => String(item || "").trim())
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        if (!normalized.length) {
            throw new Error("接口没有返回可用模型，请手动填写模型名称");
        }
        return normalized;
    }

    /** 发请求。用 GM_xmlhttpRequest 是为了绕过网课页面的跨域限制 */
    _send({ method = "POST", url, headers, body }) {
        return new Promise((resolve, reject) => {
            const options = {
                method,
                url,
                headers,
                timeout: REQUEST_TIMEOUT,
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300) {
                        resolve(res.responseText);
                    } else {
                        reject(new AiRequestError(extractApiError(res.status, res.responseText), {
                            status: res.status,
                            retryable: res.status === 0
                                || res.status === 408
                                || res.status === 409
                                || res.status === 429
                                || res.status >= 500
                        }));
                    }
                },
                onerror: () => reject(new AiRequestError(
                    "网络错误，请检查网络或接口地址是否可访问",
                    { retryable: true }
                )),
                ontimeout: () => reject(new AiRequestError(
                    "请求超时，接口响应太慢",
                    { retryable: true }
                )),
                onabort: () => reject(new AiRequestError("请求已取消"))
            };
            if (body !== undefined) options.data = JSON.stringify(body);
            GM_xmlhttpRequest(options);
        });
    }
}
