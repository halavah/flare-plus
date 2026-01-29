// 自定义 Webhook 处理
import { verifyHmacSignature } from '../utils/signature.js';
import { saveWebhookEvent } from '../utils/storage.js';
import { checkRateLimit } from '../utils/rate-limit.js';

export async function handleCustomWebhook(request, env) {
  try {
    // 速率限制
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    await checkRateLimit(env, `custom:${ip}`, 100, 60);

    // 读取 payload
    const payload = await request.text();
    const signature = request.headers.get('X-Webhook-Signature');
    const eventType = request.headers.get('X-Event-Type') || 'custom';

    // 可选：验证签名（如果提供了密钥）
    const secret = env.CUSTOM_WEBHOOK_SECRET;
    if (secret && signature) {
      const isValid = await verifyHmacSignature(payload, signature, secret);
      if (!isValid) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid signature'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 解析 payload
    let data;
    try {
      data = JSON.parse(payload);
    } catch (e) {
      data = { raw: payload };
    }

    // 保存事件
    const eventId = await saveWebhookEvent(env, {
      provider: 'custom',
      eventType,
      payload: data,
      signature
    });

    // 发送到队列进行异步处理
    await env.WEBHOOK_QUEUE.send({
      eventId,
      provider: 'custom',
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
    console.error('Custom webhook error:', error);
    throw error;
  }
}

