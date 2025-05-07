// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 查询用户是否已存在
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()
    
    if (userResult.data.length > 0) {
      // 用户已存在
      const user = userResult.data[0]
      return {
        isLoggedIn: true,
        userInfo: user.userInfo,
        remainingCount: user.remainingCount || 0
      }
    } else {
      // 用户不存在
      return {
        isLoggedIn: false
      }
    }
  } catch (error) {
    console.error(error)
    return {
      isLoggedIn: false,
      error: error
    }
  }
}