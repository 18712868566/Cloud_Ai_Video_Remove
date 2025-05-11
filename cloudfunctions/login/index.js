// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
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
    
    let userData = null
    let remainingCount = 10 // 新用户默认解析次数
    
    if (userResult.data.length > 0) {
      // 用户已存在，获取用户数据
      userData = userResult.data[0]
      remainingCount = userData.remainingCount || 0
    } else {
      // 用户不存在，创建新用户
      const result = await db.collection('users').add({
        data: {
          openid: openid,
          nickName: event.userInfo ? event.userInfo.nickName : '用户' + openid.substring(0, 5),
          avatarUrl: event.userInfo ? event.userInfo.avatarUrl : '',
          remainingCount: remainingCount,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      
      // 获取新创建的用户数据
      const newUser = await db.collection('users').doc(result._id).get()
      userData = newUser.data

      console.log(userData);
      
    }
    
    return {
      code: 200,
      msg: '登录成功',
      data: {
        userInfo: {
          openid: userData.openid,
          nickName: userData.nickName,
          avatarUrl: userData.avatarUrl
        },
        remainingCount: remainingCount
      }
    }
  } catch (err) {
    console.error('登录失败', err)
    return {
      code: 500,
      msg: '登录失败',
      error: err
    }
  }
}