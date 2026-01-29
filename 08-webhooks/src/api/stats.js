// 统计 API
export async function getWebhookStats(request, env) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');
    const days = parseInt(url.searchParams.get('days') || '7');

    let query = `
      SELECT
        date,
        provider,
        event_type,
        total_count,
        success_count,
        failure_count
      FROM webhook_stats
      WHERE date >= date('now', '-${days} days')
    `;

    const params = [];
    if (provider) {
      query += ' AND provider = ?';
      params.push(provider);
    }

    query += ' ORDER BY date DESC, provider, event_type';

    const stmt = params.length > 0
      ? env.DB.prepare(query).bind(...params)
      : env.DB.prepare(query);

    const { results } = await stmt.all();

    // 计算总计
    const totals = results.reduce((acc, row) => {
      acc.total += row.total_count;
      acc.success += row.success_count;
      acc.failure += row.failure_count;
      return acc;
    }, { total: 0, success: 0, failure: 0 });

    return new Response(JSON.stringify({
      success: true,
      stats: results,
      totals,
      period: {
        days,
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to get webhook stats:', error);
    throw error;
  }
}

export async function getWebhookEvents(request, env) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = 'SELECT * FROM webhook_events WHERE 1=1';
    const params = [];

    if (provider) {
      query += ' AND provider = ?';
      params.push(provider);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    // 解析 payload
    const events = results.map(event => ({
      ...event,
      payload: JSON.parse(event.payload)
    }));

    return new Response(JSON.stringify({
      success: true,
      events,
      count: events.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to get webhook events:', error);
    throw error;
  }
}

