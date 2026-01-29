// Durable Objects Worker - 主入口
import { Router } from 'itty-router';
import { ChatRoom } from './objects/ChatRoom.js';
import { Counter } from './objects/Counter.js';
import { GameState } from './objects/GameState.js';
import { handleChat } from './api/chat.js';
import { handleCounter } from './api/counter.js';
import { handleGame } from './api/game.js';
import { handleAdmin } from './api/admin.js';
import { cors } from './middleware/cors.js';
import { errorHandler } from './middleware/error.js';
import { logger } from './middleware/logger.js';

const router = Router();

// 应用全局中间件
router.all('*', cors);
router.all('*', logger);

// 系统路由
router.get('/', () => new Response(JSON.stringify({
  service: 'Durable Objects Worker',
  version: '1.0.0',
  status: 'running',
  timestamp: new Date().toISOString(),
  endpoints: {
    chat: {
      create: 'POST /api/chat',
      message: 'POST /chat/:id/message',
      history: 'GET /chat/:id/history',
      websocket: 'GET /chat/:id/ws (Upgrade: websocket)'
    },
    counter: {
      create: 'POST /api/counter',
      increment: 'POST /counter/:name/increment',
      getValue: 'GET /counter/:name/value',
      reset: 'POST /counter/:name/reset'
    },
    game: {
      create: 'POST /api/game',
      start: 'POST /game/:id/start',
      action: 'POST /game/:id/action',
      state: 'GET /game/:id/state',
      reset: 'POST /game/:id/reset',
      websocket: 'GET /game/:id/ws (Upgrade: websocket)'
    },
    admin: {
      stats: 'GET /api/stats',
      health: 'GET /api/health'
    }
  }
}), {
  headers: { 'Content-Type': 'application/json' }
}));

// 管理 API
router.get('/api/health', (request, env) => handleAdmin.health(request, env));
router.get('/api/stats', (request, env) => handleAdmin.getStats(request, env));

// 聊天室 API
router.post('/api/chat', (request, env) => handleChat.create(request, env));
router.get('/chat/:id/ws', (request, env) => handleChat.connect(request, env, request.params.id));
router.post('/chat/:id/message', (request, env) => handleChat.sendMessage(request, env, request.params.id));
router.get('/chat/:id/history', (request, env) => handleChat.getHistory(request, env, request.params.id));

// 计数器 API
router.post('/api/counter', (request, env) => handleCounter.create(request, env));
router.post('/counter/:name/increment', (request, env) => handleCounter.increment(request, env, request.params.name));
router.get('/counter/:name/value', (request, env) => handleCounter.getValue(request, env, request.params.name));
router.post('/counter/:name/reset', (request, env) => handleCounter.reset(request, env, request.params.name));

// 游戏状态 API
router.post('/api/game', (request, env) => handleGame.create(request, env));
router.get('/game/:id/ws', (request, env) => handleGame.connect(request, env, request.params.id));
router.post('/game/:id/start', (request, env) => handleGame.start(request, env, request.params.id));
router.post('/game/:id/action', (request, env) => handleGame.action(request, env, request.params.id));
router.get('/game/:id/state', (request, env) => handleGame.getState(request, env, request.params.id));
router.post('/game/:id/reset', (request, env) => handleGame.reset(request, env, request.params.id));

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
  }
};

export { ChatRoom, Counter, GameState };

