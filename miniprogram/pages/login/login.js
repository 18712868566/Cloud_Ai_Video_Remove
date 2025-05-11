// pages/login/login.js
import Toast from 'tdesign-miniprogram/toast/index';
import Message from 'tdesign-miniprogram/message/index';
const app = getApp();

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

    // 获取用户信息
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log(res);
        
        const userInfo = res.userInfo;
        
        // 调用登录云函数
        wx.cloud.callFunction({
          name: 'login',
          data: {
            userInfo: userInfo
          },
          success: (res) => {
            if (res.result && res.result.code === 200) {
              const data = res.result.data;
              
              // 使用全局方法保存用户信息
              app.saveUserInfo(data.userInfo, data.remainingCount);
              
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
            } else {
              Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: res.result.msg || '登录失败，请重试'
              });
            }
          },
          fail: (err) => {
            console.error('调用登录云函数失败', err);
            Message.error({
              context: this,
              offset: [20, 32],
              duration: 3000,
              content: '网络请求失败，请检查网络连接'
            });
          }
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '已取消登录',
          theme: 'error',
          direction: 'column'
        });
      }
    });
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