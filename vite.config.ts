import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * 版本号唯一真相源是 package.json，这里只读不写。
 * 改版本请用 `npm version patch|minor|major`，不要手改这个文件。
 */
const pkg: { version: string } = JSON.parse(readFileSync(resolve("./package.json"), "utf-8"));
if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) {
    throw new Error(`package.json 的 version 必须是三段式 semver，当前是 "${pkg.version}"`);
}

/** 图标以 data URI 形式写进元数据头，避免依赖外部图床 */
const iconDataUri =
    "data:image/png;base64," + readFileSync(resolve("./src/assets/icon.png")).toString("base64");

export default defineConfig({
    plugins: [
        monkey({
            entry: "src/index.js",
            userscript: {
                name: "英华学堂全系列刷课助手|自动刷课|考试自动答题",
                namespace: "https://github.com/iFulling/cdcasSK",
                version: pkg.version,
                description:
                    "英华学堂全系列刷课助手（原为成都文理学院刷课助手）🚀目前支持平台包括：【粟湾科技、海旗科技、御瑞在线学堂、如仁科技、厚荣科技】等等。😀目前已具有功能包括：视频自动播放、自动识别填充验证码、考试自动答题等功能。如有bug请留言。🐧QQ交流群：878643471",
                author: "iFulling",
                match: [
                    "*://*.yuruixxkj.com/*",
                    "*://*.zjxkeji.com/*",
                    "*://mooc.cdcas.com/*",
                    "*://*.cdcas.com/*",
                    "*://*.haiqikeji.com/*",
                    "*://*/*",
                ],
                icon: iconDataUri,
                connect: ["ark.cn-beijing.volces.com"],
                grant: [
                    "GM_setValue",
                    "GM_getValue",
                    "GM_deleteValue",
                    "GM_xmlhttpRequest",
                    "GM_addStyle",
                    "GM_registerMenuCommand",
                    "GM_notification",
                ],
                require: [
                    "https://registry.npmmirror.com/onnxruntime-web/1.17.0/files/dist/ort.min.js",
                ],
                license: "MIT",
                "run-at": "document-idle",
                noframes: true,
            },
            build: {
                fileName: "cdcasSK.user.js",
                // grant 已在上面显式声明（源码里用的是裸 GM_* 全局，插件扫不到）
                autoGrant: false,
            },
        }),
    ],
    // 源码里的 CONFIG.VERSION 由构建期注入，避免和 package.json 出现第二个版本号
    define: {
        __SCRIPT_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
        // 高于最大资源体积，确保 webp 全部内联而不是拆成独立文件
        assetsInlineLimit: 1024 * 1024,
        minify: false,
        target: "es2020",
    },
});
