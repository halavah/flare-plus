// 邮件转发器
export class EmailForwarder {
  constructor(env) {
    this.env = env;
  }

  // 转发邮件到单个收件人
  async forward(message, recipient, options = {}) {
    try {
      console.log(`Forwarding email from ${message.from} to ${recipient}`);

      // 基础转发
      await message.forward(recipient, {
        headers: options.addHeaders || {}
      });

      return {
        success: true,
        recipient,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Forward failed:', error);
      throw error;
    }
  }

  // 转发到多个收件人
  async forwardToMultiple(message, recipients, options = {}) {
    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.forward(message, recipient, options);
        results.push({ ...result, success: true });
      } catch (error) {
        results.push({
          success: false,
          recipient,
          error: error.message
        });
      }
    }

    return results;
  }

  // 条件转发
  async conditionalForward(message, rules) {
    const from = message.from;
    const to = message.to;
    const subject = message.headers.get('subject') || '';

    for (const rule of rules) {
      if (this.matchesRule(rule, { from, to, subject })) {
        console.log(`Rule matched: ${rule.name}`);

        switch (rule.action) {
          case 'forward':
            return await this.forward(message, rule.target, rule.options);

          case 'forward_multiple':
            return await this.forwardToMultiple(message, rule.targets, rule.options);

          case 'forward_with_modification':
            return await this.forwardWithModification(message, rule.target, rule.modifications);

          default:
            console.warn(`Unknown action: ${rule.action}`);
        }
      }
    }

    return null;
  }

  // 匹配规则
  matchesRule(rule, emailInfo) {
    const { from, to, subject } = emailInfo;

    // 检查发件人
    if (rule.fromPattern && !this.matchPattern(from, rule.fromPattern)) {
      return false;
    }

    // 检查收件人
    if (rule.toPattern && !this.matchPattern(to, rule.toPattern)) {
      return false;
    }

    // 检查主题
    if (rule.subjectPattern && !this.matchPattern(subject, rule.subjectPattern)) {
      return false;
    }

    return true;
  }

  // 模式匹配
  matchPattern(text, pattern) {
    if (pattern === '*') return true;
    if (pattern === text) return true;

    // 支持通配符
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(text);
    }

    // 支持正则表达式
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      const regex = new RegExp(pattern.slice(1, -1));
      return regex.test(text);
    }

    return false;
  }

  // 修改后转发
  async forwardWithModification(message, recipient, modifications = {}) {
    const headers = {};

    // 添加自定义头部
    if (modifications.addHeaders) {
      Object.assign(headers, modifications.addHeaders);
    }

    // 添加前缀到主题
    if (modifications.subjectPrefix) {
      const originalSubject = message.headers.get('subject') || '';
      headers['subject'] = `${modifications.subjectPrefix}${originalSubject}`;
    }

    // 添加备注
    if (modifications.addNote) {
      headers['X-Forwarded-Note'] = modifications.addNote;
    }

    // 添加转发标记
    headers['X-Forwarded-By'] = 'Cloudflare Email Routing';
    headers['X-Forwarded-For'] = message.from;
    headers['X-Original-To'] = message.to;

    return await this.forward(message, recipient, { addHeaders: headers });
  }

  // 使用模板转发
  async forwardWithTemplate(message, recipient, templateName) {
    // 获取模板
    const template = await this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // 应用模板修改
    return await this.forwardWithModification(message, recipient, template.modifications);
  }

  // 获取模板
  async getTemplate(name) {
    if (!this.env.EMAIL_KV) return null;

    const template = await this.env.EMAIL_KV.get(`template:${name}`, 'json');
    return template;
  }

  // 智能转发（根据邮件内容决定转发方式）
  async smartForward(message, parsed, config) {
    const { from, to, subject } = parsed;

    // 根据发件人域名决定转发目标
    const domain = from.email.split('@')[1];

    if (config.domainRouting && config.domainRouting[domain]) {
      return await this.forward(message, config.domainRouting[domain]);
    }

    // 根据主题关键词决定转发目标
    if (config.keywordRouting) {
      for (const [keyword, recipient] of Object.entries(config.keywordRouting)) {
        if (subject.toLowerCase().includes(keyword.toLowerCase())) {
          return await this.forward(message, recipient);
        }
      }
    }

    // 根据附件决定转发目标
    if (parsed.attachments.length > 0 && config.attachmentRecipient) {
      return await this.forward(message, config.attachmentRecipient);
    }

    // 默认转发
    if (config.defaultRecipient) {
      return await this.forward(message, config.defaultRecipient);
    }

    return null;
  }

  // 延迟转发（使用 Queue）
  async scheduleForward(message, recipient, delaySeconds) {
    if (!this.env.EMAIL_QUEUE) {
      throw new Error('Email queue not configured');
    }

    // 存储邮件内容
    const emailId = crypto.randomUUID();
    const emailData = {
      from: message.from,
      to: message.to,
      recipient,
      timestamp: Date.now(),
      scheduledFor: Date.now() + (delaySeconds * 1000)
    };

    // 发送到队列
    await this.env.EMAIL_QUEUE.send({
      type: 'scheduled_forward',
      emailId,
      data: emailData
    }, {
      delaySeconds
    });

    return {
      success: true,
      emailId,
      scheduledFor: emailData.scheduledFor
    };
  }
}

// 便捷函数
export async function forwardEmail(message, recipient, env, options = {}) {
  const forwarder = new EmailForwarder(env);
  return await forwarder.forward(message, recipient, options);
}

export async function forwardToMultiple(message, recipients, env, options = {}) {
  const forwarder = new EmailForwarder(env);
  return await forwarder.forwardToMultiple(message, recipients, options);
}

export async function smartForward(message, parsed, config, env) {
  const forwarder = new EmailForwarder(env);
  return await forwarder.smartForward(message, parsed, config);
}

