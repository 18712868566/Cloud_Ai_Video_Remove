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
    const wxContext = cloud.getWXContext()
    
    if (!url) {
      return {
        code: 400,
        msg: '请提供图片链接'
      }
    }

    // 下载图片
    const response = await request({
      url: url,
      encoding: null
    })
    
    // 获取文件扩展名
    const ext = url.split('.').pop().split('?')[0] || 'jpg'
    
    // 上传到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: `images/${Date.now()}.${ext}`,
      fileContent: response
    })
    
    // 获取临时文件链接
    const fileList = [uploadResult.fileID]
    const result = await cloud.getTempFileURL({
      fileList
    })
    
    return {
      code: 200,
      data: {
        tempFileURL: result.fileList[0].tempFileURL,
        fileID: uploadResult.fileID
      },
      msg: 'success'
    }
  } catch (error) {
    console.error('下载图片失败:', error)
    return {
      code: 500,
      msg: '下载失败，请稍后再试',
      error: error.message
    }
  }
}