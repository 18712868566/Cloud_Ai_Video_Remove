// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 查询用户是否存在
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()
    
    if (userResult.data.length > 0) {
      // 用户存在，返回用户信息
      const userData = userResult.data[0]
      return {
        code: 200,
        msg: '用户已登录',
        data: {
          userInfo: {
            openid: userData.openid,
            nickName: userData.nickName,
            avatarUrl: userData.avatarUrl
          },
          remainingCount: userData.remainingCount || 0
        }
      }
    } else {
      // 用户不存在
      return {
        code: 401,
        msg: '用户未登录',
        data: null
      }
    }
  } catch (err) {
    console.error('检查登录状态失败', err)
    return {
      code: 500,
      msg: '检查登录状态失败',
      error: err
    }
  }
}