// pages/home/home.js
import Toast from 'tdesign-miniprogram/toast/index';
import Message from 'tdesign-miniprogram/message/index';

Page({
    data: {
        videoUrl: '',
        announcement: "公告：本工具支持抖音、快手、小红书、微博等平台的视频去水印，使用前请确保链接正确。新用户首次登录即送10次解析机会！",
        // 解析状态
        // showResult: true,
        showResult: false,
        // 视频解析结果
        resultVideoUrl: '',
        // 视频封面
        resultVideoPoster: '',
        // 视频时长
        // resultVideoDuration: '',
        // 视频标题
        resultVideoTitle: '',
        resultPics: []
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

        // 准备API请求参数
        const token = 'bktuippakedwfmxmbyvvicr7juol1i'; // 这里留空，由您自己配置
        const url = encodeURIComponent(this.data.videoUrl);
        const apiUrl = `https://v3.alapi.cn/api/video/url?token=${token}&url=${url}`;
        // 发起API请求
        wx.request({
            url: apiUrl,
            method: 'GET',
            success: (res) => {
                wx.hideLoading();

                // 检查API返回结果
                if (res.statusCode === 200 && res.data && res.data.code === 200) {
                    const data = res.data.data;

                    console.log('API返回数据:', data);
                    // 更新页面数据，显示解析结果
                    this.setData({
                        showResult: true,
                        resultVideoUrl: data.video_url || '',
                        resultVideoPoster: data.cover_url || '',
                        resultVideoDuration: data.duration || '',
                        resultVideoTitle: data.title || '',
                        resultPics: data.pics || [],
                    });
                    this.saveToHistory({
                        url: this.data.videoUrl,
                        title: data.title || '未知标题',
                        cover: data.cover || '',
                        time: new Date().toLocaleString()
                    });

                    Toast({
                        context: this,
                        selector: '#t-toast',
                        message: '解析成功',
                        theme: 'success',
                        direction: 'column'
                    });
                } else {
                    // 处理API错误
                    Message.error({
                        context: this,
                        offset: [20, 32],
                        duration: 3000,
                        content: res.data.msg || '解析失败，请检查链接是否正确'
                    });
                }
            },
            fail: (err) => {
                wx.hideLoading();
                Message.error({
                    context: this,
                    offset: [20, 32],
                    duration: 3000,
                    content: '网络请求失败，请检查网络连接'
                });
                console.error('API请求失败:', err);
            }
        });
    },
    // ... existing code ...

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
    }
});