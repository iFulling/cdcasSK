# 本地考试搜题测试环境

给 `src/features/exam-solver.js` 用的离线测试场。真考试限次、点一下「保存修改」就是真提交，
所以搜题这条链路只能在自己造的页面上跑。

```
mock/
├── server.mjs        零依赖服务：挂页面 + 冒充 AI 接口
└── user/exam.html    仿真考试页，10 道题
```

页面结构照泰诗科技那份真实考试页扒的，改成了「答题中」状态（去掉 `disabled`，补上
真实页面上才有的 `保存修改` / `继续下一题` 按钮）。

## 用法

```bash
node mock/server.mjs
```

然后：

1. 浏览器打开 <http://localhost:8788/user/exam>
2. 配置面板 → AI 搜题：接口地址填 `http://localhost:8788`，API Key 随便填（不能空），
   接口格式选「OpenAI 兼容 · Chat Completions」，模型名随便填或点「获取模型列表」
3. 点页面上脚本面板里的「开始搜题」
4. 跑完点页面顶部的「校验答案」看结果表

一轮 10 道题约 40 秒（每题固定 `pause(1)` + `pause(3)`）。

## 用真实 AI 接口测

页面照样从这个服务打开（三道门的要求不变），只是配置面板里填真实厂商的地址和 Key。
这时候要注意：

**「校验答案」的结论没有意义。** 期望值是照 `server.mjs` 里写死的返回标的，
题目本身是校规、宿管这类内容，没有客观答案，真模型给什么都算不上错。
换真接口时只看流程：题号有没有逐题推进、每题是否都勾上了东西、脚本日志里有没有报错。

要判断解析逻辑对不对，还是用 mock 接口跑，两者不冲突 —— 想验证真实模型的返回能不能被
正确解析时，把它实际回的那句话抄进 `ANSWERS` 里，再用 mock 接口复现一遍就行。

## 为什么必须走这个服务，不能直接双击 html

三道门，缺一道脚本就不启动：

| 门 | 位置 | 要求 | 本地怎么满足 |
| --- | --- | --- | --- |
| 协议 | `vite.config.ts` 的 `@match` | 只有 `*://`，不含 `file://` | 必须 http 访问 |
| 域名 | `src/index.js` 的 `matchUrl()` | hostname 在配置列表里，**或** favicon 地址含 `ruren` 等关键词 | 页面里那行 `<link rel="shortcut icon" href="/static/favicon/ruren.ico">` |
| 路径 | `src/app.js` 的 `_checkUrl()` | `pathname` 全等 `/user/exam` | `server.mjs` 手写的这条路由 |

路径这道最容易踩：带尾斜杠或 `.html` 后缀都进不了搜题模式，而且
`src/ui/panel-template.js` 里「开始搜题」按钮用的是同一个判断，路径不对连按钮都没有。
所以不能拿 `python -m http.server` 顶替。

## 题目清单

假答案写在 `server.mjs` 的 `ANSWERS`（键是题号），期望结果写在 `user/exam.html`
每个 `topic-item` 的 `data-expect` / `data-actual` 上。

| 题 | 题型 | 接口返回 | 期望 | 考察点 |
| --- | --- | --- | --- | --- |
| 1 | 单选 | `A` | A | 最简路径 |
| 2 | 单选 | `答案：B` | B | `labelled` 分支 |
| 3 | 单选 | `<think>A 和 B 明显不对，D 太绝对，应该是 C</think>C` | C | `normalizeText` 剥 think；不剥会解析成 `ABDC` |
| 4 | 单选 | `我认为应该选 D。` | D | `isolated` 分支 |
| 5 | 单选 | `C` | C | 选项正文含大写字母，回归用例 |
| 6 | 多选 | `AB` | AB | 多选最简路径 |
| 7 | 多选 | `A、D` | AD | 顿号分隔 + 选项正文含大写字母 |
| 8 | 判断 | `B` | B | 两个选项 |
| 9 | 单选 | 一段纯中文，没有字母 | 不选 | 解析失败 → catch → 跳过 |
| 10 | 简答 | 不发请求 | 不选 | `data-type=4` 未知题型跳过 |

