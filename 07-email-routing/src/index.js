// Email Routing Worker - 主入口文件
import { Router } from 'itty-router';
import { handleRoutes } from './api/routes.js';
import { handleEmails } from './api/emails.js';
import { handleStats } from './api/stats.js';
import { handleRules } from './api/rules.js';
import { cors } from './middleware/cors.js';
import { errorHandler } from './middleware/error.js';
import { logger } from './middleware/logger.js';

// 创建路由器（用于管理 API）
const router = Router();

// 应用全局中间件
router.all('*', cors);
router.all('*', logger);

// 系统路由
router.get('/', async (request, env) => {
  return new Response(JSON.stringify({
    service: 'Email Routing Worker',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      rules: '/api/rules',
      emails: '/api/emails',
      stats: '/api/stats'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

router.get('/api/health', async (request, env) => {
  try {
    const result = await env.EMAIL_DB.prepare('SELECT 1 as test').first();
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Email Routing is running',
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

// 路由规则管理
router.get('/api/rules', (request, env) => handleRules.list(request, env));
router.post('/api/rules', (request, env) => handleRules.create(request, env));
router.get('/api/rules/:id', (request, env) => handleRules.get(request, env));
router.put('/api/rules/:id', (request, env) => handleRules.update(request, env));
router.delete('/api/rules/:id', (request, env) => handleRules.delete(request, env));

// 邮件管理
router.get('/api/emails', (request, env) => handleEmails.list(request, env));
router.get('/api/emails/:id', (request, env) => handleEmails.get(request, env));
router.delete('/api/emails/:id', (request, env) => handleEmails.delete(request, env));

// 统计信息
router.get('/api/stats/overview', (request, env) => handleStats.overview(request, env));
router.get('/api/stats/volume', (request, env) => handleStats.volume(request, env));
router.get('/api/stats/domains', (request, env) => handleStats.domains(request, env));

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

// Email Handler（Cloudflare Email Routing 入口）
export default {
  // HTTP API 处理
  async fetch(request, env, ctx) {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      return errorHandler(error, request, env);
    }
  },

  // 邮件处理入口
  async email(message, env, ctx) {
    try {
      console.log('Received email:', {
        from: message.from,
        to: message.to,
        size: message.headers.get('content-length')
      });

      // 处理邮件
      await handleRoutes.processEmail(message, env, ctx);
    } catch (error) {
      console.error('Email processing failed:', error);
      // 邮件处理失败时拒绝邮件
      message.setReject(error.message);
    }
  }
};

