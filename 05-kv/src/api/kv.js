// 基础 KV 操作 API
import { getKV } from '../utils/kv-helpers.js';
import { validateKey, validateValue, validateTTL } from '../utils/validation.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';

export const handleKV = {
  // 获取键值
  async get(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.split('/api/kv/')[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid key');
      }

      const type = url.searchParams.get('type') || 'text';
      const kv = getKV(env);

      let value;
      switch (type) {
        case 'json':
          value = await kv.get(key, 'json');
          break;
        case 'arrayBuffer':
          value = await kv.get(key, 'arrayBuffer');
          break;
        case 'stream':
          value = await kv.get(key, 'stream');
          break;
        default:
          value = await kv.get(key, 'text');
      }

      if (value === null) {
        throw new NotFoundError('Key not found');
      }

      // 对于非文本类型，返回 JSON 格式
      if (type === 'json' || type === 'arrayBuffer') {
        return new Response(JSON.stringify({
          success: true,
          key,
          value,
          type
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 对于文本类型，直接返回值
      return new Response(value, {
        status: 200,
        headers: { 'Content-Type': type === 'json' ? 'application/json' : 'text/plain' }
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

  // 存储键值
  async put(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.split('/api/kv/')[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid key');
      }

      const body = await request.json();
      const { value, expirationTtl, expiration, metadata } = body;

      if (!validateValue(value)) {
        throw new ValidationError('Invalid value');
      }

      if (expirationTtl && !validateTTL(expirationTtl)) {
        throw new ValidationError('Invalid TTL value');
      }

      const kv = getKV(env);
      const options = {};

      if (expirationTtl) {
        options.expirationTtl = expirationTtl;
      }

      if (expiration) {
        options.expiration = expiration;
      }

      if (metadata) {
        options.metadata = metadata;
      }

      // 根据值类型决定如何存储
      const valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await kv.put(key, valueToStore, options);

      return new Response(JSON.stringify({
        success: true,
        message: 'Key stored successfully',
        key,
        expirationTtl: expirationTtl || null,
        metadata: metadata || null
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

  // 删除键
  async delete(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.split('/api/kv/')[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid key');
      }

      const kv = getKV(env);
      await kv.delete(key);

      return new Response(JSON.stringify({
        success: true,
        message: 'Key deleted successfully',
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

