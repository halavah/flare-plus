// 批量操作 API
import { getR2Bucket } from '../utils/r2-client.js';
import { validateKey } from '../utils/validation.js';
import { ValidationError } from '../middleware/error.js';

export const handleBatch = {
  // 批量删除对象
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

      const bucket = getR2Bucket(env);
      const results = [];

      // 并行删除
      await Promise.all(
        keys.map(async (key) => {
          try {
            await bucket.delete(key);
            results.push({ key, success: true });
          } catch (error) {
            results.push({ key, success: false, error: error.message });
          }
        })
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch delete completed',
        total: results.length,
        succeeded: successCount,
        failed: failureCount,
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

  // 批量复制对象
  async copyMany(request, env) {
    try {
      const body = await request.json();
      const { operations } = body;

      if (!Array.isArray(operations) || operations.length === 0) {
        throw new ValidationError('operations array is required and must not be empty');
      }

      // 验证所有操作
      for (const op of operations) {
        if (!validateKey(op.sourceKey) || !validateKey(op.destinationKey)) {
          throw new ValidationError('Invalid source or destination key');
        }
      }

      const bucket = getR2Bucket(env);
      const results = [];

      // 并行复制
      await Promise.all(
        operations.map(async (op) => {
          try {
            // 获取源对象
            const sourceObject = await bucket.get(op.sourceKey);

            if (!sourceObject) {
              throw new Error('Source object not found');
            }

            // 复制到目标位置
            await bucket.put(op.destinationKey, sourceObject.body, {
              httpMetadata: sourceObject.httpMetadata,
              customMetadata: sourceObject.customMetadata
            });

            results.push({
              sourceKey: op.sourceKey,
              destinationKey: op.destinationKey,
              success: true
            });
          } catch (error) {
            results.push({
              sourceKey: op.sourceKey,
              destinationKey: op.destinationKey,
              success: false,
              error: error.message
            });
          }
        })
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch copy completed',
        total: results.length,
        succeeded: successCount,
        failed: failureCount,
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

