// 去重工具
export async function checkDuplicate(env, queueName, messageId, window) {
  const key = `dedup:${queueName}:${messageId}`;

  const exists = await env.QUEUE_KV.get(key);
  if (exists) {
    return true; // 重复消息
  }

  // 标记为已处理
  await env.QUEUE_KV.put(key, Date.now().toString(), {
    expirationTtl: window
  });

  return false; // 非重复消息
}

export function generateMessageId(payload) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));

  return crypto.subtle.digest('SHA-256', data)
    .then(hash => {
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
}

