import { CONFIG } from "../config.js";
import { ConfigManager } from "../core/config-manager.js";
import {
    PROVIDERS,
    PROTOCOLS,
    PROTOCOL_ORDER,
    getBaseUrlHint,
    getProvider,
    getProvidersForProtocol
} from "../ai/index.js";
import brandIcon from "../assets/icon.png";
import qrWechat from "../assets/donate-wechat.webp";
import qrAlipay from "../assets/donate-alipay.webp";

/** HTML 转义，配置里的值会直接拼进模板 */
function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** 搜题接口配置区，具体联动在 ui-manager.js 中绑定。 */
function renderAiConfig() {
    const currentId = ConfigManager.aiProvider;
    const provider = getProvider(currentId);
    const settings = ConfigManager.getAiSettings(currentId);
    const currentProtocol = settings.protocolId;
    const providerList = getProvidersForProtocol(currentProtocol);

    const providerOptions = providerList
        .map(id => `<option value="${id}" ${id === currentId ? "selected" : ""}>${esc(PROVIDERS[id].label)}</option>`)
        .join("");
    const protocolOptions = PROTOCOL_ORDER
        .map(id => `<option value="${id}" ${id === currentProtocol ? "selected" : ""}>${esc(PROTOCOLS[id]?.label || id)}</option>`)
        .join("");

    return `
    <section class="sk-config-section sk-config-pane" id="sk-config-ai" role="tabpanel" aria-labelledby="sk-config-nav-ai" hidden>
        <div class="sk-section-heading">
            <h3 id="sk-ai-heading">AI 搜题服务</h3>
            <span class="sk-section-tag">独立配置</span>
        </div>
        <div class="sk-config-grid">
            <div class="sk-config-item">
                <label for="cfg-ai-protocol">接口格式</label>
                <select id="cfg-ai-protocol">${protocolOptions}</select>
                <div class="sk-config-hint">同一格式的服务商共用请求逻辑</div>
            </div>
            <div class="sk-config-item">
                <label for="cfg-ai-provider">服务商预设</label>
                <select id="cfg-ai-provider">${providerOptions}</select>
            </div>
            <div class="sk-config-item sk-config-item--wide">
                <label for="cfg-ai-baseurl">接口地址</label>
                <input type="text" id="cfg-ai-baseurl" value="${esc(settings.baseUrl)}" placeholder="${esc(provider.baseUrl || "例如 https://你的域名/v1")}">
                <div class="sk-config-hint" id="cfg-ai-baseurl-hint">${esc(getBaseUrlHint(currentId, currentProtocol))}</div>
            </div>
            <div class="sk-config-item sk-config-item--wide">
                <label for="cfg-ai-model" id="cfg-ai-model-label">模型名称</label>
                <div class="sk-ai-model-input-row">
                    <input type="text" id="cfg-ai-model" value="${esc(settings.model)}" placeholder="${esc(provider.model || "请填写模型名称")}">
                    <button type="button" class="sk-log-btn sk-btn-secondary" id="cfg-ai-fetch-models">获取模型</button>
                </div>
                <select id="cfg-ai-model-select" class="sk-ai-model-select" aria-label="可用模型列表" hidden>
                    <option value="">请选择模型</option>
                </select>
                <div class="sk-config-hint sk-inline-result" id="cfg-ai-model-list-result" aria-live="polite"></div>
                <div class="sk-config-hint" id="cfg-ai-model-hint">${esc(provider.modelHint || "")}</div>
            </div>
            <div class="sk-config-item sk-config-item--wide">
                <label for="cfg-apikey" id="cfg-ai-key-label">${esc(provider.keyLabel || "API Key")}</label>
                <input type="password" id="cfg-apikey" value="${esc(settings.apiKey)}" placeholder="请输入 API Key" autocomplete="off">
                <div class="sk-config-hint">密钥仅保存在本地，并只发送给当前接口</div>
            </div>
            <div class="sk-config-item">
                <label for="cfg-ai-retry">失败重试次数</label>
                <input type="number" id="cfg-ai-retry" min="0" max="5" value="${ConfigManager.aiRetry}">
            </div>
        </div>
        <div class="sk-config-actions sk-ai-actions">
            <button type="button" class="sk-log-btn sk-btn-secondary" id="cfg-ai-test">测试接口</button>
            <span id="cfg-ai-test-result" class="sk-inline-result" aria-live="polite"></span>
        </div>
    </section>`;
}

