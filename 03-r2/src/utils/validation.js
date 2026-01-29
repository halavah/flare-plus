// 参数验证工具
export function validateKey(key) {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // 键不能为空
  if (key.trim().length === 0) {
    return false;
  }

  // 键不能包含特殊字符
  const invalidChars = /[<>"|?*\x00-\x1F]/;
  if (invalidChars.test(key)) {
    return false;
  }

  // 键长度限制
  if (key.length > 1024) {
    return false;
  }

  return true;
}

export function validatePrefix(prefix) {
  if (!prefix) {
    return true; // 空前缀有效
  }

  return validateKey(prefix);
}

export function validateLimit(limit) {
  const num = parseInt(limit);
  return !isNaN(num) && num > 0 && num <= 10000;
}

export function validateContentType(contentType) {
  if (!contentType || typeof contentType !== 'string') {
    return false;
  }

  // 基本的 MIME 类型验证
  const mimePattern = /^[a-z]+\/[a-z0-9\-\+\.]+$/i;
  return mimePattern.test(contentType);
}

export function validateMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  // 检查元数据大小
  const metadataStr = JSON.stringify(metadata);
  if (metadataStr.length > 2048) {
    return false;
  }

  return true;
}

export function validateExpiresIn(expiresIn) {
  const num = parseInt(expiresIn);
  // 1 分钟到 7 天
  return !isNaN(num) && num >= 60 && num <= 604800;
}

