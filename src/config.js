export const CONFIG = {
    // 构建期由 vite.config.ts 从 package.json 注入，不要手改
    VERSION: __SCRIPT_VERSION__,
    DEFAULT: {
        URLS: "cdcas.yuruixxkj.com|cdcas.rurenkj.com|cdcas.suwankj.com|chengxikej.com|haiqikeji.com",
        TIMEOUT_MINUTES: 40
    },
    THRESHOLDS: {
        VIDEO_STUCK_CHECK_INTERVAL: 30000,
        VIDEO_STUCK_MIN_DIFF: 0.5,
        CAPTCHA_CHECK_INTERVAL: 1000
    }
};

// 搜题接口地址不再写在这里：各厂商的默认地址见 src/ai/providers.js

export const SELECTORS = {
    VIDEO: "video, .video-player",
    CAPTCHA_LAYER: ".layui-layer-content",
    CAPTCHA_IMG: ".layui-layer-content img",
    CAPTCHA_INPUT: ".layui-layer-content input",
    PLAY_BUTTON: ".layui-layer-btn0",
    COURSE_LINKS: 'a[target="_self"], .section-item',
    TOPIC_HEAD: ".topic-head",
    TOPIC_TAB_PREFIX: "#topic-tab-",
    EXAM_MAIN: ".courseexamcon-main",
    EXAM_INTRO_LIST: ".courseexamcon-intro ul li"
};
