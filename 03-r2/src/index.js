// R2 API Worker - 主入口文件
import { Router } from 'itty-router';
import { handleObjects } from './api/objects.js';
import { handleMetadata } from './api/metadata.js';
import { handlePresigned } from './api/presigned.js';
import { handleMultipart } from './api/multipart.js';
import { handleBatch } from './api/batch.js';
import { handleConfig } from './api/config.js';
import { handleStats } from './api/stats.js';
import { cors } from './middleware/cors.js';
import { errorHandler } from './middleware/error.js';
import { logger } from './middleware/logger.js';

// 创建路由器
const router = Router();

// 应用全局中间件
router.all('*', cors);
router.all('*', logger);

// 系统路由
router.get('/', async (request, env) => {
  return new Response(JSON.stringify({
    service: 'R2 API Worker',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      objects: '/api/objects',
      metadata: '/api/objects/:key/metadata',
      presigned: '/api/objects/:key/presigned',
      multipart: '/api/objects/:key/multipart',
      batch: '/api/objects/batch',
      config: '/api/config',
      stats: '/api/stats'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

router.get('/api/health', async (request, env) => {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'R2 API is running',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// 对象操作路由
router.get('/api/objects', (request, env) => handleObjects.list(request, env));
router.get('/api/objects/:key', (request, env) => handleObjects.get(request, env));
router.put('/api/objects/:key', (request, env) => handleObjects.put(request, env));
router.delete('/api/objects/:key', (request, env) => handleObjects.delete(request, env));

// 元数据路由
router.get('/api/objects/:key/metadata', (request, env) => handleMetadata.get(request, env));
router.put('/api/objects/:key/metadata', (request, env) => handleMetadata.update(request, env));

// 预签名 URL 路由
router.post('/api/objects/:key/presigned', (request, env) => handlePresigned.generate(request, env));

// 多部分上传路由
router.post('/api/objects/:key/multipart/init', (request, env) => handleMultipart.init(request, env));
router.post('/api/objects/:key/multipart/upload', (request, env) => handleMultipart.upload(request, env));
router.post('/api/objects/:key/multipart/complete', (request, env) => handleMultipart.complete(request, env));
router.delete('/api/objects/:key/multipart/:uploadId', (request, env) => handleMultipart.abort(request, env));

// 批量操作路由
router.post('/api/objects/batch/delete', (request, env) => handleBatch.deleteMany(request, env));
router.post('/api/objects/batch/copy', (request, env) => handleBatch.copyMany(request, env));

// 配置路由
router.get('/api/config/cors', (request, env) => handleConfig.getCors(request, env));
router.put('/api/config/cors', (request, env) => handleConfig.updateCors(request, env));

// 统计路由
router.get('/api/stats', (request, env) => handleStats.getBucketStats(request, env));
router.get('/api/stats/usage', (request, env) => handleStats.getUsageStats(request, env));

// 404 处理
router.all('*', () => {
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
});

// 导出 Worker
export default {
  async fetch(request, env, ctx) {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      return errorHandler(error, request, env);
    }
  }
};

