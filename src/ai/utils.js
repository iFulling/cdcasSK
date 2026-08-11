/**
 * AI 接口通用小工具。
 * 这里只放与具体厂商无关的处理，各家协议差异写在 protocols/ 下。
 */

/** 拼接接口地址：去掉 base 末尾的斜杠，避免出现 `//v1` 这种地址 */
export function joinUrl(base, path) {
    const left = String(base || "").trim().replace(/\/+$/, "");
    const right = String(path || "").trim().replace(/^\/+/, "");
    if (!right) return left;
    return `${left}/${right}`;
}

/**
 * 用户经常直接从厂商文档里复制完整地址（例如 `https://xxx/v1/chat/completions`），
 * 而配置项要求填的是基础地址。这里做一次兜底：如果末尾已经是目标路径就原样使用。
 */
export function resolveEndpoint(baseUrl, path) {
    const base = String(baseUrl || "").trim().replace(/\/+$/, "");
    const suffix = String(path || "").replace(/^\/+/, "");
    if (!base) return "";
    if (suffix && base.toLowerCase().endsWith("/" + suffix.toLowerCase())) return base;
    return joinUrl(base, suffix);
}

/**
 * 清理模型返回的文本。
 * 部分模型（尤其中转站转发的推理模型）会把思考过程包在 <think> 里一起返回，
 * 直接丢给答案解析会把思考里的字母也算进去，所以先剥掉。
 */
export function normalizeText(text) {
    if (typeof text !== "string") return "";
    return text
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<\/?think>/gi, "")
        .trim();
}

/** 从接口返回里提取错误说明，尽量给出厂商原文，方便用户自查 */
export function extractApiError(status, responseText) {
    let detail = "";
    try {
        const json = JSON.parse(responseText);
        detail = json?.error?.message || json?.error?.type || json?.message || json?.msg || "";
    } catch {
        detail = String(responseText || "").slice(0, 200);
    }
    const hint = HTTP_HINTS[status];
    return [`接口返回 ${status}`, hint, detail].filter(Boolean).join("：");
}

const HTTP_HINTS = {
    400: "请求被拒绝，通常是模型名称填错",
    401: "鉴权失败，请检查 API Key",
    403: "没有访问权限，请检查 API Key 或模型是否开通",
    404: "地址或模型不存在，请检查接口地址",
    429: "请求过于频繁或余额不足",
    500: "服务端异常，稍后再试",
    502: "网关异常，稍后再试",
    503: "服务不可用，稍后再试"
};
