// ==UserScript==
// @name         成都文理学院刷课助手（自动填充验证码）
// @version      1.0.2
// @description  成都文理学院数字化实习实训平台刷课，在原基础上，添加了用户交互界面、自动识别填充验证码等功能。
// @author       Fulling
// @match        *://zxshixun.cdcas.com/user/node*
// @icon         data:image/png;base64,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
// @grant        GM_xmlhttpRequest
// @license    	 MIT
// @namespace  	 https://github.com/iFulling/cdcasSK
// ==/UserScript==


let videoElement = null;
let checkCaptchaTimer = null;
let containerTextElement = null;
let timerCnt = 0;

// 下一个视频
function playNext() {
    let links = $('a[target="_self"]');
    let current = 0;

    links.each((index, item) => {
        if ($(item).hasClass("on")) {
            return current = index
        }
    });

    if (current === links.length - 1) {
        addText("最后一个已看完！")
    } else {
        clearInterval(checkCaptchaTimer);
        addText("准备播放下一个视频...")
        setTimeout(() => {
            links[current + 1].click();
        }, 3000);
    }
}

// 输入验证码
async function inputCaptcha(){
    const captchaLayer = $('#layui-layer1');

    if (captchaLayer.length && captchaLayer.is(':visible')) {
        addText("验证码弹窗出现，等待填写验证码...");

        // 获取图片
        let imgs = captchaLayer.find("img")
        let img = imgs[0].style.opacity === '0' ? imgs[1] : imgs[0]

        // 图片转base64
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        let code = canvas.toDataURL("image/png").split("base64,")[1];

        // 调用接口，识别验证码
        await getCode(code).then((ans) => {
            let inputs = captchaLayer.find("input")
            let input = inputs[0].style.display === 'none' ? inputs[1] : inputs[0]
            input.value = ans
        });

        const playButton = $('.layui-layer-btn0');  // 选择 "开始播放" 按钮

        if (playButton.length) {
            playButton.click();
            checkCaptchaTimer = setInterval(playVideo, 1000);
            addText("已自动点击开始播放按钮！");
        } else {
            addText("未找到开始播放按钮，尝试刷新页面...");
            location.reload();  // 刷新当前页面
        }
    }
}

// 使用sw1128的接口，油猴链接：https://greasyfork.org/zh-CN/scripts/459260
function getCode(code){
    return new Promise((resolve, reject) =>{
        const datas = {
            "ImageBase64": String(code),
        }
        GM_xmlhttpRequest({
            method: "POST",
            url: "http://captcha.zwhyzzz.top:8092/identify_GeneralCAPTCHA",
            data: JSON.stringify(datas),
            headers: {
                "Content-Type": "application/json",
            },
            responseType: "json",
            onload: function(response) {
                if (response.status == 200) {
                    if (response.responseText.indexOf("触发限流策略") != -1)
                        addText(response.response["msg"]);
                    try{
                        var result = response.response["result"];
                        addText("识别结果：" + result);
                        return resolve(result);
                    }
                    catch(e){
                        if (response.responseText.indexOf("接口请求频率过高") != -1)
                            addText(response.responseText);
                    }
                }
                else {
                    addText("识别失败，请勿开启代理。");
                }
            }
        });
    });
}

// 播放视频，同时检测验证码
function playVideo(){
    timerCnt++;
    if (timerCnt % 5 === 0) {
        addText("等待加载，已加载：" + timerCnt + "秒")
    }
    if (timerCnt > 20) {
        addText("刷新页面")
        location.reload();
        return
    }
    if (!videoElement) {
        return getVideoElement();
    }
    // 验证码弹窗
    const verifyTags = $('.layui-layer');
    if (verifyTags.length > 0) {
        inputCaptcha()
        clearInterval(checkCaptchaTimer);
        return;
    }

    if (videoElement) {
        if (videoElement.paused) {
            videoElement.play();
            if (videoElement.readyState === 4 && !containerTextElement.text().includes("视频加载完成")) {
                addText("视频加载完成，准备播放");
            }
        } else {
            timerCnt = 0; // 如果视频正在播放，重置计时器
        }
    }
}

// 获取视频元素
const getVideoElement = ()=>{
    videoElement = document.querySelector("video");
    videoElement.muted = true;
    videoElement.playbackRate = 1.0;
    videoElement.volume = 0;
    videoElement.onended = function () {
        playNext();
        setTimeout(() => {}, 2000);
    };
}

// 添加交互显示
const addContainer = () =>{
    const container = $('<container></container>')
    container.addClass('popup');

    const header = $("<div></div>")
    header.addClass('container-header')
    header.text("成都文理学院刷课助手 1.0.0")
    container.append(header)

    // 添加移动事件
    header.on("mousedown", function(event) {
        // 获取鼠标相对盒子的偏移量
        let shiftX = event.clientX - header.offset().left;
        let shiftY = event.clientY - header.offset().top;

        // 当鼠标移动时
        function onMouseMove(event) {
            container.css({
                left: event.pageX - shiftX + 'px',
                top: event.pageY - shiftY + 'px'
            })
        }
        // 鼠标提起来
        function onMouseUp() {
            $(document).off('mousemove', onMouseMove);
            $(document).off('mouseup', onMouseUp);
        }

        $(document).on('mousemove', onMouseMove);
        $(document).on('mouseup', onMouseUp);
    })

    const hr = $("<hr>")
    container.append(hr)

    containerTextElement = $("<div></div>")
    containerTextElement.addClass('container-text')
    container.append(containerTextElement)
    addText("启动成功...")

    $("body").append(container)
}

// 添加样式
const addStyle = () => {
    const style = $("<style></style>")
    style.prop('type', 'text/css')
    style.html(
        `
.popup {
    position: fixed;
    top: 50px;
    left: 150px;
    font: 14px Menlo, Monaco, Consolas, "Courier New", monospace;
    z-index: 9999999999999999999999;
    background-color: #fff;
    box-shadow: 0 0 5px 1px rgba(0, 0, 0, .3);
    padding: 10px;
    border-radius: 5px;
}

.container-header {
    height: 30px;
    width: 300px;
    cursor: move;
    line-height: 30px;
}

.container-text {
    margin-top: 10px;
    max-height: 150px;
    min-height: 30px;
    overflow: auto;
}
        `
    )
    $('body').append(style);
}


// 添加交互文本
const addText = text => {
    containerTextElement.append(text + "<br>")
    containerTextElement.scrollTop(containerTextElement[0].scrollHeight)
}

// 初始化程序
const init = () => {
    addContainer()
    addStyle()
    addText("初始化完成...")
}


// 运行程序
(function () {
    'use strict';

    $(document).ready(function () {
        init()
        checkCaptchaTimer = setInterval(playVideo, 1000);
    });
})();
