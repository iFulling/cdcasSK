# AGENTS.md

## 项目简介

这个项目是一个基于 **ScriptCat / Tampermonkey** 的用户脚本，用于英华学堂相关平台的自动刷课、验证码识别和考试搜题等功能。

## 语言要求

- 与用户沟通、编写说明、整理规范时，**全程使用中文**。
- 代码注释、提交说明和文档内容也尽量使用中文，保持项目表达统一。

## 项目结构

源码是 ES 模块，用 `vite-plugin-monkey` 打包成单文件用户脚本。

```
src/
├── index.js               入口：网址匹配 + 502 检测 + 启动 App
├── config.js              CONFIG / API / SELECTORS 常量
├── app.js                 主流程状态机（路由判断、刷课循环、考试模式）
├── core/                  logger.js / utils.js / config-manager.js
├── ui/                    ui-manager.js / panel-template.js / styles.css
├── features/              video-player.js / ocr-engine.js / captcha-handler.js / exam-solver.js
└── assets/                icon.png、收款码 webp（构建时内联成 data URI）

scripts/
├── verify-version.mjs     构建后校验产物版本号与 package.json 一致
└── release-notes.mjs      从 CHANGELOG.md 提取指定版本章节，供发布流程使用

.github/workflows/
└── release.yml            推送 v 开头的 tag 时自动构建并创建 Release
```

其他文件：

- `vite.config.ts`：构建配置 + UserScript 元数据头（`@match` / `@grant` / `@require`、版本号都写在这里）。
- 构建产物是 `dist/cdcasSK.user.js`，**不提交进仓库**。发版靠手动传到 ScriptCat 脚本页。
- `eslint.config.js`：ESLint 配置，`ort` 和页面注入的 `data` 已声明为全局变量。
- `README.md`：项目说明、安装方法、开发说明、更新日志。
- `onnx/`：机器视觉资源（模型、字符集）。
- `收款码/`：收款码原图，`src/assets/*.webp` 由它生成。

## 开发注意事项

### 0. 常用命令
- `npm run dev` 开发（热更新，不用反复重装脚本）
- `npm run build` 打包到 `dist/cdcasSK.user.js`
- `npm run lint` 检查，**改完模块结构必跑** —— 漏掉的 import 只有它能查出来，构建不会报错
- `npm version patch|minor|major` 发版（自动跑检查、改版本、打 tag、重新构建）
- `git push --follow-tags` 推送 tag，触发 GitHub Actions 自动建 Release

### 0.4 发版
1. 先在 `CHANGELOG.md` 顶部补好该版本章节，**面向用户写**，不要写模块名函数名这类实现细节。漏了这步发布会失败。
2. `npm version patch|minor|major`
3. `git push --follow-tags`
4. GitHub Actions 自动构建、提取更新说明、创建 Release 并附上产物
5. 把产物传到脚本猫，更新说明复制 `CHANGELOG.md` 里那一段

### 0.5 版本号
- 三段式 semver，**唯一真相源是 `package.json` 的 `version`**。
- 脚本头的 `@version` 由 `vite.config.ts` 读 package.json 得到；源码里的 `CONFIG.VERSION` 由 vite 的 `define` 注入 `__SCRIPT_VERSION__`。**三处都不要手改**，改了会被 `scripts/verify-version.mjs` 在构建后拦下来。
- 注意油猴/脚本猫按段补零比较版本，`4.2` 等于 `4.2.0`，发版不能倒退或持平。

### 1. 修改脚本时
- 元数据头改在 `vite.config.ts` 的 `userscript` 字段（版本号除外，见上）。
- 源码里用的是裸 `GM_*` 全局，插件扫不到，所以 `grant` 必须在 `vite.config.ts` 里手动维护；新用一个 GM API 要记得补上。
- 不要随意改动资源地址，除非明确知道其用途。
- 很多逻辑与页面选择器、平台适配、验证码模型加载相关，修改前要确认影响范围。

### 2. 修改 UI 时
- 样式改 `src/ui/styles.css`，结构改 `src/ui/panel-template.js`，事件绑定改 `src/ui/ui-manager.js`，三者不要再混回一处。
- 这个项目是浏览器脚本，但仍然要保持界面清晰、简洁、易操作。
- 配置面板、日志面板、按钮文案尽量保持一致风格。
- 涉及状态显示、提示信息、错误信息时，优先保证用户能快速理解。

### 3. 修改说明文档时
- 更新日志写在 `CHANGELOG.md`，那是发布说明的唯一来源，`README.md` 只保留最新一版摘要与链接。
- `README.md` 要和脚本实际功能保持一致。
- 如果新增平台、功能或配置项，记得同步更新说明文档。
- 更新日志要写清楚版本变更的重点。

### 4. 提交与忽略规则
- 不要提交 `node_modules/`、`.idea/`、`.iml`、`dist/` 等本地环境与产物文件。
- 如果新增了新的临时文件、缓存目录或构建目录，及时补充到 `.gitignore`。
- 提交信息建议简洁明确，例如：
  - `更新验证码识别逻辑`
  - `优化配置面板`
  - `新增平台适配`

## 平台分类约定

项目中的网址大致分为两类：

- **新 UI**：`haiqikeji` 相关网址，也可称为 **海旗**。
- **旧 UI**：除 `haiqikeji` 以外的所有网址，也可称为 **英华**。

后续在分析、修改或讨论平台适配时，统一按这个分类来称呼，避免混淆。

## 常见修改位置

- 平台适配：`src/index.js`（网址匹配）、`src/config.js`（DOM 选择器）、`src/app.js`（页面流程）。
- 验证码识别：`src/features/ocr-engine.js`（模型加载、图片预处理、推理）、`src/features/captcha-handler.js`（触发流程）。
- 搜题功能：`src/features/exam-solver.js`（火山引擎接口、题目解析、答案填充）。
- 配置界面：`src/ui/panel-template.js`（表单结构）、`src/ui/ui-manager.js`（保存逻辑）、`src/core/config-manager.js`（存储键）。
- 视频播放：`src/features/video-player.js`（播放与卡顿检测）、`src/app.js` 的 `_videoLoop` / `_playNextVideo`。

## 工作建议

1. 修改前先确认需求范围，尽量只改必要部分。
2. 改完后检查是否需要同步更新 `README.md`。
3. 若涉及新资源文件，确认路径和引用是否正确。
4. 尽量保持兼容性，避免影响原有平台适配。

## 备注

如果后续项目结构或工作流变化较大，可以继续补充本文件，让它始终作为该仓库的操作说明。