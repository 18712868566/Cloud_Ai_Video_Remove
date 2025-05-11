// 云函数入口文件
const cloud = require('wx-server-sdk')
const request = require('request-promise')
const path = require('path')
const crypto = require('crypto')
const cheerio = require('cheerio')

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

    // 如果API解析成功，上传视频、封面和图片到云存储
    if (response && response.data) {
      const data = response.data;
      let result = {
        title: data.title || '',
        duration: data.duration || '',
      };

      // 上传视频到云存储
      if (data.video_url) {
        try {
          const videoUploadResult = await uploadToCloud(data.video_url, 'video');
          result.video_fileID = videoUploadResult.fileID; // 返回fileID而不是临时URL
          result.originalVideoUrl = data.video_url;
        } catch (error) {
          console.error('上传视频失败:', error);
          result.video_url = data.video_url; // 如果上传失败，使用原始链接
          result.video_upload_error = error.message;
        }
      }

      // 上传封面到云存储
      if (data.cover_url) {
        try {
          const coverUploadResult = await uploadToCloud(data.cover_url, 'image');
          result.cover_fileID = coverUploadResult.fileID; // 返回fileID而不是临时URL
          result.originalCoverUrl = data.cover_url;
        } catch (error) {
          console.error('上传封面失败:', error);
          result.cover_url = data.cover_url; // 如果上传失败，使用原始链接
          result.cover_upload_error = error.message;
        }
      }

      // 上传图片集到云存储
      if (data.pics && Array.isArray(data.pics) && data.pics.length > 0) {
        result.pics_fileIDs = []; // 存储fileID数组
        result.originalPics = data.pics;

        for (let i = 0; i < data.pics.length; i++) {
          try {
            const picUploadResult = await uploadToCloud(data.pics[i], 'image');
            result.pics_fileIDs.push(picUploadResult.fileID);
          } catch (error) {
            console.error(`上传图片${i + 1}失败:`, error);
            result.pics_fileIDs.push(null); // 如果上传失败，添加null
          }
        }
      }

      return {
        code: 200,
        data: result,
        msg: 'success'
      }
    }

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

// 上传文件到云存储的函数
async function uploadToCloud(url, fileType = 'video') {
  if (!url) {
    throw new Error('请提供文件URL');
  }

  console.log(`开始处理${fileType}:`, url);

  // 生成唯一文件名
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const md5 = crypto.createHash('md5').update(url).digest('hex');

  let fileExtension = '.mp4';
  if (fileType === 'image') {
    // 根据URL判断图片类型
    if (url.includes('.jpg') || url.includes('.jpeg')) {
      fileExtension = '.jpg';
    } else if (url.includes('.png')) {
      fileExtension = '.png';
    } else if (url.includes('.gif')) {
      fileExtension = '.gif';
    } else if (url.includes('.webp')) {
      fileExtension = '.webp';
    } else {
      fileExtension = '.jpg'; // 默认jpg
    }
  }

  const cloudPath = `${fileType}/${timestamp}_${randomStr}_${md5.substring(0, 8)}${fileExtension}`;

  // 提取URL的域名，用于Referer
  let referer = '';
  let origin = '';
  try {
    const urlObj = new URL(url);
    referer = `${urlObj.protocol}//${urlObj.hostname}`;
    origin = referer;
  } catch (e) {
    referer = 'https://www.baidu.com';
    origin = 'https://www.baidu.com';
  }

  // 检查URL是否是视频直链还是网页链接
  let finalVideoUrl = url;
  let fileContent;

  // 如果是视频类型且URL不是明显的视频文件链接，尝试从网页中提取视频链接
  if (fileType === 'video' && !isDirectVideoLink(url)) {
    try {
      console.log('URL可能是网页链接，尝试提取视频直链');

      // 获取网页内容
      const htmlContent = await request({
        url: url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': referer,
          'Origin': origin
        },
        timeout: 30000
      });

      // 从HTML中提取视频链接
      const extractedUrl = extractVideoUrl(htmlContent, url);

      if (extractedUrl) {
        console.log('成功从网页中提取到视频链接:', extractedUrl);
        finalVideoUrl = extractedUrl;
      } else {
        console.log('未能从网页中提取到视频链接，将使用原始URL');
      }
    } catch (extractError) {
      console.error('提取视频链接失败:', extractError);
      console.log('将使用原始URL继续尝试下载');
    }
  }

  // 下载文件
  try {
    console.log(`开始下载文件:`, finalVideoUrl);

    // 尝试使用更多的请求头
    fileContent = await request({
      url: finalVideoUrl,
      encoding: null, // 返回buffer
      timeout: 60000, // 60秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': referer,
        'Origin': origin,
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': fileType === 'video' ? 'video' : 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'Range': 'bytes=0-'
      },
      followRedirect: true,
      maxRedirects: 5,
      resolveWithFullResponse: true // 获取完整响应，包括状态码
    });

    // 检查响应状态码
    if (fileContent.statusCode !== 200 && fileContent.statusCode !== 206) {
      throw new Error(`下载失败，状态码: ${fileContent.statusCode}`);
    }

    fileContent = fileContent.body;
  } catch (downloadError) {
    console.error('直接下载失败，尝试使用备用方法:', downloadError);

    // 尝试使用不同的User-Agent
    try {
      // 使用移动设备的User-Agent
      fileContent = await request({
        url: finalVideoUrl,
        encoding: null,
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
          'Accept': '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Referer': referer,
          'Origin': origin
        },
        followRedirect: true,
        maxRedirects: 5
      });
    } catch (secondError) {
      console.error('备用方法也失败，尝试最后的方法:', secondError);

      // 最后尝试使用简单的请求
      try {
        fileContent = await request({
          url: finalVideoUrl,
          encoding: null,
          timeout: 60000,
          simple: true
        });
      } catch (finalError) {
        console.error('所有下载方法都失败:', finalError);
        throw new Error(`无法下载文件: ${finalError.message}`);
      }
    }
  }

  // 检查文件内容是否为空
  if (!fileContent || fileContent.length === 0) {
    throw new Error('下载的文件内容为空');
  }

  console.log(`文件下载成功，大小: ${fileContent.length} 字节`);

  // 上传到云存储
  const uploadResult = await cloud.uploadFile({
    cloudPath: cloudPath,
    fileContent: fileContent
  });

  console.log('上传成功，fileID:', uploadResult.fileID);

  // 获取临时访问链接
  const tempUrlResult = await cloud.getTempFileURL({
    fileList: [uploadResult.fileID]
  });

  // 确保临时URL获取成功
  if (!tempUrlResult.fileList || !tempUrlResult.fileList[0] || !tempUrlResult.fileList[0].tempFileURL) {
    throw new Error('获取临时文件URL失败');
  }

  const tempFileURL = tempUrlResult.fileList[0].tempFileURL;
  console.log('获取临时文件URL成功:', tempFileURL);

  return {
    fileID: uploadResult.fileID,
    tempFileURL: tempFileURL,
    originalUrl: url,
  };
}

