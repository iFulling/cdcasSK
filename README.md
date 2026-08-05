# 英华学堂全系列刷课助手|自动刷课|考试自动答题

![version](https://img.shields.io/badge/dynamic/json?url=https://scriptcat.org/api/v2/scripts/2933&label=Version&query=$.data.script.version&color=blue) ![ScriptCat](https://img.shields.io/badge/dynamic/json?url=https://scriptcat.org/api/v2/scripts/2933&label=ScriptCat%20%E5%AE%89%E8%A3%85%E9%87%8F&query=$.data.total_install&color=red) ![Tampermonkey](https://img.shields.io/badge/Tampermonkey-v4.9+-green.svg) ![ScriptCat](https://img.shields.io/badge/ScriptCat-v1.2+-beige.svg) ![平台](https://img.shields.io/badge/Platform-Windows%20%7C%20IOS%20%7C%20Android-lightgrey.svg) ![许可证](https://img.shields.io/github/license/iFulling/cdcasSK?color=blue&label=License)

### 💽安装

脚本猫使用文档：[快速开始 | ScriptCat](https://docs.scriptcat.org/docs/use/use/)

插件下载链接：[英华学堂全系列刷课助手 | 自动刷课 | 考试自动答题](https://scriptcat.org/zh-CN/script-show-page/2933)

脚本Github链接：[iFulling/cdcasSK: 成都文理学院数字化实习实训平台刷课](https://github.com/iFulling/cdcasSK)

### 📖介绍

【英华学堂全系列刷课助手】，原为 成都文理学院刷课助手。 本脚本改编自 [YoungLee-coder/MoocTool-CDCAS](https://github.com/YoungLee-coder/MoocTool-CDCAS) 刷课脚本。在原基础上，添加了✅用户交互界面、✅自动识别填充验证码、✅AI搜题等功能。

🚀目前已支持平台：【[粟湾科技](https://www.suwankj.com/)、[海旗科技](www.haiqikeji.com)、 [御瑞在线学堂](https://yuruixxkj.com/)、[如仁科技](https://rurenkj.com/)、[烨睿科技](https://yeruikeji.com/) 】等等，需要添加其他平台，先进入任一支持的平台然后在脚本界面中添加网址即可。

😀目前已具有功能包括：视频自动播放、自动识别填充验证码、考试自动答题等功能。如有bug请留言。

🐧QQ交流群：[878643471](https://qm.qq.com/q/JVXS1pu54O)

<img src="https://s41.ax1x.com/2026/01/03/pZUsnsS.png" height="300" alt="配置页面"> <img src="https://s41.ax1x.com/2026/03/20/penl1tP.png" height="300" alt="日志页面">

### 💻刷课

1. **如果视频加载不出来，可以试试关闭代理**。如果还是没有视频，就切换网络。如果还是没有，那就是网课的问题。

2. 本脚本在电脑、手机、平板都能运行，但是需要先安装油猴或脚本猫才能运行。如果不起作用，可以看看 [脚本不生效](https://docs.scriptcat.org/docs/use/QA/#%E8%84%9A%E6%9C%AC%E4%B8%8D%E7%94%9F%E6%95%88)。

3. 验证码识别需要下载 **机器视觉模型**，每个网站需要下载一次。如果下载比较慢，可以试试科学上网。如果清除了浏览器缓存就需要重新下载。

4. 因不同浏览器的优化策略问题（节能模式），如果发现**学时没变**，看视频时需要**将浏览器置于前台运行**。

5. 安装过老版本的需要把老版本删除或者禁用。

6. 添加网站，先进入任一支持的平台（如 [成都文理学院在线学堂](https://cdcas.yuruixxkj.com/)）然后在脚本界面的网站配置中输入自己学校的网址。这里注意自己学校的网址界面要和成都文理学院在线学堂差不多，相差太大就不适配。


### 📝搜题

1. 对接的是抖音豆包，因为是AI，**所以不能保证完全正确，分数高低与作者无关**，如果有所担心可在搜完后再自己手动搜一遍

2. 搜题配置：点击链接 👉 [视频教程](https://pan.baidu.com/s/1YMk6Fqv6Bmr1jU0FlQXqNQ?pwd=6666) | [获取搜题接入点ID和API Key](https://kdocs.cn/l/clJtV1RU8GDe)

### 🛠️开发

脚本源码已拆分为 ES 模块，用 [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey) 打包成单个用户脚本。

```bash
npm install
```

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器，浏览器里装一次开发版脚本即可热更新，改源码不用重装 |
| `npm run build` | 打包，产物是 `dist/cdcasSK.user.js`（不进 git，发版时手动传到 ScriptCat） |
| `npm run lint` | ESLint 检查（能查出模块间漏掉的引用、未定义变量） |
| `npm run typecheck` | TypeScript 检查 `vite.config.ts` |
| `npm version patch` | 发版：见下方「版本号与发版」 |

目录结构：

```
src/
├── index.js              入口：网址匹配 + 502 检测 + 启动 App
├── config.js             CONFIG / API / SELECTORS 常量
├── app.js                主流程状态机
├── core/
│   ├── logger.js         日志
│   ├── utils.js          通用工具
│   └── config-manager.js GM 存储读写
├── ui/
│   ├── ui-manager.js     面板创建与事件绑定
│   ├── panel-template.js 面板 HTML 模板
│   └── styles.css        面板样式
├── features/
│   ├── video-player.js   视频播放与卡顿检测
│   ├── ocr-engine.js     ONNX 验证码识别引擎
│   ├── captcha-handler.js 验证码流程
│   └── exam-solver.js    搜题
└── assets/               图标与收款码（构建时内联成 data URI）
```

几点约定：

- **仓库里只有源码，没有构建产物。** 产物在 `dist/`，发版时手动传到 ScriptCat 脚本页。
- UserScript 元数据头（`@match` / `@grant` / `@require` 等）写在 [`vite.config.ts`](vite.config.ts) 里，不在源码里。
- 收款码原图放在 `收款码/`，`src/assets/*.webp` 是缩放后的版本（300px 宽，UI 里显示 150px，2× 覆盖高分屏）。需要重新生成时：

  ```bash
  python -c "from PIL import Image; [Image.open(s).convert('RGB').resize((300, round(Image.open(s).height*300/Image.open(s).width)), Image.LANCZOS).save(d, 'WEBP', quality=82, method=6) for s, d in [('收款码/微信.jpg','src/assets/donate-wechat.webp'), ('收款码/支付宝.jpg','src/assets/donate-alipay.webp')]]"
  ```

#### 版本号与发版

版本号采用三段式 [语义化版本](https://semver.org/lang/zh-CN/)，**唯一真相源是 `package.json` 的 `version`**。脚本头的 `@version` 和源码里的 `CONFIG.VERSION` 都由构建期自动注入，任何一处都不要手改。

发版分三步：

**第一步**，在 [`CHANGELOG.md`](CHANGELOG.md) 顶部补好这个版本的章节（面向用户写，说清楚用户能感知到什么变化）。漏了这步后面会直接失败。

**第二步**，本地打版本：

```bash
npm version minor
```

`patch` 修 bug、`minor` 加功能、`major` 破坏性改动。它会串起：

1. **preversion** — 跑 `lint` + `typecheck`，任一不过就中止，版本号不会被改
2. 改写 `package.json` 的版本号，生成 git 提交并打上 `v4.3.0` 这样的 tag
3. **postversion** — 重新构建，并校验产物里的两处版本号和 `package.json` 一致

**第三步**，把提交和 tag 一起推上去：

```bash
git push --follow-tags
```

tag 一到 GitHub，[发布工作流](.github/workflows/release.yml)就会自动跑：装依赖 → 检查 → 构建 → 从 `CHANGELOG.md` 提取该版本章节 → **创建 Release 并附上构建好的 `cdcasSK.user.js`**。

工作流里有两道闸，任一不过就不会发布：tag 必须和 `package.json` 版本一致，`CHANGELOG.md` 里必须已有该版本的章节且非空。

发布完成后，脚本有一个固定不变的下载地址，指向最新版：

```
https://github.com/iFulling/cdcasSK/releases/latest/download/cdcasSK.user.js
```

最后把这个文件（或 Release 页面里的附件）传到 ScriptCat，更新说明直接复制 `CHANGELOG.md` 里那一段。

> ⚠️ 油猴和脚本猫比较版本时会给缺失的段补零，所以 **`4.2` 和 `4.2.0` 是相等的**。线上目前是 `4.2`，下一次发版必须从 `4.2.1` 或 `4.3.0` 起，传 `4.2.0` 上去会被当作"没有更新"。
>
> 另外 `npm version` 要求工作区干净，有未提交的改动会直接报错 —— 这是有意为之，避免把没提交的东西混进发布。

### 📋更新日志

完整更新日志见 **[CHANGELOG.md](CHANGELOG.md)**，也可以在 [Releases 页面](https://github.com/iFulling/cdcasSK/releases)按版本查看。

#### v4.2
- 新增自动填写账号和密码功能，可在配置面板中统一保存账号和密码，并在英华系和海旗科技登录页自动填充。
- 优化海旗科技章节定位逻辑，优先使用当前激活章节进行判断，减少章节标题重复带来的误判。
- 优化英华系章节定位逻辑，改为优先识别 `a.on` 和 `nodeId`，避免因章节标题不唯一导致的错误跳转。
- 调整视觉模型自动导入逻辑，支持单独开关控制，关闭后仅阻止自动下载，不影响已存在模型的正常识别。
- 补充配置面板顶部提示，提醒修改完配置后记得保存。