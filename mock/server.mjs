/**
 * 考试搜题的本地测试服务。零依赖，只用 node 内置模块。
 *
 * 一个进程同时干两件事：
 *
 *   1. 把仿真考试页挂在 http://localhost:8788/user/exam
 *      路径必须**完全等于** /user/exam —— src/app.js 的 _checkUrl() 是全等比较，
 *      带尾斜杠或 .html 后缀都进不了搜题模式，连配置面板的「开始搜题」按钮都不会渲染
 *      （见 src/ui/panel-template.js 里同样的判断）。所以这里手写路由，
 *      不要指望静态服务器的目录索引。
 *
 *   2. 冒充一个 OpenAI 兼容接口，按题号返回预先写死的答案。
 *      配置面板里接口地址填 http://localhost:8788，API Key 随便填，
 *      接口格式选「OpenAI 兼容 · Chat Completions」。
 *
 * 用法：
 *   node mock/server.mjs
 *
 * 可选环境变量：
 *   PORT=8788          端口
 *   MOCK_FAIL=429      让 /chat/completions 返回该状态码，用来测 _getAnswer 的重试
 *   MOCK_FAIL_TIMES=2  只失败前 N 次，之后恢复正常（默认一直失败）
 *   MOCK_DELAY=0       每个请求人为延迟毫秒数，用来测 AiClient 的 60 秒超时
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT) || 8788;
const FAIL_STATUS = Number(process.env.MOCK_FAIL) || 0;
const FAIL_TIMES = process.env.MOCK_FAIL_TIMES ? Number(process.env.MOCK_FAIL_TIMES) : Infinity;
const DELAY = Number(process.env.MOCK_DELAY) || 0;

/**
 * 每道题的假答案，键是题号。
 * 值是「模型原样返回的文本」，故意混了各种格式，用来压
 * src/features/exam-solver.js 里 extractChoiceAnswer 的各条解析分支。
 * 题面和期望结果写在 user/exam.html 每个 topic-item 的 data-* 上。
 */
const ANSWERS = {
    1: "A",
    2: "答案：B",
    3: "<think>A 和 B 明显不对，D 太绝对，应该是 C</think>C",
    4: "我认为应该选 D。",
    5: "C",
    6: "AB",
    7: "A、D",
    8: "B",
    9: "根据学生手册的规定，该行为应当依据情节轻重给予相应处理。"
};
/** 题号解析不出来时（例如配置面板的「连接测试」）用这个兜底 */
const FALLBACK = "A";

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".ico": "image/x-icon",
    ".png": "image/png"
};

let failed = 0;

function sendJson(res, status, body) {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        // GM_xmlhttpRequest 不受同源限制，加这个只是方便直接用浏览器戳接口
        "Access-Control-Allow-Origin": "*"
    });
    res.end(JSON.stringify(body));
}

function readBody(req) {
    return new Promise(resolve => {
        let raw = "";
        req.on("data", chunk => { raw += chunk; });
        req.on("end", () => resolve(raw));
    });
}

/**
 * 从题面里取题号。
 * exam-solver 传过来的是 .courseexamcon-main 的 innerText，开头就是 .head 里的
 * `<div class="num"><span>12</span>.</div>`，所以文字以 "12." 起头。
 */
function questionNo(text) {
    const matched = String(text || "").match(/^\s*(\d+)\s*\./);
    return matched ? Number(matched[1]) : 0;
}

async function handleChat(req, res) {
    let payload = {};
    try {
        payload = JSON.parse(await readBody(req));
    } catch {
        // 解析不了就当空对象，走下面的兜底答案
    }
    const question = payload?.messages?.find(item => item.role === "user")?.content || "";
    const no = questionNo(question);
    const answer = ANSWERS[no] ?? FALLBACK;

    console.log(`[chat] 第 ${no || "?"} 题 → ${JSON.stringify(answer)}`);
    console.log(`       题面：${question.replace(/\s+/g, " ").slice(0, 70)}`);

    if (FAIL_STATUS && failed < FAIL_TIMES) {
        failed++;
        console.log(`[chat] 按 MOCK_FAIL 返回 ${FAIL_STATUS}（第 ${failed} 次失败）`);
        return sendJson(res, FAIL_STATUS, {
            error: { message: "mock 故意失败，用来测重试分支" }
        });
    }

    sendJson(res, 200, {
        id: "mock-" + Date.now(),
        object: "chat.completion",
        model: payload?.model || "mock-model",
        choices: [
            { index: 0, message: { role: "assistant", content: answer }, finish_reason: "stop" }
        ],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    });
}

/**
 * 静态文件。
 * 必须先把内容读出来再发响应头 —— 反过来的话，读失败时 200 已经出去了，
 * catch 里再 writeHead(404) 就是 ERR_HTTP_HEADERS_SENT，而且会把进程带走。
 */
async function serveFile(res, relPath) {
    let body;
    try {
        body = await readFile(fileURLToPath(new URL(relPath, import.meta.url)));
    } catch {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 " + relPath);
        return;
    }
    res.writeHead(200, {
        "Content-Type": MIME[extname(relPath)] || "application/octet-stream"
    });
    res.end(body);
}

async function route(req, res) {
    const { pathname } = new URL(req.url, `http://localhost:${PORT}`);
    if (DELAY) await new Promise(done => setTimeout(done, DELAY));

    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
        });
        return res.end();
    }

    // 兼容用户把接口地址填成 http://localhost:8788/v1 的情况
    const apiPath = pathname.replace(/^\/v1(?=\/|$)/, "");
    if (apiPath === "/chat/completions" && req.method === "POST") {
        return handleChat(req, res);
    }
    if (apiPath === "/models") {
        return sendJson(res, 200, {
            object: "list",
            data: [{ id: "mock-fast" }, { id: "mock-smart" }]
        });
    }

    // 这条是整个服务的关键：脚本要求 pathname 全等 /user/exam
    if (pathname === "/user/exam") {
        return serveFile(res, "./user/exam.html");
    }
    if (pathname === "/") {
        res.writeHead(302, { Location: "/user/exam" });
        return res.end();
    }
    // 页面里那行 favicon 只是给 matchUrl() 看的，文件故意不存在，
    // 直接回 204 免得每次刷新都在终端和网络面板里留一条 404
    if (extname(pathname) === ".ico") {
        res.writeHead(204);
        return res.end();
    }
    // 其余按静态文件处理，顺手挡掉路径穿越
    if (pathname.includes("..")) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("400");
    }
    return serveFile(res, "." + pathname);
}

const server = createServer((req, res) => {
    // 处理函数是 async 的，抛出来的错不接会变成未捕获的 rejection 把进程干掉。
    // 本地测试服务没必要这么脆。
    route(req, res).catch(err => {
        console.error("[error]", req.method, req.url, err?.message || err);
        if (res.headersSent) return res.end();
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("500 " + (err?.message || "内部错误"));
    });
});

server.listen(PORT, () => {
    console.log(`考试测试页 → http://localhost:${PORT}/user/exam`);
    console.log(`假 AI 接口 → http://localhost:${PORT}`);
    console.log("配置面板里接口地址填上面这个，API Key 随便填，格式选 OpenAI 兼容 · Chat Completions");
});
