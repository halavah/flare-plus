// 元数据操作 API
import { getKV } from '../utils/kv-helpers.js';
import { validateKey } from '../utils/validation.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';

export const handleMetadata = {
  // 获取键的元数据
  async get(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.match(/\/api\/kv\/(.+)\/metadata/)?.[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid key');
      }

      const kv = getKV(env);
      const { value, metadata } = await kv.getWithMetadata(key);

      if (value === null) {
        throw new NotFoundError('Key not found');
      }

      return new Response(JSON.stringify({
        success: true,
        key,
        metadata: metadata || {},
        hasValue: value !== null
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

  // 同时获取值和元数据
  async getWithValue(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.match(/\/api\/kv\/(.+)\/with-metadata/)?.[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid key');
      }

      const kv = getKV(env);
      const type = url.searchParams.get('type') || 'text';
      const { value, metadata } = await kv.getWithMetadata(key, type);

      if (value === null) {
        throw new NotFoundError('Key not found');
      }

      return new Response(JSON.stringify({
        success: true,
        key,
        value,
        metadata: metadata || {},
        type
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
  }
};

