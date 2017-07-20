// ==UserScript==
// @name         bilibili - H5播放器快捷操作
// @namespace    https://github.com/jeayu/bilibili-quickdo
// @version      1.0
// @description  双击全屏,'+','-'调节播放速度、f键全屏、w键网页全屏、p键暂停/播放、d键开启/关闭弹幕等
// @author       jeayu
// @match        *://www.bilibili.com/video/*
// @match        *://www.bilibili.com/watchlater/*
// @match        *://bangumi.bilibili.com/anime/*/play*
// @run-at       document-body
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

/*
v1.1 更新：
重写部分功能
暂时去掉调节播放速度快捷键

历史更新：
https://github.com/jeayu/bilibili-quickdo/blob/master/README.md#更新历史
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
                'pushDanmu': 'enter',
                'forward': 'l',
                'backward': 'j',
                'addVolume': 'm',
                'subVolume': 'n'
            },
            auto: {
                'switch': 1, //总开关 1开启 0关闭
                'play': 1, //1开启 0关闭
                'widescreen': 1, //1宽屏 0关闭
                'danmu': 1, //1开启 0关闭
                'dblclickFullscreen': 0 //1开启 0关闭
            },
            initLoopTime: 100,
            initLoopCount: 500,
            autoLoopTime: 500,
            autoLoopCount: 50,
        },
        dblclickFullscreen: function() {
            if(GM_getValue('dblclickFullscreen') === 1){   
                var that = this;
                $(this.video).dblclick(function() {
                    $('.bilibili-player-iconfont.bilibili-player-iconfont-fullscreen', that.currentDocument).click();
                });
            }
        },
        initInfoStyle: function() {
            var that = this;
            var cssArr = [
                '.bilibili-player.mode-fullscreen .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-infoHint{width: 120px; height: 42px; line-height: 42px; padding: 15px 18px 15px 12px; font-size: 28px; margin-left: -75px; margin-top: -36px;}',
                '.bilibili-player .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-infoHint{position: absolute; top: 50%; left: 50%; z-index: 30; width: 82px; height: 32px; line-height: 32px; padding: 9px 7px 9px 7px; font-size: 20px; margin-left: -50px; margin-top: -25px; border-radius: 4px; background: rgba(255,255,255,.8); color: #000; text-align: center;}',
                '.bilibili-player .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-infoHint-text{vertical-align: top; display: inline-block; overflow: visible; text-align: center;}'
            ];
            var html = '<div class="bilibili-player-infoHint" style="opacity: 0; display: none;"><span class="bilibili-player-infoHint-text">1</span></div>';
            this.addStyle(cssArr);
            $('div.bilibili-player-video-wrap', this.currentDocument).append(html);
        },
        getKeyCode: function(type){
            return this.keyCode[this.config.quickDo[type]];
        },
        bindEvnet: function(){
            $('input.bilibili-player-video-danmaku-input', this.currentDocument).click(function () {
               $(this).select();
            });
        },
        bindKeydown: function(){
            var that = this;
            this.currentDocument.keydown(function(e) {
                if ($("input:focus, textarea:focus", that.currentDocument).length > 0)
                    that.pushDanmuHandler(e.keyCode);
                else
                    that.keyHandler(e.keyCode);
            });
            if (this.isBangumi){
                $(document).keydown(function(e){
                    if ($(document).find("input:focus, textarea:focus").length > 0)
                        that.pushDanmuHandler(e.keyCode);
                    else
                        that.keyHandler(e.keyCode);
                });
            }
        },
        keyHandler: function(keyCode){
            /*
            if (keyCode === this.getKeyCode('addSpeed') && player.playbackRate < 4) {
                player.playbackRate += 0.25;
                this.showInfoAnimate(player.playbackRate + ' X');
            } else if (keyCode === this.getKeyCode('subSpeed') && player.playbackRate > 0.5) {
                player.playbackRate -= 0.25;
                this.showInfoAnimate(player.playbackRate + ' X');
            } else 
            */
            if (keyCode === this.getKeyCode('fullscreen')){
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
            } else if (keyCode === this.getKeyCode('pushDanmu')){
                this.pushDanmuHandler(keyCode);
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
            var config = this.config.auto;
            if(config.switch === 0)
                return;
            var that = this;
            var count = 0;
            var timer = window.setInterval(function(){
                var readyState = $('.bilibili-player-video-panel div[stage="3"]', that.currentDocument);
                count++;
                if (readyState && readyState.html() === '加载视频内容...[完成]'){
                    if(GM_getValue('playAndPause') === 1){
                        that.keyHandler(that.getKeyCode('playAndPause'));
                    }
                    if (GM_getValue('widescreen') === 1){
                        that.keyHandler(that.getKeyCode('widescreen'));
                    }
                    if (GM_getValue('danmu') === 0){
                        that.keyHandler(that.getKeyCode('danmu'));
                    }
                    clearInterval(timer);
                }
                if(count >= that.config.autoLoopCount){
                    console.log('playerQuickDo auto failed');
                    clearInterval(timer);
                }
            }, this.config.autoLoopTime);
        },
        pushDanmuHandler: function(keyCode){
            if (keyCode !== this.getKeyCode('pushDanmu')){
                return;
            }
            var isFullScreen = $('div.bilibili-player.relative.mode-fullscreen', this.currentDocument)[0];
            if(isFullScreen && $("input.bilibili-player-video-danmaku-input:focus", this.currentDocument).length <= 0 && !this.isShowInput){
                this.isShowInput = true;
                $('div.bilibili-player-video-sendbar.relative', this.currentDocument).css("opacity", 1).show();
                $('input.bilibili-player-video-danmaku-input', this.currentDocument).click();
            }else if(isFullScreen){
                this.isShowInput = false;
                $('div.bilibili-player-video-sendbar.relative', this.currentDocument).css("opacity", 0).hide();
            } else{
                $('input.bilibili-player-video-danmaku-input', this.currentDocument).click();
            }
        },
        addStyle: function(cssArr){
            var css = '<style type="text/css">';
            for (let i in cssArr){
                css += cssArr[i];
            }
            css += '</style>';
            try{
                $('head', this.currentDocument).append(css);
            } catch (e) {
                console.log(e);
            }
        },
        initSettingHTML: function(){
            var config = {
                playAndPause: {checkboxId: 'checkboxAP', text: '自动播放'},
                widescreen: {checkboxId: 'checkboxAF',text: '自动宽屏'},
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
            this.autoHandler();
        },
        getSettingHTML: function(checkboxId,text){
            var html = `
            <div class="bilibili-player-fl bilibili-player-tooltip-trigger" data-tooltip="1" data-position="bottom-center" data-change-mode="1">
                <input type="checkbox" class="bilibili-player-setting-fullscreensend bpui-component bpui-checkbox bpui-button" id="${checkboxId}">
                <label for="${checkboxId}" id="${checkboxId}-lable" class="button bpui-button-text-only" role="button" data-pressed="false">
                    <span class="bpui-button-text">
                        <i class="bpui-icon-checkbox bilibili-player-iconfont-checkbox icon-12checkbox"></i>
                        <i class="bpui-icon-checkbox bilibili-player-iconfont-checkbox icon-12selected2"></i>
                        <i class="bpui-icon-checkbox bilibili-player-iconfont-checkbox icon-12select"></i>
                        <span class="bpui-checkbox-text">${text}
                        </span>
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
            //调整播放器位置
            var bangumi = /bangumi.bilibili.com/g;
            if (bangumi.exec(location.href)) {
                window.scrollTo(0,377);
            } else{
                window.scrollTo(0,235);
            }
        },
        init: function() {
            var timerCount = 0;
            var that = this;
            var timer = window.setInterval(function() {
                var video = that.getVideo();
                if (video) {
                    try {
                        that.dblclickFullscreen();
                        that.initInfoStyle();
                        that.bindEvnet();
                        that.bindKeydown();
                        that.setPlayerSite();
                        that.initSettingHTML();
                    } catch (e) {
                        console.log('playerQuickDo init error');
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