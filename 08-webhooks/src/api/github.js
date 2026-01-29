// GitHub Webhook 处理
import { verifyGitHubSignature } from '../utils/signature.js';
import { saveWebhookEvent } from '../utils/storage.js';
import { checkRateLimit } from '../utils/rate-limit.js';

export async function handleGitHubWebhook(request, env) {
  try {
    // 速率限制
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    await checkRateLimit(env, `github:${ip}`, 100, 60);

    // 获取事件类型
    const eventType = request.headers.get('X-GitHub-Event');
    if (!eventType) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing X-GitHub-Event header'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 读取 payload
    const payload = await request.text();
    const signature = request.headers.get('X-Hub-Signature-256');

    // 验证签名
    await verifyGitHubSignature(payload, signature, env.GITHUB_WEBHOOK_SECRET);

    // 解析 payload
    const data = JSON.parse(payload);

    // 保存事件
    const eventId = await saveWebhookEvent(env, {
      provider: 'github',
      eventType,
      payload: data,
      signature
    });

    // 发送到队列进行异步处理
    await env.WEBHOOK_QUEUE.send({
      eventId,
      provider: 'github',
      eventType,
      payload: data
    });

    return new Response(JSON.stringify({
      success: true,
      eventId,
      message: 'Webhook received and queued'
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('GitHub webhook error:', error);
    throw error;
  }
}

