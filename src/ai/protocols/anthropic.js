import { resolveEndpoint, normalizeText } from "../utils.js";

/**
 * Claude Messages 协议。
 * 三点和 OpenAI 不同：鉴权头是 x-api-key、必须带 anthropic-version、
 * 系统提示是顶层 system 字段而不是一条 message。
 * 浏览器里直连还需要 anthropic-dangerous-direct-browser-access 才不会被 CORS 拦。
 */
export const anthropic = {
    id: "anthropic",
    label: "Anthropic · Claude Messages",
    path: "messages",

    buildModelListRequest({ baseUrl, apiKey }) {
        return {
            method: "GET",
            url: resolveEndpoint(baseUrl, "models?limit=1000"),
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true"
            }
        };
    },

    parseModelListResponse(json) {
        const data = Array.isArray(json?.data) ? json.data : [];
        return data.map(item => item?.id).filter(Boolean);
    },

    buildRequest({ baseUrl, apiKey, model, system, user, maxTokens = 64 }) {
        return {
            url: resolveEndpoint(baseUrl, this.path),
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true"
            },
            body: {
                model,
                max_tokens: maxTokens,
                system,
                messages: [{ role: "user", content: user }]
            }
        };
    },

    parseResponse(json) {
        const blocks = Array.isArray(json?.content) ? json.content : [];
        const text = blocks
            .filter(block => block?.type === "text")
            .map(block => block.text || "")
            .join("");
        return normalizeText(text);
    }
};