第 10 题验证的是「不应该发生的事」：`server.mjs` 的终端里不该出现第 10 题的请求日志。

## 第 5、7 题是回归用例

这两题的选项正文里含大写字母，专门盯着一个修掉的缺陷。

早先 `_handleQuestion` 用 `label.innerText.includes(字母)` 挑选项，选项正文里出现
大写 A–H 就会误中。两种题型的后果不一样，所以各留了一条：

- 第 5 题单选：选项 D 正文含 `C 区`。答案是 C，但 D 也被命中，radio 同组互斥，
  靠后的 D 把正确的 C 顶掉 —— **日志打的是 C，页面上选的是 D**，直接答错。
- 第 7 题多选：选项 B 正文含 `DNS`。答案是 AD，B 被 D 命中，checkbox 不互斥，
  于是勾成 ABD —— 多选错一个即整题判错，而日志显示的答案是对的，很难看出来。

现在选项号改成优先从 `input.value` 取、退到 `.num`、最后才看文字开头，
两题都应该显示「通过」。要是哪天又变红，说明选项号的取法被改回文本匹配了。

校验面板还留着 `data-actual` 这个字段：某个用例明知修不了、只想盯着它别继续恶化时，
把实际结果写进去，那一行就会标成橙色的「已知缺陷（已复现）」而不是红色的「失败」。

## 两条跳题分支

`_nextQuestion` 靠 `saveBtn.offsetParent !== null` 二选一，对应平台上两种状态：
还有题没答时只显示「继续下一题」，全部答过一遍后才显示「保存修改」。
页面顶部的「切换分支」按钮就是切这个，两条都该跑一遍。

- 继续下一题：脚本点按钮，页面自己跳（复刻了平台 `successForm` 里 1 秒延迟后 `pageNext(true)` 的行为）
- 保存修改：脚本点保存，然后自己点题号区的 `a` 跳题

搜题每题耗时 4 秒，远大于那 1 秒延迟，所以正常不会抢跑；如果哪天把 `Utils.pause`
调小了，这里就是第一个会暴露问题的地方。

## 测异常路径

```bash
# 一直返回 429，测重试次数用完后的报错
MOCK_FAIL=429 node mock/server.mjs

# 只失败前 2 次，测重试成功（配置面板的重试次数要 ≥ 2）
MOCK_FAIL=429 MOCK_FAIL_TIMES=2 node mock/server.mjs

# 每个请求延迟 61 秒，测 AiClient 的 60 秒超时
MOCK_DELAY=61000 node mock/server.mjs

# 换端口
PORT=9000 node mock/server.mjs
```

`extractApiError` 的状态码提示（401/404/429 等）也可以用 `MOCK_FAIL` 挨个试。

## 加题 / 改题

1. 在 `user/exam.html` 题号区补一个 `li`（`data-index`、`id`、`onclick` 的序号要连续）
2. 复制一个 `topic-item`，改 `id`、`.head` 里的题号、`data-type`、`data-expect`
3. 在 `server.mjs` 的 `ANSWERS` 里按新题号加一条

有两处不显眼但别动：

- 选项里的 `span` 在 CSS 里是 `display: block`（照抄平台 `exam.css`）。
  这会让 `innerText` 长成 `A\n.\n警告`，`exam-solver.js` 的 `.replace(/\n\.\n/g, ".")`
  就是为它写的；改成 inline 那行代码就测不到了。
- 每道题各自包一个 `<form>`。radio 分组以 form 为界，靠它十道题的 `name="answer"`
  才不会互相顶掉，同时也和真实页面一致。

## 不需要页面就能测的部分

`extractChoiceAnswer` 是导出的纯函数，没有 DOM 和网络依赖。模型返回格式的解析全在它里面，
也是换模型后最容易崩的地方，直接用 node 跑比开页面快得多。项目目前没有测试框架，
真要补单测的话从这个函数开始。
