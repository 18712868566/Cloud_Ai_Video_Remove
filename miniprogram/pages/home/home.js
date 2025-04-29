// pages/home/home.js
import Toast from 'tdesign-miniprogram/toast/index';
import Message from 'tdesign-miniprogram/message/index';

Page({
    data: {
        videoUrl: '',
        isLoading: false,
        announcement: "公告：本工具支持抖音、快手、小红书、微博等平台的视频去水印，使用前请确保链接正确。新用户首次登录即送10次解析机会！"
    },
    // 可以添加方法来动态更新公告内容
    updateAnnouncement(newContent) {
        this.setData({
            announcement: newContent
        });
    },
    onInputChange(e) {
        this.setData({
            videoUrl: e.detail.value
        });
    },

    handlePaste() {
        wx.getClipboardData({
            success: (res) => {
                this.setData({
                    videoUrl: res.data
                });
                Toast({
                    context: this,
                    selector: '#t-toast',
                    message: '已粘贴剪贴板内容',
                    theme: 'success',
                    direction: 'column'
                });
            }
        });
    },

    handleClear() {
        this.setData({
            videoUrl: ''
        });
    },

    handleParse() {
        if (!this.data.videoUrl) {
            Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: '请先粘贴视频链接'
            });
            return;
        }

        this.setData({ isLoading: true });

        // 模拟解析过程
        setTimeout(() => {
            this.setData({ isLoading: false });

            // 跳转到处理页面
            wx.navigateTo({
                url: '/pages/process/process?url=' + encodeURIComponent(this.data.videoUrl)
            });
        }, 2000);
    },

    navigateToTutorial() {
        wx.navigateTo({
            url: '/pages/tutorial/tutorial'
        });
    },

    handleBatchParse() {
        wx.showToast({
            title: '批量解析功能即将上线',
            icon: 'none'
        });
    },

    navigateToHistory() {
        wx.navigateTo({
            url: '/pages/history/history'
        });
    },
    /**
    * 处理邀请/分享给好友
    */
    onShareAppMessage() {
        return {
            title: '云端AI视频移除 - 一键去除视频水印',
            path: '/pages/home/home',
            imageUrl: '/assets/images/share.png'
        };
    }
});