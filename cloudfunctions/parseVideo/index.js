// 云函数入口文件
const cloud = require('wx-server-sdk')
const request = require('request-promise')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { url } = event
    
    if (!url) {
      return {
        code: 400,
        msg: '请提供视频链接'
      }
    }

    // 调用第三方API解析视频
    const token = 'bktuippakedwfmxmbyvvicr7juol1i' // 您的API密钥
    const apiUrl = `https://v3.alapi.cn/api/video/url?token=${token}&url=${encodeURIComponent(url)}`
    
    const response = await request({
      url: apiUrl,
      method: 'GET',
      json: true
    })
    
    return {
      code: 200,
      data: response.data,
      msg: 'success'
    }
  } catch (error) {
    console.error('解析视频失败:', error)
    return {
      code: 500,
      msg: '解析失败，请稍后再试',
      error: error.message
    }
  }
}