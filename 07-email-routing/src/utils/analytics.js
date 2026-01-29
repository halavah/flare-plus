// 邮件分析记录
export async function logEmail(emailData, env) {
  try {
    const id = crypto.randomUUID();

    await env.EMAIL_DB.prepare(`
      INSERT INTO email_logs (
        id,
        from_email,
        to_email,
        subject,
        status,
        recipient,
        rule_name,
        email_id,
        error_message,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      emailData.from,
      emailData.to,
      emailData.subject,
      emailData.status,
      emailData.recipient || null,
      emailData.rule || null,
      emailData.emailId || null,
      emailData.error || null,
      new Date().toISOString()
    ).run();
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

