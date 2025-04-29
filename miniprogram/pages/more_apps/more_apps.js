// pages/more_apps/more_apps.js
Page({
  data: {
    
  },

  onLoad: function(options) {
    
  },

  // 导航到特定应用
  navigateToApp: function(e) {
    const app = e.currentTarget.dataset.app;
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 导航到解析记录
  navigateToHistory: function() {
    wx.navigateTo({
      url: '/pages/history/history'
    });
  }
})