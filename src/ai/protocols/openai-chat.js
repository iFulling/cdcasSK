import { resolveEndpoint, normalizeText } from "../utils.js";
import {
    buildOpenAiModelListRequest,
    parseOpenAiModelListResponse
} from "./openai-compatible.js";

/**
 * OpenAI Chat Completions 协议。
 * 覆盖面最广：OpenAI、DeepSeek、Grok、火山引擎豆包，以及 sub2api、new-api
 * 这类自建中转站基本都兼容这套请求格式。
 */
export const openaiChat = {
    id: "openai-chat",
    label: "OpenAI 兼容 · Chat Completions",
    path: "chat/completions",
    buildModelListRequest: buildOpenAiModelListRequest,
    parseModelListResponse: parseOpenAiModelListResponse,

    buildRequest({ baseUrl, apiKey, model, system, user }) {
        return {
            url: resolveEndpoint(baseUrl, this.path),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: {
                model,
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user }
                ]
            }
        };
    },

    parseResponse(json) {
        const choice = json?.choices?.[0];
        const message = choice?.message;
        // 少数中转站会把内容拆成分片数组，这里一并兼容
        const raw = Array.isArray(message?.content)
            ? message.content.map(part => part?.text || part?.content || "").join("")
            : message?.content ?? choice?.text;
        return normalizeText(raw);
    }
};
