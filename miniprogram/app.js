// app.js
App({
  onLaunch() {
    // 初始化TDesign
    wx.loadFontFace({
      family: 'TDesign',
      source: 'url("https://tdesign.gtimg.com/miniprogram/fonts/TDesign-icon.ttf")',
      success: console.log
    });

    // 检查登录状态
    this.checkLoginStatus();
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false
  },

  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn') || false;
    const userInfo = wx.getStorageSync('userInfo') || null;

    if (isLoggedIn && userInfo) {
      this.globalData.userInfo = userInfo;
      return true;
    }
    return false;
  },
  // 导航前检查登录状态
  navigateWithLoginCheck(pageUrl) {
    if (this.checkLoginStatus()) {
      // 已登录，直接跳转
      if (pageUrl.startsWith('/pages/')) {
        // 判断是否为 tabBar 页面
        const tabBarPages = ['/pages/home/home', '/pages/tasks/tasks', '/pages/profile/profile'];
        if (tabBarPages.includes(pageUrl)) {
          wx.switchTab({
            url: pageUrl
          });
        } else {
          wx.navigateTo({
            url: pageUrl
          });
        }
      }
    } else {
      // 未登录，跳转到登录页面，并传递目标页面路径
      wx.navigateTo({
        url: `/pages/login/login?sourcePage=${encodeURIComponent(pageUrl)}`
      });
    }
  }
});