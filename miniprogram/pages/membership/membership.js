// pages/membership/membership.js
Page({
  data: {
    selectedPlan: 'yearly', // 默认选择年度会员
    videoUrl: '',
  },

  onLoad(options) {
    // 如果有传递action参数，可以进行相应处理
    if (options.action === 'renew') {
      wx.showToast({
        title: '续费会员',
        icon: 'none'
      });
    }
  },

  // 选择套餐
  selectPlan(e) {
    const plan = e.currentTarget.dataset.plan;
    this.setData({
      selectedPlan: plan
    });
  },

  // 处理购买
  handlePurchase() {
    const plan = this.data.selectedPlan;
    const price = plan === 'monthly' ? '19.9' : '99.9';
    
    wx.showModal({
      title: '确认购买',
      content: `您选择了${plan === 'monthly' ? '月度' : '年度'}会员，价格为¥${price}，是否确认购买？`,
      success: (res) => {
        if (res.confirm) {
          // 这里应该调用支付接口
          wx.showLoading({
            title: '处理中',
          });
          
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '购买成功',
              icon: 'success',
              duration: 2000,
              success: () => {
                setTimeout(() => {
                  wx.navigateBack();
                }, 2000);
              }
            });
          }, 1500);
        }
      }
    });
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack();
  },

  // 以下是原有的方法，保留以便页面正常工作
  onInputChange(e) {
    this.setData({
      videoUrl: e.detail.value
    });
  },

  handlePaste() {
    wx.getClipboardData({
      success: (res) => {
        this.setData({
          videoUrl: res.data
        });
        wx.showToast({
          title: '粘贴成功',
          icon: 'success'
        });
      }
    });
  },

  handleClear() {
    this.setData({
      videoUrl: ''
    });
  },

  handleParse() {
    if (!this.data.videoUrl) {
      wx.showToast({
        title: '请输入视频链接',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/process/process?url=' + encodeURIComponent(this.data.videoUrl)
    });
  },

  navigateToTutorial() {
    wx.navigateTo({
      url: '/pages/tutorial/tutorial'
    });
  },

  navigateToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    });
  },

  handleInvite() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
})