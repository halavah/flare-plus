// 日志中间件
export async function logger(request) {
  const startTime = Date.now();
  const url = new URL(request.url);

  console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`);
}

export function logResponse(request, response, startTime) {
  const duration = Date.now() - startTime;
  const url = new URL(request.url);

  console.log(
    `[${new Date().toISOString()}] ` +
    `${request.method} ${url.pathname} ` +
    `${response.status} ${duration}ms`
  );
}

export async function logQueueTask(env, taskId, level, message, metadata = {}) {
  try {
    const logId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO queue_logs (id, task_id, level, message, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      logId,
      taskId,
      level,
      message,
      JSON.stringify(metadata),
      Date.now()
    ).run();
  } catch (error) {
    console.error('Failed to log queue task:', error);
  }
}

