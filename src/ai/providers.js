/**
 * 厂商预设表。
 *
 * 每条预设只做三件事：绑定协议、给出默认接口地址、给出默认模型名。
 * 用户留空地址或模型时会自动使用预设值；自建接口没有预设，必须自行填写。
 *
 * 字段说明：
 * - protocol   使用哪套报文格式，见 protocols/index.js
 * - baseUrl    默认接口地址，用户可覆盖（自建站必须自己填）
 * - model      默认模型名，用户可覆盖
 * - host       需要写进脚本头 @connect 的域名，自建站填空（地址不固定）
 * - keyLabel   API Key 输入框的说明文字
 * - modelHint  模型输入框下方的提示
 * - protocols  该厂商支持的协议列表
 */
export const PROVIDERS = {
    volcengine: {
        label: "火山方舟",
        protocol: "openai-chat",
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        model: "",
        host: "ark.cn-beijing.volces.com",
        keyLabel: "火山方舟 API Key",
        modelHint: "填接入点 ID（ep- 开头）或模型名称，获取方式见教程"
    },
    openai: {
        label: "OpenAI",
        protocol: "openai-chat",
        protocols: ["openai-chat", "openai-responses"],
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-5.4-mini",
        host: "api.openai.com",
        keyLabel: "OpenAI API Key",
        modelHint: "默认使用 gpt-5.4-mini，也可以填写账号可用的其他模型"
    },
    anthropic: {
        label: "Claude（Anthropic）",
        protocol: "anthropic",
        baseUrl: "https://api.anthropic.com/v1",
        model: "claude-sonnet-5",
        host: "api.anthropic.com",
        keyLabel: "Anthropic API Key",
        modelHint: "默认使用 claude-sonnet-5，也可以填写其他 Claude 模型"
    },
    gemini: {
        label: "Gemini（Google）",
        protocol: "gemini",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        model: "gemini-3.6-flash",
        host: "generativelanguage.googleapis.com",
        keyLabel: "Google AI Studio API Key",
        modelHint: "默认使用 gemini-3.6-flash，也可以填写其他 Gemini 模型"
    },
    grok: {
        label: "Grok（xAI）",
        protocol: "openai-chat",
        protocols: ["openai-chat", "openai-responses"],
        baseUrl: "https://api.x.ai/v1",
        model: "grok-4.5",
        host: "api.x.ai",
        keyLabel: "xAI API Key",
        modelHint: "默认使用 grok-4.5，也可以填写账号可用的其他模型"
    },
    deepseek: {
        label: "DeepSeek",
        protocol: "openai-chat",
        protocols: ["openai-chat", "openai-responses"],
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-v4-flash",
        host: "api.deepseek.com",
        keyLabel: "DeepSeek API Key",
        modelHint: "默认使用 deepseek-v4-flash，也可以填写账号可用的其他模型"
    },
    custom: {
        label: "自建接口（sub2api / new-api 等）",
        protocol: "openai-chat",
        protocols: ["openai-chat", "openai-responses", "anthropic", "gemini"],
        baseUrl: "",
        model: "",
        host: "",
        keyLabel: "中转站令牌（一般是 sk- 开头）",
        modelHint: "填写中转站实际提供的模型名称"
    }
};

/** 面板下拉框的顺序：常用的排前面，自建放最后 */
export const PROVIDER_ORDER = [
    "volcengine",
    "openai",
    "anthropic",
    "gemini",
    "grok",
    "deepseek",
    "custom"
];

export const DEFAULT_PROVIDER = "volcengine";

export function getProvider(id) {
    return PROVIDERS[id] || PROVIDERS[DEFAULT_PROVIDER];
}

/** 该厂商支持哪些接口格式 */
export function getProviderProtocols(id) {
    const provider = getProvider(id);
    return provider.protocols || [provider.protocol];
}

/** 按接口格式筛选服务商预设，同一格式下共用一套请求实现 */
export function getProvidersForProtocol(protocolId) {
    return PROVIDER_ORDER.filter(id => getProviderProtocols(id).includes(protocolId));
}

/** 切换接口格式后，当前服务商不兼容时使用该格式下的第一个预设 */
export function getDefaultProviderForProtocol(protocolId) {
    const providerIds = getProvidersForProtocol(protocolId);
    return providerIds.includes(DEFAULT_PROVIDER) ? DEFAULT_PROVIDER : providerIds[0];
}

/** 配置面板里的地址提示，按协议说明基础地址应填到哪里 */
export function getBaseUrlHint(providerId, protocolId) {
    const provider = getProvider(providerId);
    if (provider.baseUrl) return `留空时使用预设地址：${provider.baseUrl}`;
    if (protocolId === "gemini") {
        return "填写到版本路径，例如 https://你的域名/v1beta，不要带 models/...:generateContent";
    }
    if (protocolId === "anthropic") {
        return "填写到版本路径，例如 https://你的域名/v1，不要带 messages";
    }
    return "填写到版本路径，例如 https://你的域名/v1，不要带 chat/completions 或 responses";
}

/**
 * 脚本头 @connect 需要的域名清单。
 * 自建站地址不固定，脚本头里用 `*` 兜底，见 vite.config.ts。
 */
export const PROVIDER_HOSTS = Object.values(PROVIDERS)
    .map(item => item.host)
    .filter(Boolean);
