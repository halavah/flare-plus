// 存储工具
export async function saveQueueTask(env, taskData) {
  try {
    const taskId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO queue_tasks (
        id, queue_name, task_type, payload, status, priority,
        max_retries, scheduled_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      taskId,
      taskData.queueName,
      taskData.taskType,
      JSON.stringify(taskData.payload),
      'pending',
      taskData.priority || 0,
      taskData.maxRetries || 3,
      taskData.scheduledAt || null,
      Date.now()
    ).run();

    return taskId;
  } catch (error) {
    console.error('Failed to save queue task:', error);
    throw error;
  }
}

export async function updateQueueTask(env, taskId, updates) {
  try {
    const fields = [];
    const values = [];

    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (updates.retryCount !== undefined) {
      fields.push('retry_count = ?');
      values.push(updates.retryCount);
    }

    if (updates.errorMessage) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage);
    }

    if (updates.startedAt) {
      fields.push('started_at = ?');
      values.push(updates.startedAt);
    }

    if (updates.completedAt) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt);
    }

    if (fields.length === 0) return;

    values.push(taskId);

    await env.DB.prepare(`
      UPDATE queue_tasks
      SET ${fields.join(', ')}
      WHERE id = ?
    `).bind(...values).run();
  } catch (error) {
    console.error('Failed to update queue task:', error);
    throw error;
  }
}

export async function getQueueTask(env, taskId) {
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM queue_tasks WHERE id = ?
    `).bind(taskId).first();

    if (result && result.payload) {
      result.payload = JSON.parse(result.payload);
    }

    return result;
  } catch (error) {
    console.error('Failed to get queue task:', error);
    throw error;
  }
}

export async function saveToDeadLetterQueue(env, taskData) {
  try {
    const dlqId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO dead_letter_queue (
        id, original_queue, task_id, payload, error_message, retry_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      dlqId,
      taskData.queueName,
      taskData.taskId,
      JSON.stringify(taskData.payload),
      taskData.errorMessage,
      taskData.retryCount,
      Date.now()
    ).run();

    return dlqId;
  } catch (error) {
    console.error('Failed to save to DLQ:', error);
    throw error;
  }
}

export async function updateQueueStats(env, queueName, taskType, success, durationMs) {
  try {
    const date = new Date().toISOString().split('T')[0];

    await env.DB.prepare(`
      INSERT INTO queue_stats (
        date, queue_name, task_type, total_count, success_count,
        failure_count, avg_duration_ms
      )
      VALUES (?, ?, ?, 1, ?, ?, ?)
      ON CONFLICT(date, queue_name, task_type) DO UPDATE SET
        total_count = total_count + 1,
        success_count = success_count + ?,
        failure_count = failure_count + ?,
        avg_duration_ms = (avg_duration_ms * total_count + ?) / (total_count + 1)
    `).bind(
      date,
      queueName,
      taskType,
      success ? 1 : 0,
      success ? 0 : 1,
      durationMs,
      success ? 1 : 0,
      success ? 0 : 1,
      durationMs
    ).run();
  } catch (error) {
    console.error('Failed to update queue stats:', error);
  }
}

