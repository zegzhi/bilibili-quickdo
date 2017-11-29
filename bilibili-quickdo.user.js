// ==UserScript==
// @name         bilibili - H5播放器快捷操作
// @namespace    https://github.com/zegzhi/bilibili-quickdo
// @version      1.2
// @description  bilibili - H5播放器快捷操作
// @author       zegzhi
// @match        *://www.bilibili.com/video/*
// @match        *://www.bilibili.com/watchlater/*
// @match        *://bangumi.bilibili.com/anime/*/play*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

/*
v1.2 更新：
    增加超级宽屏模式，修复n个bug，重新加回调节播放速度快捷键
    历史更新:https://github.com/zegzhi/bilibili-quickdo

## 功能
- 双击全屏
- ```+``` ```-```键调节播放速度
- ```F```键全屏
- ```W```键宽屏
- ```K```键暂停/播放
- ```J``` ```L```键前进/后退5s
- ```D```键开启/关闭弹幕
- ```N``` ```M```调节音量(不记忆)
- 播放器右侧设置-高级选项 可以设置自动播放、自动宽屏、超级宽屏、双击全屏和关闭弹幕

 */

(function() {
    'use strict';

    var playerQuickDo = {
        video: null,
        infoAnimateTimer: null,
        currentDocument: null,
        isBangumi: false,
        isShowInput: false,
        keyCode:{
            'enter': 13,
            '=+': 187,
            '-_': 189,
            '+': 107,
            '-': 109,
            '0': 48,
            '1': 49,
            '2': 50,
            '3': 51,
            '4': 52,
            '5': 53,
            '6': 54,
            '7': 55,
            '8': 56,
            '9': 57,
            'a': 65,
            'b': 66,
            'c': 67,
            'd': 68,
            'e': 69,
            'f': 70,
            'g': 71,
            'h': 72,
            'i': 73,
            'j': 74,
            'k': 75,
            'l': 76,
            'm': 77,
            'n': 78,
            'o': 79,
            'p': 80,
            'q': 81,
            'r': 82,
            's': 83,
            't': 84,
            'u': 85,
            'v': 86,
            'w': 87,
            'x': 88,
            'y': 89,
            'z': 90,
            'left': 37,
            'right': 39
        },
        config: {
            quickDo: {
                'fullscreen': 'f',
                'widescreen': 'w',
                'addSpeed': '=+',
                'subSpeed': '-_',
                'danmu': 'd',
                'playAndPause': 'k',
                'forward': 'l',
                'backward': 'j',
                'addVolume': 'm',
                'subVolume': 'n'
            },
            auto: {
                'switch': 1,
                'play': 1,
                'widescreen': 1,
                'swidescreen': 1,//超级宽屏
                'danmu': 1,
                'dblclickFullscreen': 0
            },
            initLoopTime: 100,
            initLoopCount: 500,
        },
        //初始化通知
        initInfoStyle: function() {
            var that = this;
            var css = `
            <style type="text/css">
                .bilibili-player.mode-fullscreen .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-infoHint{width: 120px; height: 42px; line-height: 42px; padding: 15px 18px 15px 12px; font-size: 28px; margin-left: -75px; margin-top: -36px;}
                .bilibili-player .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-infoHint{position: absolute; top: 50%; left: 50%; z-index: 30; width: 82px; height: 32px; line-height: 32px; padding: 9px 7px 9px 7px; font-size: 20px; margin-left: -50px; margin-top: -25px; border-radius: 4px; background: rgba(255,255,255,.8); color: #000; text-align: center;}
                .bilibili-player .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-infoHint-text{vertical-align: top; display: inline-block; overflow: visible; text-align: center;}
            </style> `;
            var html = '<div class="bilibili-player-infoHint" style="opacity: 0; display: none;"><span class="bilibili-player-infoHint-text">1</span></div>';
            $('head', this.currentDocument).append(css);
            $('div.bilibili-player-video-wrap', this.currentDocument).append(html);
        },
        getKeyCode: function(type){
            return this.keyCode[this.config.quickDo[type]];
        },
        bindKeydown: function(){
            var that = this;
            this.currentDocument.keydown(function(e) {
                if ($("input:focus, textarea:focus", that.currentDocument).length === 0)
                    that.keyHandler(e.keyCode);
            });
            if (this.isBangumi){
                $(document).keydown(function(e){
                    if ($(document).find("input:focus, textarea:focus").length === 0)
                        that.keyHandler(e.keyCode);
                });
            }
            //双击全屏
            if(GM_getValue('dblclickFullscreen') === 1){
                $(this.video).dblclick(function() {
                    $('.bilibili-player-iconfont.bilibili-player-iconfont-fullscreen', that.currentDocument).click();
                });
            }
        },
        keyHandler: function(keyCode){
            if (keyCode === this.getKeyCode('addSpeed') && this.video.playbackRate < 4) {
                this.video.playbackRate += 0.25;
                this.showInfoAnimate('X '+this.video.playbackRate);
            } else if (keyCode === this.getKeyCode('subSpeed') && this.video.playbackRate > 0.5) {
                this.video.playbackRate -= 0.25;
                this.showInfoAnimate('X '+this.video.playbackRate);
            } else if (keyCode === this.getKeyCode('fullscreen')){
                $('.bilibili-player-iconfont.bilibili-player-iconfont-fullscreen', this.currentDocument).click();
            } else if (keyCode === this.getKeyCode('widescreen')){
                $('.bilibili-player-iconfont.bilibili-player-iconfont-widescreen', this.currentDocument).click();
            } else if (keyCode === this.getKeyCode('danmu')){
                if ($('.video-state-danmaku-off', this.currentDocument)[0]){
                    this.showInfoAnimate('弹幕开启');
                } else {
                    this.showInfoAnimate('弹幕关闭');
                }
                $('div.bilibili-player-video-control div.bilibili-player-video-btn.bilibili-player-video-btn-danmaku', this.currentDocument).click();
                $('.bilibili-player-danmaku-setting-lite-panel', this.currentDocument).hide();
            } else if (keyCode === this.getKeyCode('playAndPause')){
                $('div.bilibili-player-video-control div.bilibili-player-video-btn.bilibili-player-video-btn-start', this.currentDocument).click();
            } else if (keyCode === this.getKeyCode('forward')){
                this.video.currentTime += 5;
            } else if (keyCode === this.getKeyCode('backward')){
                this.video.currentTime -= 5;
            } else if (keyCode === this.getKeyCode('addVolume')){
                if (this.video.volume + 0.1 <= 1) {
                    this.video.volume += 0.1;
                } else {
                    this.video.volume = 1;
                }
                this.showInfoAnimate(Math.round(this.video.volume*100) + '%');
            } else if (keyCode === this.getKeyCode('subVolume')){
                if (this.video.volume - 0.1 >= 0) {
                    this.video.volume -= 0.1;
                } else {
                    this.video.volume = 0;
                }
                this.showInfoAnimate(Math.round(this.video.volume*100) + '%');
            }
        },
        autoHandler: function(){
            var that = this;
            var config = this.config.auto;
            if(config.switch === 0) return;
            if(GM_getValue('playAndPause') === 1){ //自动播放
                this.video.autoplay = true;
            }
            if (GM_getValue('widescreen') === 1){
                that.keyHandler(that.getKeyCode('widescreen'));
            }
            if (GM_getValue('danmu') === 0){
                that.keyHandler(that.getKeyCode('danmu'));
            }
        },
        initSettingHTML: function(){
            var config = {
                playAndPause: {checkboxId: 'checkboxAK',text: '自动播放'},
                widescreen: {checkboxId: 'checkboxAW',text: '自动宽屏'},
                swidescreen: {checkboxId: 'checkboxAA',text: '超级宽屏'},
                danmu: {checkboxId: 'checkboxAD',text: '打开弹幕'},
                dblclickFullscreen: {checkboxId: 'checkboxDF',text: '双击全屏'}
            };
            var that = this;
            for (let key in config){
                var value = config[key];
                $('.bilibili-player-advopt-wrap', this.currentDocument).append(this.getSettingHTML(value.checkboxId, value.text));
                if(GM_getValue(key) === 1){
                    $(`#${value.checkboxId}-lable`, this.currentDocument).addClass('bpui-state-active');
                }else if(GM_getValue(key) === 0){
                    $(`#${value.checkboxId}-lable`, this.currentDocument).removeClass('bpui-state-active');
                }else{
                    GM_setValue(key, this.config.auto[key]);
                    $(`#${value.checkboxId}-lable`, this.currentDocument).removeClass('bpui-state-active');
                }
                $(`#${value.checkboxId}`, this.currentDocument).click(function(){
                    var gmvalue = GM_getValue(key) === 1 ? 0 : 1;
                    GM_setValue(key, gmvalue);
                    if(gmvalue === 1){
                        $(this, that.currentDocument).next().addClass('bpui-state-active');
                    }else{
                        $(this, that.currentDocument).next().removeClass('bpui-state-active');
                    }
                });
            }
        },
        getSettingHTML: function(checkboxId,text){
            var html = `
            <div class="bilibili-player-fl">
                <input type="checkbox" class="bpui-component bpui-checkbox bpui-button" id="${checkboxId}">
                <label for="${checkboxId}" id="${checkboxId}-lable" class="button bpui-button-text-only" role="button" data-pressed="false">
                    <span class="bpui-button-text">
                        <i class="bpui-icon-checkbox icon-12checkbox"></i>
                        <i class="bpui-icon-checkbox icon-12selected2"></i>
                        <i class="bpui-icon-checkbox icon-12select"></i>
                        <span class="bpui-checkbox-text" style="padding-left: 0px;">${text}</span>
                    </span>
                </label>
            </div>`;
            return html;
        },
        showInfoAnimate: function(info) {
            var that = this;
            clearTimeout(this.infoAnimateTimer);
            $('div.bilibili-player-infoHint', this.currentDocument).stop().css("opacity", 1).show();
            $('span.bilibili-player-infoHint-text', this.currentDocument)[0].innerHTML = info;
            this.infoAnimateTimer = setTimeout(function() {
                $('div.bilibili-player-infoHint', that.currentDocument).animate({
                    opacity: 0
                }, 300, function() {
                    $(this).hide();
                });
            }, 1E3);
        },
        getVideo: function() {
            //获取Video组件
            if(this.video)
                return this.video;
            var bangumi = /bangumi.bilibili.com/g;
            var iframePlayer = $('iframe.bilibiliHtml5Player');
            var temDocument;
            if (bangumi.exec(location.href) && iframePlayer[0]) {
                temDocument = iframePlayer.prop('contentWindow').document;
                this.isBangumi = true;
            } else{
                temDocument = document;
            }
            this.currentDocument = $(temDocument);
            this.video = temDocument.querySelector('video');
            return this.video;
        },
        setPlayerSite: function() {
            var bangumi = /bangumi.bilibili.com/g;
            var watchlater = /www.bilibili.com\/watchlater/g;
            if (bangumi.exec(location.href)) {
                window.scrollTo(0,380);
            } else if (watchlater.exec(location.href)) {
                var h = $(".video-top-info")[0].offsetHeight+$(".bili-header-m")[0].offsetHeight + 10;
                window.scrollTo(0,h);
            } else {
                if(GM_getValue('swidescreen') === 1){
                    $(".n-i.gotop.sub").unbind();
                    $(".n-i.gotop.sub").click(function(){
                        var h = $(".bili-header-m")[0].offsetHeight+7;
                        var timmer=requestAnimationFrame(function fn(){
                            var s = $(window).scrollTop();
                            if(s > h){
                                s-=100;
                                $(window).scrollTop(s);
                                timmer=requestAnimationFrame(fn);
                            }
                            if(s < h ) $(window).scrollTop(h);
                        });
                    });
                    $(".bpui-slider-handle").remove();
                    window.scrollTo(0,$(".bili-header-m")[0].offsetHeight+7);
                    //移动元素位置
                    var about0 = $($(".main-inner")[0]); //标题栏
                    var about1 = $($(".main-inner")[1]);  //分p
                    var about = $($(".main-inner")[2]);  //简介
                    $("#arc_toolbar_report").prependTo(about);
                    about1.prependTo(about);
                    about0.prependTo(about);
                    //微调间距
                    $(".sign").css("height","40px");
                    $("#bofqi").css("margin","0");
                    $(".player-wrapper").css("padding","0");
                    about.css("margin-left","115px");
                    //调整播放器大小
                    var width = $(window).width();
                    var height = $(window).height()-110;
                    $(".player").css({"width":width+"px", "height":height+"px"});
                    window.onresize = function() {
                        var width = $(window).width();
                        var height = $(window).height()-110;
                        $(".player").css({"width":width+"px", "height":height+"px"});
                    };
                } else {
                    var height0 = $("#viewbox_report")[0].offsetHeight+$(".bili-header-m")[0].offsetHeight + 10;
                    window.scrollTo(0,height0);
                }
            }
        },
        init: function() {
            var timerCount = 0;
            var that = this;
            var timer = window.setInterval(function() {
                var video = that.getVideo();//获取Video组件
                if (video) {
                    try {
                        that.initInfoStyle();//初始化信息样式
                        that.initSettingHTML();//初始化设置页面
                        that.setPlayerSite();//调整页面样式
                        that.bindKeydown();//绑定Keydown
                        that.autoHandler();//初始化播放器设置
                    } catch (e) {
                        console.log('playerQuickDo init error:'+e);
                    } finally {
                        console.log('playerQuickDo init done');
                        clearInterval(timer);
                    }
                } else {
                    timerCount++;
                    if (timerCount >= that.config.initLoopCount) {
                        console.log('H5 player not found');
                        clearInterval(timer);
                    }
                }
            }, this.config.initLoopTime);
        }
    };
    playerQuickDo.init();
})();