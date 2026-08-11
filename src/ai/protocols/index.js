import { openaiChat } from "./openai-chat.js";
import { openaiResponses } from "./openai-responses.js";
import { anthropic } from "./anthropic.js";
import { gemini } from "./gemini.js";

/**
 * 协议注册表。
 * 「协议」指请求和返回的报文格式。当前内置四种常见协议族，
 * 大多数官方接口和中转站都可以映射到其中一种。
 * 新增厂商一般只需在 providers.js 里加一条预设，不用动这里。
 */
export const PROTOCOLS = {
    [openaiChat.id]: openaiChat,
    [openaiResponses.id]: openaiResponses,
    [anthropic.id]: anthropic,
    [gemini.id]: gemini
};

export const PROTOCOL_ORDER = [
    "openai-chat",
    "openai-responses",
    "anthropic",
    "gemini"
];

export function getProtocol(id) {
    return PROTOCOLS[id] || null;
}

export { openaiChat, openaiResponses, anthropic, gemini };
