// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    isVip: true,
    userId: '12345678'
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },
  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = app.checkLoginStatus();
    if (isLoggedIn) {
      this.setData({
        isLoggedIn: true,
        userInfo: app.globalData.userInfo
      });
    } else {
      wx.navigateTo({
        url: '/pages/login/login?sourcePage=/pages/profile/profile'
      });
    }
  },
  // 退出登录·
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          wx.removeStorageSync('isLoggedIn');
          wx.removeStorageSync('userInfo');
          app.globalData.userInfo = null;

          this.setData({
            isLoggedIn: false,
            userInfo: null
          });

          // 跳转到登录页面
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  },
  // 编辑个人资料
  editProfile: function () {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 导航到会员详情
  navigateToMembership: function () {
    wx.navigateTo({
      url: '/pages/membership/membership'
    });
  },

  // 续费会员
  renewVip: function () {
    wx.navigateTo({
      url: '/pages/membership/membership?action=renew'
    });
  },

  // 分享应用
  shareApp: function () {
    // 不需要实现，因为使用了open-type="share"
  },

  // 联系客服
  contactService: function () {
    // 不需要实现，因为使用了open-type="contact"
  },
  // 添加分享方法
  onShareAppMessage: function () {
    return {
      title: '云端AI视频移除 - 一键去除视频水印',
      path: '/pages/home/home',
      imageUrl: '/images/share-image.png' // 请确保此图片存在
    }
  },
  // 邀请好友
  inviteFriends: function () {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 导航到常见问题
  navigateToFAQ: function () {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 联系客服
  contactService: function () {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },
  // 导航到常见问题-使用教程
  navigateToTutorial: function () {
    wx.navigateTo({
      url: '/pages/tutorial/tutorial'
    });
  },

  // 导航到解析记录
  navigateToHistory: function () {
    wx.navigateTo({
      url: '/pages/history/history'
    });
  },

  // 导航到意见反馈
  navigateToFeedback: function () {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 导航到系统设置
  navigateToSettings: function () {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  }
})