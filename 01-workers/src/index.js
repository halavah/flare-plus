/**
 * Cloudflare Workers API 服务
 * 主入口文件 - 处理所有 HTTP 请求
 */

import { handleAuth } from './api/auth.js';
import { handleUsers } from './api/users.js';
import { handleUtils } from './api/utils.js';
import { corsMiddleware } from './middleware/cors.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { getConfig } from './config/env.js';

/**
 * 主请求处理器
 * @param {Request} request - 请求对象
 * @param {Env} env - 环境变量和绑定
 * @param {ExecutionContext} ctx - 执行上下文
 * @returns {Response} 响应对象
 */
export default {
  async fetch(request, env, ctx) {
    try {
      // 获取配置
      const config = getConfig(env);

      // 解析 URL
      const url = new URL(request.url);
      const pathname = url.pathname;

      // 记录请求日志
      console.log(`${request.method} ${pathname} - ${request.headers.get('user-agent') || 'Unknown'}`);

      // 全局中间件
      let response = await corsMiddleware(request);
      if (response) return response;

      response = await rateLimitMiddleware(request, env);
      if (response) return response;

      // API 路由处理
      if (pathname.startsWith('/api/auth/')) {
        return await handleAuth(request, env, pathname);
      }

      if (pathname.startsWith('/api/users')) {
        // 需要认证的路由
        const authResult = await authMiddleware(request, env);
        if (authResult) return authResult;

        return await handleUsers(request, env, pathname);
      }

      if (pathname.startsWith('/api/utils/')) {
        return await handleUtils(request, env, pathname);
      }

      // 健康检查端点
      if (pathname === '/api/health' || pathname === '/') {
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'Cloudflare Workers API is running',
          timestamp: new Date().toISOString(),
          version: config.VERSION || '1.0.0'
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      }

      // API 文档端点
      if (pathname === '/api/docs') {
        return new Response(JSON.stringify({
          title: 'Cloudflare Workers API',
          version: '1.0.0',
          endpoints: {
            auth: {
              'POST /api/auth/login': '用户登录',
              'POST /api/auth/register': '用户注册',
              'POST /api/auth/refresh': '刷新 Token'
            },
            users: {
              'GET /api/users': '获取用户列表 (需要认证)',
              'GET /api/users/:id': '获取用户详情 (需要认证)',
              'POST /api/users': '创建用户 (需要认证)',
              'PUT /api/users/:id': '更新用户 (需要认证)',
              'DELETE /api/users/:id': '删除用户 (需要认证)'
            },
            utils: {
              'GET /api/utils/time': '获取服务器时间',
              'POST /api/utils/hash': '生成哈希值',
              'GET /api/utils/ip': '获取客户端 IP'
            },
            system: {
              'GET /api/health': '健康检查',
              'GET /api/docs': 'API 文档'
            }
          }
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 404 处理
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: `路径 ${pathname} 不存在`,
        available: ['/api/health', '/api/docs', '/api/auth/*', '/api/users/*', '/api/utils/*']
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      // 错误处理
      console.error('Worker Error:', error);

      // 返回错误响应
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message || '服务器内部错误',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  },

  /**
   * 定时任务处理器
   * @param {ScheduledEvent} event - 定时事件
   * @param {Env} env - 环境变量
   * @param {ExecutionContext} ctx - 执行上下文
   */
  async scheduled(event, env, ctx) {
    console.log('Scheduled task triggered:', event.cron);

    // 示例：清理过期数据
    if (event.cron === '0 0 * * *') { // 每天午夜执行
      // await cleanupExpiredData(env);
    }
  },

  /**
   * 队列处理器
   * @param {MessageBatch} batch - 消息批次
   * @param {Env} env - 环境变量
   * @param {ExecutionContext} ctx - 执行上下文
   */
  async queue(batch, env, ctx) {
    console.log(`Processing ${batch.messages.length} queue messages`);

    for (const message of batch.messages) {
      try {
        // 处理消息
        const data = JSON.parse(message.body);
        console.log('Processing message:', data);

        // 标记消息为已处理
        message.ack();
      } catch (error) {
        console.error('Error processing queue message:', error);
        // 重试或失败消息
        message.retry();
      }
    }
  }
};