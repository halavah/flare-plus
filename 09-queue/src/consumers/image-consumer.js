// 图片处理队列消费者
import { updateQueueTask, saveToDeadLetterQueue, updateQueueStats } from '../utils/storage.js';
import { logQueueTask } from '../middleware/logger.js';

export async function handleImageQueue(batch, env) {
  for (const message of batch.messages) {
    const startTime = Date.now();

    try {
      const { taskId, type, data } = message.body;

      await logQueueTask(env, taskId, 'info', 'Processing image', { type });

      await updateQueueTask(env, taskId, {
        status: 'processing',
        startedAt: Date.now()
      });

      let success = false;
      let errorMessage = null;

      try {
        switch (type) {
          case 'resize':
            success = await resizeImage(data, env);
            break;
          case 'optimize':
            success = await optimizeImage(data, env);
            break;
          case 'thumbnail':
            success = await generateThumbnail(data, env);
            break;
          case 'watermark':
            success = await addWatermark(data, env);
            break;
          default:
            throw new Error(`Unknown image processing type: ${type}`);
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

        if (retryCount >= 2) {
          await saveToDeadLetterQueue(env, {
            queueName: 'image',
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

      await updateQueueStats(env, 'image', type, success, duration);
    } catch (error) {
      console.error('Failed to process image message:', error);
      message.retry();
    }
  }
}

async function resizeImage(data, env) {
  console.log('Resizing image:', data.imageUrl, 'to', data.width, 'x', data.height);
  // 图片缩放逻辑
  return true;
}

async function optimizeImage(data, env) {
  console.log('Optimizing image:', data.imageUrl);
  // 图片优化逻辑
  return true;
}

async function generateThumbnail(data, env) {
  console.log('Generating thumbnail for:', data.imageUrl);
  // 缩略图生成逻辑
  return true;
}

async function addWatermark(data, env) {
  console.log('Adding watermark to:', data.imageUrl);
  // 水印添加逻辑
  return true;
}

