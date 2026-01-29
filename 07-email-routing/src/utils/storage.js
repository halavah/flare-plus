// 邮件存储工具
export async function storeEmail(message, env) {
  const emailId = crypto.randomUUID();

  try {
    // 获取邮件内容
    const raw = await message.raw();
    const headers = {};
    for (const [key, value] of message.headers) {
      headers[key] = value;
    }

    const emailData = {
      id: emailId,
      from: message.from,
      to: message.to,
      subject: headers['subject'] || '',
      headers,
      timestamp: new Date().toISOString()
    };

    // 存储到 R2（如果可用）
    if (env.EMAIL_STORAGE) {
      await env.EMAIL_STORAGE.put(
        `emails/${emailId}`,
        JSON.stringify(emailData),
        {
          httpMetadata: {
            contentType: 'application/json'
          }
        }
      );
    }

    return emailId;
  } catch (error) {
    console.error('Failed to store email:', error);
    throw error;
  }
}

