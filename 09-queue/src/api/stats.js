// 统计 API
export async function getQueueStats(request, env) {
  try {
    const url = new URL(request.url);
    const queue = url.searchParams.get('queue');
    const days = parseInt(url.searchParams.get('days') || '7');

    let query = `
      SELECT
        date,
        queue_name,
        task_type,
        total_count,
        success_count,
        failure_count,
        avg_duration_ms
      FROM queue_stats
      WHERE date >= date('now', '-${days} days')
    `;

    const params = [];
    if (queue) {
      query += ' AND queue_name = ?';
      params.push(queue);
    }

    query += ' ORDER BY date DESC, queue_name, task_type';

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
      successRate: totals.total > 0 ? (totals.success / totals.total * 100).toFixed(2) + '%' : '0%',
      period: {
        days,
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    throw error;
  }
}

export async function getQueueTasks(request, env) {
  try {
    const url = new URL(request.url);
    const queue = url.searchParams.get('queue');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = 'SELECT * FROM queue_tasks WHERE 1=1';
    const params = [];

    if (queue) {
      query += ' AND queue_name = ?';
      params.push(queue);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    // 解析 payload
    const tasks = results.map(task => ({
      ...task,
      payload: JSON.parse(task.payload)
    }));

    return new Response(JSON.stringify({
      success: true,
      tasks,
      count: tasks.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to get queue tasks:', error);
    throw error;
  }
}

export async function getDeadLetterQueue(request, env) {
  try {
    const url = new URL(request.url);
    const queue = url.searchParams.get('queue');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = 'SELECT * FROM dead_letter_queue WHERE 1=1';
    const params = [];

    if (queue) {
      query += ' AND original_queue = ?';
      params.push(queue);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    // 解析 payload
    const dlqTasks = results.map(task => ({
      ...task,
      payload: JSON.parse(task.payload)
    }));

    return new Response(JSON.stringify({
      success: true,
      tasks: dlqTasks,
      count: dlqTasks.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to get DLQ:', error);
    throw error;
  }
}

