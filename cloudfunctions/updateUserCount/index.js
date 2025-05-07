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
    // 查询用户
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()
    
    if (userResult.data.length > 0) {
      // 用户存在，更新解析次数
      const user = userResult.data[0]
      await db.collection('users').doc(user._id).update({
        data: {
          remainingCount: event.count,
          updateTime: db.serverDate()
        }
      })
      
      return {
        code: 200,
        msg: '更新成功'
      }
    } else {
      return {
        code: 404,
        msg: '用户不存在'
      }
    }
  } catch (error) {
    console.error(error)
    return {
      code: 500,
      msg: '更新失败',
      error: error
    }
  }
}