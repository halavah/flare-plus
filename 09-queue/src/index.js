// Queue Worker - 主入口
import { Router } from 'itty-router';
import { sendToQueue, sendBatch } from './api/producer.js';
import { getQueueStats, getQueueTasks, getDeadLetterQueue } from './api/stats.js';
import { handleTaskQueue } from './consumers/task-consumer.js';
import { handleEmailQueue } from './consumers/email-consumer.js';
import { handleImageQueue } from './consumers/image-consumer.js';
import { cors } from './middleware/cors.js';
import { errorHandler } from './middleware/error.js';
import { logger } from './middleware/logger.js';

const router = Router();

// 应用全局中间件
router.all('*', cors);
router.all('*', logger);

// 系统路由
router.get('/', () => new Response(JSON.stringify({
  service: 'Queue Worker',
  version: '1.0.0',
  status: 'running',
  timestamp: new Date().toISOString(),
  endpoints: {
    producer: {
      send: 'POST /api/queue/send',
      batch: 'POST /api/queue/batch'
    },
    stats: {
      overview: 'GET /api/stats?queue=&days=7',
      tasks: 'GET /api/tasks?queue=&status=&limit=50',
      dlq: 'GET /api/dlq?queue=&limit=50'
    },
    queues: ['task', 'email', 'webhook', 'image'],
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

// 生产者 API
router.post('/api/queue/send', (request, env) => sendToQueue(request, env));
router.post('/api/queue/batch', (request, env) => sendBatch(request, env));

// 统计和查询 API
router.get('/api/stats', (request, env) => getQueueStats(request, env));
router.get('/api/tasks', (request, env) => getQueueTasks(request, env));
router.get('/api/dlq', (request, env) => getDeadLetterQueue(request, env));

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

  // Queue 消费者 - 根据队列名称分发
  async queue(batch, env) {
    const queueName = batch.queue;

    console.log(`Processing batch from queue: ${queueName}, messages: ${batch.messages.length}`);

    try {
      switch (queueName) {
        case 'task-queue':
          await handleTaskQueue(batch, env);
          break;
        case 'email-queue':
          await handleEmailQueue(batch, env);
          break;
        case 'image-queue':
          await handleImageQueue(batch, env);
          break;
        case 'webhook-queue':
          // Webhook 队列在 08-webhooks 项目中处理
          console.log('Webhook queue should be handled by webhooks worker');
          break;
        default:
          console.error(`Unknown queue: ${queueName}`);
      }
    } catch (error) {
      console.error(`Failed to process queue ${queueName}:`, error);
    }
  }
};
