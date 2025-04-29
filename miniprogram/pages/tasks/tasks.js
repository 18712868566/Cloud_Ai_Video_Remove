// pages/tasks/tasks.js
import Toast from 'tdesign-miniprogram/toast/index';

const app = getApp();

Page({
  data: {
    tasks: [
      {
        id: 0,
        title: '登录即享',
        desc: '新人福利',
        reward: '解析视频次数 +10',
        completed: true
      },
      {
        id: 1,
        title: '每日签到',
        desc: '连续签到奖励更多',
        reward: '解析视频次数 +1',
        completed: false
      },
      {
        id: 2,
        title: '邀请好友',
        desc: '邀请一位好友使用小程序',
        reward: '解析视频次数 +3',
        completed: false
      }
    ]
  },

  onLoad() {
    // 检查登录状态
    if (!app.checkLoginStatus()) {
      wx.navigateTo({
        url: '/pages/login/login?sourcePage=/pages/tasks/tasks'
      });
    }
  },

  completeTask(e) {
    const taskId = e.currentTarget.dataset.id;
    const tasks = this.data.tasks;
    
    // 更新任务状态
    tasks.forEach(task => {
      if (task.id === taskId) {
        task.completed = true;
      }
    });
    
    // 计算完成进度
    const completedCount = tasks.filter(task => task.completed).length;
    const progress = Math.floor((completedCount / tasks.length) * 100);
    
    this.setData({
      tasks,
      progress
    });
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: '任务完成',
      theme: 'success',
      direction: 'column'
    });
  }
});