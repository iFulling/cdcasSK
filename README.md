## 成都文理学院刷课助手（自动填充验证码）

### 安装

油猴安装指南：[首页 | Tampermonkey](https://www.tampermonkey.net/index.php?locale=zh)

脚本油猴链接：[成都文理学院刷课助手（自动填充验证码）](https://greasyfork.org/zh-CN/scripts/512596)

脚本Github链接：[iFulling/cdcasSK: 成都文理学院数字化实习实训平台刷课](https://github.com/iFulling/cdcasSK)

### 介绍

 [成都文理学院数字化实习实训平台](https://zxshixun.cdcas.com/)  & 仓辉教育科技 自动刷课

**启动时关闭系统代理，否则视频刷新不出来。**

因为要获取验证码，在弹出请求跨域资源的页面时，选择 **总是允许**。

请将浏览器置于前台运行，否则可能上传不了学时！

![1](https://img.picui.cn/free/2024/10/16/670f1ac37b3b7.png)

仅在成都文理学院做了测试。 

本脚本改编自 [YoungLee-coder/MoocTool-CDCAS](https://github.com/YoungLee-coder/MoocTool-CDCAS) 刷课脚本。

自动识别填充网页验证码使用 [sw1128/Web_Captcha](https://github.com/sw1128/Web_Captcha) 的接口。

在原基础上，添加了用户交互界面、自动识别填充验证码等功能。

![1](https://img.picui.cn/free/2024/10/16/670f1ac0b8ffd.png)

如上图，只会在课程学习页面运行，其他页面不会允许。