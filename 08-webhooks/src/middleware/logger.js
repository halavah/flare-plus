// 日志中间件
export async function logger(request) {
  const startTime = Date.now();
  const url = new URL(request.url);

  console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`);

  // 记录 webhook 特定的头部
  const provider = request.headers.get('X-GitHub-Event') ||
                   request.headers.get('X-Slack-Signature') ||
                   'unknown';

  if (provider !== 'unknown') {
    console.log(`Provider: ${provider}`);
  }
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

export async function logWebhookEvent(env, eventId, level, message, metadata = {}) {
  try {
    const logId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO webhook_logs (id, event_id, level, message, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      logId,
      eventId,
      level,
      message,
      JSON.stringify(metadata),
      Date.now()
    ).run();
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }
}

