import { resolveEndpoint, normalizeText } from "../utils.js";

/**
 * Gemini generateContent 协议。
 * 特殊点：模型名要拼进地址（models/xxx:generateContent），
 * 鉴权用 x-goog-api-key 头，系统提示放 systemInstruction。
 */
export const gemini = {
    id: "gemini",
    label: "Google · Gemini generateContent",

    buildModelListRequest({ baseUrl, apiKey }) {
        return {
            method: "GET",
            url: resolveEndpoint(baseUrl, "models?pageSize=1000"),
            headers: {
                "x-goog-api-key": apiKey
            }
        };
    },

    parseModelListResponse(json) {
        const models = Array.isArray(json?.models) ? json.models : [];
        return models
            .filter(item => {
                const methods = item?.supportedGenerationMethods;
                return !Array.isArray(methods) || methods.includes("generateContent");
            })
            .map(item => String(item?.name || "").replace(/^models\//, ""))
            .filter(Boolean);
    },

    buildRequest({ baseUrl, apiKey, model, system, user }) {
        const name = String(model || "").replace(/^models\//, "");
        return {
            url: resolveEndpoint(baseUrl, `models/${name}:generateContent`),
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },
            body: {
                systemInstruction: { parts: [{ text: system }] },
                contents: [{ role: "user", parts: [{ text: user }] }],
                generationConfig: {
                    maxOutputTokens: 64,
                    temperature: 0
                }
            }
        };
    },

    parseResponse(json) {
        const parts = json?.candidates?.[0]?.content?.parts || [];
        const text = parts
            .filter(part => part?.thought !== true)
            .map(part => part?.text || "")
            .join("");
        return normalizeText(text);
    }
};
