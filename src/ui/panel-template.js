import { CONFIG } from "../config.js";
import { ConfigManager } from "../core/config-manager.js";
import qrWechat from "../assets/donate-wechat.webp";
import qrAlipay from "../assets/donate-alipay.webp";

/**
 * 日志工具栏 HTML —— 面板初次创建和路由切换后都用这一份，避免两边判定不一致。
 * 登录页统一按 href 判断（登录地址常带 query，只看 pathname 会漏）。
 */
export function renderToolbar() {
    const href = window.location.href;
    const pathname = window.location.pathname;
    return `
<button class="sk-log-btn sk-log-clear">清空日志</button>
${href.includes("/login") ? '<button class="sk-log-btn sk-recaptcha" style="margin-left:6px;">重新识别验证码</button>' : ''}
${pathname === "/user/exam" ? '<button class="sk-log-btn sk-exam-start" style="margin-left:6px;background:#0e639c;">开始搜题</button><button class="sk-log-btn sk-exam-stop" style="margin-left:6px;background:#f48771;color:#000;">停止搜题</button>' : ''}
`;
}

/** 控制台面板主体 HTML（原 UIManager._createLogPopup 内联模板） */
export function renderPanel() {
    return `
<div class="sk-log-header">
    <span class="sk-log-title">刷课助手控制台 v${CONFIG.VERSION}</span>
    <div class="sk-log-actions">
        <button class="sk-log-btn sk-tab-btn active" data-tab="log">日志</button>
        <button class="sk-log-btn sk-tab-btn" data-tab="config">配置</button>
        <button class="sk-log-btn sk-tab-btn" data-tab="tutorial">教程</button>
        <button class="sk-log-btn sk-tab-btn" data-tab="donate">捐赠</button>
        <button class="sk-log-btn sk-tab-btn" data-tab="about">说明</button>
        <button class="sk-log-btn sk-log-close">✕</button>
    </div>
</div>
<div class="sk-tab-content active" id="sk-tab-log">
    <div class="sk-log-toolbar">${renderToolbar()}</div>
    <div class="sk-log-content"></div>
</div>
<div class="sk-tab-content" id="sk-tab-config">
    <div class="sk-config-item" style="color:#4ec9b0; font-weight:bold; text-align:center;">
        修改完配置记得保存
    </div>
    <div class="sk-config-item" style="display: flex; flex-direction: column; gap: 12px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; background: #252526; padding: 8px 12px; border-radius: 6px; border: 1px solid #3c3c3c;">
            <span style="color:#ccc;">模型：<span id="status-onnx" style="color:gray; font-weight:bold;">检测中...</span></span>
            <span style="color:#ccc;">字符集：<span id="status-json" style="color:gray; font-weight:bold;">检测中...</span></span>
            <span style="color:#ccc;">引擎：<span id="status-wasm" style="color:gray; font-weight:bold;">检测中...</span></span>
        </div>
        
        <div style="display: flex; justify-content: space-between; gap: 10px;">
            <button class="sk-log-btn" id="btn-import-onnx" style="background-color: #0e639c; flex: 1; padding: 8px 0;">导入模型</button>
            <button class="sk-log-btn" id="btn-import-json" style="background-color: #0e639c; flex: 1; padding: 8px 0;">导入字符集</button>
            <button class="sk-log-btn" id="btn-import-wasm" style="background-color: #4ec9b0; color: #000; flex: 1; padding: 8px 0; font-weight: bold;">导入WASM</button>
            
            <input type="file" id="file-import-onnx" accept=".onnx" style="display:none">
            <input type="file" id="file-import-json" accept=".json" style="display:none">
            <input type="file" id="file-import-wasm" accept=".wasm" style="display:none">
        </div>
    </div>
    <div class="sk-config-item" style="display: flex; align-items: center; justify-content: space-between;">
        <label style="margin-bottom: 0;">自动导入视觉模型：</label>
        <label class="sk-switch">
            <input type="checkbox" id="cfg-auto-import" ${ConfigManager.autoImportModels ? "checked" : ""}>
            <span class="sk-slider"></span>
        </label>
    </div>
    <div class="sk-config-item">
        <label>页面停留最大时间，小于等于0则禁用（分钟）：</label>
        <input type="number" id="cfg-timeout" value="${ConfigManager.timeoutMinutes}">
    </div>
    <div class="sk-config-item">
        <label>火山引擎接入点 ID（获取 ID 看教程）：</label>
        <input type="text" id="cfg-endpoint" value="${ConfigManager.endpointId}">
    </div>
    <div class="sk-config-item">
        <label>火山引擎 API Key（获取 API Key 看教程）：<br /></label>
        <input type="text" id="cfg-apikey" value="${ConfigManager.apiKey}">
    </div>
    <div class="sk-config-item" style="display: flex; align-items: center; justify-content: space-between;">
        <label style="margin-bottom: 0;">自动识别登录验证码：</label>
        <label class="sk-switch">
            <input type="checkbox" id="cfg-auto-login" ${ConfigManager.autoLoginCaptcha ? "checked" : ""}>
            <span class="sk-slider"></span>
        </label>
    </div>
    <div class="sk-config-item" style="display: flex; align-items: center; justify-content: space-between;">
        <label style="margin-bottom: 0;">自动填写账号和密码：</label>
        <label class="sk-switch">
            <input type="checkbox" id="cfg-auto-fill-account" ${ConfigManager.autoFillAccount ? "checked" : ""}>
            <span class="sk-slider"></span>
        </label>
    </div>
    <div class="sk-config-item" id="cfg-auto-fill-tip" style="display:${ConfigManager.autoFillAccount ? 'block' : 'none'}; background:#1e1e1e; border:1px solid #3c3c3c; color:#d4d4d4; padding:10px 12px; border-radius:6px; line-height:1.6;">
        自动填写一个账号，而且所有网站都会填写，所以尽量保证所有网站的账号密码一致。
    </div>
    <div class="sk-config-item" id="cfg-auto-fill-fields" style="display:${ConfigManager.autoFillAccount ? 'block' : 'none'};">
        <label>账号：</label>
        <input type="text" id="cfg-login-account" value="${ConfigManager.loginAccount}" placeholder="请输入账号">
    </div>
    <div class="sk-config-item" id="cfg-auto-fill-fields-pwd" style="display:${ConfigManager.autoFillAccount ? 'block' : 'none'};">
        <label>密码：</label>
        <input type="text" id="cfg-login-password" value="${ConfigManager.loginPassword}" placeholder="请输入密码">
    </div>
    <div class="sk-config-item">
        <label>启用平台域名（每行一个）：</label>
        <textarea id="cfg-urls" rows="5">${ConfigManager.get("刷课配置.urls", CONFIG.DEFAULT.URLS).split('|').join('\n')}</textarea>
    </div>
    <div class="sk-config-actions">
        <button class="sk-log-btn primary" id="cfg-save">保存配置</button>
    </div>
</div>
<div class="sk-tab-content" id="sk-tab-tutorial">
    <div class="sk-log-content" style="padding: 15px; line-height: 1.6; color: #fff;">
        <h4 style="margin-top: 0; color: #4ec9b0;">常见问题与提示</h4>
        <p>1. <b>关于平台</b>：网站界面要和 <a target='_blank' href='https://cdcas.yuruixxkj.com/' style="color: #4ec9b0; text-decoration: underline;">成都文理学院在线学堂</a> 差不多，相差太大就不适配。如学习通、智慧树等平台就无法使用。</p>
        <p>2. <b>没有视频</b>：如果视频加载不出来，可以试试关闭代理。如果还是没有视频，就切换网络。如果还是没有，那就是网课的问题。</p>
        <p>3. <b>多端运行</b>：本脚本在电脑、手机、平板都能运行，但是需要先安装油猴或脚本猫才能运行。如果不起作用，可以看看 <a target='_blank' href='https://docs.scriptcat.org/docs/use/QA/#%E8%84%9A%E6%9C%AC%E4%B8%8D%E7%94%9F%E6%95%88' style="color: #4ec9b0; text-decoration: underline;">脚本不生效</a>。</p>
        <p>4. <b>版本冲突</b>：请确保已删除或禁用旧版本的刷课脚本。</p>
        <p>5. <b>保持前台</b>：如果发现<b>学时没变</b>，播放视频时将浏览器置于前台运行。</p>
        <p>6. <b>补刷不跳转</b>：浏览器默认拦截弹出式窗口，需要浏览器设置里允许。</p>
        <p>7. <b>验证码识别</b>：验证码识别需要下载<b>机器视觉模型</b>，每个网站需要下载一次。如果下载比较慢，可以试试科学上网。如果清除了浏览器缓存就需要重新下载。</p>
        
        <h4 style="margin-top: 15px; color: #4ec9b0;">考试搜题说明</h4>
        <p>1. <b>AI 提示</b>：答案由 AI 生成，<b>不能保证 100% 正确</b>。分数高低与作者无关，建议搜完后人工复核。</p>
        <p>2. <b>配置教程</b>：
            <a target='_blank' href='https://pan.baidu.com/s/1YMk6Fqv6Bmr1jU0FlQXqNQ?pwd=6666' style="color: #4ec9b0; text-decoration: underline;">视频教程</a> | 
            <a target='_blank' href='https://kdocs.cn/l/clJtV1RU8GDe' style="color: #4ec9b0; text-decoration: underline;">获取搜题接入点ID和API Key</a>
        </p>
        <h4 style="margin-top: 15px; color: #4ec9b0;">交流与支持</h4>
        <p>更多视频教程及问题反馈，欢迎加入脚本交流群：
            <a target='_blank' href='https://qm.qq.com/q/JVXS1pu54O' style="color: #4ec9b0; text-decoration: underline;">点击加入 QQ 群</a>
        </p>
    </div>
</div>
<div class="sk-tab-content" id="sk-tab-donate">
    <div class="sk-log-content" style="padding: 15px; text-align: center; color: #fff;">
        <h4 style="margin-top: 0; color: #4ec9b0; margin-bottom: 5px;">🥣 请作者点一份拼好饭</h4>
        <p style="margin-bottom: 5px;">二维码是自愿捐赠！</p>
        <p style="margin-bottom: 5px;">插件完全免费，但是依然需要一台服务器来处理数据。</p>
        <p style="margin-bottom: 20px;">如果您觉得它对您有所帮助，欢迎打赏支持后续开发维护！</p>
        
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 10px;">
            <div class="sk-donate-item">
                <img alt="微信" style="width: 150px; height: 210px; border-radius: 8px;" src="${qrWechat}">
                <p>微信</p>
            </div>
            <div class="sk-donate-item">
                <img alt="支付宝" style="width: 150px; height: 210px; border-radius: 8px;" src="${qrAlipay}">
                <p>支付宝</p>
            </div>
        </div>
    </div>
</div>
<div class="sk-tab-content" id="sk-tab-about">
    <div class="sk-log-content" style="padding: 15px; line-height: 1.6; color: #fff;">
        <h4 style="text-align: center; margin-bottom: 10px; color: #fff;">英华学堂全系列刷课助手（原为成都文理学院刷课助手） 使用说明</h4>
        <p>1. 您使用本插件，即表示您同意本使用条款；如果您不同意，请勿使用本插件。</p>
        <p>2. 此脚本仅用于学习研究，您必须在下载后24小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。</p>
        <p>3. 请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。</p>
        <p>4. 本人对此脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害（如封禁、限制等）。</p>
        <p>5. 若有信息功能侵犯到您的权益，请及时联系作者。</p>
        <p>6. 任何以任何方式查看此脚本的人或直接或间接使用此脚本的使用者都应仔细阅读此条款。</p>
        <p>7. 本人保留随时更改或补充此条款的权利，一旦您使用或复制或修改了此脚本，即视为您已接受此免责条款。</p>
    </div>
</div>
`;
}
