// 通用工具函数
export function generateId() {
  return crypto.randomUUID();
}

export function getCurrentTimestamp() {
  return Date.now();
}

export function formatTimestamp(timestamp) {
  return new Date(timestamp).toISOString();
}

export function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return null;
  }
}

export function stringifyJSON(obj) {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    return null;
  }
}

export function truncateString(str, maxLength) {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '')
    .trim();
}