// 判断URL是否是视频直链
function isDirectVideoLink(url) {
  const videoExtensions = ['.mp4', '.m3u8', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm'];
  const videoParams = ['video', 'media', 'play', 'stream'];

  // 检查URL是否包含视频扩展名
  for (const ext of videoExtensions) {
    if (url.includes(ext)) {
      return true;
    }
  }

  // 检查URL是否包含视频相关参数
  for (const param of videoParams) {
    if (url.includes(param)) {
      return true;
    }
  }

  // 检查特定平台的视频URL特征
  if (
    url.includes('vd') ||
    url.includes('video') ||
    url.includes('media') ||
    url.includes('stream') ||
    url.includes('cdn') ||
    url.includes('mp4')
  ) {
    return true;
  }

  return false;
}

// 从HTML中提取视频URL
function extractVideoUrl(html, baseUrl) {
  try {
    const $ = cheerio.load(html);

    // 尝试查找视频标签
    let videoUrl = '';

    // 查找video标签的src属性
    $('video').each(function () {
      const src = $(this).attr('src');
      if (src && (src.includes('.mp4') || src.includes('blob:') || src.includes('http'))) {
        videoUrl = src;
        return false; // 跳出循环
      }

      // 查找source标签
      $(this).find('source').each(function () {
        const src = $(this).attr('src');
        if (src && (src.includes('.mp4') || src.includes('blob:') || src.includes('http'))) {
          videoUrl = src;
          return false; // 跳出循环
        }
      });
    });

    // 如果没找到，查找包含video或mp4的script标签
    if (!videoUrl) {
      $('script').each(function () {
        const content = $(this).html();
        if (content) {
          // 尝试匹配常见的视频URL模式
          const urlMatches = content.match(/(https?:\/\/[^"'\s]+\.(?:mp4|m3u8)[^"'\s]*)/g);
          if (urlMatches && urlMatches.length > 0) {
            videoUrl = urlMatches[0];
            return false; // 跳出循环
          }

          // 尝试匹配JSON中的视频URL
          const jsonMatch = content.match(/["'](?:video_url|videoUrl|url|src)["']\s*:\s*["'](https?:\/\/[^"']+)["']/i);
          if (jsonMatch && jsonMatch[1]) {
            videoUrl = jsonMatch[1];
            return false; // 跳出循环
          }
        }
      });
    }

    // 如果找到了相对URL，转换为绝对URL
    if (videoUrl && !videoUrl.startsWith('http') && !videoUrl.startsWith('blob:')) {
      try {
        const urlObj = new URL(videoUrl, baseUrl);
        videoUrl = urlObj.href;
      } catch (e) {
        console.error('转换相对URL失败:', e);
      }
    }

    return videoUrl;
  } catch (error) {
    console.error('解析HTML提取视频URL失败:', error);
    return null;
  }
}