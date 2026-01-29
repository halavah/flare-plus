// 邮件路由处理 - 完整版
import { storeEmail } from '../utils/storage.js';
import { checkSpam, updateSenderReputation } from '../utils/spam-filter.js';
import { parseEmail, getEmailSummary } from '../utils/email-parser.js';
import { forwardEmail, forwardToMultiple, smartForward } from '../utils/forwarder.js';
import { extractAttachments, saveAttachments } from '../utils/attachment-handler.js';
import { logEmail } from '../utils/analytics.js';

export const handleRoutes = {
  // 处理收到的邮件 - 完整实现
  async processEmail(message, env, ctx) {
    const from = message.from;
    const to = message.to;
    const subject = message.headers.get('subject') || '(无主题)';
    const startTime = Date.now();

    console.log(`Processing email from ${from} to ${to}: ${subject}`);

    try {
      // 步骤 1: 解析邮件
      console.log('Step 1: Parsing email...');
      const parsed = await parseEmail(message);

      // 步骤 2: 垃圾邮件检测
      console.log('Step 2: Spam detection...');
      const spamCheck = await checkSpam(message, env, parsed);

      if (spamCheck.isSpam) {
        console.log(`Spam detected (score: ${spamCheck.score}): ${spamCheck.reason}`);

        // 记录垃圾邮件
        await logEmail({
          from,
          to,
          subject,
          status: 'rejected',
          reason: 'spam',
          spamScore: spamCheck.score,
          spamDetails: spamCheck.details
        }, env);

        // 更新发件人信誉
        await updateSenderReputation(from, true, env);

        // 拒绝邮件
        message.setReject(`Spam detected: ${spamCheck.reason}`);
        return;
      }

      // 更新发件人信誉（非垃圾邮件）
      await updateSenderReputation(from, false, env);

      // 步骤 3: 提取附件
      console.log('Step 3: Extracting attachments...');
      const attachments = await extractAttachments(message, env);
      console.log(`Found ${attachments.length} attachment(s)`);

      // 步骤 4: 获取路由规则
      console.log('Step 4: Getting routing rules...');
      const rules = await getMatchingRules(to, env);
      console.log(`Found ${rules.length} matching rule(s)`);

      // 步骤 5: 应用路由规则
      if (rules.length === 0) {
        // 没有匹配规则，使用默认处理
        await this.handleDefaultRoute(message, parsed, attachments, env);
      } else {
        // 应用第一条匹配的规则
        const rule = rules[0];
        await this.applyRoutingRule(message, parsed, attachments, rule, env);
      }

      // 步骤 6: 记录成功
      const duration = Date.now() - startTime;
      await logEmail({
        from,
        to,
        subject,
        status: 'processed',
        duration,
        attachmentCount: attachments.length,
        parsedSize: parsed.size
      }, env);

      console.log(`Email processed successfully in ${duration}ms`);
    } catch (error) {
      console.error('Email processing error:', error);

      // 记录错误
      await logEmail({
        from,
        to,
        subject,
        status: 'error',
        error: error.message,
        stack: error.stack
      }, env);

      // 抛出错误让 Cloudflare 处理
      throw error;
    }
  },

  // 处理默认路由
  async handleDefaultRoute(message, parsed, attachments, env) {
    const defaultAction = env.DEFAULT_ACTION || 'forward';
    const defaultRecipient = env.DEFAULT_RECIPIENT || message.to;

    console.log(`Applying default action: ${defaultAction}`);

    switch (defaultAction) {
      case 'forward':
        await forwardEmail(message, defaultRecipient, env);
        await logEmail({
          from: message.from,
          to: message.to,
          subject: parsed.subject,
          status: 'forwarded',
          recipient: defaultRecipient,
          rule: 'default'
        }, env);
        break;

      case 'store':
        const emailId = await storeEmail(message, env);

        // 保存附件
        if (attachments.length > 0) {
          await saveAttachments(attachments, emailId, env);
        }

        await logEmail({
          from: message.from,
          to: message.to,
          subject: parsed.subject,
          status: 'stored',
          emailId,
          rule: 'default'
        }, env);
        break;

      case 'drop':
        await logEmail({
          from: message.from,
          to: message.to,
          subject: parsed.subject,
          status: 'dropped',
          rule: 'default'
        }, env);
        console.log('Email dropped per default action');
        break;

      default:
        await forwardEmail(message, defaultRecipient, env);
    }
  },

  // 应用路由规则
  async applyRoutingRule(message, parsed, attachments, rule, env) {
    console.log(`Applying rule: ${rule.name} (action: ${rule.action})`);

    const from = message.from;
    const to = message.to;
    const subject = parsed.subject;

    try {
      switch (rule.action) {
        case 'forward':
          // 单个转发
          await forwardEmail(message, rule.target, env, {
            addHeaders: rule.add_headers ? JSON.parse(rule.add_headers) : {}
          });

          await logEmail({
            from,
            to,
            subject,
            status: 'forwarded',
            recipient: rule.target,
            rule: rule.name
          }, env);
          break;

        case 'forward_multiple':
          // 多个转发
          const targets = rule.targets ? JSON.parse(rule.targets) : [rule.target];
          await forwardToMultiple(message, targets, env);

          await logEmail({
            from,
            to,
            subject,
            status: 'forwarded_multiple',
            recipients: targets.join(', '),
            rule: rule.name
          }, env);
          break;

        case 'store':
          // 存储邮件
          const emailId = await storeEmail(message, env);

          // 保存附件
          if (attachments.length > 0) {
            const attachmentResults = await saveAttachments(attachments, emailId, env);
            console.log(`Saved ${attachmentResults.filter(r => r.success).length} attachments`);
          }

          await logEmail({
            from,
            to,
            subject,
            status: 'stored',
            emailId,
            attachmentCount: attachments.length,
            rule: rule.name
          }, env);
          break;

        case 'store_and_forward':
          // 存储并转发
          const storeEmailId = await storeEmail(message, env);

          if (attachments.length > 0) {
            await saveAttachments(attachments, storeEmailId, env);
          }

          await forwardEmail(message, rule.target, env);

          await logEmail({
            from,
            to,
            subject,
            status: 'stored_and_forwarded',
            emailId: storeEmailId,
            recipient: rule.target,
            rule: rule.name
          }, env);
          break;

        case 'drop':
          // 丢弃邮件
          await logEmail({
            from,
            to,
            subject,
            status: 'dropped',
            rule: rule.name
          }, env);
          console.log('Email dropped per rule');
          break;

        case 'auto_reply':
          // 自动回复
          await this.sendAutoReply(message, rule, env);

          await logEmail({
            from,
            to,
            subject,
            status: 'auto_replied',
            rule: rule.name
          }, env);
          break;

        case 'smart_forward':
          // 智能转发
          const config = rule.config ? JSON.parse(rule.config) : {};
          await smartForward(message, parsed, config, env);

          await logEmail({
            from,
            to,
            subject,
            status: 'smart_forwarded',
            rule: rule.name
          }, env);
          break;

        default:
          console.warn(`Unknown action: ${rule.action}, using default forward`);
          await forwardEmail(message, rule.target || to, env);
      }

      // 更新规则统计
      await this.updateRuleStats(rule.id, true, env);
    } catch (error) {
      console.error(`Failed to apply rule ${rule.name}:`, error);

      // 更新规则统计（失败）
      await this.updateRuleStats(rule.id, false, env);

      throw error;
    }
  },

  // 发送自动回复
  async sendAutoReply(message, rule, env) {
    if (!env.SEND_EMAIL) {
      console.warn('Send email binding not configured');
      return;
    }

    const replyTemplate = rule.reply_template || 'Thank you for your email. We will respond shortly.';
    const replySubject = rule.reply_subject || `Re: ${message.headers.get('subject') || ''}`;

    try {
      await env.SEND_EMAIL.send({
        from: message.to,
        to: message.from,
        subject: replySubject,
        text: replyTemplate
      });

      console.log(`Auto-reply sent to ${message.from}`);
    } catch (error) {
      console.error('Failed to send auto-reply:', error);
    }
  },

  // 更新规则统计
  async updateRuleStats(ruleId, success, env) {
    try {
      if (!env.EMAIL_DB) return;

      await env.EMAIL_DB.prepare(`
        UPDATE routing_rules
        SET
          total_processed = total_processed + 1,
          ${success ? 'success_count = success_count + 1' : 'failure_count = failure_count + 1'},
          last_used = ?
        WHERE id = ?
      `).bind(Date.now(), ruleId).run();
    } catch (error) {
      console.error('Failed to update rule stats:', error);
    }
  }
};

