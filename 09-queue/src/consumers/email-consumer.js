// 邮件队列消费者
import { updateQueueTask, saveToDeadLetterQueue, updateQueueStats } from '../utils/storage.js';
import { logQueueTask } from '../middleware/logger.js';

export async function handleEmailQueue(batch, env) {
  for (const message of batch.messages) {
    const startTime = Date.now();

    try {
      const { taskId, type, data } = message.body;

      await logQueueTask(env, taskId, 'info', 'Processing email', { type });

      await updateQueueTask(env, taskId, {
        status: 'processing',
        startedAt: Date.now()
      });

      let success = false;
      let errorMessage = null;

      try {
        switch (type) {
          case 'welcome':
            success = await sendWelcomeEmail(data, env);
            break;
          case 'notification':
            success = await sendNotificationEmail(data, env);
            break;
          case 'report':
            success = await sendReportEmail(data, env);
            break;
          case 'marketing':
            success = await sendMarketingEmail(data, env);
            break;
          default:
            throw new Error(`Unknown email type: ${type}`);
        }
      } catch (error) {
        errorMessage = error.message;
        await logQueueTask(env, taskId, 'error', error.message);
      }

      const duration = Date.now() - startTime;

      if (success) {
        await updateQueueTask(env, taskId, {
          status: 'completed',
          completedAt: Date.now()
        });
        message.ack();
      } else {
        const retryCount = message.attempts || 0;

        if (retryCount >= 5) {
          await saveToDeadLetterQueue(env, {
            queueName: 'email',
            taskId,
            payload: data,
            errorMessage,
            retryCount
          });

          await updateQueueTask(env, taskId, {
            status: 'failed',
            errorMessage,
            completedAt: Date.now()
          });

          message.ack();
        } else {
          await updateQueueTask(env, taskId, {
            retryCount: retryCount + 1,
            errorMessage
          });
          message.retry();
        }
      }

      await updateQueueStats(env, 'email', type, success, duration);
    } catch (error) {
      console.error('Failed to process email message:', error);
      message.retry();
    }
  }
}

async function sendWelcomeEmail(data, env) {
  console.log('Sending welcome email to:', data.email);
  // 发送欢迎邮件
  return true;
}

async function sendNotificationEmail(data, env) {
  console.log('Sending notification email to:', data.email);
  // 发送通知邮件
  return true;
}

async function sendReportEmail(data, env) {
  console.log('Sending report email to:', data.email);
  // 发送报告邮件
  return true;
}

async function sendMarketingEmail(data, env) {
  console.log('Sending marketing email to:', data.email);
  // 发送营销邮件
  return true;
}

