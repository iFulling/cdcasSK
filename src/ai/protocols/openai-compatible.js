import { resolveEndpoint } from "../utils.js";

/** OpenAI 兼容服务共用的鉴权和模型列表格式 */
export function buildOpenAiModelListRequest({ baseUrl, apiKey }) {
    return {
        method: "GET",
        url: resolveEndpoint(baseUrl, "models"),
        headers: {
            "Authorization": `Bearer ${apiKey}`
        }
    };
}

export function parseOpenAiModelListResponse(json) {
    const data = Array.isArray(json?.data) ? json.data : [];
    return data.map(item => item?.id).filter(Boolean);
}
