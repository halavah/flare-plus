// Webhooks Worker - 主入口
import { Router } from 'itty-router';
import { handleGitHubWebhook } from './api/github.js';
import { handleStripeWebhook } from './api/stripe.js';
import { handleSlackWebhook } from './api/slack.js';
import { handleCustomWebhook } from './api/custom.js';
import { getWebhookStats, getWebhookEvents } from './api/stats.js';
import { handleWebhookQueue } from './consumer.js';
import { cors } from './middleware/cors.js';
import { errorHandler } from './middleware/error.js';
import { logger } from './middleware/logger.js';

const router = Router();

// 应用全局中间件
router.all('*', cors);
router.all('*', logger);

// 系统路由
router.get('/', () => new Response(JSON.stringify({
  service: 'Webhooks Worker',
  version: '1.0.0',
  status: 'running',
  timestamp: new Date().toISOString(),
  endpoints: {
    webhooks: {
      github: 'POST /webhooks/github',
      stripe: 'POST /webhooks/stripe',
      slack: 'POST /webhooks/slack',
      custom: 'POST /webhooks/custom'
    },
    stats: {
      overview: 'GET /api/stats?provider=&days=7',
      events: 'GET /api/events?provider=&status=&limit=50'
    },
    health: 'GET /api/health'
  }
}), {
  headers: { 'Content-Type': 'application/json' }
}));

// 健康检查
router.get('/api/health', () => new Response(JSON.stringify({
  success: true,
  status: 'ok',
  timestamp: new Date().toISOString()
}), {
  headers: { 'Content-Type': 'application/json' }
}));

// Webhook 接收端点
router.post('/webhooks/github', (request, env) => handleGitHubWebhook(request, env));
router.post('/webhooks/stripe', (request, env) => handleStripeWebhook(request, env));
router.post('/webhooks/slack', (request, env) => handleSlackWebhook(request, env));
router.post('/webhooks/custom', (request, env) => handleCustomWebhook(request, env));

// 统计和查询 API
router.get('/api/stats', (request, env) => getWebhookStats(request, env));
router.get('/api/events', (request, env) => getWebhookEvents(request, env));

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

export default {
  async fetch(request, env, ctx) {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      return errorHandler(error, request, env);
    }
  },

  // Queue 消费者
  async queue(batch, env) {
    await handleWebhookQueue(batch, env);
  }
};
