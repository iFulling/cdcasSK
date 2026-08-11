import { resolveEndpoint, normalizeText } from "../utils.js";
import {
    buildOpenAiModelListRequest,
    parseOpenAiModelListResponse
} from "./openai-compatible.js";

/**
 * OpenAI Responses 协议（/v1/responses）。
 * 与 Chat Completions 的差别：输入字段叫 input，系统提示叫 instructions，
 * 返回结构是 output 数组，新模型上 OpenAI 优先推荐这套。
 */
export const openaiResponses = {
    id: "openai-responses",
    label: "OpenAI 兼容 · Responses",
    path: "responses",
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
                instructions: system,
                input: user
            }
        };
    },

    parseResponse(json) {
        // 官方 SDK 里的便捷字段，部分实现会直接给出
        if (typeof json?.output_text === "string" && json.output_text.trim()) {
            return normalizeText(json.output_text);
        }
        const output = Array.isArray(json?.output) ? json.output : [];
        const parts = [];
        for (const item of output) {
            // 推理模型会额外返回 reasoning 分段，只取正式回复
            if (item?.type && item.type !== "message") continue;
            for (const content of item?.content || []) {
                if (typeof content?.text === "string") parts.push(content.text);
            }
        }
        return normalizeText(parts.join(""));
    }
};