// 获取匹配的路由规则
async function getMatchingRules(recipient, env) {
  try {
    if (!env.EMAIL_DB) return [];

    const rules = await env.EMAIL_DB.prepare(`
      SELECT * FROM routing_rules
      WHERE active = 1
      ORDER BY priority DESC
    `).all();

    if (!rules.results || rules.results.length === 0) {
      return [];
    }

    // 过滤匹配的规则
    return rules.results.filter(rule => matchesRule(rule, recipient));
  } catch (error) {
    console.error('Failed to get routing rules:', error);
    return [];
  }
}

// 匹配规则
function matchesRule(rule, recipient) {
  const pattern = rule.pattern || rule.match_pattern;

  if (!pattern) return false;

  // 通配符匹配
  if (pattern === '*') return true;

  // 精确匹配
  if (pattern === recipient) return true;

  // 域名匹配（@example.com）
  if (pattern.startsWith('@')) {
    const domain = recipient.split('@')[1];
    return pattern.substring(1) === domain;
  }

  // 通配符正则匹配
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$');
    return regex.test(recipient);
  }

  // 正则表达式匹配
  if (pattern.startsWith('/') && pattern.endsWith('/')) {
    const regex = new RegExp(pattern.slice(1, -1));
    return regex.test(recipient);
  }

  return false;
}
