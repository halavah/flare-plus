// 分析和日志工具函数
import { generateUUID } from './helpers.js';

// 记录验证日志
export async function logVerification(logData, env) {
  const logId = generateUUID();

  try {
    await env.TURNSTILE_DB.prepare(`
      INSERT INTO verification_logs (
        id,
        site_key,
        success,
        error_message,
        ip_address,
        user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logId,
      env.TURNSTILE_SITE_KEY,
      logData.success ? 1 : 0,
      logData.errorCodes ? logData.errorCodes.join(',') : null,
      logData.ipAddress,
      logData.userAgent,
      new Date().toISOString()
    ).run();
  } catch (error) {
    console.error('Failed to log verification:', error);
  }
}

// 更新统计数据
export async function updateAnalytics(siteKey, success, env) {
  const today = new Date().toISOString().split('T')[0];

  try {
    await env.TURNSTILE_DB.prepare(`
      INSERT INTO analytics (
        date,
        site_key,
        total_verifications,
        successful_verifications,
        failed_verifications
      ) VALUES (?, ?, 1, ?, ?)
      ON CONFLICT(date, site_key) DO UPDATE SET
        total_verifications = total_verifications + 1,
        successful_verifications = successful_verifications + ?,
        failed_verifications = failed_verifications + ?
    `).bind(
      today,
      siteKey,
      success ? 1 : 0,
      success ? 0 : 1,
      success ? 1 : 0,
      success ? 0 : 1
    ).run();
  } catch (error) {
    console.error('Failed to update analytics:', error);
  }
}

// 获取统计概览
export async function getStatsOverview(siteKey, env) {
  const today = new Date().toISOString().split('T')[0];

  const stats = await env.TURNSTILE_DB.prepare(`
    SELECT
      total_verifications,
      successful_verifications,
      failed_verifications
    FROM analytics
    WHERE date = ? AND site_key = ?
  `).bind(today, siteKey).first();

  return stats || {
    total_verifications: 0,
    successful_verifications: 0,
    failed_verifications: 0
  };
}

