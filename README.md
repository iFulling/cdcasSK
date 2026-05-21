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

### 📋更新日志

#### v4.2 更新日志
- 新增自动填写账号和密码功能，可在配置面板中统一保存账号和密码，并在英华系和海旗科技登录页自动填充。
- 优化海旗科技章节定位逻辑，优先使用当前激活章节进行判断，减少章节标题重复带来的误判。
- 优化英华系章节定位逻辑，改为优先识别 `a.on` 和 `nodeId`，避免因章节标题不唯一导致的错误跳转。
- 调整视觉模型自动导入逻辑，支持单独开关控制，关闭后仅阻止自动下载，不影响已存在模型的正常识别。
- 补充配置面板顶部提示，提醒修改完配置后记得保存。