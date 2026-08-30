import js from "@eslint/js";
import globals from "globals";

export default [
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            // 平台自己的脚本，放在根目录只为对照分析，不是本项目源码
            "video.js",
        ],
    },
    js.configs.recommended,
    {
        files: ["src/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.greasemonkey,
                // 通过 @require 引入的 onnxruntime-web，运行时以全局变量存在
                ort: "readonly",
                // 网课页面自身注入的全局变量，代码里已用 typeof 保护后再读
                data: "readonly",
                // 构建期由 vite 的 define 替换成 package.json 里的版本号
                __SCRIPT_VERSION__: "readonly",
            },
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-empty": ["warn", { allowEmptyCatch: true }],
        },
    },
    {
        // 构建辅助脚本和本地测试服务跑在 Node 里，不是浏览器环境
        files: ["scripts/**/*.mjs", "mock/**/*.mjs", "eslint.config.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: globals.node,
        },
    },
];
