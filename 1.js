// ==UserScript==
// @name         成都文理学院刷课助手|自动刷课|考试自动答题
// @version      2.0.1
// @description  成都文理学院刷课助手，🚀目前已支持平台：【数字化实习实训平台、公益课程、英华学堂】。😀目前已具有功能包括：视频自动播放、自动识别填充验证码、考试自动答题等功能。如有bug请留言。
// @author       iFulling
// @match        *://zxshixun.cdcas.com/*
// @match        *://gyxy.cdcas.com/*
// @match        *://mooc.cdcas.com/*
// @icon         data:image/png;base64,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
// @grant        GM_xmlhttpRequest
// @license    	 MIT
// @namespace  	 https://github.com/iFulling/cdcasSK
// @connect      captcha.zwhyzzz.top
// @connect      captcha.zwhyzzz.top:8092
// @connect      ark.cn-beijing.volces.com
// ==/UserScript==

/**
 /* @downloadURL https://update.greasyfork.org/scripts/512596/%E6%88%90%E9%83%BD%E6%96%87%E7%90%86%E5%AD%A6%E9%99%A2%E5%88%B7%E8%AF%BE%E5%8A%A9%E6%89%8B%EF%BC%88%E8%87%AA%E5%8A%A8%E5%A1%AB%E5%85%85%E9%AA%8C%E8%AF%81%E7%A0%81%EF%BC%89.user.js
 /* @updateURL https://update.greasyfork.org/scripts/512596/%E6%88%90%E9%83%BD%E6%96%87%E7%90%86%E5%AD%A6%E9%99%A2%E5%88%B7%E8%AF%BE%E5%8A%A9%E6%89%8B%EF%BC%88%E8%87%AA%E5%8A%A8%E5%A1%AB%E5%85%85%E9%AA%8C%E8%AF%81%E7%A0%81%EF%BC%89.meta.js
 */

let videoElement = null;
let checkCaptchaTimer = null;
let containerTextElement = null;
let examTextElement = null;
let layuiLayerContent = null;
let links = null;
let current = 0;
let timerCnt = 0;
let version = "2.0.1"
let token = "";
let auth = "";
let examCurrent = 0;
let examTimer = null;
let startFlag = false;

// 获取当前课程
function getCurrent() {
    links = $('a[target="_self"]');
    links.each((index, item) => {
        if ($(item).hasClass("on")) {
            return current = index
        }
    });
}
// 下一个视频
async function playNext() {
    clearInterval(checkCaptchaTimer);
    if (current === links.length - 1) {
        addText("最后一个已看完！")
    } else {
        addText("准备播放下一个视频...")
        await pause(3)
        links[current + 1].click();
    }
}

// 输入验证码
async function inputCaptcha() {
    if (layuiLayerContent.length && layuiLayerContent.is(':visible')) {
        addText("验证码弹窗出现，准备填写验证码...");
        await pause(2, 5)

        // 获取图片
        let imgs = layuiLayerContent.find("img")
        let img = imgs[0].style.opacity === '0' ? imgs[1] : imgs[0]

        // 图片转base64
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        let code = canvas.toDataURL("image/png").split("base64,")[1];

        // 调用接口，识别验证码
        let ans = await getCode(code)

        // 获取input，填入验证码
        let inputs = layuiLayerContent.find("input")
        let input = inputs[0].style.display === 'none' ? inputs[1] : inputs[0]
        $(input).mousedown()
        input.value = ans

        // 点击开始播放按钮
        await pause(2, 5)
        const playButton = $('.layui-layer-btn0');
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
function getCode(code) {
    return new Promise((resolve, reject) => {
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
            onload: function (response) {
                if (response.status == 200) {
                    if (response.responseText.indexOf("触发限流策略") != -1)
                        addText(response.response["msg"]);
                    try {
                        var result = response.response["result"];
                        addText("识别结果：" + result);
                        return resolve(result);
                    } catch (e) {
                        if (response.responseText.indexOf("接口请求频率过高") != -1)
                            addText(response.responseText);
                    }
                } else {
                    addText("识别失败，请勿开启代理。");
                }
            }
        });
    });
}

// 播放视频，同时检测验证码
async function playVideo() {
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
        if (links[current].title && links[current].title.includes("考试")) {
            addText("课程已看完，自动停止！")
            clearInterval(checkCaptchaTimer)
        }else {
            getVideoElement();
        }
        return
    }
    // 验证码弹窗
    layuiLayerContent = $('.layui-layer-content');
    if (layuiLayerContent.length > 0) {
        clearInterval(checkCaptchaTimer);
        await inputCaptcha()
        return;
    }

    // 检测视频是否加载成功且暂停
    // if (!videoElement) return;
    if (videoElement.paused) {
        videoElement.play();
        if (videoElement.readyState === 4) {
            const message = containerTextElement.text().includes("视频加载完成")
                ? "请将浏览器置于前台运行。（若学时会增加可忽略）" : "视频加载完成，准备播放";
            addText(message);
        }
    } else {
        timerCnt = 0;
    }
}

