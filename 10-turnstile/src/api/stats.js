// 统计信息 API
export const handleStats = {
  // 获取概览统计
  async overview(request, env) {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // 今日统计
      const todayStats = await env.TURNSTILE_DB.prepare(`
        SELECT
          total_verifications,
          successful_verifications,
          failed_verifications,
          ROUND((successful_verifications * 100.0 / NULLIF(total_verifications, 0)), 2) as success_rate
        FROM analytics
        WHERE date = ? AND site_key = ?
      `).bind(today, env.TURNSTILE_SITE_KEY).first();

      // 最近1小时统计
      const hourAgo = new Date(now.getTime() - 3600000).toISOString();
      const recentStats = await env.TURNSTILE_DB.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
          COUNT(DISTINCT ip_address) as unique_ips
        FROM verification_logs
        WHERE created_at >= ?
      `).bind(hourAgo).first();

      return new Response(JSON.stringify({
        success: true,
        stats: {
          today: {
            total: todayStats?.total_verifications || 0,
            successful: todayStats?.successful_verifications || 0,
            failed: todayStats?.failed_verifications || 0,
            successRate: todayStats?.success_rate || 0
          },
          lastHour: {
            total: recentStats.total,
            successful: recentStats.successful,
            failed: recentStats.total - recentStats.successful,
            uniqueIPs: recentStats.unique_ips,
            successRate: recentStats.total > 0
              ? ((recentStats.successful / recentStats.total) * 100).toFixed(2)
              : 0
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // 获取详细指标
  async metrics(request, env) {
    try {
      const url = new URL(request.url);
      const days = parseInt(url.searchParams.get('days')) || 7;

      // 获取最近N天的统计数据
      const metrics = await env.TURNSTILE_DB.prepare(`
        SELECT
          date,
          total_verifications,
          successful_verifications,
          failed_verifications,
          ROUND((successful_verifications * 100.0 / NULLIF(total_verifications, 0)), 2) as success_rate
        FROM analytics
        WHERE date >= date('now', '-' || ? || ' days')
          AND site_key = ?
        ORDER BY date DESC
      `).bind(days, env.TURNSTILE_SITE_KEY).all();

      // 计算总计
      const totals = metrics.results.reduce((acc, day) => ({
        total: acc.total + day.total_verifications,
        successful: acc.successful + day.successful_verifications,
        failed: acc.failed + day.failed_verifications
      }), { total: 0, successful: 0, failed: 0 });

      return new Response(JSON.stringify({
        success: true,
        period: `${days} days`,
        metrics: metrics.results,
        totals: {
          ...totals,
          successRate: totals.total > 0
            ? ((totals.successful / totals.total) * 100).toFixed(2)
            : 0
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // 获取验证日志
  async logs(request, env) {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const success = url.searchParams.get('success');

      let query = `
        SELECT
          id,
          success,
          error_message,
          ip_address,
          user_agent,
          created_at
        FROM verification_logs
        WHERE site_key = ?
      `;
      const params = [env.TURNSTILE_SITE_KEY];

      if (success !== null && success !== undefined) {
        query += ' AND success = ?';
        params.push(success === 'true' ? 1 : 0);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const logs = await env.TURNSTILE_DB.prepare(query).bind(...params).all();

      return new Response(JSON.stringify({
        success: true,
        logs: logs.results,
        total: logs.results.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

