// 速率限制 API
import { getKV } from '../utils/kv-helpers.js';
import { ValidationError } from '../middleware/error.js';

export const handleRateLimit = {
  // 检查速率限制
  async check(request, env) {
    try {
      const body = await request.json();
      const { identifier, limit, window } = body;

      if (!identifier) {
        throw new ValidationError('identifier is required');
      }

      const maxRequests = limit || 100;
      const windowMs = (window || 60) * 1000; // 转换为毫秒
      const currentWindow = Math.floor(Date.now() / windowMs);
      const key = `ratelimit:${identifier}:${currentWindow}`;

      const kv = getKV(env);
      const current = parseInt(await kv.get(key)) || 0;

      if (current >= maxRequests) {
        return new Response(JSON.stringify({
          success: true,
          allowed: false,
          limit: maxRequests,
          remaining: 0,
          resetTime: (currentWindow + 1) * windowMs,
          message: 'Rate limit exceeded'
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': ((currentWindow + 1) * windowMs).toString()
          }
        });
      }

      // 增加计数
      const newCount = current + 1;
      await kv.put(key, String(newCount), {
        expirationTtl: Math.ceil(windowMs / 1000) + 1
      });

      return new Response(JSON.stringify({
        success: true,
        allowed: true,
        limit: maxRequests,
        remaining: maxRequests - newCount,
        resetTime: (currentWindow + 1) * windowMs
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': (maxRequests - newCount).toString(),
          'X-RateLimit-Reset': ((currentWindow + 1) * windowMs).toString()
        }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // 获取速率限制统计
  async getStats(request, env) {
    try {
      const url = new URL(request.url);
      const identifier = url.pathname.split('/api/rate-limit/stats/')[1];

      if (!identifier) {
        throw new ValidationError('identifier is required');
      }

      // 获取当前窗口的计数
      const window = url.searchParams.get('window') || 60;
      const windowMs = parseInt(window) * 1000;
      const currentWindow = Math.floor(Date.now() / windowMs);
      const key = `ratelimit:${identifier}:${currentWindow}`;

      const kv = getKV(env);
      const current = parseInt(await kv.get(key)) || 0;

      return new Response(JSON.stringify({
        success: true,
        identifier,
        current,
        window: parseInt(window),
        resetTime: (currentWindow + 1) * windowMs
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

