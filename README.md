# 跨平台 Web 自动化执行工具

[![Version](https://img.shields.io/badge/dynamic/json?url=https://scriptcat.org/api/v2/scripts/2933&label=Version&query=$.data.script.version&color=blue)](https://github.com/iFulling/cdcasSK) [![License](https://img.shields.io/github/license/iFulling/cdcasSK?color=blue)](https://github.com/iFulling/cdcasSK) [![Users](https://img.shields.io/badge/dynamic/json?url=https://scriptcat.org/api/v2/scripts/2933&label=Active%20Users&query=$.data.total_install&color=red)]() [![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![Platform](https://img.shields.io/badge/Platform-PC%20%7C%20IOS%20%7C%20Android-lightgrey.svg)]()



> **⚠️ Disclaimer / 免责声明**
> 
> 本项目仅供前端技术研究与自动化测试学习交流使用（For Technical Research & Educational Purpose Only）。
> 项目旨在验证 **DOM 监听**、**浏览器指纹模拟** 及 **事件流劫持** 等技术在复杂 Web 环境下的可行性。请勿将本项目代码用于任何违反目标平台用户协议的商业活动或不正当用途。


## 📖 项目简介 (Introduction)

**跨平台 Web 自动化执行工具** 是一个基于 `UserScript` 架构的浏览器端轻量级自动化交互解决方案。针对现代 Web 应用（SPA）日益复杂的页面结构与交互逻辑，本项目提供了一套非侵入式的 DOM 注入与事件流控制方案，旨在解决重复性 Web 操作的自动化执行、复杂状态监听与跨域数据协同问题。

本项目采用 **面向对象 (OOP)** 设计思想，通过工厂模式与单例模式解耦业务逻辑与底层驱动，实现了高扩展性与高维护性。

## 🏗️ 技术架构 (Architecture)

### 核心模块设计
项目采用模块化分层架构，确保各功能单元的独立性与复用性：

- **Core Driver Layer**: 
  - `ConfigManager`: 基于 `GM_getValue/GM_setValue` 封装的持久化配置管理中心，支持跨会话的状态保存与动态参数配置。
  - `Logger`: 统一日志系统，支持日志分级（INFO, WARN, ERROR）与 UI 面板实时投射，便于生产环境调试。

- **UI Interaction Layer**:
  - `UIManager`: 基于 Shadow DOM 思想的 UI 注入引擎，创建独立于宿主页面的控制面板与日志悬浮窗，避免样式污染。
  - **Drag & Drop System**: 实现了基于原生 DOM 事件的窗口拖拽系统，提供流畅的用户交互体验。

- **Business Logic Layer**:
  - `VideoController`: 针对 HTML5 `MediaElement` 的全生命周期控制封装，包含播放状态守护、异常自动恢复与流媒体事件监听。
  - `ContentAnalyzer`: 上下文感知的内容分析引擎，负责页面特定 DOM 结构的解析与数据提取。

- **Service Bridge Layer**:
  - `ServiceConnector`: 基于 `GM_xmlhttpRequest` 的跨域通信桥梁，实现前端与后端微服务（如 OCR 识别、NLP 分析）的安全数据交换。

### 关键技术点
1. **可靠的 DOM 状态监听**: 结合 `MutationObserver` 与轮询机制，解决 SPA 页面路由切换导致的状态丢失与 DOM 元素动态加载问题。
2. **异常检测与自愈 (Self-Healing)**: 内置 Watchdog 机制，实时监控业务流状态（如视频卡顿、网络超时），并在异常发生时尝试自动刷新或重启流程。
3. **跨域资源协同**: 突破浏览器同源策略限制，与外部 API 网关进行通信，扩展了纯前端脚本的能力边界。

## ✨ 功能特性 (Key Features)

- **智能媒体流控制**: 
  - 自动接管 `<video>` 元素，突破原生播放器对控件的限制。
  - 智能防抖动的卡顿检测算法，有效区分网络缓冲与播放器假死。

- **可视化配置中心**:
  - 注入式控制面板，支持实时修改运行参数（如超时阈值、功能开关）。
  - 集成可视化日志控制台，实时反馈执行进度与系统状态。

- **验证码辅助系统 (Captcha Support)**:
  - 自动提取页面验证码图像数据（Canvas/Image -> Base64）。
  - 对接云端 OCR 服务，实现验证码的自动识别与填入。

- **扩展性设计**:
  - 预留 **策略模式** 接口，可轻松扩展适配不同的 Web 平台业务逻辑。
  - 统一的异常处理机制，增强了脚本在不同浏览器环境下的兼容性。

## 🛠️ 技术栈 (Tech Stack)

- **Language**: JavaScript (ES6+), Class Fields, Async/Await
- **Runtime**: Browser Environment (Chrome/Edge), GM API
- **APIs**: DOM API, MutationObserver, HTML5 Media API, XMLHttpRequest

## 📄 声明

本项目为个人技术研究成果，展示了在浏览器端进行复杂 DOM 操作与自动化流程控制的技术实现能力，请勿将本项目代码用于任何违反目标平台用户协议的商业活动或不正当用途

## 📄 许可证

MIT License © 2024-2026 iFulling
