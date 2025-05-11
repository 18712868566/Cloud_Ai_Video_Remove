// pages/home/home.js
import Toast from 'tdesign-miniprogram/toast/index';
import Message from 'tdesign-miniprogram/message/index';
const app = getApp();

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
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        // 每次页面显示时检查登录状态
        this.checkLoginStatus();
    },

    /**
     * 检查用户登录状态
     */
    checkLoginStatus() {
        // 调用云函数检查登录状态
        wx.cloud.callFunction({
            name: 'checkLogin',
            success: res => {
                if (res.result && res.result.code === 200) {
                    // 用户已登录，更新全局数据和页面数据
                    const data = res.result.data;
                    app.saveUserInfo(data.userInfo, data.remainingCount);

                    this.setData({
                        isLoggedIn: true,
                        userInfo: data.userInfo,
                        remainingCount: data.remainingCount
                    });

                    // 更新公告内容
                    this.updateAnnouncement(`公告：本工具支持抖音、快手、小红书、微博等平台的视频去水印。${data.userInfo.nickName}，您还有${data.remainingCount}次解析机会！`);
                } else {
                    // 用户未登录，跳转到登录页面
                    wx.navigateTo({
                        url: '/pages/login/login?sourcePage=/pages/home/home'
                    });
                }
            },
            fail: err => {
                console.error('调用检查登录云函数失败', err);
                // 如果云函数调用失败，尝试使用本地存储的登录信息
                const isLoggedIn = app.checkLoginStatus();
                if (isLoggedIn) {
                    this.setData({
                        isLoggedIn: true,
                        userInfo: app.globalData.userInfo,
                        remainingCount: app.globalData.remainingCount
                    });

                    // 更新公告内容
                    this.updateAnnouncement(`公告：本工具支持抖音、快手、小红书、微博等平台的视频去水印。${app.globalData.userInfo.nickName}，您还有${app.globalData.remainingCount}次解析机会！`);
                } else {
                    // 本地也没有登录信息，跳转到登录页面
                    wx.navigateTo({
                        url: '/pages/login/login?sourcePage=/pages/home/home'
                    });
                }
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
        // 直接从全局数据获取登录状态
        const isLoggedIn = app.globalData.isLoggedIn;
        const userInfo = app.globalData.userInfo;
        const remainingCount = app.globalData.remainingCount;
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
        if (!isLoggedIn) {
            // 显示登录弹窗
            this.setData({
                showLoginDialog: true
            });
            return;
        }

        // 检查剩余解析次数
        if (remainingCount <= 0) {
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
                console.log('云函数返回结果:', res);
                // 检查云函数返回结果
                if (res.result && res.result.code === 200) {
                    const data = res.result.data;

                    console.log('API返回数据:', data);

                    // 更新页面数据，显示解析结果
                    this.setData({
                        showResult: true,
                        resultVideoFileID: data.video_fileID || '', // 存储fileID
                        resultCoverFileID: data.cover_fileID || '', // 存储封面fileID
                        resultVideoDuration: data.duration || '',
                        resultVideoTitle: data.title || '',
                        resultPicsFileIDs: data.pics_fileIDs || [], // 存储图片fileIDs
                    });

                    // 如果有视频fileID，直接使用云文件ID播放
                    if (data.video_fileID) {
                        this.setData({
                            resultVideoUrl: data.video_fileID // 直接使用fileID
                        });
                    } else if (data.video_url) {
                        // 兼容旧版本，如果没有fileID但有URL
                        this.setData({
                            resultVideoUrl: data.video_url
                        });
                    }

                    // 如果有封面fileID，直接使用云文件ID显示
                    if (data.cover_fileID) {
                        this.setData({
                            resultVideoPoster: data.cover_fileID // 直接使用fileID
                        });
                    } else if (data.cover_url) {
                        // 兼容旧版本，如果没有fileID但有URL
                        this.setData({
                            resultVideoPoster: data.cover_url
                        });
                    }

                    // 处理图片集
                    if (data.pics_fileIDs && data.pics_fileIDs.length > 0) {
                        this.setData({
                            resultPics: data.pics_fileIDs // 直接使用fileIDs数组
                        });
                    } else if (data.pics && data.pics.length > 0) {
                        // 兼容旧版本，如果没有fileIDs但有URLs
                        this.setData({
                            resultPics: data.pics
                        });
                    }

                    // 更新剩余解析次数
                    const newCount = this.data.remainingCount - 1;
                    this.setData({
                        remainingCount: newCount
                    });

                    // 使用全局方法更新解析次数
                    app.updateRemainingCount(newCount);

                    // 保存到历史记录
                    this.saveToHistory({
                        url: this.data.videoUrl,
                        title: data.title || '未知标题',
                        cover: data.cover_fileID || data.cover_url || '',
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
    // 保存视频到相册
    saveVideoToPhone() {
        console.log('123123213213' + this.data.resultVideoUrl);

        if (!this.data.resultVideoUrl) {
            Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: '没有可保存的视频'
            });
            return;
        }

        // wx.showLoading({
        //     title: '正在下载视频...',
        // });

        // 检查是否是云存储文件ID
        if (this.data.resultVideoUrl.startsWith('cloud://')) {
            // 使用云文件ID下载
            this.downloadCloudFile(this.data.resultVideoUrl, true);
            return;
        }

        // 检查URL是否有效
        if (!this.isValidUrl(this.data.resultVideoUrl)) {
            wx.hideLoading();
            console.error('视频URL无效:', this.data.resultVideoUrl);
            Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: '视频链接无效，请重新解析'
            });
            return;
        }

        // 使用重试机制下载视频
        this.downloadFileWithRetry(this.data.resultVideoUrl, 3, true);
    },
    // 保存封面图片到手机
    saveCoverToPhone() {
        console.log(this.data.resultVideoPoster);

        if (!this.data.resultVideoPoster) {
            Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: '没有可保存的封面图片'
            });
            return;
        }

        wx.showLoading({
            title: '正在保存封面...',
        });

        // 检查是否是云存储文件ID
        if (this.data.resultVideoPoster.startsWith('cloud://')) {
            // 使用云文件ID下载
            this.downloadCloudFile(this.data.resultVideoPoster, false);
            return;
        }
        // 检查URL是否有效
        if (!this.isValidUrl(this.data.resultVideoPoster)) {
            wx.hideLoading();
            console.error('图片URL无效:', this.data.resultVideoPoster);
            Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: '图片链接无效，请重新解析'
            });
            return;
        }

        // 使用重试机制下载图片
        this.downloadFileWithRetry(this.data.resultVideoPoster, 3, false);
    },

    // 从云存储下载文件
    downloadCloudFile(fileID, isVideo = false) {
        console.log(`开始从云存储下载${isVideo ? '视频' : '图片'}:`, fileID);

        wx.cloud.downloadFile({
            fileID: fileID,
            success: res => {
                console.log('云存储下载成功，临时路径:', res.tempFilePath);
                if (isVideo) {
                    this.saveVideoToAlbum(res.tempFilePath);
                } else {
                    this.saveImageToAlbum(res.tempFilePath);
                }
            },
            fail: err => {
                wx.hideLoading();
                console.error(`云存储下载${isVideo ? '视频' : '图片'}失败:`, err);
                Message.error({
                    context: this,
                    offset: [20, 32],
                    duration: 3000,
                    content: `下载${isVideo ? '视频' : '图片'}失败，请稍后再试`
                });
            }
        });
    },
    // 检查URL是否有效
    isValidUrl(url) {
        if (!url) return false;
        // 简单检查URL格式
        try {
            // 检查是否是相对路径
            if (url.startsWith('/') && !url.startsWith('//')) {
                return false;
            }
            // 检查是否包含协议
            if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
                return false;
            }
            return true;
        } catch (e) {
            console.error('URL检查失败:', e);
            return false;
        }
    },
    // 带重试机制的下载方法
    downloadFileWithRetry(url, maxRetries, isVideo = false) {
        let retryCount = 0;

        const attemptDownload = () => {
            // 确保URL有效
            if (!url.startsWith('http')) {
                if (url.startsWith('//')) {
                    url = 'https:' + url;
                } else {
                    wx.hideLoading();
                    console.error('无效的URL格式:', url);
                    Message.error({
                        context: this,
                        offset: [20, 32],
                        duration: 3000,
                        content: '文件链接格式无效，请重新解析'
                    });
                    return;
                }
            }

            console.log(`尝试下载${isVideo ? '视频' : '图片'}:`, url);

            wx.downloadFile({
                url: url,
                success: downloadRes => {
                    if (downloadRes.statusCode === 200) {
                        console.log('下载成功，临时路径:', downloadRes.tempFilePath);
                        if (isVideo) {
                            this.saveVideoToAlbum(downloadRes.tempFilePath);
                        } else {
                            this.saveImageToAlbum(downloadRes.tempFilePath);
                        }
                    } else {
                        console.error(`下载${isVideo ? '视频' : '图片'}失败，状态码:`, downloadRes.statusCode);
                        retryCount++;
                        if (retryCount < maxRetries) {
                            console.log(`尝试第${retryCount}次重试下载...`);
                            setTimeout(() => {
                                attemptDownload();
                            }, 1000 * retryCount);
                        } else {
                            wx.hideLoading();
                            Message.error({
                                context: this,
                                offset: [20, 32],
                                duration: 3000,
                                content: `下载${isVideo ? '视频' : '图片'}失败，请重试`
                            });
                        }
                    }
                },
                fail: err => {
                    console.error(`下载${isVideo ? '视频' : '图片'}失败:`, err);
                    retryCount++;
                    if (retryCount < maxRetries) {
                        console.log(`尝试第${retryCount}次重试下载...`);
                        setTimeout(() => {
                            attemptDownload();
                        }, 1000 * retryCount);
                    } else {
                        wx.hideLoading();
                        Message.error({
                            context: this,
                            offset: [20, 32],
                            duration: 3000,
                            content: `下载${isVideo ? '视频' : '图片'}失败，请重试`
                        });
                    }
                }
            });
        };

        attemptDownload();
    },
    // 修改图片保存方法，使用重试机制
    saveImageToPhone(imageUrl) {
        wx.showLoading({
            title: '正在保存图片...',
        });

        // 检查URL是否有效
        if (!this.isValidUrl(imageUrl)) {
            wx.hideLoading();
            console.error('图片URL无效:', imageUrl);
            Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: '图片链接无效，请重新解析'
            });
            return;
        }

        // 使用重试机制下载图片
        this.downloadFileWithRetry(imageUrl, 3, false);
    },
    // 保存所有图片 - 修改这个方法使用重试机制
    saveAllPics() {
        if (!this.data.resultPics || this.data.resultPics.length === 0) {
            Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: '没有可保存的图片'
            });
            return;
        }

        wx.showLoading({
            title: '正在保存图片...',
        });

        let successCount = 0;
        let failCount = 0;
        let totalCount = this.data.resultPics.length;
        let processedCount = 0;

        // 逐个下载图片
        this.data.resultPics.forEach((url, index) => {
            setTimeout(() => {
                // 检查是否是云存储文件ID
                if (url.startsWith('cloud://')) {
                    // 使用云文件ID下载
                    wx.cloud.downloadFile({
                        fileID: url,
                        success: res => {
                            this.saveImageToAlbum(res.tempFilePath, () => {
                                successCount++;
                                processedCount++;
                                this.checkAllImagesComplete(successCount, failCount, totalCount);
                            });
                        },
                        fail: err => {
                            console.error('云存储下载图片失败:', err);
                            failCount++;
                            processedCount++;
                            this.checkAllImagesComplete(successCount, failCount, totalCount);
                        }
                    });
                    return;
                }

                // 检查URL是否有效
                if (!this.isValidUrl(url)) {
                    console.error('图片URL无效:', url);
                    failCount++;
                    processedCount++;
                    this.checkAllImagesComplete(successCount, failCount, totalCount);
                    return;
                }

                // 确保URL有效
                let processedUrl = url;
                if (!url.startsWith('http')) {
                    if (url.startsWith('//')) {
                        processedUrl = 'https:' + url;
                    } else {
                        console.error('无效的URL格式:', url);
                        failCount++;
                        processedCount++;
                        this.checkAllImagesComplete(successCount, failCount, totalCount);
                        return;
                    }
                }

                wx.downloadFile({
                    url: processedUrl,
                    success: downloadRes => {
                        if (downloadRes.statusCode === 200) {
                            this.saveImageToAlbum(downloadRes.tempFilePath, () => {
                                successCount++;
                                processedCount++;
                                this.checkAllImagesComplete(successCount, failCount, totalCount);
                            });
                        } else {
                            console.error('下载图片失败，状态码:', downloadRes.statusCode);
                            failCount++;
                            processedCount++;
                            this.checkAllImagesComplete(successCount, failCount, totalCount);
                        }
                    },
                    fail: err => {
                        console.error('下载图片失败:', err);
                        failCount++;
                        processedCount++;
                        this.checkAllImagesComplete(successCount, failCount, totalCount);
                    }
                });
            }, index * 500);
        });
    },
    // 检查所有图片是否处理完成
    checkAllImagesComplete(successCount, failCount, totalCount) {
        // 所有图片处理完成后显示结果
        if (successCount + failCount === totalCount) {
            wx.hideLoading();
            if (failCount === 0) {
                Toast({
                    context: this,
                    selector: '#t-toast',
                    message: `已成功保存${successCount}张图片`,
                    theme: 'success',
                    direction: 'column'
                });
            } else if (successCount === 0) {
                Message.error({
                    context: this,
                    offset: [20, 32],
                    duration: 3000,
                    content: '所有图片保存失败，请重试'
                });
            } else {
                Message.warning({
                    context: this,
                    offset: [20, 32],
                    duration: 3000,
                    content: `成功保存${successCount}张图片，${failCount}张保存失败`
                });
            }
        }
    },

    // 显示授权提示弹窗
    showAuthModal(operation) {
        wx.showModal({
            title: '授权提示',
            content: `需要您授权${operation}权限，是否前往设置打开权限？`,
            confirmText: '去设置',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    wx.openSetting({
                        success: (settingRes) => {
                            console.log('设置结果', settingRes);
                        }
                    });
                }
            }
        });
    },
    /**
     * 保存视频到相册
     */
    saveVideoToAlbum(filePath) {
        wx.saveVideoToPhotosAlbum({
            filePath: filePath,
            success: () => {
                Toast({
                    context: this,
                    selector: '#t-toast',
                    message: '视频已保存到相册',
                    theme: 'success',
                    direction: 'column'
                });
            },
            fail: (err) => {
                console.error('保存视频失败', err);
                Message.error({
                    context: this,
                    offset: [20, 32],
                    duration: 3000,
                    content: '保存视频失败，请检查权限设置'
                });
            }
        });
    },
    /**
     * 保存图片到相册
     * @param {String} url 图片链接
     */
    saveImageToAlbum(url) {
        if (!url) {
            Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: '图片链接为空，无法保存'
            });
            return;
        }

        wx.showLoading({
            title: '正在保存...',
        });

        // 先下载图片到本地临时文件
        wx.downloadFile({
            url: url,
            success: (res) => {
                if (res.statusCode === 200) {
                    // 保存图片到相册
                    wx.saveImageToPhotosAlbum({
                        filePath: res.tempFilePath,
                        success: () => {
                            wx.hideLoading();
                            Toast({
                                context: this,
                                selector: '#t-toast',
                                message: '图片已保存到相册',
                                theme: 'success',
                                direction: 'column'
                            });
                        },
                        fail: (err) => {
                            wx.hideLoading();
                            console.error('保存图片失败', err);
                            // 如果是用户拒绝授权导致的失败
                            if (err.errMsg.indexOf('auth deny') >= 0 || err.errMsg.indexOf('authorize') >= 0) {
                                this.showAuthModal();
                            } else {
                                Message.error({
                                    context: this,
                                    offset: [20, 32],
                                    duration: 3000,
                                    content: '保存图片失败，请重试'
                                });
                            }
                        }
                    });
                } else {
                    wx.hideLoading();
                    Message.error({
                        context: this,
                        offset: [20, 32],
                        duration: 3000,
                        content: '下载图片失败，请重试'
                    });
                }
            },
            fail: (err) => {
                wx.hideLoading();
                console.error('下载图片失败', err);
                Message.error({
                    context: this,
                    offset: [20, 32],
                    duration: 3000,
                    content: '下载图片失败，请检查网络连接'
                });
            }
        });
    },
    // 图文时下载单张图片
    downloadImageViaCloudFunction(e) {
        const url = e.currentTarget.dataset.url;
        wx.showLoading({
            title: '正在保存图片...',
        });
        this.saveImageToPhone(url);
    },
    // 添加在checkAllImagesComplete方法后面
    saveToHistory(historyItem) {
        console.log('保存到历史记录:', historyItem);

        // 从本地存储获取历史记录
        const historyStorage = wx.getStorageSync('videoHistory') || [];

        // 检查是否已存在相同URL的记录
        const existingIndex = historyStorage.findIndex(item => item.url === historyItem.url);

        if (existingIndex >= 0) {
            // 如果已存在，更新时间
            historyStorage[existingIndex].time = historyItem.time;
        } else {
            // 如果不存在，添加到历史记录开头
            historyStorage.unshift(historyItem);

            // 限制历史记录数量，最多保存50条
            if (historyStorage.length > 50) {
                historyStorage.pop();
            }
        }

        // 保存到本地存储
        wx.setStorageSync('videoHistory', historyStorage);
    },
})

