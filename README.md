# 英华学堂全系列刷课助手|自动刷课|考试自动答题

[![Version](https://img.shields.io/badge/dynamic/json?url=https://scriptcat.org/api/v2/scripts/2933&label=version&query=$.data.script.version&color=blue)](https://scriptcat.org/zh-CN/script-show-page/2933)
[![ScriptCat 安装量](https://img.shields.io/badge/dynamic/json?url=https://scriptcat.org/api/v2/scripts/2933&label=ScriptCat%20%E5%AE%89%E8%A3%85%E9%87%8F&query=$.data.total_install&color=red)](https://scriptcat.org/zh-CN/script-show-page/2933)
[![CI](https://github.com/iFulling/cdcasSK/actions/workflows/ci.yml/badge.svg)](https://github.com/iFulling/cdcasSK/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/iFulling/cdcasSK?label=license)](LICENSE)

适用于英华学堂相关平台的用户脚本，提供视频自动学习、验证码识别、登录信息填充和考试 AI 搜题等功能。项目原名“成都文理学院刷课助手”，基于 [YoungLee-coder/MoocTool-CDCAS](https://github.com/YoungLee-coder/MoocTool-CDCAS) 改进。

> 使用脚本前请遵守学校、课程平台及所在地区的相关规定。AI 搜题结果可能有误，请自行复核。

## 功能

- 自动播放课程视频、切换下一节，并尝试跳过考试、作业等非视频章节。
- 检测视频卡顿、页面停留超时和常见的 502 错误。
- 使用本地 ONNX 模型识别登录页及学习过程中的验证码。
- 可选自动填写账号和密码，登录信息保存在用户脚本管理器的本地存储中。
- 在考试页面读取题目，通过 AI 接口获取答案并自动填入。
- 支持 OpenAI Chat、OpenAI Responses、Claude Messages 和 Gemini generateContent 接口格式。
- 内置火山方舟、OpenAI、Claude、Gemini、Grok、DeepSeek 预设，也支持 sub2api、new-api 等自建接口。
- 提供日志、配置、教程和平台域名管理面板。

## 平台范围

项目按页面结构将平台分为两类：

- **英华（旧 UI）**：包括 `yuruixxkj.com`、`rurenkj.com`、`suwankj.com`、`chengxikej.com` 等同类站点。
- **海旗（新 UI）**：`haiqikeji.com` 相关站点。

进入任一已支持平台后，可以在“配置 → 平台范围”中添加同类学校站点的域名。自定义域名只扩大脚本启用范围，不代表脚本能够适配不同结构的平台；学习通、智慧树等平台目前不支持。

## 安装

推荐使用 ScriptCat：

1. 安装 [ScriptCat 浏览器扩展](https://docs.scriptcat.org/docs/use/use/)。
2. 打开 [脚本安装页](https://scriptcat.org/zh-CN/script-show-page/2933)，点击安装。
3. 进入支持的课程平台，页面加载后打开“刷课助手”悬浮按钮。

也可以从 [GitHub Releases](https://github.com/iFulling/cdcasSK/releases) 下载最新版 `cdcasSK.user.js`，交给 ScriptCat 或 Tampermonkey 安装。

安装过旧版脚本时，请先禁用或删除旧版，避免多个版本同时运行。

## 使用说明

### 视频学习

进入课程或视频页面后，脚本会自动检测并播放视频。为避免浏览器节能策略影响计时，播放期间建议将课程页面保持在前台，并允许当前站点打开弹出式窗口。

如果视频无法加载，请依次检查代理、网络连接和课程平台本身是否正常。页面一直停留在同一视频时，可以在“配置 → 自动化”中调整“页面停留上限”，设置为 `0` 可关闭超时处理。

### 验证码识别

首次识别验证码时需要下载机器视觉模型。默认会自动导入，也可以在“配置 → 视觉模型”中手动导入 ONNX 模型、字符集和 WASM 文件。清除用户脚本存储或相关浏览器数据后，可能需要重新导入。

登录页的自动验证码识别默认关闭，可在“配置 → 自动化”中开启。识别错误时，可以在日志页点击“重新识别验证码”。

### 自动填写账号

在“配置 → 自动化”中开启“自动填写账号和密码”，再填写登录信息并保存。所有已启用的平台共用这一组账号和密码，请仅在私人设备上使用，并确认各站点凭据一致。

### AI 搜题

1. 打开“配置 → AI 搜题”，选择接口格式和服务商预设。
2. 填写 API Key。官方接口可以使用预设地址和模型；自建接口需要填写基础地址和模型名称。
3. 使用“获取模型”选择接口返回的模型，或直接手动填写。
4. 点击“测试接口”确认配置可用并保存。
5. 进入考试页面，在日志页点击“开始搜题”。

不同服务商的地址、模型和密钥会分别保存，切换服务商不会互相覆盖。火山方舟的接入点和 API Key 获取方式可参考[视频教程](https://pan.baidu.com/s/1YMk6Fqv6Bmr1jU0FlQXqNQ?pwd=6666)及[配置文档](https://kdocs.cn/l/clJtV1RU8GDe)。

## 界面预览

<p>
  <img src="https://s41.ax1x.com/2026/08/11/pmqyvAU.png" height="300" alt="刷课助手日志页面">
  <img src="https://s41.ax1x.com/2026/08/11/pmqyxNF.png" height="300" alt="刷课助手视觉模型页面">
  <img src="https://s41.ax1x.com/2026/08/11/pmqyzh4.png" height="300" alt="刷课助手AI搜题页面">
</p>

## 常见问题

- **脚本没有出现**：确认扩展和脚本均已启用；自定义站点需要先在已支持平台的配置面板中添加域名。也可查看 ScriptCat 的[脚本不生效排查说明](https://docs.scriptcat.org/docs/use/QA/#%E8%84%9A%E6%9C%AC%E4%B8%8D%E7%94%9F%E6%95%88)。
- **学时没有变化**：将视频页面保持在前台，关闭浏览器节能或休眠限制后重试。
- **补刷时不自动跳转**：允许当前站点打开弹出式窗口。
- **验证码模型下载失败**：检查网络后重试；也可以在配置面板中手动导入 `onnx/` 目录中的模型和字符集，并另行导入 ONNX Runtime 的 WASM 引擎。
- **AI 接口报错**：先使用“测试接口”，再检查接口格式、基础地址、模型名称、API Key 和账户余额。

问题反馈与交流：[QQ 群 878643471](https://qm.qq.com/q/JVXS1pu54O)。

## 本地开发

项目源码使用 ES 模块，通过 [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey) 打包为单文件用户脚本。

```bash
npm install
npm run dev
```

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器，安装一次开发版脚本后可热更新 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run typecheck` | 检查 `vite.config.ts` 类型 |
| `npm run build` | 构建 `dist/cdcasSK.user.js` 并校验版本号 |

主要目录：

```text
src/
├── ai/          AI 服务商、协议与统一请求逻辑
├── assets/      图标和界面图片资源
├── core/        日志、工具和配置存储
├── features/    视频、验证码与考试搜题功能
├── ui/          面板结构、事件与样式
├── app.js       页面流程与任务状态
├── config.js    默认配置和页面选择器
└── index.js     入口与平台匹配
```

开发时请注意：

- UserScript 元数据维护在 [`vite.config.ts`](vite.config.ts)，新增 `GM_*` API 时需要同步补充 `grant`。
- 版本号唯一来源是 [`package.json`](package.json)，不要手动修改脚本头或源码中的版本常量。
- 构建产物位于 `dist/`，不提交到仓库。
- 发布说明唯一来源是 [`CHANGELOG.md`](CHANGELOG.md)。

## 发布

1. 在 `CHANGELOG.md` 顶部添加新版本说明。
2. 运行 `npm version patch`、`npm version minor` 或 `npm version major`。
3. 运行 `git push --follow-tags`。
4. GitHub Actions 会创建 Release 并附带构建产物；再将产物上传到 ScriptCat。

## 许可证

本项目采用 [MIT License](LICENSE)。
