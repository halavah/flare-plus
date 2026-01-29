// 统计信息 API
export const handleStats = {
  // 获取概览统计
  async overview(request, env) {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // 今日统计
      const todayStats = await env.EMAIL_DB.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'forwarded' THEN 1 ELSE 0 END) as forwarded,
          SUM(CASE WHEN status = 'stored' THEN 1 ELSE 0 END) as stored,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status = 'dropped' THEN 1 ELSE 0 END) as dropped,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
        FROM email_logs
        WHERE DATE(created_at) = ?
      `).bind(today).first();

      // 最近24小时统计
      const dayAgo = new Date(now.getTime() - 24 * 3600000).toISOString();
      const last24hStats = await env.EMAIL_DB.prepare(`
        SELECT
          COUNT(*) as total,
          COUNT(DISTINCT from_email) as unique_senders,
          COUNT(DISTINCT to_email) as unique_recipients
        FROM email_logs
        WHERE created_at >= ?
      `).bind(dayAgo).first();

      return new Response(JSON.stringify({
        success: true,
        stats: {
          today: {
            total: todayStats.total,
            forwarded: todayStats.forwarded,
            stored: todayStats.stored,
            rejected: todayStats.rejected,
            dropped: todayStats.dropped,
            errors: todayStats.errors
          },
          last24h: {
            total: last24hStats.total,
            uniqueSenders: last24hStats.unique_senders,
            uniqueRecipients: last24hStats.unique_recipients
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

  // 获取邮件量统计
  async volume(request, env) {
    try {
      const url = new URL(request.url);
      const days = parseInt(url.searchParams.get('days')) || 7;

      const metrics = await env.EMAIL_DB.prepare(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'forwarded' THEN 1 ELSE 0 END) as forwarded,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM email_logs
        WHERE DATE(created_at) >= DATE('now', '-' || ? || ' days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `).bind(days).all();

      return new Response(JSON.stringify({
        success: true,
        period: `${days} days`,
        metrics: metrics.results
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

  // 获取域名统计
  async domains(request, env) {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit')) || 10;

      const domainStats = await env.EMAIL_DB.prepare(`
        SELECT
          SUBSTR(from_email, INSTR(from_email, '@') + 1) as domain,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM email_logs
        WHERE created_at >= DATE('now', '-7 days')
        GROUP BY domain
        ORDER BY count DESC
        LIMIT ?
      `).bind(limit).all();

      return new Response(JSON.stringify({
        success: true,
        domains: domainStats.results
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

