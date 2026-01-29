// 速率限制管理 API
import { ValidationError } from '../middleware/error.js';

export const handleRateLimit = {
  // 重置速率限制
  async reset(request, env) {
    try {
      const url = new URL(request.url);
      const identifier = url.pathname.split('/api/rate-limit/reset/')[1];

      if (!identifier) {
        throw new ValidationError('Identifier is required');
      }

      // 从数据库中删除速率限制记录
      await env.TURNSTILE_DB.prepare(`
        DELETE FROM rate_limits
        WHERE identifier = ?
      `).bind(identifier).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Rate limit reset successfully',
        identifier
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 获取速率限制状态
  async status(request, env) {
    try {
      const url = new URL(request.url);
      const identifier = url.pathname.split('/api/rate-limit/status/')[1];

      if (!identifier) {
        throw new ValidationError('Identifier is required');
      }

      const now = Date.now();
      const windowStart = Math.floor(now / (parseInt(env.RATE_LIMIT_WINDOW) * 1000)) *
                          (parseInt(env.RATE_LIMIT_WINDOW) * 1000);

      const rateLimit = await env.TURNSTILE_DB.prepare(`
        SELECT attempts, window_start, created_at
        FROM rate_limits
        WHERE identifier = ?
      `).bind(identifier).first();

      if (!rateLimit) {
        return new Response(JSON.stringify({
          success: true,
          identifier,
          attempts: 0,
          remaining: parseInt(env.MAX_ATTEMPTS),
          resetAt: new Date(windowStart + parseInt(env.RATE_LIMIT_WINDOW) * 1000).toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 检查窗口是否过期
      const isExpired = rateLimit.window_start !== windowStart;
      const attempts = isExpired ? 0 : rateLimit.attempts;
      const remaining = Math.max(0, parseInt(env.MAX_ATTEMPTS) - attempts);

      return new Response(JSON.stringify({
        success: true,
        identifier,
        attempts,
        remaining,
        maxAttempts: parseInt(env.MAX_ATTEMPTS),
        resetAt: new Date(windowStart + parseInt(env.RATE_LIMIT_WINDOW) * 1000).toISOString(),
        blocked: remaining === 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  }
};

