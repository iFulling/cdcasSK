import { CONFIG, SELECTORS } from "./config.js";
import { Logger } from "./core/logger.js";
import { Utils } from "./core/utils.js";
import { ConfigManager } from "./core/config-manager.js";
import { UIManager } from "./ui/ui-manager.js";
import { VideoPlayer } from "./features/video-player.js";
import { CaptchaHandler } from "./features/captcha-handler.js";
import { ExamSolver } from "./features/exam-solver.js";
import { installMultiTabGuard } from "./features/multi-tab-guard.js";

export class App {
    constructor() {
        this.ui = new UIManager();
        this.videoPlayer = new VideoPlayer(this.ui);
        this.captchaHandler = new CaptchaHandler(this.ui);
        this.examSolver = new ExamSolver(this.ui);
        this.checkTimer = null;
        this.isVideoMode = false;
    }
    init() {
        if (!this._checkFirstUse()) return;
        // 必须在 UI 之前，配置面板渲染时要读到迁移后的值
        ConfigManager.migrate();
        this._checkCourseChange();
        this.ui.init();
        this._initRouteListener();
        Logger.info(`安装过老版本的需要把老版本删除或者禁用。`);
        Logger.info(`如果一直放同一个视频，就把页面停留最大时间设置成0`);
        Logger.info(`刷课助手 v${CONFIG.VERSION} 启动`);
        this._setupPageTimeout();
        this._initVisibilityListener();
        // 要在页面那个每秒检测下一次执行前装好，装晚了只会多弹一次窗，不影响后续
        installMultiTabGuard();
        this.captchaHandler.startObserver();
        this._checkUrl();
    }
    _checkCourseChange() {
        const href = window.location.href;
        const match = href.match(/courseId=([^&]+)/) || href.match(/id=([^&]+)/) || href.match(/course\/(\d+)/);
        if (match) {
            const currentCourseId = match[1];
            const lastCourseId = GM_getValue("sk_last_course_id");
            if (lastCourseId && lastCourseId !== currentCourseId) {
                Logger.info("检测到切换课程，重置刷课状态与黑名单记录");
                ConfigManager.videoStage = 1;
                GM_setValue("sk_blocked_chapters", []);
            }
            GM_setValue("sk_last_course_id", currentCourseId);
        }
    }
    _initVisibilityListener() {
        document.addEventListener("visibilitychange", () => {
            if (!this.isVideoMode) return;
            if (document.hidden) {
                Logger.warn("检测到页面被隐藏 (最小化或切换标签)");
                Logger.warn("页面隐藏可能无法增加学时，若学时会增加可忽略");
            } else {
                Logger.info("页面恢复可见");
            }
        });
        window.addEventListener("blur", () => {
            if (!this.isVideoMode) return;
            Logger.warn("检测到窗口失去焦点 (切屏)");
        });
        window.addEventListener("focus", () => {
            if (!this.isVideoMode) return;
            Logger.info("窗口重新获得焦点");
        });
    }
    _checkFirstUse() {
        const isFirstUse = GM_getValue("firstUse", true);
        if (isFirstUse) {
            const mzsm = prompt("英华学堂全系列刷课助手|自动刷课|考试自动答题（原为成都文理学院刷课助手）\n若要使用，请阅读并同意以下免责条款。\n\n" +
                "1. 此脚本仅用于学习研究，您必须在下载后24小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。\n" +
                "2. 请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。\n" +
                "3. 本人对此脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害（如封禁、限制等）。\n" +
                "4. 若有信息功能侵犯到您的权益，请及时联系作者。\n" +
                "5. 任何以任何方式查看此脚本的人或直接或间接使用此脚本的使用者都应仔细阅读此条款。\n" +
                "6. 本人保留随时更改或补充此条款的权利，一旦您使用或复制或修改了此脚本，即视为您已接受此免责条款。\n\n" +
                "若您同意以上内容，请输入“我已阅读并同意以上内容” 然后开始使用。", "");
            if (mzsm === "我已阅读并同意以上内容") {
                GM_setValue("firstUse", false);
                return true;
            } else {
                alert("免责条款未同意，脚本停止运行。\n若不想使用，请自行禁用脚本，以免每个页面都弹出该提示。");
                return false;
            }
        }
        return true;
    }
    async _handleErrorPage() {
        const errorMsg = document.querySelector("#error-main .name")?.innerText || document.querySelector(".name")?.innerText || "";
        if (/未到|未开放|尚未开放|锁定|未开启/.test(errorMsg)) {
            const currentChapter = GM_getValue("sk_current_brushing_chapter");
            if (currentChapter) {
                Logger.warn(`检测到错误页提示: ${errorMsg}，已将 [${currentChapter}] 加入临时黑名单`);
                const blocked = GM_getValue("sk_blocked_chapters", []);
                if (!blocked.includes(currentChapter)) {
                    blocked.push(currentChapter);
                    GM_setValue("sk_blocked_chapters", blocked);
                }
            }
            this.ui.updateStatus("检测到章节锁定，正在返回...");
            await Utils.pause(2);
            this._navigateToStudyRecord();
        } else {
            Logger.warn(`进入未知错误页: ${errorMsg}，5秒后尝试返回记录页检查进度...`);
            this.ui.updateStatus("遇到错误，尝试返回...");
            await Utils.pause(5);
            this._navigateToStudyRecord();
        }
    }
    _navigateToStudyRecord() {
        const href = window.location.href;
        let courseId = "";
        const match = href.match(/courseId=([^&]+)/) || href.match(/id=([^&]+)/) || href.match(/course\/(\d+)/);
        if (match) {
            courseId = match[1];
        }
        if (!courseId) {
            const input = document.querySelector('input[name="courseId"]');
            if (input) courseId = input.value;
        }
        if (!courseId) {
            const backLink = document.querySelector("#back")?.href || "";
            const backMatch = backLink.match(/courseId=([^&]+)/) || backLink.match(/id=([^&]+)/);
            if (backMatch) courseId = backMatch[1];
        }
        if (!courseId && typeof data !== 'undefined' && data.back) {
            const dataMatch = data.back.match(/courseId=([^&]+)/) || data.back.match(/id=([^&]+)/);
            if (dataMatch) courseId = dataMatch[1];
        }
        if (!courseId) {
            courseId = GM_getValue("sk_last_course_id");
            if (courseId) Logger.info("URL 丢失课程号，使用缓存记录的 ID: " + courseId);
        }
        if (courseId) {
            ConfigManager.videoStage = 2;
            GM_setValue("sk_video_stage", 2);
            const targetPath = href.includes("/student/") ? "/student/course-study-record" : "/user/study_record";
            location.href = `${targetPath}?id=${courseId}&courseId=${courseId}`;
        } else {
            Logger.error("无法获取课程号，尝试返回首页");
            location.href = href.includes("/student/") ? "/student/home" : "/user/index";
        }
    }
    _checkUrl() {
        const href = window.location.href;
        const pathname = window.location.pathname;
        const savedStage = GM_getValue("sk_video_stage");
        if (savedStage) {
            ConfigManager.videoStage = savedStage;
        }

        if (document.getElementById("error-main") || document.querySelector(".errormain")) {
            this._handleErrorPage();
            return;
        }
        if (href.includes("/node") || pathname === "/student/course-study") {
            this._startVideoMode();
        } else if (pathname === "/user/exam") {
            this._startExamMode();
        } else if (href.includes("/login")) {
            this._autoFillLoginFields();
            this.captchaHandler.checkAndSolveLogin();
            document.addEventListener("sk:recaptcha_login", () => {
                this.captchaHandler.solveLoginCaptcha();
            });
        } else if (href.includes("/user/study_record") || href.includes("course-study-record")) {
            this._checkStudyRecord();
        } else if (pathname === "/student/home") {
            this.ui.updateStatus("已进入个人首页");
            this.ui.clearLog();
            Logger.info("成功检测到路由跳转：已进入个人首页");
        } else {
            this.ui.updateStatus("请进入课程或考试页面");
        }
    }
    _autoFillLoginFields() {
        if (!ConfigManager.autoFillAccount) return;
        if (this._loginFillTimer) return;
        const href = window.location.href;
        const isHaiqi = href.includes("haiqikeji");
        const fill = (selector, value) => {
            const el = document.querySelector(selector);
            if (!el || !value) return false;
            el.focus();
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
            if (setter) {
                setter.call(el, value);
            } else {
                el.value = value;
            }
            el.dispatchEvent(new InputEvent("input", {
                bubbles: true,
                composed: true,
                data: value,
                inputType: "insertText"
            }));
            el.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
            el.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));
            return true;
        };
        const tryFill = () => {
            if (!ConfigManager.autoFillAccount) return true;
            if (isHaiqi) {
                const inputs = document.querySelectorAll('input.el-input__inner');
                const userInput = Array.from(inputs).find(el => el.type === 'text' || (el.placeholder || '').includes('学号'));
                const passInput = Array.from(inputs).find(el => el.type === 'password' || (el.placeholder || '').includes('密码'));
                const ok1 = userInput && ConfigManager.loginAccount ? (fill('input.el-input__inner[type="text"]', ConfigManager.loginAccount) || fill('input[placeholder="请输入学号"]', ConfigManager.loginAccount)) : false;
                const ok2 = passInput && ConfigManager.loginPassword ? (fill('input.el-input__inner[type="password"]', ConfigManager.loginPassword) || fill('input[placeholder="请输入密码"]', ConfigManager.loginPassword)) : false;
                return !!(ok1 && ok2);
            }
            const ok1 = !!fill('#username', ConfigManager.loginAccount);
            const ok2 = !!fill('#password', ConfigManager.loginPassword);
            return ok1 && ok2;
        };
        let attempts = 0;
        const maxAttempts = 40;
        const interval = setInterval(() => {
            attempts++;
            if (tryFill() || attempts >= maxAttempts) {
                clearInterval(interval);
                this._loginFillTimer = null;
            }
        }, 250);
        this._loginFillTimer = interval;
        tryFill();
    }
    _initRouteListener() {
        const self = this;
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        history.pushState = function () {
            originalPushState.apply(this, arguments);
            self._handleRouteChange();
        };
        history.replaceState = function () {
            originalReplaceState.apply(this, arguments);
            self._handleRouteChange();
        };
        window.addEventListener("popstate", () => this._handleRouteChange());
    }
    _handleRouteChange() {
        this.ui.updateToolbar();
        this._checkUrl();
    }
    _getPageInfo() {
        const totalEl = document.querySelector(".pagebar-bbs .total") || document.querySelector(".total");
        if (!totalEl) return null;
        const text = totalEl.innerText;
        const match = text.match(/页次：\s*(\d+)\s*\/\s*(\d+)/) || text.match(/(\d+)\s*\/\s*(\d+)/);
        if (match) {
            return { current: parseInt(match[1]), total: parseInt(match[2]) };
        }
        return null;
    }
    async _checkStudyRecord() {
        if (ConfigManager.videoStage !== 2) return;
        GM_deleteValue("sk_current_brushing_chapter");
        this.ui.updateStatus("正在检查学习进度...");
        Logger.info("核对学习进度");

        const videoTab = Array.from(document.querySelectorAll(".tab")).find(t => t.innerText.includes("视频记录"));
        if (videoTab && !videoTab.classList.contains("active")) {
            Logger.info("正在切换至视频记录标签...");
            videoTab.click();
            await Utils.pause(2);
        }

        await Utils.pause(1);

        let progressEl = null;
        for (let i = 0; i < 5; i++) {
            progressEl = document.querySelector(".score-table td") || document.querySelector(".progress-text");
            if (progressEl) break;
            await Utils.pause(1);
        }

        if (progressEl && progressEl.innerText.includes("100%")) {
            Logger.info("学习进度已达 100%，刷课完成！");
            this.ui.notify("完成", "学习进度 100%，所有课程已完成！");
            this.ui.updateStatus("刷课完成");
            ConfigManager.videoStage = 1;
            GM_setValue("sk_video_stage", 1);
            this.isVideoMode = false;
            return;
        }

        await Utils.pause(1);

        let rows = [];
        for (let i = 0; i < 5; i++) {
            rows = document.querySelectorAll("table#list tbody tr, .video-table tbody tr");
            if (rows.length > 0) break;
            Logger.info(`正在等待记录列表加载... (${i + 1}/5)`);
            await Utils.pause(1);
        }

        let foundUnfinished = false;
        for (const row of rows) {
            const statusEl = row.querySelector("td:last-child span, .col-status span, td:nth-last-child(2) span");
            const status = statusEl?.innerText;
            const blockedChapters = GM_getValue("sk_blocked_chapters", []);
            if (status && !status.includes("已学") && !status.includes("已完成") && !/未开放|尚未开放|锁定|未开启/.test(status)) {
                const link = row.querySelector("td:first-child a");
                const chapterTitle = (row.querySelector("td:first-child") || row.querySelector(".video-link"))?.innerText?.trim();

                if (blockedChapters.includes(chapterTitle)) {
                    Logger.warn(`章节 ${chapterTitle} 在黑名单中（未开放），跳过...`);
                    continue;
                }

                if (link) {
                    Logger.info(`发现未学课程: ${chapterTitle}，准备跳转...`);
                    this.ui.updateStatus(`补刷: ${chapterTitle}`);
                    foundUnfinished = true;
                    GM_setValue("sk_current_brushing_chapter", chapterTitle);
                    GM_setValue("sk_video_stage", 1);
                    await Utils.pause(1);
                    link.click();
                    return;
                } else if (chapterTitle) {
                    Logger.info(`发现未学课程: ${chapterTitle}，准备回跳学习页...`);
                    this.ui.updateStatus(`准备补刷: ${chapterTitle}`);
                    GM_setValue("sk_target_chapter", chapterTitle);
                    GM_setValue("sk_current_brushing_chapter", chapterTitle);
                    GM_setValue("sk_video_stage", 1);
                    foundUnfinished = true;
                    await Utils.pause(2);
                    this._navigateToStudyPage();
                    return;
                }
            }
        }

        if (!foundUnfinished) {
            const nextBtn = document.querySelector(".page-btn.next, .btn-next");
            const pageInfo = this._getPageInfo();
            const hasNextPage = pageInfo ? (pageInfo.current < pageInfo.total) : (nextBtn && !nextBtn.classList.contains("disabled") && !nextBtn.hasAttribute("disabled"));

            if (hasNextPage && nextBtn) {
                Logger.info("当前页已完成，进入下一页...");
                this.ui.updateStatus("翻页检查中...");
                await Utils.pause(1);
                nextBtn.click();
                setTimeout(() => this._checkStudyRecord(), 3000);
            } else {
                Logger.info("所有页面检查完毕，未发现可刷课程或章节已锁定。");
                this.ui.notify("完成", "学习进度核对结束");
                this.ui.updateStatus("检查结束");
                ConfigManager.videoStage = 1;
                GM_setValue("sk_video_stage", 1);
                this.isVideoMode = false;
            }
        }
    }
    _navigateToStudyPage() {
        const href = window.location.href;
        let courseId = "";
        const match = href.match(/id=([^&]+)/) || href.match(/courseId=([^&]+)/);
        if (match) courseId = match[1];

        if (courseId) {
            const targetPath = href.includes("/student/") ? "/student/course-study" : "/node/index";
            location.href = `${targetPath}?id=${courseId}&courseId=${courseId}`;
        } else {
            Logger.error("无法返回学习页，ID 丢失");
            location.href = "/student/home";
        }
    }
    async _startVideoMode() {
        this.isVideoMode = true;
        this.ui.updateStatus("进入视频刷课模式");
        Logger.info("进入视频刷课模式");
        GM_registerMenuCommand("开始刷课", () => {
            ConfigManager.videoStage = 1;
            this._videoLoop();
        });
        GM_registerMenuCommand("停止刷课", () => this._stopVideoLoop());
        document.addEventListener("sk:video_ended", () => {
            if (ConfigManager.videoStage === 2) {
                const links = document.querySelectorAll(SELECTORS.COURSE_LINKS);
                const currentIndex = this._getCurrentVideoIndex(links);
                if (currentIndex !== -1 && currentIndex < links.length - 1) {
                    const nextItem = links[currentIndex + 1];
                    const nextTitle = nextItem.querySelector(".section-title")?.innerText?.trim() || nextItem.innerText?.trim();
                    if (nextTitle) {
                        Logger.info(`侧边栏发现后续视频: ${nextTitle}，继续播放...`);
                        this._playNextVideo();
                        return;
                    }
                }
                this._playNextVideo();
            } else {
                this._playNextVideo();
            }
        });
        await Utils.pause(3);
        this._videoLoop();
    }
    async _returnToStudyRecord() {
        this.ui.updateStatus("本节补刷完成，返回记录页...");
        Logger.info("本节补刷完成，返回记录页继续检查");
        await Utils.pause(2);
        this._navigateToStudyRecord();
    }
    _startExamMode() {
        this.ui.updateStatus("进入考试搜题模式");
        Logger.warn("答案由 AI 生成，不能保证 100% 正确。分数高低与作者无关，建议搜完后人工复核。");
        Logger.info("进入考试搜题模式，点击【开始搜题】");
        GM_registerMenuCommand("开始搜题", () => this.examSolver.start());
        GM_registerMenuCommand("停止搜题", () => this.examSolver.stop());
        document.addEventListener("sk:exam_start", () => this.examSolver.start());
        document.addEventListener("sk:exam_stop", () => this.examSolver.stop());
    }
    async _videoLoop() {
        if (this.checkTimer) clearInterval(this.checkTimer);

        const targetChapter = GM_getValue("sk_target_chapter");
        if (targetChapter) {
            this.ui.updateStatus(`自动定位章节: ${targetChapter}`);
            Logger.info(`正在尝试自动跳转至补刷章节: ${targetChapter}`);
            const links = Array.from(document.querySelectorAll(SELECTORS.COURSE_LINKS));
            const activeIndex = links.findIndex(link => link.classList?.contains("active") || link.querySelector?.(".active"));
            if (activeIndex !== -1) {
                const activeItem = links[activeIndex];
                const activeTitle = activeItem.querySelector(".section-title")?.innerText?.trim() || activeItem.innerText?.trim();
                if (activeTitle) {
                    GM_deleteValue("sk_target_chapter");
                    GM_setValue("sk_current_brushing_chapter", targetChapter);
                    Logger.info(`使用 active 定位当前章节: ${activeTitle}`);
                }
            }
            for (const link of links) {
                const title = link.querySelector(".section-title")?.innerText?.trim() || link.innerText?.trim();
                if (title && (targetChapter.includes(title) || title.includes(targetChapter))) {
                    GM_deleteValue("sk_target_chapter");
                    GM_setValue("sk_current_brushing_chapter", targetChapter);
                    Logger.info(`成功定位，开始补刷: ${title}`);
                    link.click();
                    break;
                }
            }
        }

        this.checkTimer = setInterval(async () => {
            if (this.captchaHandler.isRecognizing) return;
            const layer = document.querySelector(SELECTORS.CAPTCHA_LAYER);
            const isRealCaptcha = layer && layer.querySelector("img") && layer.querySelector("input");
            if (isRealCaptcha && layer.offsetParent !== null) {
                await this.captchaHandler.checkAndSolve();
                return;
            }
            if (layer && !isRealCaptcha && layer.offsetParent !== null) {
                const content = layer.innerText || "";
                if (/未开放|尚未开放|锁定|请先学习|未开启/.test(content)) {
                    const currentChapter = targetChapter || GM_getValue("sk_current_brushing_chapter");
                    if (currentChapter) {
                        Logger.warn(`检测到章节锁定弹窗: ${content}，已将 [${currentChapter}] 加入临时黑名单`);
                        const blocked = GM_getValue("sk_blocked_chapters", []);
                        if (!blocked.includes(currentChapter)) {
                            blocked.push(currentChapter);
                            GM_setValue("sk_blocked_chapters", blocked);
                        }
                    }
                    const confirmBtn = layer.parentNode.querySelector(".layui-layer-btn0");
                    if (confirmBtn) confirmBtn.click();
                    await Utils.pause(1);
                    this._returnToStudyRecord();
                    return;
                }
                const confirmBtn = layer.parentNode.querySelector(".layui-layer-btn0");
                if (confirmBtn) {
                    Logger.info("拦截到系统提示弹窗，尝试自动关闭/确认...");
                    confirmBtn.click();
                    await Utils.pause(1);
                }
                return;
            }
            const video = document.querySelector(SELECTORS.VIDEO);
            if (video) {
                if (video.paused) {
                    await this.videoPlayer.start();
                } else {
                    if (this.ui.panel && this.ui.panel.textContent.includes("验证码")) {
                        this.ui.updateStatus("视频播放中...");
                    }
                }
            } else {
                const isExamPage = !document.querySelector(SELECTORS.VIDEO) && !document.querySelector(".detmain-tabs .ico1") && (
                    Array.from(document.querySelectorAll("button span, .el-button, .detmain-tabs .item span")).some(el =>
                        /考试|作业|练习|测验|资料/.test(el.innerText)
                    ) || !!document.querySelector(".ico3, .ico4, .external-link-container")
                );

                if (isExamPage && !this._examSkipping) {
                    this._examSkipping = true;
                    Logger.warn("检测到当前章节为考试/作业/非视频内容，准备跳过...");
                    this.ui.updateStatus("自动跳过非视频章节...");
                    await Utils.pause(3);
                    this._playNextVideo();
                    setTimeout(() => { this._examSkipping = false; }, 5000);
                }
            }
        }, CONFIG.THRESHOLDS.CAPTCHA_CHECK_INTERVAL);
    }
    _stopVideoLoop() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
        this.ui.updateStatus("刷课已暂停");
    }
    _getCurrentVideoIndex(links) {
        const items = Array.from(links || []);
        const href = window.location.href;
        const isHaiqi = href.includes("haiqikeji");

        if (isHaiqi) {
            const activeIndex = items.findIndex(link => link.classList?.contains("active") || link.querySelector?.(".active"));
            if (activeIndex !== -1) return activeIndex;

            const activeChapter = document.querySelector(".section-item.active");
            if (activeChapter) {
                const idx = items.findIndex(link => link === activeChapter || link.contains?.(activeChapter) || activeChapter.contains?.(link));
                if (idx !== -1) return idx;
            }

            const currentTitle = document.querySelector("h1")?.innerText?.trim();
            if (currentTitle) {
                for (let i = 0; i < items.length; i++) {
                    const link = items[i];
                    const sectionTitle = link.querySelector(".section-title")?.innerText?.trim() || link.title?.trim() || link.innerText?.trim();
                    if (!sectionTitle) continue;
                    if (currentTitle === sectionTitle) return i;
                    if (currentTitle.includes(sectionTitle) || sectionTitle.includes(currentTitle)) return i;
                }
            }
            return -1;
        }

        const currentUrl = new URL(window.location.href);
        for (let i = 0; i < items.length; i++) {
            const link = items[i];
            const activeLink = link.querySelector("a.on") || (link.matches && link.matches("a.on"));
            if (activeLink) return i;

            try {
                const linkUrl = new URL(link.href, window.location.origin);
                const linkNodeId = linkUrl.searchParams.get("nodeId");
                const currentNodeId = currentUrl.searchParams.get("nodeId");
                if (linkNodeId && currentNodeId && linkNodeId === currentNodeId) return i;
            } catch { }
        }

        const currentTitle = document.querySelector("h1")?.innerText?.trim();
        if (currentTitle) {
            for (let i = 0; i < items.length; i++) {
                const link = items[i];
                const sectionTitle = link.querySelector(".section-title")?.innerText?.trim() || link.title?.trim() || link.innerText?.trim();
                if (!sectionTitle) continue;
                if (currentTitle === sectionTitle) return i;
                if (currentTitle.includes(sectionTitle) || sectionTitle.includes(currentTitle)) return i;
            }
        }
        return -1;
    }
    async _playNextVideo() {
        this._stopVideoLoop();
        const sidebar = document.querySelector(".detmain-navlist, .course-sidebar, .section-list, .detmain-navs");
        const links = sidebar ? sidebar.querySelectorAll(SELECTORS.COURSE_LINKS) : document.querySelectorAll(SELECTORS.COURSE_LINKS);
        let currentIndex = this._getCurrentVideoIndex(links);

        if (currentIndex !== -1 && currentIndex < links.length - 1) {
            this.ui.updateStatus("准备播放下一个视频...");
            await Utils.pause(3);
            const nextItem = links[currentIndex + 1];
            if (nextItem.classList.contains('section-item') || nextItem.parentElement.classList.contains('item')) {
                const header = nextItem.querySelector('.section-header') || nextItem;
                header.click();
            } else {
                nextItem.click();
            }
            setTimeout(() => this._videoLoop(), 3000);
        } else {
            const globalNext = Array.from(document.querySelectorAll("a, button, span")).find(el => {
                const text = el.innerText;
                const isNextText = /下一章|下一节|下一页|Next Chapter|Next Section/i.test(text);
                const isBBS = el.closest(".pagebar-bbs, .discuss-list, .bbs-list, .pagebar");
                const isRecord = text.includes("记录") || text.includes("首页") || text.includes("尾页");
                return isNextText && el.offsetParent !== null && !isBBS && !isRecord;
            });

            if (globalNext) {
                Logger.info(`侧边栏已到头，发现跳转按钮: ${globalNext.innerText}，尝试进入下一章...`);
                this.ui.updateStatus("跳转下一章...");
                globalNext.click();
                setTimeout(() => this._videoLoop(), 5000);
                return;
            }

            this.ui.notify("完成", "当前页面所有视频已播放完毕");
            this.ui.updateStatus("准备核对总进度...");
            Logger.info("当前播放列表已结束，开始回跳记录页核对进度");
            ConfigManager.videoStage = 2;
            await Utils.pause(2);
            this._navigateToStudyRecord();
        }
    }
    _setupPageTimeout() {
        const minutes = ConfigManager.timeoutMinutes;
        if (minutes > 0) {
            setTimeout(() => {
                if (this.isVideoMode) {
                    this.ui.notify("超时", "页面停留超时，即将刷新");
                    setTimeout(() => location.reload(), 5000);
                }
            }, minutes * 60 * 1000);
        }
    }
}
