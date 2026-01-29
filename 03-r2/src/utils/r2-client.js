// R2 客户端封装
export function getR2Bucket(env) {
  if (!env.MY_BUCKET) {
    throw new Error('R2 bucket binding not found. Please check wrangler.toml');
  }
  return env.MY_BUCKET;
}

// R2 操作辅助函数
export const r2Utils = {
  // 生成对象键
  generateKey(filename, options = {}) {
    const { prefix = '', timestamp = true } = options;
    const ts = timestamp ? `${Date.now()}-` : '';
    return `${prefix}${ts}${filename}`.replace(/\/\//g, '/');
  },

  // 解析对象键
  parseKey(key) {
    const parts = key.split('/');
    return {
      path: parts.slice(0, -1).join('/'),
      filename: parts[parts.length - 1],
      extension: parts[parts.length - 1].split('.').pop()
    };
  },

  // 格式化对象大小
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },

  // 获取内容类型
  getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
      // 图片
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',

      // 文档
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

      // 视频
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',

      // 音频
      mp3: 'audio/mpeg',
      wav: 'audio/wav',

      // 文本
      txt: 'text/plain',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',

      // 压缩文件
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed'
    };

    return types[ext] || 'application/octet-stream';
  }
};

