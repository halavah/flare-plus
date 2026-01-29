// 参数验证工具
export function validateKey(key) {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // 键不能为空
  if (key.trim().length === 0) {
    return false;
  }

  // 键长度限制（512 字节）
  if (new TextEncoder().encode(key).length > 512) {
    return false;
  }

  return true;
}

export function validateValue(value) {
  if (value === null || value === undefined) {
    return false;
  }

  // 值大小限制（25 MB）
  const size = new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value)).length;
  if (size > 25 * 1024 * 1024) {
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
  return !isNaN(num) && num > 0 && num <= 1000;
}

export function validateTTL(ttl) {
  const num = parseInt(ttl);
  // 60 秒到 2 年
  return !isNaN(num) && num >= 60 && num <= 63072000;
}

export function validateMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  // 元数据大小限制（1024 字节）
  const size = new TextEncoder().encode(JSON.stringify(metadata)).length;
  if (size > 1024) {
    return false;
  }

  return true;
}

