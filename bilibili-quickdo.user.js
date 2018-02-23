// ==UserScript==
// @name         bilibili-H5播放器快捷操作
// @namespace    https://github.com/zegzhi/bilibili-quickdo
// @version      1.3.3
// @description  bilibili - H5播放器快捷操作
// @author       zegzhi
// @match        *://www.bilibili.com/bangumi/play/ep*
// @match        *://www.bilibili.com/bangumi/play/ss*
// @match        *://www.bilibili.com/video/av*
// @match        *://www.bilibili.com/watchlater/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

/*
v1.3.2 更新：
    兼容新版播放页面
## 功能
- 双击全屏
- ```+``` ```-```键调节播放速度
- ```F```键全屏
- ```W```键宽屏
- ```K```键暂停/播放
- ```J``` ```L```键前进/后退5s
- ```D```键开启/关闭弹幕
- ```N``` ```M```调节音量(不记忆)
- 播放器右侧设置-高级选项 可以设置自动播放、自动宽屏、剧场模式、双击全屏和关闭弹幕

 */

(function () {
    'use strict';

    var playerQuickDo = {
        video: null, // video组件
        href: null,
        scrollTo: null,

        // 按键代码
        keyCode: {
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
        // 设置按钮
        settingHTML: {
            'playAndPause': '自动播放',
            'widescreen': '自动宽屏',
            'swidescreen': '剧场模式',
            'danmu': '打开弹幕',
            'dblclickFullscreen': '双击全屏'
        },
        // 用户配置
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
            initLoopTime: 100,
            initLoopCount: 500,
        },
        // 初始化通知
        initInfoStyle: function () {
            var that = this;
            var css = `<style type="text/css">
.bilibili-player .mode-fullscreen .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-infoHint{width: 120px; height: 42px; line-height: 42px; padding: 15px 18px 15px 12px; font-size: 28px; margin-left: -75px; margin-top: -36px;}
.bilibili-player .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-infoHint{position: absolute; top: 50%; left: 50%; z-index: 30; width: 82px; height: 32px; line-height: 32px; padding: 9px 7px 9px 7px; font-size: 20px; margin-left: -50px; margin-top: -25px; border-radius: 4px; background: rgba(255,255,255,.8); color: #000; text-align: center;}
.bilibili-player .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-infoHint-text{vertical-align: top; display: inline-block; overflow: visible; text-align: center;}
</style> `;
            var html = '<div class="bilibili-player-infoHint" style="opacity: 0; display: none;"><span class="bilibili-player-infoHint-text">1</span></div>';
            $('head').append(css);
            $('div.bilibili-player-video-wrap').append(html);
        },
        getKeyCode: function (type) {
            return this.keyCode[this.config.quickDo[type]];
        },
        // 按键监听
        bindKeydown: function () {
            var that = this;
            $(document).keydown(function (e) {
                if ($(document).find("input:focus, textarea:focus").length === 0)
                    that.keyHandler(e.keyCode);
            });
            // 双击全屏
            if (GM_getValue('dblclickFullscreen') === 1) {
                $(this.video).dblclick(function () {
                    $('.bilibili-player-iconfont.bilibili-player-iconfont-fullscreen').click();
                });
            }
        },
        // 按键处理函数
        keyHandler: function (keyCode) {
            if (this.video.src === '')
                this.video = $('video')[0];
            switch (keyCode) {
                case this.getKeyCode('addSpeed'):
                    if (this.video.playbackRate < 4) {
                        this.video.playbackRate += 0.5;
                        this.showInfoAnimate('X ' + this.video.playbackRate);
                    }
                    break;
                case this.getKeyCode('subSpeed'):
                    if (this.video.playbackRate > 0.5) {
                        this.video.playbackRate -= 0.5;
                        this.showInfoAnimate('X ' + this.video.playbackRate);
                    }
                    break;
                case this.getKeyCode('fullscreen'):
                    $('.bilibili-player-iconfont.bilibili-player-iconfont-fullscreen').click();
                    break;
                case this.getKeyCode('widescreen'):
                    $('.bilibili-player-iconfont.bilibili-player-iconfont-widescreen').click();
                    break;
                case this.getKeyCode('danmu'):
                    if ($('.video-state-danmaku-off')[0]) {
                        this.showInfoAnimate('弹幕开启');
                    } else {
                        this.showInfoAnimate('弹幕关闭');
                    }
                    $('div.bilibili-player-video-control div.bilibili-player-video-btn.bilibili-player-video-btn-danmaku').click();
                    $('.bilibili-player-danmaku-setting-lite-panel').hide();
                    break;
                case this.getKeyCode('playAndPause'):
                    $('div.bilibili-player-video-control div.bilibili-player-video-btn.bilibili-player-video-btn-start').click();
                    break;
                case this.getKeyCode('forward'):
                    this.video.currentTime += 5;
                    break;
                case this.getKeyCode('backward'):
                    this.video.currentTime -= 5;
                    break;
                case this.getKeyCode('addVolume'):
                    if (this.video.volume + 0.1 <= 1) {
                        this.video.volume += 0.1;
                    } else {
                        this.video.volume = 1;
                    }
                    this.showInfoAnimate(Math.round(this.video.volume * 100) + '%');
                    break;
                case this.getKeyCode('subVolume'):
                    if (this.video.volume - 0.1 >= 0) {
                        this.video.volume -= 0.1;
                    } else {
                        this.video.volume = 0;
                    }
                    this.showInfoAnimate(Math.round(this.video.volume * 100) + '%');
                    break;
            }
        },
        // 播放器默认设置处理函数
        autoHandler: function () {
            this.setScrollTo();
            if (GM_getValue('swidescreen') === 1) {
                $(".bpui-slider-handle")[0].remove(); // 删除进度条小圆点
                $(window).resize(); // 调整播放器大小
            }
            if (GM_getValue('playAndPause') === 1) { // 自动播放
                this.video.autoplay = true;
                //this.video.style="object-fit:fill";
            }
            if (GM_getValue('widescreen') === 1) {
                $('.icon-24wideoff').click();
            }
            if (GM_getValue('danmu') === 0) {
                this.keyHandler(this.getKeyCode('danmu'));
            }
        },
        initSettingHTML: function () {
            var that = this;
            for (let key in this.settingHTML) {
                let value = this.settingHTML[key];
                let html = `<div class="bilibili-player-fl">
<input type="checkbox" class="bpui-component bpui-checkbox bpui-button" id="checkbox${key}">
<label for="checkbox${key}" id="checkbox${key}-lable" class="button bpui-button-text-only" role="button" data-pressed="false">
<span class="bpui-button-text">
<i class="bpui-icon-checkbox icon-12checkbox"></i>
<i class="bpui-icon-checkbox icon-12selected2"></i>
<i class="bpui-icon-checkbox icon-12select"></i>
<span class="bpui-checkbox-text" style="padding-left: 0px;">${value}</span>
</span>
</label>
</div>`;
                $('.bilibili-player-advopt-wrap').append(html);
                if (GM_getValue(key) === 1) {
                    $(`#checkbox${key}-lable`).addClass('bpui-state-active');
                } else if (GM_getValue(key) === 0) {
                    $(`#checkbox${key}-lable`).removeClass('bpui-state-active');
                } else {
                    GM_setValue(key, 0);
                    $(`#checkbox${key}-lable`).removeClass('bpui-state-active');
                }
                $(`#checkbox${key}`).click(function () {
                    var gmvalue = GM_getValue(key) === 1 ? 0 : 1;
                    GM_setValue(key, gmvalue);
                    if (gmvalue === 1) {
                        $(this).next().addClass('bpui-state-active');
                    } else {
                        $(this).next().removeClass('bpui-state-active');
                    }
                });
            }
        },
        showInfoAnimate: function (info) {
            var that = this;
            $('div.bilibili-player-infoHint').stop().css("opacity", 1).show();
            $('span.bilibili-player-infoHint-text')[0].innerHTML = info;
            var infoAnimateTimer = setTimeout(function () {
                $('div.bilibili-player-infoHint').animate({
                    opacity: 0
                }, 300, function () {
                    $(this).hide();
                });
                clearTimeout(infoAnimateTimer);
            }, 1E3);
        },
        setScrollTo: function () {
            switch (this.href) {
                case 'video':
                    if (GM_getValue('swidescreen') === 1) {
                        window.scrollTo(0, $(".bili-header-m")[0].offsetHeight + 7);
                    } else {
                        var height0 = $("#viewbox_report")[0].offsetHeight + $(".bili-header-m")[0].offsetHeight + 10;
                        window.scrollTo(0, height0);
                    }
                    break;
                case 'bangumi':
                    if (GM_getValue('swidescreen') === 1) {
                        window.scrollTo(0, $(".bili-header-m")[0].offsetHeight + 7);
                    } else {
                        window.scrollTo(0, 380);
                    }

                    break;
                case 'watchlater':
                    var h = $(".video-top-info")[0].offsetHeight + $(".bili-header-m")[0].offsetHeight + 10;
                    window.scrollTo(0, h);
                    break;
            }
        },
        setPageStyle: function () {
            var that = this;
            if (GM_getValue('swidescreen') !== 1) return;
            switch (this.href) {
                case 'video':
                    // 移动元素位置
                    var p1 =  $('.b-page-body>div:eq(0)'); // 头部
                    var p2 = $('.b-page-body>div:eq(1)'); // 播放器
                    var p2_1 = $('.b-page-body>div:eq(1)>div:eq(1)'); // 分p
                    var p2_2 = $('#arc_toolbar_report'); // 视频底部数据栏
                    var p3 = $('.b-page-body>div:eq(2)');  // 底部（视频信息+评论）
                    p3.before(p2_1);
                    p3.before(p2_2);
                    p2_1.before(p1);
                    // 微调间距
                    $(".sign").css("height", "40px"); // up个性签名
                    //$('#__bofqi').css('margin', '0');
                    p2.css("padding", "0");
                    //$('#__bofqi').css('height', '100%');
                    $("#bofqi").css("margin", "0");
                    $('.b-page-body>div:gt(0)').css("margin-left", "115px");
                    // 调整播放器大小事件
                    $(window).resize(function () {
                        var width = $(window).width();
                        var height = $(window).height() - 110;
                        $(".player").css({
                            "width": width + "px",
                            "height": height + "px"
                        });
                    });
                    // 修改回到顶部按钮
                    $('.gotop').unbind().click(function () {
                        that.setScrollTo();
                    });
                    break;
                case 'bangumi':
                    $('.bangumi-info-wrapper').before($('.bangumi-header'));
                    $(".sign").css("height", "40px"); // up个性签名
                    $('.bangumi-player').css('margin', '0');
                    $('.bangumi-player').css('height', 'auto');
                    $('.player-wrapper').css('min-height', '0');
                    $('.player-wrapper').css('padding', '0');
                    $('#app>div:gt(0)').css("margin-left", "115px");
                    // 调整播放器大小事件
                    $(window).resize(function () {
                        var width = $(window).width();
                        var height = $(window).height() - 110;
                        $(".player").css({
                            "width": width + "px",
                            "height": height + "px"
                        });
                    });
                    // 修改回到顶部按钮
                    $(".nav-goto-top").remove();
                    $('.nav-mini-switch').before(
                        $('<div class="nav-goto-top"></div>').click(function () {
                            that.setScrollTo();
                        })
                    );
                    break;
                case 'watchlater':
                    break;
            }
        },
        init: function (n) {
            console.log('playerQuickDo init(' + n + ')');
            // 初始化变量
            var timerCount = 0;
            this.href = /.com\/.{0,}?\//g.exec(location.href)[0].slice(5, -1);
            var that = this;
            // 处理换P问题
            window.onhashchange = function () {
                setTimeout(function () {
                    that.video = null;
                    that.init(1);
                }, 1000);
            };
            // 等待Video组件加载完
            var timer = window.setInterval(function () {
                that.video = $('video')[0];
                if (that.video) {
                    try {
                        if (n === 0) {
                            that.setPageStyle(); // 调整页面样式(剧场模式)
                            that.bindKeydown(); // 绑定Keydown
                        }
                        that.initInfoStyle(); // 初始化信息样式
                        that.initSettingHTML(); // 初始化设置页面
                        that.autoHandler(); // 初始化播放器设置
                    } catch (e) {
                        console.log('playerQuickDo init error:' + e);
                    } finally {
                        console.log('playerQuickDo init done');
                        clearInterval(timer);
                    }
                } else if (++timerCount >= that.config.initLoopCount) {
                    console.log('H5 player not found');
                    clearInterval(timer);
                }
            }, this.config.initLoopTime);
        }
    };
    playerQuickDo.init(0);
})();