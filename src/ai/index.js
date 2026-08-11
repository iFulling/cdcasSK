/**
 * AI 接口模块统一出口。
 *
 * 结构：
 * - protocols/  报文格式适配，四种：OpenAI Chat、OpenAI Responses、Claude、Gemini
 * - providers.js 厂商预设，把厂商映射到协议 + 默认地址 + 默认模型
 * - client.js   统一请求封装，上层只调 ask()
 *
 * 新增一家厂商：如果它兼容上述四种协议之一，只在 providers.js 加一条预设即可；
 * 只有报文格式确实不同，才需要在 protocols/ 下新增文件。
 */
export { AiClient, AiRequestError } from "./client.js";
export {
    PROVIDERS,
    PROVIDER_ORDER,
    PROVIDER_HOSTS,
    DEFAULT_PROVIDER,
    getProvider,
    getProviderProtocols,
    getProvidersForProtocol,
    getDefaultProviderForProtocol,
    getBaseUrlHint
} from "./providers.js";
export { PROTOCOLS, PROTOCOL_ORDER, getProtocol } from "./protocols/index.js";
