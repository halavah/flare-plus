// 速率限制工具函数
export async function checkRateLimit(identifier, env) {
  const now = Date.now();
  const windowStart = Math.floor(now / (parseInt(env.RATE_LIMIT_WINDOW) * 1000)) *
                      (parseInt(env.RATE_LIMIT_WINDOW) * 1000);
  const maxAttempts = parseInt(env.MAX_ATTEMPTS);

  try {
    // 查询当前窗口的尝试次数
    const existing = await env.TURNSTILE_DB.prepare(`
      SELECT attempts, window_start
      FROM rate_limits
      WHERE identifier = ?
    `).bind(identifier).first();

    if (existing) {
      // 检查窗口是否过期
      if (existing.window_start === windowStart) {
        if (existing.attempts >= maxAttempts) {
          return {
            allowed: false,
            attempts: existing.attempts,
            resetAt: new Date(windowStart + parseInt(env.RATE_LIMIT_WINDOW) * 1000).toISOString()
          };
        }
      }
    }

    // 更新或创建速率限制记录
    await env.TURNSTILE_DB.prepare(`
      INSERT INTO rate_limits (id, identifier, attempts, window_start)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET
        attempts = CASE
          WHEN window_start = ? THEN attempts + 1
          ELSE 1
        END,
        window_start = ?
    `).bind(
      `rate:${identifier}`,
      identifier,
      windowStart,
      windowStart,
      windowStart
    ).run();

    // 获取更新后的尝试次数
    const updated = await env.TURNSTILE_DB.prepare(`
      SELECT attempts FROM rate_limits WHERE identifier = ?
    `).bind(identifier).first();

    return {
      allowed: updated.attempts <= maxAttempts,
      attempts: updated.attempts,
      remaining: Math.max(0, maxAttempts - updated.attempts),
      resetAt: new Date(windowStart + parseInt(env.RATE_LIMIT_WINDOW) * 1000).toISOString()
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // 失败时允许请求，避免阻塞正常用户
    return {
      allowed: true,
      attempts: 0,
      remaining: maxAttempts
    };
  }
}

// 重置速率限制
export async function resetRateLimit(identifier, env) {
  await env.TURNSTILE_DB.prepare(`
    DELETE FROM rate_limits WHERE identifier = ?
  `).bind(identifier).run();
}

