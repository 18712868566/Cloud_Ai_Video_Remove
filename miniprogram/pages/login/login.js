// pages/login/login.js
import Toast from 'tdesign-miniprogram/toast/index';
import Message from 'tdesign-miniprogram/message/index';

Page({
  data: {
    
  },

  onLoad(options) {
    // 获取来源页面路径，用于登录成功后跳转
    this.sourcePage = options.sourcePage || '/pages/home/home';
  },

  navigateBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  handleLogin() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '登录中...',
      theme: 'loading',
      direction: 'column',
      duration: 1000
    });

    // 模拟登录过程
    setTimeout(() => {
      // 保存登录状态
      wx.setStorageSync('isLoggedIn', true);
      wx.setStorageSync('userInfo', {
        nickName: '用户' + Math.floor(Math.random() * 10000),
        avatarUrl: '',
        loginTime: new Date().getTime()
      });

      Message.success({
        context: this,
        offset: [20, 32],
        duration: 2000,
        content: '登录成功'
      });

      // 延迟跳转，让用户看到登录成功的提示
      setTimeout(() => {
        // 跳转到来源页面
        if (this.sourcePage.startsWith('/')) {
          wx.switchTab({
            url: this.sourcePage,
            fail: () => {
              wx.navigateTo({
                url: this.sourcePage
              });
            }
          });
        } else {
          wx.navigateBack({
            delta: 1
          });
        }
      }, 1500);
    }, 1500);
  },

  navigateToPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    });
  },

  navigateToTerms() {
    wx.navigateTo({
      url: '/pages/terms/terms'
    });
  }
});