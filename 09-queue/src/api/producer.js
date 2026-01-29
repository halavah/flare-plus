// 队列生产者 API
import { ValidationError } from '../middleware/error.js';
import { saveQueueTask } from '../utils/storage.js';
import { checkDuplicate, generateMessageId } from '../utils/deduplication.js';

export async function sendToQueue(request, env) {
  try {
    const body = await request.json();
    const { queue, type, data, options = {} } = body;

    if (!queue || !type || !data) {
      throw new ValidationError('Missing required fields: queue, type, data');
    }

    // 验证队列名称
    const validQueues = ['task', 'email', 'webhook', 'image'];
    if (!validQueues.includes(queue)) {
      throw new ValidationError(`Invalid queue. Must be one of: ${validQueues.join(', ')}`);
    }

    // 去重检查
    if (options.deduplicate !== false) {
      const messageId = options.messageId || await generateMessageId({ type, data });
      const window = parseInt(env.DEDUPLICATION_WINDOW) || 300;

      const isDuplicate = await checkDuplicate(env, queue, messageId, window);
      if (isDuplicate) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Duplicate message ignored',
          messageId
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 保存任务到数据库
    const taskId = await saveQueueTask(env, {
      queueName: queue,
      taskType: type,
      payload: data,
      priority: options.priority || 0,
      maxRetries: options.maxRetries || 3,
      scheduledAt: options.scheduledAt || null
    });

    // 发送到队列
    const queueBinding = getQueueBinding(env, queue);
    await queueBinding.send({
      taskId,
      type,
      data,
      options
    });

    return new Response(JSON.stringify({
      success: true,
      taskId,
      queue,
      message: 'Task queued successfully'
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to send to queue:', error);
    throw error;
  }
}

export async function sendBatch(request, env) {
  try {
    const body = await request.json();
    const { queue, tasks } = body;

    if (!queue || !Array.isArray(tasks) || tasks.length === 0) {
      throw new ValidationError('Missing required fields: queue, tasks (array)');
    }

    const results = [];
    const queueBinding = getQueueBinding(env, queue);

    for (const task of tasks) {
      try {
        const taskId = await saveQueueTask(env, {
          queueName: queue,
          taskType: task.type,
          payload: task.data,
          priority: task.priority || 0,
          maxRetries: task.maxRetries || 3
        });

        await queueBinding.send({
          taskId,
          type: task.type,
          data: task.data
        });

        results.push({ taskId, success: true });
      } catch (error) {
        results.push({ error: error.message, success: false });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      total: tasks.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to send batch:', error);
    throw error;
  }
}

function getQueueBinding(env, queueName) {
  const queueMap = {
    'task': env.TASK_QUEUE,
    'email': env.EMAIL_QUEUE,
    'webhook': env.WEBHOOK_QUEUE,
    'image': env.IMAGE_QUEUE
  };

  return queueMap[queueName];
}

