// 批量操作 API
import { getKV } from '../utils/kv-helpers.js';
import { validateKey, validateValue } from '../utils/validation.js';
import { ValidationError } from '../middleware/error.js';

export const handleBatch = {
  // 批量获取
  async getMany(request, env) {
    try {
      const body = await request.json();
      const { keys } = body;

      if (!Array.isArray(keys) || keys.length === 0) {
        throw new ValidationError('keys array is required and must not be empty');
      }

      // 验证所有键
      for (const key of keys) {
        if (!validateKey(key)) {
          throw new ValidationError(`Invalid key: ${key}`);
        }
      }

      const kv = getKV(env);
      const results = [];

      // 并行获取
      await Promise.all(
        keys.map(async (key) => {
          try {
            const value = await kv.get(key, 'text');
            results.push({ key, value, found: value !== null });
          } catch (error) {
            results.push({ key, value: null, found: false, error: error.message });
          }
        })
      );

      const foundCount = results.filter(r => r.found).length;

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch get completed',
        total: results.length,
        found: foundCount,
        notFound: results.length - foundCount,
        results
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

  // 批量存储
  async putMany(request, env) {
    try {
      const body = await request.json();
      const { items } = body;

      if (!Array.isArray(items) || items.length === 0) {
        throw new ValidationError('items array is required and must not be empty');
      }

      // 验证所有项
      for (const item of items) {
        if (!validateKey(item.key)) {
          throw new ValidationError(`Invalid key: ${item.key}`);
        }
        if (!validateValue(item.value)) {
          throw new ValidationError(`Invalid value for key: ${item.key}`);
        }
      }

      const kv = getKV(env);
      const results = [];

      // 并行存储
      await Promise.all(
        items.map(async (item) => {
          try {
            const options = {};
            if (item.expirationTtl) options.expirationTtl = item.expirationTtl;
            if (item.metadata) options.metadata = item.metadata;

            const valueToStore = typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value);
            await kv.put(item.key, valueToStore, options);

            results.push({ key: item.key, success: true });
          } catch (error) {
            results.push({ key: item.key, success: false, error: error.message });
          }
        })
      );

      const successCount = results.filter(r => r.success).length;

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch put completed',
        total: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
        results
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

  // 批量删除
  async deleteMany(request, env) {
    try {
      const body = await request.json();
      const { keys } = body;

      if (!Array.isArray(keys) || keys.length === 0) {
        throw new ValidationError('keys array is required and must not be empty');
      }

      // 验证所有键
      for (const key of keys) {
        if (!validateKey(key)) {
          throw new ValidationError(`Invalid key: ${key}`);
        }
      }

      const kv = getKV(env);
      const results = [];

      // 并行删除
      await Promise.all(
        keys.map(async (key) => {
          try {
            await kv.delete(key);
            results.push({ key, success: true });
          } catch (error) {
            results.push({ key, success: false, error: error.message });
          }
        })
      );

      const successCount = results.filter(r => r.success).length;

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch delete completed',
        total: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
        results
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