// 获取视频元素
const getVideoElement = () => {
    videoElement = document.querySelector("video");
    videoElement.muted = true;
    videoElement.playbackRate = 1.0;
    videoElement.volume = 0;
    videoElement.onended = async function () {
        await playNext();
    };
}


// 添加交互显示
const addContainer = () => {
    const container = $('<container></container>')
    container.addClass('popup');

    const header = $("<div></div>")
    header.addClass('container-header')
    header.text("成都文理学院刷课助手 " + version)
    container.append(header)

    const btnGroup = $("<div></div>")
    const classTab = $("<button class='classTabBtn'>刷课配置</button>")
    const examTab = $("<button class='examTabBtn'>搜题配置</button>")
    btnGroup.append(classTab)
    btnGroup.append(examTab)
    header.append(btnGroup)

    classTab.on("click", () => {
        examTextElement.hide()
        containerTextElement.show()
    })
    examTab.on("click", ()=>{
        containerTextElement.hide()
        examTextElement.show()
    })

    // 添加移动事件
    header.on("mousedown", function (event) {
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
    $("body").append(container)
}

const showClassOption = () => {
    containerTextElement = $("<div></div>")
    containerTextElement.addClass('container-text')
    $(".popup").append(containerTextElement)
    addText("<h4>提示1</h4>：如果开启了系统代理，要先关闭！")
    addText("<h4>提示2</h4>：本脚本仅支持PC端，如果不起作用，点油猴图标看是否有提示 \"<b>Please enable developer mode...</b>\"，若有，点击查看 <a target='_blank' href='https://www.baidu.com/s?wd=%E6%B2%B9%E7%8C%B4%20Please%20enable%20developer'>油猴插件不能使用</a>")
    addText("<h4>提示3</h4>：因为要获取验证码，如果弹出请求跨域资源的页面，选择 <b>总是允许</b>。")
    addText("<h4>提示4</h4>：因不同浏览器的优化策略问题，如果发现<b>学时没变</b>，看视频时请<b>将浏览器置于前台运行</b>。<br>")
    addText("启动成功...")
}
const showExamOption = () => {
    examTextElement = $("<div></div>")
    examTextElement.addClass('container-exam')
    $(".popup").append(examTextElement)
    examTextElement.append("<h4>提示1</h4>：如果开启了系统代理，要先关闭！<br>")
    examTextElement.append("<h4>提示2</h4>：本脚本仅支持PC端，如果不起作用，点油猴图标看是否有提示 \"<b>Please enable developer mode...</b>\"，若有，点击查看 <a target='_blank' href='https://www.baidu.com/s?wd=%E6%B2%B9%E7%8C%B4%20Please%20enable%20developer'>油猴插件不能使用</a><br>")
    examTextElement.append("<h4>提示3</h4>：对接的是抖音豆包，因为是AI，<b>所以不能保证完全正确，分数高低与作者无关</b>，如果有所担心可在搜完后再自己手动搜一遍<br>")
    examTextElement.append("启动成功...<br><br>")

    let cookies = document.cookie.split("; ");
    let cookieObj = {};
    cookies.forEach(cookie=>{
        let part = cookie.split("=")
        cookieObj[part[0]] = part[1]
    })
    token = cookieObj["_db_token"] || ""
    auth = cookieObj["_db_auth"] || ""
    let date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));

    examTextElement.append("搜题配置：点击链接 <a target='_blank' href='https://kdocs.cn/l/clJtV1RU8GDe'>获取搜题token和auth</a><br>")
    let tokenDiv = $("<div></div>")
    tokenDiv.append("<span>Token：</span>")
    let tokenInput = $("<input type='text' value='"+token+"'/>")
    tokenInput.on("keyup", e=>{
        token = e.target.value
        document.cookie = "_db_token="+token+"; domain=.cdcas.com; expires="+date.toUTCString()+"; path=/";
    })
    tokenDiv.append(tokenInput)

    let authDiv = $("<div></div>")
    authDiv.append("<span>Auth ：</span>")
    let authInput = $("<input type='text' value='"+auth+"'/>")
    authInput.on("keyup", e=>{
        auth = e.target.value
        document.cookie = "_db_auth="+auth+"; domain=.cdcas.com; expires="+date.toUTCString()+"; path=/";
    })
    authDiv.append(authInput)

    examTextElement.append(tokenDiv)
    examTextElement.append(authDiv)

    let startBtn = $("<button>开始搜题</button>")
    let stopBtn = $("<button>停止搜题</button>")
    examTextElement.append(startBtn)
    examTextElement.append(stopBtn)
    examCurrent = parseInt($(".topic-head.on").text()) - 1
    examTextElement.append("<span id='examStatus'></span>")
    setExamStatus("已停止。搜题将从当前题开始");
    if ($("#startArea").length == 1){
        setExamStatus("等待答题...");
    }
    if ($(".courseexam-list").find(".time").text().includes("已交卷")) {
        setExamStatus("已交卷,不可继续答题");
    }
    startBtn.on("click",async ()=>{
        if (startFlag) return;
        startFlag = true;
        examCurrent = parseInt($(".topic-head.on").text()) - 1
        let n = $(".courseexamcon-intro").find("ul").children("li").length;

        for (; examCurrent < n; examCurrent++) {
            if (!startFlag) break;
            let tab = $("#topic-tab-" + examCurrent)
            setExamStatus("进行中...正在搜索第 " + ( examCurrent + 1 ) + " 题")
            await pause(1)
            // 1 单选 2 多选 3 判断
            let type = parseInt(tab.find(".courseexamcon-main").data("type"))
            if ([1, 2, 3].includes(type)){
                let question = tab.find(".courseexamcon-main")[0].innerText.replaceAll("\n.\n", ".")
                console.log(question)
                let answer = await getAnswer(question)
                answer = answer.match(/[a-zA-Z]+/)[0];
                setExamStatus("第 "+ (examCurrent + 1) +" 题答案：" + answer)
                switch (type) {
                    case 1:
                    case 3:
                        tab.find("input[value='"+answer.toUpperCase()+"']").click()
                        break;
                    case 2:
                        for (let item of answer) {
                            tab.find("input[value='"+item.toUpperCase()+"']").click()
                        }
                        break;
                }
            }else{
                setExamStatus("未添加该题型，跳过...")
            }
            await pause(3)
            let btn = tab.find("input[value='保存修改']")
            if (btn.css("display") == "none"){
                tab.find("input[value='继续下一题']").click()
            }else{
                btn.click()
                $(".courseexamcon-intro").find("ul").children("li")[examCurrent + 1].querySelector("a").click()
            }
        }
        startFlag = false
        setExamStatus("已停止。下次搜题将从当前题开始");
    })

    stopBtn.on("click", ()=>{
        startFlag = false
        setExamStatus("已停止。下次搜题将从当前题开始")
    })
}
const setExamStatus = text => {
    $("#examStatus").text("当前状态："+text)
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
    width: 520px;
    font: 14px Menlo, Monaco, Consolas, "Courier New", monospace;
    z-index: 9999999999999999999999;
    background-color: #fff;
    box-shadow: 0 0 5px 1px rgba(0, 0, 0, .3);
    padding: 10px;
    border-radius: 5px;
}
.popup h4{
    display: inline-block;
}
.popup b{
    color: red;
}
.popup a{
    color: blue;
}

