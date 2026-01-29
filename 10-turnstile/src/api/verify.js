// Turnstile 验证 API
import { validateSessionToken, generateSessionToken } from '../utils/session.js';
import { checkRateLimit } from '../utils/rate-limit.js';
import { logVerification, updateAnalytics } from '../utils/analytics.js';
import { ValidationError } from '../middleware/error.js';

export const handleVerify = {
  // 验证 Turnstile Token
  async verify(request, env) {
    try {
      const body = await request.json();
      const { token, action = 'verify', metadata = {} } = body;

      if (!token) {
        throw new ValidationError('Turnstile token is required');
      }

      // 获取客户端信息
      const clientIP = request.headers.get('CF-Connecting-IP');
      const userAgent = request.headers.get('User-Agent');

      // 检查速率限制
      const rateLimitResult = await checkRateLimit(clientIP, env);
      if (!rateLimitResult.allowed) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          attempts: rateLimitResult.attempts,
          resetAt: rateLimitResult.resetAt
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 调用 Turnstile API 验证 Token
      const verification = await verifyTurnstileToken(token, env, {
        remoteip: clientIP,
        action
      });

      // 记录验证结果
      await logVerification({
        token,
        success: verification.success,
        errorCodes: verification['error-codes'],
        ipAddress: clientIP,
        userAgent,
        action,
        metadata
      }, env);

      // 更新统计数据
      await updateAnalytics(env.TURNSTILE_SITE_KEY, verification.success, env);

      if (!verification.success) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Verification failed',
          errorCodes: verification['error-codes']
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 生成会话令牌
      const sessionToken = await generateSessionToken({
        verified: true,
        action: verification.action || action,
        challenge_ts: verification.challenge_ts,
        hostname: verification.hostname,
        ip: clientIP,
        userAgent,
        metadata
      }, env);

      return new Response(JSON.stringify({
        success: true,
        sessionToken,
        verification: {
          action: verification.action,
          hostname: verification.hostname,
          challenge_ts: verification.challenge_ts
        }
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
  },

  // 快速检查（仅验证不生成会话）
  async check(request, env) {
    try {
      const body = await request.json();
      const { token } = body;

      if (!token) {
        throw new ValidationError('Turnstile token is required');
      }

      const clientIP = request.headers.get('CF-Connecting-IP');

      // 验证 Token
      const verification = await verifyTurnstileToken(token, env, {
        remoteip: clientIP
      });

      return new Response(JSON.stringify({
        success: verification.success,
        verified: verification.success,
        errorCodes: verification['error-codes'] || []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  }
};

// 调用 Turnstile Siteverify API
async function verifyTurnstileToken(token, env, options = {}) {
  const formData = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token
  });

  if (options.remoteip) {
    formData.append('remoteip', options.remoteip);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Turnstile API error: ${response.statusText}`);
  }

  return await response.json();
}

