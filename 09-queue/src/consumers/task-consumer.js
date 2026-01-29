// 任务队列消费者
import { updateQueueTask, saveToDeadLetterQueue, updateQueueStats } from '../utils/storage.js';
import { logQueueTask } from '../middleware/logger.js';

export async function handleTaskQueue(batch, env) {
  for (const message of batch.messages) {
    const startTime = Date.now();

    try {
      const { taskId, type, data } = message.body;

      await logQueueTask(env, taskId, 'info', 'Processing task', { type });

      // 更新任务状态为处理中
      await updateQueueTask(env, taskId, {
        status: 'processing',
        startedAt: Date.now()
      });

      // 根据任务类型处理
      let success = false;
      let errorMessage = null;

      try {
        switch (type) {
          case 'data_processing':
            success = await processDataTask(data, env);
            break;
          case 'cleanup':
            success = await processCleanupTask(data, env);
            break;
          case 'notification':
            success = await processNotificationTask(data, env);
            break;
          case 'report':
            success = await processReportTask(data, env);
            break;
          default:
            throw new Error(`Unknown task type: ${type}`);
        }
      } catch (error) {
        errorMessage = error.message;
        await logQueueTask(env, taskId, 'error', error.message);
      }

      const duration = Date.now() - startTime;

      if (success) {
        // 任务成功
        await updateQueueTask(env, taskId, {
          status: 'completed',
          completedAt: Date.now()
        });
        message.ack();
      } else {
        // 任务失败
        const retryCount = message.attempts || 0;

        if (retryCount >= 3) {
          // 超过重试次数，移到死信队列
          await saveToDeadLetterQueue(env, {
            queueName: 'task',
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
          // 重试
          await updateQueueTask(env, taskId, {
            retryCount: retryCount + 1,
            errorMessage
          });
          message.retry();
        }
      }

      // 更新统计
      await updateQueueStats(env, 'task', type, success, duration);
    } catch (error) {
      console.error('Failed to process task message:', error);
      message.retry();
    }
  }
}

async function processDataTask(data, env) {
  console.log('Processing data task:', data);
  // 数据处理逻辑
  await new Promise(resolve => setTimeout(resolve, 100));
  return true;
}

async function processCleanupTask(data, env) {
  console.log('Processing cleanup task:', data);
  // 清理逻辑
  return true;
}

async function processNotificationTask(data, env) {
  console.log('Processing notification task:', data);
  // 通知逻辑
  return true;
}

async function processReportTask(data, env) {
  console.log('Processing report task:', data);
  // 报告生成逻辑
  return true;
}

