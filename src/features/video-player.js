import { Logger } from "../core/logger.js";
import { CONFIG } from "../config.js";
import { SELECTORS } from "../config.js";

export class VideoPlayer {
    constructor(ui) {
        this.ui = ui;
        this.video = null;
        this.stuckTimer = null;
        this.lastTime = 0;
        this.stuckCount = 0;
    }
    async start() {
        this.video = document.querySelector(SELECTORS.VIDEO);
        if (!this.video) return false;
        this._setupVideo();
        this._startStuckCheck();
        try {
            await this.video.play();
            this.ui.updateStatus("视频播放中...");
            Logger.info("视频开始播放");
        } catch (e) {
            Logger.error("播放失败: " + e.message);
        }
        return true;
    }
    _setupVideo() {
        this.video.muted = true;
        this.video.playbackRate = 1.0;
        this.video.onended = () => this._onEnded();
    }
    _onEnded() {
        Logger.info("当前视频播放结束");
        this.ui.updateStatus("视频播放结束，准备切换...");
        this._stopStuckCheck();
        document.dispatchEvent(new CustomEvent("sk:video_ended"));
    }
    _startStuckCheck() {
        this._stopStuckCheck();
        this.lastTime = this.video.currentTime;
        this.stuckCount = 0;
        this.stuckTimer = setInterval(() => {
            if (!this.video) return;
            const currentTime = this.video.currentTime;
            const diff = Math.abs(currentTime - this.lastTime);
            if (diff < CONFIG.THRESHOLDS.VIDEO_STUCK_MIN_DIFF && !this.video.paused) {
                this.stuckCount++;
                this.ui.updateStatus(`视频卡顿检测 (${this.stuckCount})`);
                if (this.stuckCount > 3) {
                    this.ui.notify("警告", "视频卡死，尝试刷新页面");
                    setTimeout(() => location.reload(), 2000);
                }
            } else {
                this.stuckCount = 0;
            }
            this.lastTime = currentTime;
        }, CONFIG.THRESHOLDS.VIDEO_STUCK_CHECK_INTERVAL);
    }
    _stopStuckCheck() {
        if (this.stuckTimer) {
            clearInterval(this.stuckTimer);
            this.stuckTimer = null;
        }
    }
}
