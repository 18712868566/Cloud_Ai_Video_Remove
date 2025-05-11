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
      isLoggedIn: false,
      remainingCount: 0
    },
      // 检查登录状态
      this.checkLoginStatus();
  },
  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn') || false;
    const userInfo = wx.getStorageSync('userInfo') || null;
    const remainingCount = wx.getStorageSync('remainingCount') || 0;

    if (isLoggedIn && userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      this.globalData.remainingCount = remainingCount;
      return true;
    }
    return false;
  },
  // 添加保存用户信息的方法
  saveUserInfo(userInfo, remainingCount) {
    // 保存到全局数据
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
    this.globalData.remainingCount = remainingCount;

    // 同时保存到本地存储
    wx.setStorageSync('isLoggedIn', true);
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('remainingCount', remainingCount);
  },

  // 添加更新用户解析次数的方法
  updateRemainingCount(count) {
    this.globalData.remainingCount = count;
    wx.setStorageSync('remainingCount', count);
  },

  // 添加登出方法
  logout() {
    // 清除全局数据
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    this.globalData.remainingCount = 0;

    // 清除本地存储
    wx.removeStorageSync('isLoggedIn');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('remainingCount');
  }
});