// 从 CHANGELOG.md 提取指定版本的章节，作为 GitHub Release 的正文。
// 用法：node scripts/release-notes.mjs v4.3.0
//
// 同时承担两道校验，任一不过就退出码非零、中止发布：
//   1. tag 与 package.json 的版本号必须一致（防止打错 tag）
//   2. CHANGELOG.md 里必须已经写好该版本的章节（防止发出空白说明）
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const resolve = (p) => fileURLToPath(new URL(p, import.meta.url));
const fail = (msg) => {
    console.error(`\n✗ ${msg}\n`);
    process.exit(1);
};

const tag = process.argv[2];
if (!tag) fail("用法：node scripts/release-notes.mjs <tag>，例如 v4.3.0");
if (!/^v\d+\.\d+\.\d+$/.test(tag)) fail(`tag 必须形如 v4.3.0，当前是 "${tag}"`);

const { version } = JSON.parse(readFileSync(resolve("../package.json"), "utf-8"));
if (tag !== `v${version}`) {
    fail(`tag 与 package.json 版本不一致：tag 是 ${tag}，package.json 是 ${version}`);
}

const changelog = readFileSync(resolve("../CHANGELOG.md"), "utf-8");
const lines = changelog.split(/\r?\n/);
const start = lines.findIndex((l) => l.trim() === `## ${tag}`);
if (start === -1) {
    fail(`CHANGELOG.md 里没有找到 "## ${tag}" 这一节，请先补写该版本的更新说明`);
}

const rest = lines.slice(start + 1);
const end = rest.findIndex((l) => l.startsWith("## "));
const body = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();

if (!body) fail(`"## ${tag}" 这一节是空的，请先补写更新内容`);

process.stdout.write(body + "\n");
