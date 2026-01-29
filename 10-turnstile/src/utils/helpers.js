// 通用工具函数
export function generateUUID() {
  return crypto.randomUUID();
}

export function getCurrentTimestamp() {
  return Date.now();
}

export function formatDate(timestamp) {
  return new Date(timestamp).toISOString();
}

export function calculateExpiration(durationSeconds) {
  return Date.now() + (durationSeconds * 1000);
}

export function isExpired(expiresAt) {
  return Date.now() > expiresAt;
}

export function parseUserAgent(userAgentString) {
  // 简单的 User-Agent 解析
  const ua = userAgentString || '';
  return {
    browser: ua.includes('Chrome') ? 'Chrome' :
             ua.includes('Firefox') ? 'Firefox' :
             ua.includes('Safari') ? 'Safari' : 'Unknown',
    os: ua.includes('Windows') ? 'Windows' :
        ua.includes('Mac') ? 'MacOS' :
        ua.includes('Linux') ? 'Linux' : 'Unknown',
    mobile: ua.includes('Mobile') || ua.includes('Android')
  };
}

