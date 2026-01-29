// 元数据操作 API
import { getR2Bucket } from '../utils/r2-client.js';
import { validateKey, validateMetadata } from '../utils/validation.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';

export const handleMetadata = {
  // 获取对象元数据
  async get(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.match(/\/api\/objects\/(.+)\/metadata/)?.[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid object key');
      }

      const bucket = getR2Bucket(env);
      const object = await bucket.head(key);

      if (!object) {
        throw new NotFoundError('Object not found');
      }

      return new Response(JSON.stringify({
        success: true,
        metadata: {
          key: object.key,
          size: object.size,
          uploaded: object.uploaded.toISOString(),
          httpEtag: object.httpEtag,
          httpMetadata: object.httpMetadata,
          customMetadata: object.customMetadata || {}
        }
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

  // 更新对象元数据
  async update(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.match(/\/api\/objects\/(.+)\/metadata/)?.[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid object key');
      }

      const body = await request.json();

      if (!validateMetadata(body.metadata)) {
        throw new ValidationError('Invalid metadata');
      }

      const bucket = getR2Bucket(env);

      // 检查对象是否存在
      const object = await bucket.head(key);
      if (!object) {
        throw new NotFoundError('Object not found');
      }

      // R2 不支持直接更新元数据，需要重新上传
      // 先获取对象内容
      const existingObject = await bucket.get(key);

      // 重新上传带新元数据
      await bucket.put(key, existingObject.body, {
        httpMetadata: body.httpMetadata || object.httpMetadata,
        customMetadata: body.metadata
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Metadata updated successfully',
        key,
        metadata: body.metadata
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

