import { CONFIG } from "../config.js";
import {
    DEFAULT_PROVIDER,
    PROVIDERS,
    getProvider,
    getProviderProtocols
} from "../ai/providers.js";

export class ConfigManager {
    static get(key, defaultValue) {
        return GM_getValue(key, defaultValue);
    }
    static set(key, value) {
        GM_setValue(key, value);
    }
    static get urls() {
        const val = this.get("刷课配置.urls", CONFIG.DEFAULT.URLS);
        return val.split("|").map(u => u.trim()).filter(u => u);
    }
    static set urls(value) {
        this.set("刷课配置.urls", value);
    }
    static get timeoutMinutes() {
        return this.get("刷课配置.timeout_minutes", CONFIG.DEFAULT.TIMEOUT_MINUTES);
    }
    static set timeoutMinutes(value) {
        this.set("刷课配置.timeout_minutes", value);
    }
    /** 生成某个厂商的配置键，避免不同厂商共用模型、地址或密钥 */
    static _aiKey(providerId, field) {
        return `搜题配置.providers.${this._normalizeProvider(providerId)}.${field}`;
    }
    static _normalizeProvider(providerId) {
        return Object.prototype.hasOwnProperty.call(PROVIDERS, providerId)
            ? providerId
            : DEFAULT_PROVIDER;
    }
    /** 只在目标位置为空时迁移，避免覆盖用户已经保存的新配置 */
    static _migrateAiValue(providerId, field, value) {
        if (value === "" || value === undefined || value === null) return;
        const key = this._aiKey(providerId, field);
        if (!this.get(key, "")) this.set(key, value);
    }
    /**
     * 老配置迁移。
     *
     * 4.3.1 及更早只支持火山方舟，接入点 ID 和 API Key 都存在扁平键里。
     * 多接口开发版也曾短暂使用扁平的 provider/model/base_url/protocol 键。
     * 这里统一搬到按厂商隔离的配置，迁移后删除旧键，后续启动不会重复处理。
     */
    static migrate() {
        const savedProvider = this._normalizeProvider(this.get("搜题配置.provider", DEFAULT_PROVIDER));
        const endpointId = this.get("搜题配置.endpoint_id", "");
        const flatModel = this.get("搜题配置.model", "");
        const flatBaseUrl = this.get("搜题配置.base_url", "");
        const flatProtocol = this.get("搜题配置.protocol", "");
        const flatApiKey = this.get("搜题配置.apikey", "");

        this._migrateAiValue("volcengine", "model", endpointId);
        this._migrateAiValue(savedProvider, "model", flatModel);
        this._migrateAiValue(savedProvider, "base_url", flatBaseUrl);
        this._migrateAiValue(savedProvider, "protocol", flatProtocol);
        this._migrateAiValue(savedProvider, "apikey", flatApiKey);

        GM_deleteValue("搜题配置.endpoint_id");
        GM_deleteValue("搜题配置.model");
        GM_deleteValue("搜题配置.base_url");
        GM_deleteValue("搜题配置.protocol");
        GM_deleteValue("搜题配置.apikey");
    }
    /** 搜题用的厂商。老用户没存过这项时默认火山方舟 */
    static get aiProvider() {
        return this._normalizeProvider(this.get("搜题配置.provider", DEFAULT_PROVIDER));
    }
    static set aiProvider(value) {
        this.set("搜题配置.provider", this._normalizeProvider(value));
    }
    /** 报文协议。同一家厂商可能支持多种（如 OpenAI 的 Chat 与 Responses） */
    static get aiProtocol() {
        const provider = getProvider(this.aiProvider);
        const saved = this.get(this._aiKey(this.aiProvider, "protocol"), "");
        const allowed = getProviderProtocols(this.aiProvider);
        return allowed.includes(saved) ? saved : provider.protocol;
    }
    static set aiProtocol(value) {
        const allowed = getProviderProtocols(this.aiProvider);
        this.set(
            this._aiKey(this.aiProvider, "protocol"),
            allowed.includes(value) ? value : getProvider(this.aiProvider).protocol
        );
    }
    /** 接口地址。留空表示用厂商预设地址，自建接口必须自己填 */
    static get aiBaseUrl() {
        return this.get(this._aiKey(this.aiProvider, "base_url"), "");
    }
    static set aiBaseUrl(value) {
        this.set(this._aiKey(this.aiProvider, "base_url"), value);
    }
    /**
     * 模型名称。老版本叫「接入点 ID」（只有火山方舟一家），键名迁移见 migrate()。
     * 火山方舟填 ep- 开头的接入点 ID，其他厂商填模型名。
     */
    static get aiModel() {
        return this.get(this._aiKey(this.aiProvider, "model"), "");
    }
    static set aiModel(value) {
        this.set(this._aiKey(this.aiProvider, "model"), value);
    }
    static get apiKey() {
        return this.get(this._aiKey(this.aiProvider, "apikey"), "");
    }
    static set apiKey(value) {
        this.set(this._aiKey(this.aiProvider, "apikey"), value);
    }
    /** 一次请求失败后的重试次数，0 表示不重试 */
    static get aiRetry() {
        const val = parseInt(this.get("搜题配置.retry", 1));
        return Number.isNaN(val) ? 1 : Math.max(0, Math.min(5, val));
    }
    static set aiRetry(value) {
        this.set("搜题配置.retry", value);
    }
    /** 读取指定厂商的完整配置；地址和模型保持原始空值，由 AiClient 应用厂商预设 */
    static getAiSettings(providerId = this.aiProvider) {
        const normalized = this._normalizeProvider(providerId);
        const provider = getProvider(normalized);
        const allowed = getProviderProtocols(normalized);
        const savedProtocol = this.get(this._aiKey(normalized, "protocol"), "");
        return {
            providerId: normalized,
            protocolId: allowed.includes(savedProtocol) ? savedProtocol : provider.protocol,
            baseUrl: this.get(this._aiKey(normalized, "base_url"), ""),
            apiKey: this.get(this._aiKey(normalized, "apikey"), ""),
            model: this.get(this._aiKey(normalized, "model"), "")
        };
    }
    /** 保存当前面板选中的厂商配置，不影响其他厂商已经保存的密钥和模型 */
    static saveAiSettings(settings) {
        const providerId = this._normalizeProvider(settings?.providerId);
        this.aiProvider = providerId;
        this.aiProtocol = settings?.protocolId;
        this.aiBaseUrl = settings?.baseUrl || "";
        this.apiKey = settings?.apiKey || "";
        this.aiModel = settings?.model || "";
    }
    /** 打包当前厂商配置给 AiClient */
    static get aiSettings() {
        return this.getAiSettings();
    }
    static get autoLoginCaptcha() {
        return this.get("刷课配置.auto_login_captcha", false);
    }
    static set autoLoginCaptcha(value) {
        this.set("刷课配置.auto_login_captcha", value);
    }
    static get autoFillAccount() {
        return this.get("刷课配置.auto_fill_account", false);
    }
    static set autoFillAccount(value) {
        this.set("刷课配置.auto_fill_account", value);
    }
    static get loginAccount() {
        return this.get("刷课配置.login_account", "");
    }
    static set loginAccount(value) {
        this.set("刷课配置.login_account", value);
    }
    static get loginPassword() {
        return this.get("刷课配置.login_password", "");
    }
    static set loginPassword(value) {
        this.set("刷课配置.login_password", value);
    }
    static get autoImportModels() {
        return this.get("刷课配置.auto_import_models", true);
    }
    static set autoImportModels(value) {
        this.set("刷课配置.auto_import_models", value);
    }
    static get videoStage() {
        return this.get("刷课配置.video_stage", 1);
    }
    static set videoStage(value) {
        this.set("刷课配置.video_stage", value);
    }
}
