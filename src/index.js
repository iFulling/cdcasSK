import { ConfigManager } from "./core/config-manager.js";
import { App } from "./app.js";

function matchUrl() {
    let iconLink = document.querySelector("link[rel='shortcut icon']");
    if (iconLink && /yuruixxkj|yinghua|canghui|gyxy|ruren|zjxkeji|yuncanjykeji|haiqikeji/.test(iconLink.getAttribute("href"))) {
        return true;
    }
    const urls = ConfigManager.urls;
    const currentUrl = window.location.hostname;
    for (let i = 0; i < urls.length; i++) {
        if (currentUrl.includes(urls[i].trim())) {
            return true;
        }
    }
    return false;
}
function quick502Check() {
    const errorText = document.body.innerText || document.documentElement.innerText || "";
    const title = document.title || "";
    if (/Internal Server Error|Service Unavailable|Bad Gateway/i.test(errorText + title)) {
        setTimeout(() => {
            location.reload();
        }, 5000);
        return true;
    }
    return false;
}
(function () {
    'use strict';
    if (!matchUrl()) return;
    if (quick502Check()) return;
    const app = new App();
    window.addEventListener("load", () => app.init());
})();
