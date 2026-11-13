import { Logger } from "../core/logger.js";
import { Utils } from "../core/utils.js";

/**
 * 新壳学习成绩页的刷课流程。
 *
 * 平台没有给出批量接口，只能按节点走一遍「开会话 → 报进度 → 结束会话」三步：
 * get_study_progress 拿到节点清单 → 逐个 study_session_start / heartbeat / end，
 * 一轮走完再拉一次进度，直到 completedNodes 与 totalNodes 相等。
 */

const API = {
    PROGRESS: "/api/user/get_study_progress",
    SESSION_START: "/api/user/study_session_start",
    SESSION_HEARTBEAT: "/api/user/study_session_heartbeat",
    SESSION_END: "/api/user/study_session_end",
};

export class StudyRecordBrush {
    constructor(ui) {
        this.ui = ui;
        this.running = false;
        this.stopped = false;
        this.finished = false;
        this.token = null;
        this.courseId = null;
        this.schoolId = null;
        this.userId = null;
        this.completed = 0;
        this.total = 0;
    }

    async start() {
        if (this.running) {
            Logger.warn("刷课正在进行中，先停止再重新开始");
            return;
        }

        try {
            this._loadContext();
        } catch (e) {
            Logger.error(e.message);
            this.ui.updateStatus("刷课未启动：缺少登录信息");
            return;
        }

        this.running = true;
        this.stopped = false;
        this.finished = false;
        this.completed = 0;
        this.total = 0;
        this.ui.setBrushRunning(true);

        try {
            await this._run();
        } catch (e) {
            Logger.error(`刷课中断：${e.message}`);
            this.ui.updateStatus("刷课中断");
        } finally {
            this.running = false;
            this.ui.setBrushRunning(false);
            if (this.stopped) {
                Logger.info("刷课已停止");
                this.ui.updateStatus("已停止刷课");
            }
        }
    }

    stop() {
        if (!this.running) return;
        this.stopped = true;
        this.finished = false;
        Logger.info("收到停止指令，等待当前节点结束...");
        this.ui.updateStatus("正在停止刷课...");
    }

    /** 从页面存储和 URL 里取登录态与课程号，缺任何一项都不启动 */
    _loadContext() {
        const rawInfo = localStorage.getItem("userInfo");
        if (!rawInfo) throw new Error("内存里没有用户信息，请先登录");

        const token = localStorage.getItem("student_token");
        if (!token) throw new Error("内存里没有用户令牌，请先登录");

        const info = JSON.parse(rawInfo);
        const courseId = new URL(window.location.href).searchParams.get("id");
        if (!courseId) throw new Error("当前地址没有 id 参数，无法确定课程");

        this.token = token;
        this.courseId = courseId;
        this.schoolId = info.schoolId;
        this.userId = info.id;
    }

    async _run() {
        let lastCompleted = -1;
        let stalledRounds = 0;

        while (!this.stopped) {
            const progress = await this._fetchProgress();
            const summary = progress.summary;
            this.completed = summary.completedNodes;
            this.total = summary.totalNodes;
            this._reportProgress();

            if (this.completed >= this.total) {
                this.finished = true;
                Logger.info(`全部 ${this.total} 个节点已完成`);
                this.ui.updateStatus("所有视频全部完成");
                Logger.notice("所有视频已完成，请刷新页面确认进度");
                break;
            }

            // 平台偶尔有节点刷不动，连着两轮进度不动就收手，避免无限请求
            if (this.completed === lastCompleted) {
                stalledRounds += 1;
                if (stalledRounds >= 2) {
                    Logger.warn("连续两轮进度没有变化，停止刷课，请稍后重试");
                    break;
                }
            } else {
                stalledRounds = 0;
            }
            lastCompleted = this.completed;

            const pending = progress.nodeProgressList.filter(node => node.statusText !== "已完成");
            Logger.info(`本轮待处理 ${pending.length} 个节点`);

            for (const node of pending) {
                if (this.stopped) return;
                await this._brushNode(node);
                if (this.stopped) return;
                // 前后节点之间也留间隔，避免 start 挨得太近被平台计数
                await Utils.pause(1);
            }
        }
    }

    async _fetchProgress() {
        const data = await this._request(API.PROGRESS, {
            query: {
                schoolId: this.schoolId,
                userId: this.userId,
                courseId: this.courseId,
            },
        });
        return data;
    }

    /** 单个节点：开会话 → 报满进度 → 结束会话 */
    async _brushNode(node) {
        try {
            const sessionId = await this._request(API.SESSION_START, {
                method: "POST",
                body: {
                    schoolId: this.schoolId,
                    userId: this.userId,
                    nodeId: String(node.nodeId),
                    courseId: this.courseId,
                    terminal: "web",
                },
            });

            // 平台限流：会话开始后不足 1 秒就报心跳会直接 500，这里留 200ms 余量
            Logger.info(`开始视频：${node.nodeName}`);
            await Utils.pause(1.2);
            await this._heartbeat(sessionId);

            await this._request(API.SESSION_END, {
                method: "POST",
                body: { sessionId },
            });

            this.completed += 1;
            Logger.info(`${node.nodeName} 已完成`);
            this._reportProgress();
        } catch (e) {
            Logger.warn(`${node.nodeName} 处理失败：${e.message}`);
        }
    }

    /** 心跳被限流时退避重试，三次都失败才把节点记为失败 */
    async _heartbeat(sessionId) {
        const maxRetry = 3;
        for (let i = 0; i < maxRetry; i++) {
            try {
                return await this._request(API.SESSION_HEARTBEAT, {
                    method: "POST",
                    body: { sessionId, progress: "100" },
                });
            } catch (e) {
                if (!e.message.includes("频繁") || i === maxRetry - 1) throw e;
                Logger.warn(`心跳过快，${i + 1} 秒后重试`);
                await Utils.pause(i + 1);
            }
        }
    }

    _reportProgress() {
        this.ui.updateStatus(`已完成 ${this.completed}/${this.total}`);
    }

    /**
     * 统一请求入口。
     * authorization 是裸 JWT，值取自 localStorage 的 student_token，不带 Bearer 前缀。
     */
    async _request(path, { method = "GET", query, body } = {}) {
        let url = path;
        if (query) {
            url += `?${new URLSearchParams(query).toString()}`;
        }
        // 用绝对地址：脚本沙箱里的 fetch 不一定按页面 origin 解析相对路径
        const fullUrl = new URL(url, window.location.origin).toString();

        const options = {
            method,
            credentials: "include",
            headers: {
                accept: "application/json, text/plain, */*",
                authorization: this.token,
            },
        };
        if (body) {
            options.headers["content-type"] = "application/json";
            options.body = JSON.stringify(body);
        }

        const res = await fetch(fullUrl, options);
        if (!res.ok) {
            throw new Error(`${path} 请求失败，HTTP ${res.status}`);
        }

        const json = await res.json();
        if (json.code !== 200) {
            throw new Error(`${path} 返回 ${json.code}：${json.msg}`);
        }
        return json.data;
    }
}
