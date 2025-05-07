// app.js
App({
  onLaunch() {
    // 初始化TDesign
    wx.loadFontFace({
      family: 'TDesign',
      source: 'url("https://tdesign.gtimg.com/miniprogram/fonts/TDesign-icon.ttf")',
      success: console.log
    });

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-4gwhtw1l3224ada7',
        traceUser: true,
      })
    }
    this.globalData = {
      userInfo: null,
      isLoggedIn: false
    },
      // 检查登录状态
      this.checkLoginStatus();
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