// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
console.log(db);

const _ = db.command

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
      // 用户已存在，更新用户信息
      const user = userResult.data[0]
      await db.collection('users').doc(user._id).update({
        data: {
          userInfo: event.userInfo,
          updateTime: db.serverDate()
        }
      })
      
      return {
        code: 200,
        msg: '登录成功',
        remainingCount: user.remainingCount || 0
      }
    } else {
      // 用户不存在，创建新用户
      const result = await db.collection('users').add({
        data: {
          openid: openid,
          userInfo: event.userInfo,
          remainingCount: 10, // 新用户赠送10次解析机会
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      
      return {
        code: 200,
        msg: '登录成功',
        remainingCount: 10
      }
    }
  } catch (error) {
    console.error(error)
    return {
      code: 500,
      msg: '登录失败',
      error: error
    }
  }
}