// 配置管理 API
import { ValidationError } from '../middleware/error.js';

// CORS 配置存储在 KV（如果可用）或内存中
let corsConfig = {
  allowedOrigins: ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Amz-Meta-*'],
  maxAge: 86400
};

export const handleConfig = {
  // 获取 CORS 配置
  async getCors(request, env) {
    try {
      // 如果有 KV 绑定，从 KV 读取
      if (env.CONFIG_KV) {
        const stored = await env.CONFIG_KV.get('cors_config', 'json');
        if (stored) {
          corsConfig = stored;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        config: corsConfig
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // 更新 CORS 配置
  async updateCors(request, env) {
    try {
      const body = await request.json();

      // 验证配置
      if (!Array.isArray(body.allowedOrigins)) {
        throw new ValidationError('allowedOrigins must be an array');
      }

      if (!Array.isArray(body.allowedMethods)) {
        throw new ValidationError('allowedMethods must be an array');
      }

      if (!Array.isArray(body.allowedHeaders)) {
        throw new ValidationError('allowedHeaders must be an array');
      }

      if (typeof body.maxAge !== 'number' || body.maxAge < 0) {
        throw new ValidationError('maxAge must be a positive number');
      }

      // 更新配置
      corsConfig = {
        allowedOrigins: body.allowedOrigins,
        allowedMethods: body.allowedMethods,
        allowedHeaders: body.allowedHeaders,
        maxAge: body.maxAge
      };

      // 如果有 KV 绑定，保存到 KV
      if (env.CONFIG_KV) {
        await env.CONFIG_KV.put('cors_config', JSON.stringify(corsConfig));
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'CORS configuration updated',
        config: corsConfig
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

