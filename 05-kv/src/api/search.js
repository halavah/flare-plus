// 搜索操作 API
import { getKV } from '../utils/kv-helpers.js';
import { validatePrefix, validateLimit } from '../utils/validation.js';
import { ValidationError } from '../middleware/error.js';

export const handleSearch = {
  // 前缀搜索
  async searchByPrefix(request, env) {
    try {
      const url = new URL(request.url);
      const prefix = url.searchParams.get('prefix') || '';
      const limit = parseInt(url.searchParams.get('limit')) || 100;

      if (!prefix) {
        throw new ValidationError('prefix parameter is required');
      }

      if (!validatePrefix(prefix)) {
        throw new ValidationError('Invalid prefix');
      }

      if (!validateLimit(limit)) {
        throw new ValidationError('Invalid limit');
      }

      const kv = getKV(env);
      const listed = await kv.list({ prefix, limit });

      return new Response(JSON.stringify({
        success: true,
        prefix,
        total: listed.keys.length,
        list_complete: listed.list_complete,
        keys: listed.keys.map(key => ({
          name: key.name,
          expiration: key.expiration,
          metadata: key.metadata
        }))
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

