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
├── ai/                    搜题接口层：client.js / providers.js / protocols/（各厂商请求格式）
├── features/              video-player.js / ocr-engine.js / captcha-handler.js / exam-solver.js / multi-tab-guard.js
└── assets/                icon.png、收款码 webp（构建时内联成 data URI）

mock/
├── server.mjs             本地测试服务：挂仿真考试页 + 冒充 OpenAI 兼容接口
└── user/exam.html         仿真考试页，10 道题覆盖各种题型和返回格式

scripts/
├── verify-version.mjs     构建后校验产物版本号与 package.json 一致
└── release-notes.mjs      从 CHANGELOG.md 提取指定版本章节，供发布流程使用

.github/workflows/
├── ci.yml                 推送到 main 及 PR 时跑检查与构建
└── release.yml            推送 v 开头的 tag 时自动构建并创建 Release
```

其他文件：

- `vite.config.ts`：构建配置 + UserScript 元数据头（`@match` / `@grant` / `@require`、版本号都写在这里）。
- 构建产物是 `dist/cdcasSK.user.js`，**不提交进仓库**。发版靠手动传到 ScriptCat 脚本页。
- `eslint.config.js`：ESLint 配置，`ort` 和页面注入的 `data` 已声明为全局变量。
- `.npmrc`：只配了 `npm version` 的中文提交信息模板。**不要往里写任何令牌或密码**，它会进仓库。
- `README.md`：项目说明、安装方法、开发说明、更新日志。
- `onnx/`：机器视觉资源（模型、字符集）。
- `收款码/`：收款码原图，`src/assets/*.webp` 由它生成。

## 开发注意事项

### 0. 常用命令
- `npm run dev` 开发（热更新，不用反复重装脚本）
- `npm run build` 打包到 `dist/cdcasSK.user.js`
- `npm run lint` 检查，**改完模块结构必跑** —— 漏掉的 import 只有它能查出来，构建不会报错
- `npm run typecheck` 类型检查

以上三项 CI 会在推送到 main 和提 PR 时自动跑一遍，但本地先跑能省一个来回。
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
- 搜题功能：`src/ai/`（各厂商接口与协议格式）、`src/features/exam-solver.js`（题目解析、选项匹配、答案填充）。
- 配置界面：`src/ui/panel-template.js`（表单结构）、`src/ui/ui-manager.js`（保存逻辑）、`src/core/config-manager.js`（存储键）。
- 视频播放：`src/features/video-player.js`（播放与卡顿检测）、`src/app.js` 的 `_videoLoop` / `_playNextVideo`。

## 本地调试

### 测试考试搜题

真考试限次、点一下「保存修改」就是真提交，所以搜题只能在自己造的页面上跑。
`mock/` 下有一套现成的：

```bash
node mock/server.mjs
```

一个进程同时把仿真考试页挂在 <http://localhost:8788/user/exam>，并冒充一个 OpenAI 兼容接口
按题号返回写死的答案。配置面板里接口地址填 `http://localhost:8788`，Key 随便填。
10 道题覆盖单选、多选、判断、未知题型，以及模型返回格式的各种花样，跑完点页面上的
「校验答案」对比期望值。详细说明和加题方法见 `mock/README.md`。

要注意页面必须走那个服务，不能双击 html：`@match` 只有 `*://` 不含 `file://`，
而且 `_checkUrl()` 要求 `pathname` 全等 `/user/exam`，多一个斜杠或后缀都进不了搜题模式。

### 模拟图形验证码

服务端什么时候下发验证码不可控，等它自然触发没法稳定复现。改 `captcha-handler.js` 或 `ocr-engine.js` 时用下面的办法伪造一次响应。

平台的学时上报是 `$.ajax({dataType: 'json'})` POST 到 `/user/node/study`，只有返回 `{status: false, need_code: 1}` 才会弹出图形验证码。用 jQuery 的 `dataFilter` 改原始响应文本，后续的 `JSON.parse`、`need_code` 分支判断全部走真实代码路径，不必伪造 `readyState` / `status` 这些只读属性。

在课程页控制台粘贴，然后开始播放：

```js
(function () {
  var fired = false;
  window.jQuery.ajaxPrefilter(function (options) {
    if (fired || String(options.url).indexOf('/user/node/study') === -1) return;
    fired = true;
    options.dataFilter = function () {
      console.log('[mock] 注入 need_code=1');
      return JSON.stringify({ status: false, need_code: 1 });
    };
  });
  console.log('[mock] 已就位，等待下一次学时上报');
})();
```

- 用 `window.jQuery`，不要用 `$` —— DevTools 控制台的 `$` 可能是它自己的 `querySelector` 别名。
- **必须一次性。** 脚本填完码点「开始播放」会再次 POST 同一个地址，无条件返回 `need_code: 1` 会让弹窗关掉后立刻重开：`sendCode()` 里显式把 `layIndex` 置空，`layer.open` 的 `end` 回调也会置空，`layIndex === null` 那道判断拦不住，结果是无限循环。
- 触发时机不用抢。上报本身有 10 秒（支持 `sendBeacon` 时 30 秒）的周期定时器，播放开始时 `studyId == 0` 也会立刻发一次。
- 放行第二个请求正好验证收尾：真实服务端会返回 `status: true`，由于带了 `code`，页面会执行 `playState = 'playing'; player.videoPlay()` 恢复播放。整条链路（弹窗 → 识别 → 填入 → 提交 → 恢复播放）都能观察到，只有服务端对验证码本身的校验结果测不到。
- 别用 `need_code: 2`。那是点选验证码，渲染进 `#video-captcha` 而不是 layui 层，接的是外部服务 `shixun.kaikangxinxi.com/api/dunclick.json`；脚本的验证码处理器只认 `.layui-layer-content`，看不见它，目前是未覆盖的情况。

### 弹窗里有诱饵元素，别删那行 mousedown

平台在验证码弹窗里放了两组元素，带显眼 ID 的那组是陷阱：

| 元素 | ID | 状态 | 图片地址 |
| --- | --- | --- | --- |
| 诱饵输入框 | `#yzCode` | `display:none` | — |
| 真实输入框 | 无 | 可见 | — |
| 诱饵图 | `#codeImg` | `opacity:0` | `/service/code` |
| 真实图 | 无 | 可见 | `/service/code/aa` |

平台脚本里有个 `var tw = ''`，可见输入框的 `mousedown` 会把它改成 `'_'`，最终提交的是 `code + tw`；若填的是隐藏的 `#yzCode`，`tw` 会被清空。也就是说服务端能靠末尾有没有下划线，分辨填的是可见框还是诱饵框。

`captcha-handler.js` 已经处理对了：按 `opacity` 和 `display` 跳过两个诱饵，并显式 `dispatchEvent(new MouseEvent('mousedown'))` 触发 `tw = '_'`。**那行 mousedown 不是可以顺手清理的兼容代码** —— 删掉验证码照样能通过，但请求里少个下划线，服务端侧就有了识别特征。

调试时据此检查三件事：

- OCR 读的是 `/service/code/aa` 那张，别对着 `/service/code` 的内容判断识别对错。
- 抓第二个请求，确认 `code` 参数末尾是 `_`；不是就说明踩到诱饵路径了。
- 先单独在地址栏打开一次 `/service/code/aa`。如果它是「请求时才在 session 里生成」的无状态生成器就没问题；如果它依赖服务端已进入待验证状态，伪造场景下可能返回空图或 404，那测的是一张废图，OCR 失败不代表模型有问题。

## 工作建议

1. 修改前先确认需求范围，尽量只改必要部分。
2. 改完后检查是否需要同步更新 `README.md`。
3. 若涉及新资源文件，确认路径和引用是否正确。
4. 尽量保持兼容性，避免影响原有平台适配。

## 备注

如果后续项目结构或工作流变化较大，可以继续补充本文件，让它始终作为该仓库的操作说明。