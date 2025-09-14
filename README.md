# 成都文理学院刷课助手|自动刷课|考试自动答题

![版本](https://img.shields.io/badge/release-v2.1.8-blue.svg) ![ScriptCat](https://img.shields.io/badge/tampermonkey-2580-green.svg) ![Tampermonkey](https://img.shields.io/badge/tampermonkey-v4.9+-green.svg) ![平台](https://img.shields.io/badge/platform-Windows-lightgrey.svg) ![许可证](https://img.shields.io/badge/license-MIT-blue.svg)

### 💽安装

油猴安装指南：[首页 | Tampermonkey](https://www.tampermonkey.net/index.php?locale=zh)

脚本油猴链接：[成都文理学院刷课助手|自动刷课|考试自动答题](https://greasyfork.org/zh-CN/scripts/512596)

脚本Github链接：[iFulling/cdcasSK: 成都文理学院数字化实习实训平台刷课](https://github.com/iFulling/cdcasSK)

### 📖介绍

【成都文理学院刷课助手】虽然其他学校也能用，但仅在成都文理学院做了测试。 本脚本改编自 [YoungLee-coder/MoocTool-CDCAS](https://github.com/YoungLee-coder/MoocTool-CDCAS) 刷课脚本。在原基础上，添加了✅用户交互界面、✅自动识别填充验证码、✅AI搜题等功能。

🚀目前已支持平台：【 [成都文理学院数字化实习实训平台](https://cdcas.rurenkj.com/)、[成都文理学院公益课程](https://cdcas.zjxkeji.com/)、[成都文理学院在线学堂](https://cdcas.yuruixxkj.com/)、[成都文理学院英华学堂](https://zxshixun.cdcas.com/) 】（不止成都文理，其他学校虽也能使用，但仅在成都文理学院做了测试，如果需要添加自己学校的平台，先进入任一支持的平台然后在脚本界面中添加网址即可）。

😀目前已具有功能包括：视频自动播放、自动识别填充验证码、考试自动答题等功能。如有bug请留言。

🐧QQ交流群：878643471

### 💻刷课

1. **启动时关闭系统代理，否则视频刷新不出来。**
2. 本脚本仅支持PC端，如果不起作用，点油猴图标看是否有提示 "**Please enable developer mode...**"，若有，点击查看 [油猴插件不能使用](https://www.baidu.com/s?wd=油猴PleaseEnableDeveloper)
3. 因为要获取验证码，如果弹出请求跨域资源的页面，选择 **总是允许**。
4. 因不同浏览器的优化策略问题，如果发现**学时没变**，看视频时请**将浏览器置于前台运行**。
5. 安装过老版本的需要把老版本删除或者禁用。

   ![1](https://s21.ax1x.com/2025/02/27/pE3oC1U.png)

6. 添加网站，先进入任一支持的平台（如 [成都文理学院在线学堂](https://cdcas.yuruixxkj.com/)）然后在脚本界面的网站配置中输入自己学校的网址。

   ![1](https://s21.ax1x.com/2025/06/18/pVEq2U1.png)

### 📝搜题

1. 对接的是抖音豆包，因为是AI，**所以不能保证完全正确，分数高低与作者无关**，如果有所担心可在搜完后再自己手动搜一遍
2. 搜题配置：点击链接 👉 [视频教程](https://pan.baidu.com/s/1YMk6Fqv6Bmr1jU0FlQXqNQ?pwd=6666) | [获取搜题接入点ID和API Key](https://kdocs.cn/l/clJtV1RU8GDe)

![](https://s21.ax1x.com/2025/02/27/pE3o9pT.png)

### 📋更新日志

#### 最新更新
- **验证码接口优化**：更换为更稳定的验证码识别服务，提高识别成功率
- **网站配置更新**：更新默认支持的网站列表，使用最新的平台地址
- **错误处理改进**：优化验证码识别失败时的错误提示和处理逻辑
- **用户体验提升**：改进网站配置界面，支持在脚本界面直接添加新的学习平台