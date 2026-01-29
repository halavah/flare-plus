// Webhook Queue 消费者
import { updateWebhookEvent, updateWebhookStats } from './utils/storage.js';
import { logWebhookEvent } from './middleware/logger.js';

export async function handleWebhookQueue(batch, env) {
  for (const message of batch.messages) {
    try {
      const { eventId, provider, eventType, payload } = message.body;

      await logWebhookEvent(env, eventId, 'info', 'Processing webhook event', {
        provider,
        eventType
      });

      // 根据提供商处理事件
      let success = false;
      let errorMessage = null;

      try {
        switch (provider) {
          case 'github':
            success = await processGitHubEvent(eventType, payload, env);
            break;
          case 'stripe':
            success = await processStripeEvent(eventType, payload, env);
            break;
          case 'slack':
            success = await processSlackEvent(eventType, payload, env);
            break;
          case 'custom':
            success = await processCustomEvent(eventType, payload, env);
            break;
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }
      } catch (error) {
        errorMessage = error.message;
        await logWebhookEvent(env, eventId, 'error', error.message);
      }

      // 更新事件状态
      await updateWebhookEvent(env, eventId, {
        status: success ? 'completed' : 'failed',
        errorMessage,
        processedAt: Date.now()
      });

      // 更新统计
      await updateWebhookStats(env, provider, eventType, success);

      // 确认消息
      message.ack();
    } catch (error) {
      console.error('Failed to process webhook message:', error);
      message.retry();
    }
  }
}

// GitHub 事件处理
async function processGitHubEvent(eventType, payload, env) {
  console.log(`Processing GitHub event: ${eventType}`);

  switch (eventType) {
    case 'push':
      console.log(`Push to ${payload.repository.full_name}`);
      // 处理推送事件
      break;
    case 'pull_request':
      console.log(`PR ${payload.action} on ${payload.repository.full_name}`);
      // 处理 PR 事件
      break;
    case 'issues':
      console.log(`Issue ${payload.action} on ${payload.repository.full_name}`);
      // 处理 Issue 事件
      break;
    default:
      console.log(`Unhandled GitHub event: ${eventType}`);
  }

  return true;
}

// Stripe 事件处理
async function processStripeEvent(eventType, payload, env) {
  console.log(`Processing Stripe event: ${eventType}`);

  switch (eventType) {
    case 'payment_intent.succeeded':
      console.log(`Payment succeeded: ${payload.data.object.id}`);
      // 处理支付成功
      break;
    case 'customer.subscription.created':
      console.log(`Subscription created: ${payload.data.object.id}`);
      // 处理订阅创建
      break;
    case 'invoice.payment_failed':
      console.log(`Payment failed: ${payload.data.object.id}`);
      // 处理支付失败
      break;
    default:
      console.log(`Unhandled Stripe event: ${eventType}`);
  }

  return true;
}

// Slack 事件处理
async function processSlackEvent(eventType, payload, env) {
  console.log(`Processing Slack event: ${eventType}`);

  switch (eventType) {
    case 'message':
      console.log(`Message received in channel ${payload.event?.channel}`);
      // 处理消息
      break;
    case 'app_mention':
      console.log(`App mentioned by ${payload.event?.user}`);
      // 处理提及
      break;
    default:
      console.log(`Unhandled Slack event: ${eventType}`);
  }

  return true;
}

// 自定义事件处理
async function processCustomEvent(eventType, payload, env) {
  console.log(`Processing custom event: ${eventType}`);
  console.log('Payload:', payload);

  // 自定义处理逻辑

  return true;
}

