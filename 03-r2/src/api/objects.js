// 对象操作 API
import { getR2Bucket } from '../utils/r2-client.js';
import { validateKey } from '../utils/validation.js';

export const handleObjects = {
  // 列出所有对象
  async list(request, env) {
    try {
      const url = new URL(request.url);
      const prefix = url.searchParams.get('prefix') || '';
      const limit = parseInt(url.searchParams.get('limit')) || 1000;
      const cursor = url.searchParams.get('cursor');

      const bucket = getR2Bucket(env);

      const options = {
        limit,
        prefix
      };

      if (cursor) {
        options.cursor = cursor;
      }

      const listed = await bucket.list(options);

      return new Response(JSON.stringify({
        success: true,
        objects: listed.objects.map(obj => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded.toISOString(),
          httpEtag: obj.httpEtag
        })),
        truncated: listed.truncated,
        cursor: listed.cursor,
        delimitedPrefixes: listed.delimitedPrefixes || []
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

  // 获取对象（下载）
  async get(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.split('/api/objects/')[1];

      if (!validateKey(key)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid object key'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const bucket = getR2Bucket(env);
      const object = await bucket.get(key);

      if (!object) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Object not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 返回对象内容
      return new Response(object.body, {
        status: 200,
        headers: {
          'Content-Type': object.httpMetadata.contentType || 'application/octet-stream',
          'Content-Length': object.size.toString(),
          'ETag': object.httpEtag,
          'Last-Modified': object.uploaded.toUTCString()
        }
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

  // 上传对象
  async put(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.split('/api/objects/')[1];

      if (!validateKey(key)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid object key'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const bucket = getR2Bucket(env);
      const contentType = request.headers.get('Content-Type') || 'application/octet-stream';

      // 获取自定义元数据
      const customMetadata = {};
      for (const [key, value] of request.headers.entries()) {
        if (key.startsWith('x-amz-meta-')) {
          customMetadata[key.replace('x-amz-meta-', '')] = value;
        }
      }

      // 上传对象
      await bucket.put(key, request.body, {
        httpMetadata: {
          contentType
        },
        customMetadata
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Object uploaded successfully',
        key,
        contentType
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

  // 删除对象
  async delete(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.split('/api/objects/')[1];

      if (!validateKey(key)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid object key'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const bucket = getR2Bucket(env);
      await bucket.delete(key);

      return new Response(JSON.stringify({
        success: true,
        message: 'Object deleted successfully',
        key
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
  }
};

