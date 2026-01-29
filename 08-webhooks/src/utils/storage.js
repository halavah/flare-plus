// 存储工具
export async function saveWebhookEvent(env, eventData) {
  try {
    const eventId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO webhook_events (
        id, provider, event_type, payload, signature, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      eventId,
      eventData.provider,
      eventData.eventType,
      JSON.stringify(eventData.payload),
      eventData.signature || null,
      'pending',
      Date.now()
    ).run();

    return eventId;
  } catch (error) {
    console.error('Failed to save webhook event:', error);
    throw error;
  }
}

export async function updateWebhookEvent(env, eventId, updates) {
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

    if (updates.processedAt) {
      fields.push('processed_at = ?');
      values.push(updates.processedAt);
    }

    if (fields.length === 0) return;

    values.push(eventId);

    await env.DB.prepare(`
      UPDATE webhook_events
      SET ${fields.join(', ')}
      WHERE id = ?
    `).bind(...values).run();
  } catch (error) {
    console.error('Failed to update webhook event:', error);
    throw error;
  }
}

export async function getWebhookEvent(env, eventId) {
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM webhook_events WHERE id = ?
    `).bind(eventId).first();

    if (result && result.payload) {
      result.payload = JSON.parse(result.payload);
    }

    return result;
  } catch (error) {
    console.error('Failed to get webhook event:', error);
    throw error;
  }
}

export async function updateWebhookStats(env, provider, eventType, success) {
  try {
    const date = new Date().toISOString().split('T')[0];

    await env.DB.prepare(`
      INSERT INTO webhook_stats (date, provider, event_type, total_count, success_count, failure_count)
      VALUES (?, ?, ?, 1, ?, ?)
      ON CONFLICT(date, provider, event_type) DO UPDATE SET
        total_count = total_count + 1,
        success_count = success_count + ?,
        failure_count = failure_count + ?
    `).bind(
      date,
      provider,
      eventType,
      success ? 1 : 0,
      success ? 0 : 1,
      success ? 1 : 0,
      success ? 0 : 1
    ).run();
  } catch (error) {
    console.error('Failed to update webhook stats:', error);
  }
}

