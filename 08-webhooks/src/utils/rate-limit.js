// 速率限制工具
import { RateLimitError } from '../middleware/error.js';

export async function checkRateLimit(env, identifier, limit, window) {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - (window * 1000);

  // 获取当前计数
  const current = await env.WEBHOOKS_KV.get(key, 'json') || { count: 0, resetAt: now + (window * 1000) };

  // 如果窗口已过期，重置计数
  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + (window * 1000);
  }

  // 检查是否超限
  if (current.count >= limit) {
    throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil((current.resetAt - now) / 1000)} seconds`);
  }

  // 增加计数
  current.count++;
  await env.WEBHOOKS_KV.put(key, JSON.stringify(current), {
    expirationTtl: window
  });

  return {
    allowed: true,
    remaining: limit - current.count,
    resetAt: current.resetAt
  };
}

export function getRateLimitHeaders(result) {
  return {
    'X-RateLimit-Limit': result.limit || 100,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Reset': Math.floor(result.resetAt / 1000)
  };
}

