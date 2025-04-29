// pages/feedback/feedback.js
import Toast from 'tdesign-miniprogram/toast/index';
import Message from 'tdesign-miniprogram/message/index';

Page({
  data: {
    activeType: 0,
    feedbackContent: '',
    contentLength: 0
  },

  onLoad(options) {
    // 页面加载时的逻辑
  },

  navigateBack() {
    wx.navigateBack();
  },

  selectType(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      activeType: parseInt(index)
    });
  },

  onContentChange(e) {
    const content = e.detail.value;
    this.setData({
      feedbackContent: content,
      contentLength: content.length
    });
  },

  submitFeedback() {
    if (!this.data.feedbackContent.trim()) {
      Message.error({
        context: this,
        offset: [20, 32],
        duration: 3000,
        content: '请输入反馈内容'
      });
      return;
    }

    // 获取反馈类型
    const typeMap = ['功能建议', '使用问题', '体验问题', '其他问题'];
    const selectedType = typeMap[this.data.activeType];

    // 这里可以添加提交逻辑，例如发送到服务器
    Toast({
      context: this,
      selector: '#t-toast',
      message: '感谢您的反馈！',
      theme: 'success',
      direction: 'column'
    });

    // 重置表单
    this.setData({
      feedbackContent: '',
      contentLength: 0
    });
  }
});