/** 日志工具栏。登录页按 href 判断，避免 query 导致漏判。 */
export function renderToolbar() {
    const href = window.location.href;
    const pathname = window.location.pathname;
    return `
<button type="button" class="sk-log-btn sk-log-clear">清空日志</button>
${href.includes("/login") ? '<button type="button" class="sk-log-btn sk-btn-secondary sk-recaptcha">重新识别验证码</button>' : ''}
${pathname === "/user/exam" ? '<button type="button" class="sk-log-btn sk-btn-primary sk-exam-start">开始搜题</button><button type="button" class="sk-log-btn sk-btn-danger sk-exam-stop">停止搜题</button>' : ''}
`;
}

/** 控制台面板主体 HTML。 */
export function renderPanel() {
    const urls = ConfigManager.get("刷课配置.urls", CONFIG.DEFAULT.URLS).split("|").join("\n");

    return `
<header class="sk-log-header">
    <div class="sk-log-topbar">
        <div class="sk-log-brand">
            <img class="sk-brand-mark" src="${brandIcon}" alt="">
            <span class="sk-brand-copy">
                <strong class="sk-log-title">英华刷课助手</strong>
                <span class="sk-log-subtitle">自动学习考试控制台</span>
            </span>
        </div>
        <div class="sk-log-meta">
            <span class="sk-runtime-badge"><i aria-hidden="true"></i>运行中</span>
            <span class="sk-log-version">v${CONFIG.VERSION}</span>
            <button type="button" class="sk-log-btn sk-log-close" aria-label="收起控制台" title="收起控制台">
                <span aria-hidden="true">×</span>
            </button>
        </div>
    </div>
    <nav class="sk-log-actions" role="tablist" aria-label="控制台页面">
        <button type="button" class="sk-log-btn sk-tab-btn active" id="sk-tab-btn-log" data-tab="log" role="tab" aria-selected="true" aria-controls="sk-tab-log">日志</button>
        <button type="button" class="sk-log-btn sk-tab-btn" id="sk-tab-btn-config" data-tab="config" role="tab" aria-selected="false" aria-controls="sk-tab-config" tabindex="-1">配置</button>
        <button type="button" class="sk-log-btn sk-tab-btn" id="sk-tab-btn-tutorial" data-tab="tutorial" role="tab" aria-selected="false" aria-controls="sk-tab-tutorial" tabindex="-1">教程</button>
        <button type="button" class="sk-log-btn sk-tab-btn" id="sk-tab-btn-donate" data-tab="donate" role="tab" aria-selected="false" aria-controls="sk-tab-donate" tabindex="-1">支持</button>
        <button type="button" class="sk-log-btn sk-tab-btn" id="sk-tab-btn-about" data-tab="about" role="tab" aria-selected="false" aria-controls="sk-tab-about" tabindex="-1">说明</button>
    </nav>
</header>

<section class="sk-tab-content active" id="sk-tab-log" role="tabpanel" aria-labelledby="sk-tab-btn-log">
    <div class="sk-log-overview">
        <div class="sk-current-state">
            <span class="sk-overline">当前状态</span>
            <strong id="sk-console-status">刷课助手准备就绪</strong>
        </div>
        <span class="sk-log-counter"><strong id="sk-log-count">0</strong> 条记录</span>
    </div>
    <div class="sk-log-toolbar">${renderToolbar()}</div>
    <div class="sk-log-content" role="log" aria-label="运行日志" aria-live="polite" aria-relevant="additions">
        <div class="sk-log-empty">等待任务日志</div>
    </div>
</section>

<section class="sk-tab-content" id="sk-tab-config" role="tabpanel" aria-labelledby="sk-tab-btn-config" hidden>
    <div class="sk-config-banner"><span aria-hidden="true"></span>保存后将自动刷新页面并应用设置</div>

    <nav class="sk-config-nav" role="tablist" aria-label="配置分类">
        <button type="button" class="sk-log-btn sk-config-nav-btn active" id="sk-config-nav-vision" data-config-pane="vision" role="tab" aria-selected="true" aria-controls="sk-config-vision">视觉模型</button>
        <button type="button" class="sk-log-btn sk-config-nav-btn" id="sk-config-nav-ai" data-config-pane="ai" role="tab" aria-selected="false" aria-controls="sk-config-ai" tabindex="-1">AI 搜题</button>
        <button type="button" class="sk-log-btn sk-config-nav-btn" id="sk-config-nav-auto" data-config-pane="auto" role="tab" aria-selected="false" aria-controls="sk-config-auto" tabindex="-1">自动化</button>
        <button type="button" class="sk-log-btn sk-config-nav-btn" id="sk-config-nav-platform" data-config-pane="platform" role="tab" aria-selected="false" aria-controls="sk-config-platform" tabindex="-1">平台范围</button>
    </nav>

    <section class="sk-config-section sk-config-pane active" id="sk-config-vision" role="tabpanel" aria-labelledby="sk-config-nav-vision">
        <div class="sk-section-heading">
            <h3 id="sk-vision-heading">视觉识别模型</h3>
            <div class="sk-section-control">
                <span>自动导入模型</span>
                <label class="sk-switch">
                    <input type="checkbox" id="cfg-auto-import" aria-label="自动导入视觉模型" ${ConfigManager.autoImportModels ? "checked" : ""}>
                    <span class="sk-slider" aria-hidden="true"></span>
                </label>
            </div>
        </div>
        <div class="sk-model-status">
            <div class="sk-model-state"><span>识别模型</span><strong id="status-onnx" class="sk-status-value">检测中...</strong></div>
            <div class="sk-model-state"><span>字符集</span><strong id="status-json" class="sk-status-value">检测中...</strong></div>
            <div class="sk-model-state"><span>推理引擎</span><strong id="status-wasm" class="sk-status-value">检测中...</strong></div>
        </div>
        <div class="sk-model-import-actions">
            <button type="button" class="sk-log-btn" id="btn-import-onnx">导入模型</button>
            <button type="button" class="sk-log-btn" id="btn-import-json">导入字符集</button>
            <button type="button" class="sk-log-btn" id="btn-import-wasm">导入 WASM</button>
            <input type="file" id="file-import-onnx" accept=".onnx" hidden>
            <input type="file" id="file-import-json" accept=".json" hidden>
            <input type="file" id="file-import-wasm" accept=".wasm" hidden>
        </div>
    </section>

    ${renderAiConfig()}

    <section class="sk-config-section sk-config-pane" id="sk-config-auto" role="tabpanel" aria-labelledby="sk-config-nav-auto" hidden>
        <div class="sk-section-heading">
            <h3 id="sk-auto-heading">自动化设置</h3>
        </div>
        <div class="sk-config-grid">
            <div class="sk-config-item sk-config-item--wide">
                <label for="cfg-timeout">页面停留上限（分钟，0 为禁用）</label>
                <input type="number" id="cfg-timeout" value="${ConfigManager.timeoutMinutes}">
            </div>
        </div>
        <div class="sk-setting-list">
            <div class="sk-setting-row">
                <label for="cfg-auto-login">自动识别登录验证码</label>
                <label class="sk-switch">
                    <input type="checkbox" id="cfg-auto-login" ${ConfigManager.autoLoginCaptcha ? "checked" : ""}>
                    <span class="sk-slider" aria-hidden="true"></span>
                </label>
            </div>
            <div class="sk-setting-row">
                <label for="cfg-auto-fill-account">自动填写账号和密码</label>
                <label class="sk-switch">
                    <input type="checkbox" id="cfg-auto-fill-account" ${ConfigManager.autoFillAccount ? "checked" : ""}>
                    <span class="sk-slider" aria-hidden="true"></span>
                </label>
            </div>
        </div>
        <div class="sk-config-reveal">
            <div class="sk-note" id="cfg-auto-fill-tip" style="display:${ConfigManager.autoFillAccount ? 'block' : 'none'};">
                所有已启用平台将共用这一组账号和密码，请确认各站点凭据一致。
            </div>
            <div class="sk-config-grid">
                <div class="sk-config-item" id="cfg-auto-fill-fields" style="display:${ConfigManager.autoFillAccount ? 'block' : 'none'};">
                    <label for="cfg-login-account">账号</label>
                    <input type="text" id="cfg-login-account" value="${esc(ConfigManager.loginAccount)}" placeholder="请输入账号" autocomplete="username">
                </div>
                <div class="sk-config-item" id="cfg-auto-fill-fields-pwd" style="display:${ConfigManager.autoFillAccount ? 'block' : 'none'};">
                    <label for="cfg-login-password">密码</label>
                    <input type="password" id="cfg-login-password" value="${esc(ConfigManager.loginPassword)}" placeholder="请输入密码" autocomplete="current-password">
                </div>
            </div>
        </div>
    </section>

    <section class="sk-config-section sk-config-pane" id="sk-config-platform" role="tabpanel" aria-labelledby="sk-config-nav-platform" hidden>
        <div class="sk-section-heading">
            <h3 id="sk-platform-heading">平台范围</h3>
        </div>
        <div class="sk-config-item">
            <label for="cfg-urls">启用平台域名（每行一个）</label>
            <textarea id="cfg-urls" rows="5">${esc(urls)}</textarea>
        </div>
    </section>

    <div class="sk-config-actions sk-config-actions--sticky">
        <button type="button" class="sk-log-btn sk-btn-primary sk-save-button" id="cfg-save">保存全部配置</button>
    </div>
</section>

<section class="sk-tab-content" id="sk-tab-tutorial" role="tabpanel" aria-labelledby="sk-tab-btn-tutorial" hidden>
    <div class="sk-doc">
        <section class="sk-doc-section">
            <h3>常见问题与提示</h3>
            <ol>
                <li><b>平台适配：</b>网站界面需与 <a target="_blank" rel="noopener noreferrer" class="sk-link" href="https://cdcass.taiskeji.com/">成都文理学院在线学堂</a> 相近，学习通、智慧树等平台无法使用。</li>
                <li><b>视频无法加载：</b>先关闭代理或切换网络；仍无法加载时，通常是课程资源本身异常。</li>
                <li><b>多端运行：</b>电脑、手机和平板需先安装油猴或脚本猫。脚本未运行时可查看 <a target="_blank" rel="noopener noreferrer" class="sk-link" href="https://docs.scriptcat.org/docs/use/QA/#%E8%84%9A%E6%9C%AC%E4%B8%8D%E7%94%9F%E6%95%88">脚本不生效说明</a>。</li>
                <li><b>版本冲突：</b>请删除或禁用旧版刷课脚本。</li>
                <li><b>学时未变化：</b>播放视频时将浏览器保持在前台。</li>
                <li><b>补刷不跳转：</b>请在浏览器设置中允许当前网站打开弹出式窗口。</li>
                <li><b>验证码识别：</b>首次使用需下载机器视觉模型，清除浏览器缓存后需要重新下载。</li>
            </ol>
        </section>
        <section class="sk-doc-section">
            <h3>考试搜题</h3>
            <ol>
                <li><b>答案校验：</b>AI 生成内容不能保证完全正确，完成后请人工复核。</li>
                <li><b>接口格式：</b>支持 OpenAI Chat、OpenAI Responses、Claude Messages 与 Gemini generateContent。</li>
                <li><b>服务商预设：</b>支持火山方舟、OpenAI、Claude、Gemini、Grok、DeepSeek 及兼容中转站，各厂商配置独立保存。</li>
                <li><b>模型列表：</b>填写接口地址和 API Key 后，可获取接口提供的模型；不支持列表接口时仍可手动填写。</li>
                <li><b>连接测试：</b>开始搜题前可先在配置页测试接口。</li>
                <li><b>火山方舟：</b>有免费次数，因此以火山方舟为例 <a target="_blank" rel="noopener noreferrer" class="sk-link" href="https://kdocs.cn/l/clJtV1RU8GDe">接入点与密钥</a><span class="sk-link-separator">/</span><a target="_blank" rel="noopener noreferrer" class="sk-link" href="https://pan.baidu.com/s/1YMk6Fqv6Bmr1jU0FlQXqNQ?pwd=6666">老视频教程</a></li>
            </ol>
        </section>
        <section class="sk-doc-section">
            <h3>交流与支持</h3>
            <p>视频教程与问题反馈可加入 <a target="_blank" rel="noopener noreferrer" class="sk-link" href="https://qm.qq.com/q/JVXS1pu54O">交流 QQ 群</a>。</p>
        </section>
    </div>
</section>

<section class="sk-tab-content" id="sk-tab-donate" role="tabpanel" aria-labelledby="sk-tab-btn-donate" hidden>
    <div class="sk-doc sk-doc-center">
        <div class="sk-support-intro">
            <span class="sk-overline">自愿支持</span>
            <h3>请作者点一份拼好饭</h3>
            <p>脚本完全免费，感谢你支持服务器与后续维护。</p>
        </div>
        <div class="sk-donate-grid">
            <figure class="sk-donate-item">
                <img alt="微信收款码" src="${qrWechat}">
                <figcaption>微信</figcaption>
            </figure>
            <figure class="sk-donate-item">
                <img alt="支付宝收款码" src="${qrAlipay}">
                <figcaption>支付宝</figcaption>
            </figure>
        </div>
    </div>
</section>

<section class="sk-tab-content" id="sk-tab-about" role="tabpanel" aria-labelledby="sk-tab-btn-about" hidden>
    <div class="sk-doc">
        <section class="sk-doc-section">
            <span class="sk-overline">使用条款</span>
            <h3>英华学堂全系列刷课助手</h3>
            <ol>
                <li>使用本脚本即表示同意本使用条款；不同意时请勿使用。</li>
                <li>脚本仅用于学习研究，下载后 24 小时内应从设备中删除相关内容。</li>
                <li>请勿将脚本用于任何商业或非法目的，违规后果由使用者承担。</li>
                <li>作者不对脚本错误或使用脚本造成的损失、封禁与限制负责。</li>
                <li>如有内容侵犯你的权益，请及时联系作者。</li>
                <li>直接或间接使用、查看脚本的用户均应仔细阅读本条款。</li>
                <li>作者保留修改或补充条款的权利；使用、复制或修改脚本即视为接受。</li>
            </ol>
        </section>
    </div>
</section>
`;
}
