/**
 * 站点外壳识别。
 *
 * 同一个学校可能同时挂在新旧两套壳上（成都文理一个旧壳域名、一个新壳域名），
 * 域名后缀（haiqikeji / leykeji / qintaiyfkj / jiuzhouzxkj）随时会变，
 * 所以判据只看 DOM 结构，不看 URL。
 *
 * 新壳 = Vue 3 单页应用，根节点被 Vue 挂载过，带 __vue_app__。
 * 旧壳 = jQuery + yeeui 老框架，页面加载 /yeeui/ 下的 yee.js、yee.config.js、layer.js。
 */

/** 三种识别结果，认不出时返回 UNKNOWN，调用方不要猜 */
export const SHELL = Object.freeze({
    VUE: "vue",
    LEGACY: "legacy",
    UNKNOWN: "unknown",
});

/**
 * 识别当前页面属于哪套壳。
 *
 * 两条判据互斥且都在 DOM 侧：
 * - Vue 3 的挂载标记只有新壳有；
 * - /yeeui/ 的脚本只有旧壳引。
 *
 * 都不命中说明是第三种结构，返回 UNKNOWN。这时候按其中任意一套去操作都可能填错元素、
 * 点错链接，所以由调用方决定是等待重试还是放弃。
 *
 * @returns {"vue"|"legacy"|"unknown"}
 */
export function detectShell() {
    const app = document.querySelector("#app");
    if (app && app.__vue_app__) return SHELL.VUE;

    if (document.querySelector('script[src*="/yeeui/"]')) return SHELL.LEGACY;

    return SHELL.UNKNOWN;
}
