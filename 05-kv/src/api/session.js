// 会话管理 API
import { getKV } from '../utils/kv-helpers.js';
import { generateSessionId } from '../utils/kv-helpers.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';

export const handleSession = {
  // 创建会话
  async create(request, env) {
    try {
      const body = await request.json();
      const { userId, data, expiresIn } = body;

      if (!userId) {
        throw new ValidationError('userId is required');
      }

      const sessionId = generateSessionId();
      const now = new Date();
      const ttl = expiresIn || 1800; // 默认 30 分钟

      const sessionData = {
        sessionId,
        userId,
        data: data || {},
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
        ip: request.headers.get('CF-Connecting-IP'),
        userAgent: request.headers.get('User-Agent')
      };

      const kv = getKV(env);
      await kv.put(`session:${sessionId}`, JSON.stringify(sessionData), {
        expirationTtl: ttl
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Session created',
        sessionId,
        expiresIn: ttl
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

  // 获取会话
  async get(request, env) {
    try {
      const url = new URL(request.url);
      const sessionId = url.pathname.split('/api/sessions/')[1];

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      const kv = getKV(env);
      const sessionData = await kv.get(`session:${sessionId}`, 'json');

      if (!sessionData) {
        throw new NotFoundError('Session not found or expired');
      }

      return new Response(JSON.stringify({
        success: true,
        session: sessionData
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
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

  // 删除会话
  async delete(request, env) {
    try {
      const url = new URL(request.url);
      const sessionId = url.pathname.split('/api/sessions/')[1];

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      const kv = getKV(env);
      await kv.delete(`session:${sessionId}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Session deleted',
        sessionId
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

