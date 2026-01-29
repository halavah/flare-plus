// Stripe Webhook 处理
import { verifyStripeSignature } from '../utils/signature.js';
import { saveWebhookEvent } from '../utils/storage.js';
import { checkRateLimit } from '../utils/rate-limit.js';

export async function handleStripeWebhook(request, env) {
  try {
    // 速率限制
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    await checkRateLimit(env, `stripe:${ip}`, 100, 60);

    // 读取 payload
    const payload = await request.text();
    const signature = request.headers.get('Stripe-Signature');

    // 验证签名
    await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET);

    // 解析 payload
    const event = JSON.parse(payload);
    const eventType = event.type;

    // 保存事件
    const eventId = await saveWebhookEvent(env, {
      provider: 'stripe',
      eventType,
      payload: event,
      signature
    });

    // 发送到队列进行异步处理
    await env.WEBHOOK_QUEUE.send({
      eventId,
      provider: 'stripe',
      eventType,
      payload: event
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
    console.error('Stripe webhook error:', error);
    throw error;
  }
}

