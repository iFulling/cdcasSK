import { CONFIG } from "../config.js";

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
    static get endpointId() {
        return this.get("搜题配置.endpoint_id", "");
    }
    static set endpointId(value) {
        this.set("搜题配置.endpoint_id", value);
    }
    static get apiKey() {
        return this.get("搜题配置.apikey", "");
    }
    static set apiKey(value) {
        this.set("搜题配置.apikey", value);
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
