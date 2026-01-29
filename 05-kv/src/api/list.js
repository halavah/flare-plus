// 列表操作 API
import { getKV } from '../utils/kv-helpers.js';
import { validatePrefix, validateLimit } from '../utils/validation.js';
import { ValidationError } from '../middleware/error.js';

export const handleList = {
  // 列出所有键
  async list(request, env) {
    try {
      const url = new URL(request.url);
      const prefix = url.searchParams.get('prefix') || '';
      const limit = parseInt(url.searchParams.get('limit')) || 1000;
      const cursor = url.searchParams.get('cursor');

      if (prefix && !validatePrefix(prefix)) {
        throw new ValidationError('Invalid prefix');
      }

      if (!validateLimit(limit)) {
        throw new ValidationError('Invalid limit (must be between 1 and 1000)');
      }

      const kv = getKV(env);
      const options = {
        limit,
        prefix
      };

      if (cursor) {
        options.cursor = cursor;
      }

      const listed = await kv.list(options);

      return new Response(JSON.stringify({
        success: true,
        keys: listed.keys.map(key => ({
          name: key.name,
          expiration: key.expiration,
          metadata: key.metadata
        })),
        list_complete: listed.list_complete,
        cursor: listed.cursor,
        total: listed.keys.length
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

