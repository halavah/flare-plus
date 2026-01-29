// 会话管理 API
import { validateSessionToken as validateToken } from '../utils/session.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';

export const handleSession = {
  // 验证会话令牌
  async validate(request, env) {
    try {
      const body = await request.json();
      const { sessionToken } = body;

      if (!sessionToken) {
        throw new ValidationError('Session token is required');
      }

      const validation = await validateToken(sessionToken, env);

      if (!validation.valid) {
        return new Response(JSON.stringify({
          valid: false,
          reason: validation.reason
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        valid: true,
        session: {
          action: validation.session.action,
          verified: validation.session.verified,
          createdAt: new Date(validation.session.timestamp).toISOString(),
          expiresAt: new Date(validation.session.expiresAt).toISOString()
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 获取会话信息
  async get(request, env) {
    try {
      const url = new URL(request.url);
      const sessionToken = url.pathname.split('/api/session/')[1];

      if (!sessionToken) {
        throw new ValidationError('Session token is required');
      }

      const sessionData = await env.TURNSTILE_SESSIONS.get(`session:${sessionToken}`);

      if (!sessionData) {
        throw new NotFoundError('Session not found');
      }

      const session = JSON.parse(sessionData);

      return new Response(JSON.stringify({
        success: true,
        session: {
          verified: session.verified,
          action: session.action,
          createdAt: new Date(session.timestamp).toISOString(),
          expiresAt: new Date(session.expiresAt).toISOString(),
          metadata: session.metadata
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 删除会话
  async delete(request, env) {
    try {
      const url = new URL(request.url);
      const sessionToken = url.pathname.split('/api/session/')[1];

      if (!sessionToken) {
        throw new ValidationError('Session token is required');
      }

      await env.TURNSTILE_SESSIONS.delete(`session:${sessionToken}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Session deleted successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  }
};

