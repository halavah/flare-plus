// Slack Webhook 处理
import { verifySlackSignature } from '../utils/signature.js';
import { saveWebhookEvent } from '../utils/storage.js';
import { checkRateLimit } from '../utils/rate-limit.js';

export async function handleSlackWebhook(request, env) {
  try {
    // 速率限制
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    await checkRateLimit(env, `slack:${ip}`, 100, 60);

    // 读取 payload
    const payload = await request.text();
    const signature = request.headers.get('X-Slack-Signature');
    const timestamp = request.headers.get('X-Slack-Request-Timestamp');

    // 验证签名
    await verifySlackSignature(payload, signature, timestamp, env.SLACK_WEBHOOK_SECRET);

    // 解析 payload
    const data = JSON.parse(payload);

    // 处理 Slack URL 验证挑战
    if (data.type === 'url_verification') {
      return new Response(JSON.stringify({
        challenge: data.challenge
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const eventType = data.type || 'unknown';

    // 保存事件
    const eventId = await saveWebhookEvent(env, {
      provider: 'slack',
      eventType,
      payload: data,
      signature
    });

    // 发送到队列进行异步处理
    await env.WEBHOOK_QUEUE.send({
      eventId,
      provider: 'slack',
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
    console.error('Slack webhook error:', error);
    throw error;
  }
}

