// KV API Worker - 主入口文件
import { Router } from 'itty-router';
import { handleKV } from './api/kv.js';
import { handleList } from './api/list.js';
import { handleMetadata } from './api/metadata.js';
import { handleBatch } from './api/batch.js';
import { handleSearch } from './api/search.js';
import { handleSession } from './api/session.js';
import { handleCache } from './api/cache.js';
import { handleRateLimit } from './api/rate-limit.js';
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
    service: 'KV API Worker',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      kv: '/api/kv',
      list: '/api/kv',
      metadata: '/api/kv/:key/metadata',
      batch: '/api/kv/batch',
      search: '/api/kv/search',
      session: '/api/sessions',
      cache: '/api/cache',
      rateLimit: '/api/rate-limit'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

router.get('/api/health', async (request, env) => {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'KV API is running',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// 基础 KV 操作
router.get('/api/kv/:key', (request, env) => handleKV.get(request, env));
router.put('/api/kv/:key', (request, env) => handleKV.put(request, env));
router.delete('/api/kv/:key', (request, env) => handleKV.delete(request, env));

// 列表操作
router.get('/api/kv', (request, env) => handleList.list(request, env));

// 元数据操作
router.get('/api/kv/:key/metadata', (request, env) => handleMetadata.get(request, env));
router.get('/api/kv/:key/with-metadata', (request, env) => handleMetadata.getWithValue(request, env));

// 批量操作
router.post('/api/kv/batch/get', (request, env) => handleBatch.getMany(request, env));
router.post('/api/kv/batch/put', (request, env) => handleBatch.putMany(request, env));
router.post('/api/kv/batch/delete', (request, env) => handleBatch.deleteMany(request, env));

// 搜索操作
router.get('/api/kv/search', (request, env) => handleSearch.searchByPrefix(request, env));

// 会话管理
router.post('/api/sessions', (request, env) => handleSession.create(request, env));
router.get('/api/sessions/:id', (request, env) => handleSession.get(request, env));
router.delete('/api/sessions/:id', (request, env) => handleSession.delete(request, env));

// 缓存管理
router.post('/api/cache', (request, env) => handleCache.set(request, env));
router.get('/api/cache/:key', (request, env) => handleCache.get(request, env));
router.delete('/api/cache/:key', (request, env) => handleCache.delete(request, env));

// 速率限制
router.post('/api/rate-limit/check', (request, env) => handleRateLimit.check(request, env));
router.get('/api/rate-limit/stats/:identifier', (request, env) => handleRateLimit.getStats(request, env));

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

