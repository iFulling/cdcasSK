import { Logger } from "../core/logger.js";

/**
 * 多标签页占用检测的旁路。
 *
 * 平台 video.js 里有个每秒执行的检查（下面是原文逻辑）：
 *
 *     var bNodeId = storage.get('node_play_' + schoolId + userId);
 *     if (bNodeId != nodeId && layId == 0) {
 *         layId = Yee.alert('检测到有其他视频页面同时打开', ...);
 *         playState = 'pause'; player.videoPause();
 *         return;
 *     }
 *     if (playState == 'playing') { totalTime++; }
 *
 * 另有一个 567ms 的定时器不停把当前 nodeId 写进同一个键。所以同时开着两个
 * 不同小节的页面时，两边会互相覆盖，双方都会不停弹窗并暂停视频 —— 补刷流程
 * 开新标签页正好会踩到。
 *
 * 注意 totalTime++ 和这段检查在同一个回调里，学时就是靠它按秒累加的，
 * 所以不能把这个定时器停掉，否则 totalTime 恒为 0，上报接口那边
 * `if (totalTime <= studyTime) return` 会导致一次学时都不提交。
 *
 * 这里的做法是让 `bNodeId != nodeId` 恒为假：条件不成立时代码会直接落到
 * totalTime++，视频不会被暂停，弹窗也不会出现，计时照常。
 *
 * 平台的 storage.get 最终读的是 window.localStorage，所以只需要接管
 * Storage.prototype.getItem，不必去碰它那个闭包里的变量（从外部无法访问）。
 */

/** 平台写入的占用标记键前缀，完整键名是 node_play_<schoolId><userId> */
const PLAY_LOCK_PREFIX = "node_play_";

/** 平台页面里存放当前小节 ID 的隐藏输入框，video.js 也是从这里读的 */
const NODE_ID_SELECTOR = "#video-nodeId";

let installed = false;
let notified = false;

/**
 * 每次命中都重新读一遍 DOM，这样海旗那种前端路由切换小节后不用重新装钩子。
 * 命中频率是每秒一次，开销可以忽略。
 */
function currentNodeId() {
    const el = document.querySelector(NODE_ID_SELECTOR);
    return el?.value?.trim() || "";
}

export function installMultiTabGuard() {
    if (installed) return;

    // 沙箱里的 window 是代理对象，DOM 原型要从 unsafeWindow 上取才能改到页面真正用的那个
    const scope = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    const proto = scope?.Storage?.prototype;
    if (!proto || typeof proto.getItem !== "function") {
        Logger.warn("当前环境取不到 localStorage，多标签页占用保护未启用");
        return;
    }

    const originalGetItem = proto.getItem;
    proto.getItem = function (key) {
        const raw = originalGetItem.call(this, key);
        // 只接管占用标记这一个键，续播进度键（node_<schoolId><userId>_<nodeId>）保持原样
        if (typeof key !== "string" || !key.startsWith(PLAY_LOCK_PREFIX)) return raw;

        const nodeId = currentNodeId();
        // 不在视频页（取不到 nodeId）时不干预，避免影响其他页面
        if (!nodeId) return raw;

        if (raw && raw !== nodeId && !notified) {
            notified = true;
            Logger.info(`检测到其他视频页面占用播放标记，已忽略该检测并继续计时`);
        }
        return nodeId;
    };

    installed = true;
    Logger.info("已启用多标签页占用保护");
}
