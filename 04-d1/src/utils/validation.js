// 参数验证工具
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateAge(age) {
  const num = parseInt(age);
  return !isNaN(num) && num > 0 && num <= 120;
}

export function validateStatus(status) {
  const validStatuses = ['draft', 'published', 'archived'];
  return validStatuses.includes(status);
}

export function validateLimit(limit) {
  const num = parseInt(limit);
  return !isNaN(num) && num > 0 && num <= 1000;
}

export function validatePage(page) {
  const num = parseInt(page);
  return !isNaN(num) && num > 0;
}

export function validateId(id) {
  const num = parseInt(id);
  return !isNaN(num) && num > 0;
}

export function validateRequired(fields, data) {
  for (const field of fields) {
    if (!data[field]) {
      throw new Error(`${field} is required`);
    }
  }
  return true;
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // 移除潜在的 SQL 注入字符
  return input
    .replace(/'/g, "''")
    .trim();
}

