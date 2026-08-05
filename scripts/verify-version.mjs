// 构建后自检：产物里的三处版本号必须和 package.json 完全一致。
// 这个项目历史上出现过 package.json 写 4.2.0、脚本头写 4.2 的情况，
// 版本号一旦对不上，ScriptCat 会拒绝上传或者用户收不到更新，所以这里卡死。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const resolve = (p) => fileURLToPath(new URL(p, import.meta.url));
const { version } = JSON.parse(readFileSync(resolve("../package.json"), "utf-8"));
const dist = readFileSync(resolve("../dist/cdcasSK.user.js"), "utf-8");

const checks = [
    ["元数据头 @version", /^\/\/ @version\s+(\S+)$/m],
    ["CONFIG.VERSION", /VERSION:\s*"([^"]+)"/],
];

const failed = [];
for (const [name, re] of checks) {
    const found = dist.match(re)?.[1];
    if (found !== version) failed.push(`  ${name}: 产物是 ${found ?? "(没找到)"}，package.json 是 ${version}`);
}

if (failed.length) {
    console.error(`\n✗ 版本号不一致：\n${failed.join("\n")}\n`);
    process.exit(1);
}
console.log(`✓ 版本号一致：v${version}`);
