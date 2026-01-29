// D1 Database API Worker - 主入口文件
import { Router } from 'itty-router';
import { handleUsers } from './api/users.js';
import { handleArticles } from './api/articles.js';
import { handleQuery } from './api/query.js';
import { handleTransaction } from './api/transaction.js';
import { handleBatch } from './api/batch.js';
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
    service: 'D1 Database API Worker',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: '/api/users',
      articles: '/api/articles',
      query: '/api/query',
      transaction: '/api/transaction',
      batch: '/api/batch',
      stats: '/api/stats'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

router.get('/api/health', async (request, env) => {
  try {
    // 测试数据库连接
    const result = await env.DB.prepare('SELECT 1 as test').first();
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'D1 Database API is running',
      database: result ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// 用户管理路由
router.get('/api/users', (request, env) => handleUsers.list(request, env));
router.get('/api/users/:id', (request, env) => handleUsers.get(request, env));
router.post('/api/users', (request, env) => handleUsers.create(request, env));
router.put('/api/users/:id', (request, env) => handleUsers.update(request, env));
router.delete('/api/users/:id', (request, env) => handleUsers.delete(request, env));

// 文章管理路由
router.get('/api/articles', (request, env) => handleArticles.list(request, env));
router.get('/api/articles/:id', (request, env) => handleArticles.get(request, env));
router.post('/api/articles', (request, env) => handleArticles.create(request, env));
router.put('/api/articles/:id', (request, env) => handleArticles.update(request, env));
router.delete('/api/articles/:id', (request, env) => handleArticles.delete(request, env));
router.get('/api/articles/author/:authorId', (request, env) => handleArticles.getByAuthor(request, env));

// 高级查询路由
router.post('/api/query/execute', (request, env) => handleQuery.execute(request, env));
router.post('/api/query/prepared', (request, env) => handleQuery.prepared(request, env));
router.get('/api/query/search', (request, env) => handleQuery.search(request, env));

// 事务路由
router.post('/api/transaction/transfer', (request, env) => handleTransaction.transfer(request, env));
router.post('/api/transaction/order', (request, env) => handleTransaction.createOrder(request, env));

// 批量操作路由
router.post('/api/batch/insert', (request, env) => handleBatch.insert(request, env));
router.post('/api/batch/update', (request, env) => handleBatch.update(request, env));
router.post('/api/batch/delete', (request, env) => handleBatch.delete(request, env));

// 统计信息路由
router.get('/api/stats/users', (request, env) => handleStats.users(request, env));
router.get('/api/stats/articles', (request, env) => handleStats.articles(request, env));
router.get('/api/stats/database', (request, env) => handleStats.database(request, env));

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