.container-header {
    height: 30px;
    cursor: move;
    line-height: 30px;
    display: flex;
    justify-content: space-between;
}
.container-header button{
    margin-left: 10px;
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 1px solid;
}
.container-header button:hover{
    color: red;
}

.container-text, .container-exam {
    margin-top: 10px;
    max-height: 200px;
    min-height: 30px;
    overflow: auto;
}
.container-exam {
    max-height: 300px;
}

.container-exam div{
    margin: 10px 0;
}

.container-exam input{
    border: 1px solid #000000;
    width: 400px;
    padding: 3px;
    padding-left: 5px;
    border-radius: 3px;
}
.container-exam button{
    color: red;
    padding: 3px 10px;
    background: #ba251e;
    color: white;
    border-radius: 3px;
    cursor: pointer;
    margin: 10px 20px 10px 0;
    border: none;
}
.container-exam button:hover{
    background: pink;
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

// 暂停函数
function pause(start, end = undefined) {
    let delay = start;
    if (end) {
        delay = Math.floor(Math.random() * (end - start)) + start;
        addText(`等待 ${delay} 秒后继续...`);
    }
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, delay * 1000); // 将秒转换为毫秒
    });
}

const getAnswer = (question) => {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
            data: JSON.stringify({
                "model": token,
                "messages": [
                    {
                        "role": "user",
                        "content": "只说选项号，不要说理由。\n" + question
                    }
                ]
            }),
            headers: {
                "Authorization": "Bearer " + auth,
                "Content-Type": "application/json",
            },
            responseType: "json",
            onload: function (response) {
                if (response.status == 401) {
                    addText("作者关闭了搜题接口，开启时间等待更新...");
                } else if (response.status == 200) {
                    try {
                        var answer = response.response["choices"][0].message.content;
                        addText("搜题结果：" + answer);
                        return resolve(answer);
                    } catch (e) {
                        addText("异常捕获：接口错误！");
                    }
                } else {
                    addText("接口错误！");
                }
            }
        });
    })
}

// 初始化程序
const init = async () => {
    addContainer()
    addStyle()
    showClassOption()
    showExamOption()
}


// 运行程序
(function () {
    'use strict';

    $(document).ready(async function () {
        await init()
        if (window.location.href.includes("/node")) {
            $(".classTabBtn").click()
            getCurrent()
            addText("初始化完成，可以解放双手了；为了更像人为点击，将会延时一段时间再播放<br>")
            await pause(5, 10)
            checkCaptchaTimer = setInterval(playVideo, 1000);
        }else if (window.location.href.includes("/exam")){
            $(".examTabBtn").click()
        }else{
            $(".classTabBtn").click()
            addText("请点进课程内容，进行学习...<br>")
        }
    });
})();
