// 缓存管理 API
import { getKV } from '../utils/kv-helpers.js';
import { validateKey, validateValue, validateTTL } from '../utils/validation.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';

export const handleCache = {
  // 设置缓存
  async set(request, env) {
    try {
      const body = await request.json();
      const { key, value, ttl, strategy } = body;

      if (!validateKey(key)) {
        throw new ValidationError('Invalid key');
      }

      if (!validateValue(value)) {
        throw new ValidationError('Invalid value');
      }

      const cacheTtl = ttl || 3600; // 默认 1 小时
      if (!validateTTL(cacheTtl)) {
        throw new ValidationError('Invalid TTL');
      }

      const kv = getKV(env);
      const cacheData = {
        value,
        strategy: strategy || 'standard',
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + cacheTtl * 1000).toISOString()
      };

      await kv.put(`cache:${key}`, JSON.stringify(cacheData), {
        expirationTtl: cacheTtl,
        metadata: { strategy, cachedAt: cacheData.cachedAt }
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Cache set successfully',
        key,
        ttl: cacheTtl,
        strategy
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

  // 获取缓存
  async get(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.split('/api/cache/')[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid key');
      }

      const kv = getKV(env);
      const cacheData = await kv.get(`cache:${key}`, 'json');

      if (!cacheData) {
        throw new NotFoundError('Cache not found or expired');
      }

      return new Response(JSON.stringify({
        success: true,
        key,
        value: cacheData.value,
        strategy: cacheData.strategy,
        cachedAt: cacheData.cachedAt,
        expiresAt: cacheData.expiresAt
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

  // 删除缓存
  async delete(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.split('/api/cache/')[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid key');
      }

      const kv = getKV(env);
      await kv.delete(`cache:${key}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Cache deleted',
        key
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

