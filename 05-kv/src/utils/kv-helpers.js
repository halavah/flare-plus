// KV 操作辅助函数
export function getKV(env) {
  if (!env.MY_KV_NAMESPACE) {
    throw new Error('KV namespace binding not found. Please check wrangler.toml');
  }
  return env.MY_KV_NAMESPACE;
}

// 生成会话 ID
export function generateSessionId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
}

// 格式化键名
export function formatKey(prefix, key) {
  return prefix ? `${prefix}:${key}` : key;
}

// 解析键名
export function parseKey(fullKey) {
  const parts = fullKey.split(':');
  return {
    prefix: parts.length > 1 ? parts[0] : null,
    key: parts.length > 1 ? parts.slice(1).join(':') : parts[0]
  };
}

// 计算过期时间
export function calculateExpiration(ttl) {
  return Math.floor(Date.now() / 1000) + ttl;
}

// 检查是否过期
export function isExpired(expiration) {
  return expiration && expiration < Math.floor(Date.now() / 1000);
}

// KV 值序列化
export function serializeValue(value) {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

// KV 值反序列化
export function deserializeValue(value, type = 'auto') {
  if (!value) return null;

  if (type === 'json' || (type === 'auto' && value.startsWith('{') || value.startsWith('['))) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

