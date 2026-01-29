// 会话管理工具函数
import { generateUUID } from './helpers.js';

// 生成会话令牌
export async function generateSessionToken(verificationData, env) {
  const sessionToken = generateUUID();
  const now = Date.now();
  const expiresAt = now + (parseInt(env.SESSION_DURATION) * 1000);

  const sessionData = {
    token: sessionToken,
    verified: verificationData.verified,
    action: verificationData.action,
    challenge_ts: verificationData.challenge_ts,
    hostname: verificationData.hostname,
    ip: verificationData.ip,
    userAgent: verificationData.userAgent,
    metadata: verificationData.metadata || {},
    timestamp: now,
    expiresAt
  };

  // 存储到 KV
  await env.TURNSTILE_SESSIONS.put(
    `session:${sessionToken}`,
    JSON.stringify(sessionData),
    { expirationTtl: parseInt(env.SESSION_DURATION) }
  );

  return sessionToken;
}

// 验证会话令牌
export async function validateSessionToken(sessionToken, env) {
  const sessionData = await env.TURNSTILE_SESSIONS.get(`session:${sessionToken}`);

  if (!sessionData) {
    return {
      valid: false,
      reason: 'Session not found or expired'
    };
  }

  const session = JSON.parse(sessionData);

  // 检查是否过期
  if (Date.now() > session.expiresAt) {
    await env.TURNSTILE_SESSIONS.delete(`session:${sessionToken}`);
    return {
      valid: false,
      reason: 'Session expired'
    };
  }

  return {
    valid: true,
    session
  };
}

// 删除会话
export async function deleteSession(sessionToken, env) {
  await env.TURNSTILE_SESSIONS.delete(`session:${sessionToken}`);
}

