// pages/home/home.js
import Toast from 'tdesign-miniprogram/toast/index';
import Message from 'tdesign-miniprogram/message/index';

Page({
    data: {
        videoUrl: '',
        announcement: "公告：本工具支持抖音、快手、小红书、微博等平台的视频去水印，使用前请确保链接正确。新用户首次登录即送10次解析机会！",
        // 解析状态
        showResult: false,
        // 视频解析结果
        resultVideoUrl: '',
        // 视频封面
        resultVideoPoster: '',
        // 视频时长
        resultVideoDuration: '',
        // 视频标题
        resultVideoTitle: '',
        resultPics: [],
        // 用户信息
        userInfo: null,
        // 是否已登录
        isLoggedIn: false,
        // 剩余解析次数
        remainingCount: 0,
        // 登录弹窗显示状态
        showLoginDialog: false
    },
    /**
 * 生命周期函数--监听页面加载
 */
    onLoad: function (options) {
        // 初始化云开发
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力');
        } else {
            wx.cloud.init({
                env: 'cloud1-4gwhtw1l3224ada7',
                traceUser: true,
            });
        }

        // 检查用户登录状态
        this.checkLoginStatus();
    },
    /**
     * 检查用户登录状态
     */
    checkLoginStatus() {
        wx.showLoading({
            title: '加载中...',
        });

        // 获取用户登录状态
        wx.cloud.callFunction({
            name: 'checkLogin',
            success: res => {
                wx.hideLoading();

                if (res.result && res.result.isLoggedIn) {
                    // 用户已登录
                    this.setData({
                        isLoggedIn: true,
                        userInfo: res.result.userInfo,
                        remainingCount: res.result.remainingCount || 0
                    });

                    // 更新公告内容
                    this.updateAnnouncement(`公告：本工具支持抖音、快手、小红书、微博等平台的视频去水印。${this.data.userInfo.nickName}，您还有${this.data.remainingCount}次解析机会！`);
                } else {
                    // 用户未登录
                    this.setData({
                        isLoggedIn: false,
                        userInfo: null,
                        remainingCount: 0
                    });
                }
            },
            fail: err => {
                wx.hideLoading();
                console.error('检查登录状态失败:', err);
            }
        });
    },
    // 可以添加方法来动态更新公告内容
    updateAnnouncement(newContent) {
        this.setData({
            announcement: newContent
        });
    },
    // 视频输入框内容变化
    onInputChange(e) {
        this.setData({
            videoUrl: e.detail.value
        });
    },
    /**
     * 处理粘贴事件
     */
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
    /**
     * 清除视频链接
     */
    handleClear() {
        this.setData({
            videoUrl: '',
            showResult: false,
            resultVideoUrl: '',
            resultVideoPoster: '',
            resultVideoDuration: '',
            resultVideoTitle: '',
            resultPics: []
        });
    },
    /**
     * 处理解析按钮点击
     */
    handleParse() {
        // 如果已经显示结果，则不再触发解析
        if (this.data.showResult) {
            Toast({
                context: this,
                selector: '#t-toast',
                message: '当前已显示解析结果',
                theme: 'success',
                direction: 'column'
            });
            return;
        }

        // 检查是否已登录
        if (!this.data.isLoggedIn) {
            // 显示登录弹窗
            this.setData({
                showLoginDialog: true
            });
            return;
        }

        // 检查剩余解析次数
        if (this.data.remainingCount <= 0) {
            Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: '您的解析次数已用完，请分享给好友获取更多次数'
            });
            return;
        }

        if (!this.data.videoUrl) {
            Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: '请先粘贴视频链接'
            });
            return;
        }

        // 显示加载状态
        wx.showLoading({
            title: '正在解析...',
        });

        // 调用云函数解析视频
        wx.cloud.callFunction({
            name: 'parseVideo',
            data: {
                url: this.data.videoUrl
            },
            success: res => {
                wx.hideLoading();

                // 检查云函数返回结果
                if (res.result && res.result.code === 200) {
                    const data = res.result.data;

                    console.log('API返回数据:', data);

                    // 更新页面数据，显示解析结果
                    this.setData({
                        showResult: true,
                        resultVideoUrl: data.video_url || '',
                        resultVideoPoster: data.cover_url || '',
                        resultVideoDuration: data.duration || '',
                        resultVideoTitle: data.title || '',
                        resultPics: data.pics || [],
                        // 更新剩余解析次数
                        remainingCount: this.data.remainingCount - 1
                    });

                    // 更新公告内容
                    this.updateAnnouncement(`公告：本工具支持抖音、快手、小红书、微博等平台的视频去水印。${this.data.userInfo.nickName}，您还有${this.data.remainingCount}次解析机会！`);

                    // 保存到历史记录
                    this.saveToHistory({
                        url: this.data.videoUrl,
                        title: data.title || '未知标题',
                        cover: data.cover_url || '',
                        time: new Date().toLocaleString()
                    });

                    // 更新用户解析次数
                    wx.cloud.callFunction({
                        name: 'updateUserCount',
                        data: {
                            count: this.data.remainingCount
                        }
                    });

                    Toast({
                        context: this,
                        selector: '#t-toast',
                        message: '解析成功',
                        theme: 'success',
                        direction: 'column'
                    });
                } else {
                    // 处理云函数错误
                    Message.error({
                        context: this,
                        offset: [20, 32],
                        duration: 3000,
                        content: res.result.msg || '解析失败，请检查链接是否正确'
                    });
                }
            },
            fail: err => {
                wx.hideLoading();
                console.error('调用云函数失败:', err);
                Message.error({
                    context: this,
                    offset: [20, 32],
                    duration: 3000,
                    content: '网络请求失败，请检查网络连接'
                });
            }
        });
    },

    /**
 * 处理用户登录
 */
    handleLogin() {
        wx.showLoading({
            title: '登录中...',
        });

        // 获取用户信息
        wx.getUserProfile({
            desc: '用于完善会员资料',
            success: userRes => {
                // 调用云函数进行登录
                wx.cloud.callFunction({
                    name: 'login',
                    data: {
                        userInfo: userRes.userInfo
                    },
                    success: res => {
                        wx.hideLoading();

                        if (res.result && res.result.code === 200) {
                            // 登录成功
                            this.setData({
                                isLoggedIn: true,
                                userInfo: userRes.userInfo,
                                remainingCount: res.result.remainingCount || 10,
                                showLoginDialog: false
                            });

                            // 更新公告内容
                            this.updateAnnouncement(`公告：本工具支持抖音、快手、小红书、微博等平台的视频去水印。${this.data.userInfo.nickName}，您还有${this.data.remainingCount}次解析机会！`);

                            Toast({
                                context: this,
                                selector: '#t-toast',
                                message: '登录成功',
                                theme: 'success',
                                direction: 'column'
                            });
                        } else {
                            // 登录失败
                            Message.error({
                                context: this,
                                offset: [20, 32],
                                duration: 3000,
                                content: res.result.msg || '登录失败，请稍后再试'
                            });
                        }
                    },
                    fail: err => {
                        wx.hideLoading();
                        console.error('调用登录云函数失败:', err);
                        Message.error({
                            context: this,
                            offset: [20, 32],
                            duration: 3000,
                            content: '登录失败，请稍后再试'
                        });
                    }
                });
            },
            fail: err => {
                wx.hideLoading();
                console.error('获取用户信息失败:', err);
                Message.error({
                    context: this,
                    offset: [20, 32],
                    duration: 3000,
                    content: '获取用户信息失败'
                });
            }
        });
    },
    // 预览图片
    previewImage(e) {
        const url = e.currentTarget.dataset.url;
        wx.previewImage({
            current: url,
            urls: this.data.resultPics
        });
    },
    // 复制图片链接
    copyPicLink(e) {
        const url = e.currentTarget.dataset.url;
        wx.setClipboardData({
            data: url,
            success: () => {
                Toast({
                    context: this,
                    selector: '#t-toast',
                    message: '图片链接已复制',
                    theme: 'success',
                    direction: 'column'
                });
            }
        });
    },
    // 下载图片
    downloadPic(e) {
        const url = e.currentTarget.dataset.url;
        wx.showLoading({
            title: '正在保存图片...',
        });

        wx.downloadFile({
            url: url,
            success: (res) => {
                if (res.statusCode === 200) {
                    wx.saveImageToPhotosAlbum({
                        filePath: res.tempFilePath,
                        success: () => {
                            wx.hideLoading();
                            Toast({
                                context: this,
                                selector: '#t-toast',
                                message: '图片保存成功',
                                theme: 'success',
                                direction: 'column'
                            });
                        },
                        fail: (err) => {
                            wx.hideLoading();
                            console.error('保存图片失败:', err);
                            Message.error({
                                context: this,
                                offset: [20, 32],
                                duration: 3000,
                                content: '保存图片失败，请检查权限设置'
                            });
                        }
                    });
                } else {
                    wx.hideLoading();
                    Message.error({
                        context: this,
                        offset: [20, 32],
                        duration: 3000,
                        content: '下载图片失败'
                    });
                }
            },
            fail: (err) => {
                wx.hideLoading();
                console.error('下载图片失败:', err);
                Message.error({
                    context: this,
                    offset: [20, 32],
                    duration: 3000,
                    content: '下载图片失败，请检查网络连接'
                });
            }
        });
    },
    /**
 * 保存到历史记录
 */
    saveToHistory(historyItem) {
        // 获取现有历史记录
        const historyList = wx.getStorageSync('historyList') || [];

        // 添加新记录到开头
        historyList.unshift(historyItem);

        // 限制历史记录数量，最多保存50条
        const limitedList = historyList.slice(0, 100);

        // 保存到本地存储
        wx.setStorageSync('historyList', limitedList);
    },
    // 复制无水印链接
    copyNoWatermarkLink() {
        wx.setClipboardData({
            data: this.data.resultVideoUrl,
            success: () => {
                Toast({
                    context: this,
                    selector: '#t-toast',
                    message: '链接已复制',
                    theme: 'success',
                    direction: 'column'
                });
            }
        });
    },

    // 保存到手机
    saveToPhone() {
        wx.showLoading({
            title: '正在保存...',
        });

        // 模拟下载过程
        setTimeout(() => {
            wx.hideLoading();
            Toast({
                context: this,
                selector: '#t-toast',
                message: '保存成功',
                theme: 'success',
                direction: 'column'
            });
        }, 1500);
    },
    // 复制封面链接
    copyWithCover() {
        wx.setClipboardData({
            data: this.data.resultVideoPoster,
            success: () => {
                Toast({
                    context: this,
                    selector: '#t-toast',
                    message: '封面链接已复制',
                    theme: 'success',
                    direction: 'column'
                });
            }
        });
    },
    // 保存封面
    saveCover() {
        wx.showLoading({
            title: '正在保存封面...',
        });

        // 模拟下载过程
        setTimeout(() => {
            wx.hideLoading();
            Toast({
                context: this,
                selector: '#t-toast',
                message: '封面保存成功',
                theme: 'success',
                direction: 'column'
            });
        }, 1000);
    },
    // 使用备用下载通道
    useAlternativeDownload() {
        wx.showLoading({
            title: '使用备用通道下载...',
        });

        // 模拟下载过程
        setTimeout(() => {
            wx.hideLoading();
            Toast({
                context: this,
                selector: '#t-toast',
                message: '下载成功',
                theme: 'success',
                direction: 'column'
            });
        }, 2000);
    },

    // 复制视频标题文案
    copyVideoTitle() {
        wx.setClipboardData({
            data: this.data.resultVideoTitle,
            success: () => {
                Toast({
                    context: this,
                    selector: '#t-toast',
                    message: '标题已复制',
                    theme: 'success',
                    direction: 'column'
                });
            }
        });
    },
    // 导航到教程页面
    navigateToTutorial() {
        wx.navigateTo({
            url: '/pages/tutorial/tutorial'
        });
    },
    // 处理批量解析按钮点击
    handleBatchParse() {
        wx.showToast({
            title: '批量解析功能即将上线',
            icon: 'none'
        });
    },
    // 导航到历史记录页面
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
    },
    /**
 * 关闭登录弹窗
 */
    closeLoginDialog() {
        this.setData({
            showLoginDialog: false
        });
    }
});
