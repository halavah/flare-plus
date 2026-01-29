// Turnstile Verification Worker - 主入口文件
import { Router } from 'itty-router';
import { handleVerify } from './api/verify.js';
import { handleSession } from './api/session.js';
import { handleStats } from './api/stats.js';
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
    service: 'Turnstile Verification Worker',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      verify: '/api/verify',
      session: '/api/session',
      stats: '/api/stats',
      rateLimit: '/api/rate-limit'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

router.get('/api/health', async (request, env) => {
  try {
    // 测试数据库连接
    const result = await env.TURNSTILE_DB.prepare('SELECT 1 as test').first();
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Turnstile Verification is running',
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

// 获取站点密钥（公开）
router.get('/api/site-key', (request, env) => {
  return new Response(JSON.stringify({
    success: true,
    siteKey: env.TURNSTILE_SITE_KEY
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// 验证路由
router.post('/api/verify', (request, env) => handleVerify.verify(request, env));
router.post('/api/verify/check', (request, env) => handleVerify.check(request, env));

// 会话管理路由
router.post('/api/session/validate', (request, env) => handleSession.validate(request, env));
router.delete('/api/session/:token', (request, env) => handleSession.delete(request, env));
router.get('/api/session/:token', (request, env) => handleSession.get(request, env));

// 统计信息路由
router.get('/api/stats/overview', (request, env) => handleStats.overview(request, env));
router.get('/api/stats/metrics', (request, env) => handleStats.metrics(request, env));
router.get('/api/stats/logs', (request, env) => handleStats.logs(request, env));

// 速率限制管理路由
router.post('/api/rate-limit/reset/:identifier', (request, env) => handleRateLimit.reset(request, env));
router.get('/api/rate-limit/status/:identifier', (request, env) => handleRateLimit.status(request, env));

// 前端集成示例页面
router.get('/demo', (request, env) => {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Turnstile 验证演示</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .container { background: #f5f5f5; padding: 30px; border-radius: 8px; }
    h1 { color: #333; }
    .form-group { margin: 20px 0; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    button { background: #0066cc; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
    button:hover { background: #0052a3; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
    .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔒 Turnstile 验证演示</h1>
    <p>这是一个 Cloudflare Turnstile 验证的演示页面。</p>

    <form id="verifyForm">
      <div class="form-group">
        <label for="email">邮箱地址：</label>
        <input type="email" id="email" name="email" required placeholder="your@email.com">
      </div>

      <div class="form-group">
        <div class="cf-turnstile"
             data-sitekey="${env.TURNSTILE_SITE_KEY}"
             data-callback="onTurnstileSuccess"
             data-error-callback="onTurnstileError">
        </div>
      </div>

      <button type="submit" id="submitBtn" disabled>提交验证</button>
    </form>

    <div id="result"></div>
  </div>

  <script>
    let turnstileToken = null;

    function onTurnstileSuccess(token) {
      turnstileToken = token;
      document.getElementById('submitBtn').disabled = false;
      console.log('Turnstile 验证成功！');
    }

    function onTurnstileError() {
      turnstileToken = null;
      document.getElementById('submitBtn').disabled = true;
      showResult('Turnstile 验证失败，请刷新页面重试。', false);
    }

    document.getElementById('verifyForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!turnstileToken) {
        showResult('请先完成验证。', false);
        return;
      }

      const email = document.getElementById('email').value;
      const submitBtn = document.getElementById('submitBtn');

      submitBtn.disabled = true;
      submitBtn.textContent = '验证中...';

      try {
        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: turnstileToken,
            action: 'demo_form',
            metadata: { email }
          })
        });

        const data = await response.json();

        if (data.success) {
          showResult(\`✅ 验证成功！会话令牌：\${data.sessionToken}\`, true);
        } else {
          showResult(\`❌ 验证失败：\${data.error}\`, false);
        }
      } catch (error) {
        showResult(\`❌ 请求失败：\${error.message}\`, false);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '提交验证';
      }
    });

    function showResult(message, success) {
      const resultDiv = document.getElementById('result');
      resultDiv.className = 'result ' + (success ? 'success' : 'error');
      resultDiv.textContent = message;
    }
  </script>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
});

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

