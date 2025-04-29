// pages/settings/settings.js
import Toast from 'tdesign-miniprogram/toast/index';
import Dialog from 'tdesign-miniprogram/dialog/index';

Page({
  data: {
    cacheSize: '23.5MB',
    notificationEnabled: true
  },

  onLoad(options) {
    // 页面加载时的逻辑
  },

  navigateBack() {
    wx.navigateBack();
  },

  clearCache() {
    Dialog.confirm({
      title: '清理缓存',
      content: '确定要清理缓存吗？',
      confirmBtn: '确定',
      cancelBtn: '取消',
    }).then(() => {
      // 模拟清理缓存
      setTimeout(() => {
        this.setData({
          cacheSize: '0KB'
        });
        Toast({
          context: this,
          selector: '#t-toast',
          message: '缓存清理成功！',
          theme: 'success',
          direction: 'column'
        });
      }, 1000);
    });
  },

  managePermissions() {
    wx.showToast({
      title: '将跳转到微信小程序权限管理页面',
      icon: 'none'
    });
  },

  toggleNotification(e) {
    this.setData({
      notificationEnabled: e.detail.value
    });
  },

  navigateToHelp() {
    wx.navigateTo({
      url: '/pages/tutorial/tutorial'
    });
  },

  navigateToAbout() {
    wx.showToast({
      title: '关于我们页面开发中',
      icon: 'none'
    });
  },

  handleLogout() {
    Dialog.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmBtn: '确定',
      cancelBtn: '取消',
    }).then(() => {
      // 模拟退出登录
      Toast({
        context: this,
        selector: '#t-toast',
        message: '已退出登录',
        theme: 'success',
        direction: 'column'
      });
      
      // 返回到登录页或首页
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/home/home'
        });
      }, 1000);
    });
  }
});