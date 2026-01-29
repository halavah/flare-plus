// 增强的垃圾邮件过滤器
export class SpamFilter {
  constructor(env) {
    this.env = env;
    this.rules = this.initializeRules();
  }

  // 初始化过滤规则
  initializeRules() {
    return {
      // 垃圾关键词列表
      spamKeywords: [
        'lottery', 'winner', 'congratulations', 'free money', 'viagra',
        'casino', 'click here', 'act now', 'limited time', 'buy now',
        'weight loss', 'make money fast', 'work from home', 'earn extra cash',
        'nigerian prince', 'inheritance', 'urgent response', 'verify account',
        'suspended account', 'confirm identity', 'billing problem'
      ],

      // 可疑域名列表
      suspiciousDomains: [
        'spam.com', 'fake.org', 'scam.net', 'phishing.com',
        'tempmail.com', 'guerrillamail.com', '10minutemail.com'
      ],

      // 可疑 TLD 列表
      suspiciousTLDs: [
        '.xyz', '.top', '.club', '.work', '.click', '.link',
        '.download', '.stream', '.review', '.country'
      ],

      // 黑名单 IP 范围（示例）
      blacklistedIPs: []
    };
  }

  // 综合垃圾邮件检测
  async check(message, parsed = null) {
    const scores = {
      keyword: 0,
      domain: 0,
      header: 0,
      content: 0,
      link: 0,
      attachment: 0
    };

    // 获取邮件信息
    const from = message.from;
    const subject = message.headers.get('subject') || '';
    const headers = {};

    for (const [key, value] of message.headers) {
      headers[key.toLowerCase()] = value;
    }

    // 1. 检查主题关键词
    scores.keyword = this.checkKeywords(subject);

    // 2. 检查发件人域名
    scores.domain = this.checkDomain(from);

    // 3. 检查邮件头
    scores.header = this.checkHeaders(headers);

    // 4. 检查内容（如果已解析）
    if (parsed) {
      scores.content = this.checkContent(parsed);
      scores.link = this.checkLinks(parsed);
      scores.attachment = this.checkAttachments(parsed);
    }

    // 5. 检查发件人信誉（使用 KV 缓存）
    const reputationScore = await this.checkReputation(from);
    scores.reputation = reputationScore;

    // 计算总分
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const isSpam = totalScore >= 50; // 阈值：50

    console.log('Spam check scores:', scores, 'Total:', totalScore, 'Is spam:', isSpam);

    return {
      isSpam,
      score: totalScore,
      details: scores,
      reason: this.getSpamReason(scores)
    };
  }

  // 检查关键词
  checkKeywords(text) {
    if (!text) return 0;

    const textLower = text.toLowerCase();
    let score = 0;

    for (const keyword of this.rules.spamKeywords) {
      if (textLower.includes(keyword)) {
        score += 15;
        console.log(`Spam keyword detected: ${keyword}`);
      }
    }

    // 全大写的主题（超过10个字符）
    if (text.length > 10 && text === text.toUpperCase()) {
      score += 20;
      console.log('All caps subject detected');
    }

    // 过多的感叹号
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 3) {
      score += 10;
      console.log(`Excessive exclamation marks: ${exclamationCount}`);
    }

    return Math.min(score, 50);
  }

  // 检查域名
  checkDomain(email) {
    if (!email) return 0;

    const domain = email.split('@')[1];
    if (!domain) return 0;

    let score = 0;

    // 检查是否在黑名单中
    if (this.rules.suspiciousDomains.includes(domain)) {
      score += 50;
      console.log(`Blacklisted domain: ${domain}`);
    }

    // 检查可疑 TLD
    for (const tld of this.rules.suspiciousTLDs) {
      if (domain.endsWith(tld)) {
        score += 20;
        console.log(`Suspicious TLD: ${tld}`);
        break;
      }
    }

    // 检查域名长度（过长的域名可能是垃圾邮件）
    if (domain.length > 30) {
      score += 10;
    }

    // 检查数字比例（域名中数字过多）
    const digitCount = (domain.match(/\d/g) || []).length;
    if (digitCount > domain.length * 0.3) {
      score += 15;
    }

    return Math.min(score, 50);
  }

  // 检查邮件头
  checkHeaders(headers) {
    let score = 0;

    // 检查是否缺少必要的头部
    if (!headers['message-id']) {
      score += 10;
    }

    if (!headers['date']) {
      score += 10;
    }

    // 检查 SPF/DKIM/DMARC
    const authResults = headers['authentication-results'] || '';
    if (authResults.includes('spf=fail')) {
      score += 30;
      console.log('SPF check failed');
    }
    if (authResults.includes('dkim=fail')) {
      score += 30;
      console.log('DKIM check failed');
    }

    // 检查可疑的 Received 头
    const received = headers['received'] || '';
    if (received.includes('unknown')) {
      score += 15;
    }

    return Math.min(score, 50);
  }

  // 检查内容
  checkContent(parsed) {
    if (!parsed || !parsed.body) return 0;

    const text = parsed.body.text || '';
    const html = parsed.body.html || '';
    let score = 0;

    // 检查内容长度（过短的邮件）
    if (text.length < 50 && text.length > 0) {
      score += 10;
    }

    // 检查 HTML 与文本比例（HTML 过多）
    if (html && text) {
      const ratio = html.length / text.length;
      if (ratio > 10) {
        score += 15;
      }
    }

    // 检查关键词
    score += this.checkKeywords(text);

    return Math.min(score, 50);
  }

  // 检查链接
  checkLinks(parsed) {
    if (!parsed || !parsed.body) return 0;

    const html = parsed.body.html || '';
    let score = 0;

    // 提取链接
    const linkMatches = html.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];

    // 过多的链接
    if (linkMatches.length > 10) {
      score += 20;
      console.log(`Too many links: ${linkMatches.length}`);
    }

    // 检查可疑链接
    for (const link of linkMatches) {
      const hrefMatch = link.match(/href=["']([^"']*)["']/i);
      if (hrefMatch) {
        const url = hrefMatch[1];

        // IP 地址链接
        if (/\d+\.\d+\.\d+\.\d+/.test(url)) {
          score += 15;
        }

        // 缩短链接
        if (url.includes('bit.ly') || url.includes('tinyurl') || url.includes('goo.gl')) {
          score += 10;
        }
      }
    }

    return Math.min(score, 50);
  }

  // 检查附件
  checkAttachments(parsed) {
    if (!parsed || !parsed.attachments) return 0;

    let score = 0;
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar', '.zip'];

    for (const attachment of parsed.attachments) {
      const filename = attachment.filename.toLowerCase();

      // 检查危险扩展名
      for (const ext of dangerousExtensions) {
        if (filename.endsWith(ext)) {
          score += 30;
          console.log(`Dangerous attachment: ${filename}`);
          break;
        }
      }
    }

    return Math.min(score, 50);
  }

  // 检查发件人信誉
  async checkReputation(email) {
    if (!this.env.EMAIL_KV) return 0;

    const key = `reputation:${email}`;
    const reputation = await this.env.EMAIL_KV.get(key, 'json');

    if (!reputation) return 0;

    // 负面信誉
    if (reputation.spam_count > reputation.total_count * 0.5) {
      return 40;
    }

    if (reputation.spam_count > 0) {
      return 20;
    }

    return 0;
  }

  // 更新发件人信誉
  async updateReputation(email, isSpam) {
    if (!this.env.EMAIL_KV) return;

    const key = `reputation:${email}`;
    let reputation = await this.env.EMAIL_KV.get(key, 'json') || {
      total_count: 0,
      spam_count: 0,
      last_seen: null
    };

    reputation.total_count++;
    if (isSpam) {
      reputation.spam_count++;
    }
    reputation.last_seen = Date.now();

    await this.env.EMAIL_KV.put(key, JSON.stringify(reputation), {
      expirationTtl: 86400 * 30 // 30 天
    });
  }

  // 获取垃圾邮件原因
  getSpamReason(scores) {
    const reasons = [];

    if (scores.keyword > 20) reasons.push('包含垃圾关键词');
    if (scores.domain > 20) reasons.push('可疑发件人域名');
    if (scores.header > 20) reasons.push('邮件头异常');
    if (scores.content > 20) reasons.push('内容可疑');
    if (scores.link > 20) reasons.push('包含可疑链接');
    if (scores.attachment > 20) reasons.push('包含危险附件');
    if (scores.reputation > 20) reasons.push('发件人信誉不佳');

    return reasons.join('; ') || '综合判定';
  }

  // 添加到黑名单
  async addToBlacklist(email) {
    if (!this.env.EMAIL_KV) return;
    await this.env.EMAIL_KV.put(`blacklist:${email}`, '1', {
      expirationTtl: 86400 * 90 // 90 天
    });
  }

  // 检查是否在黑名单中
  async isBlacklisted(email) {
    if (!this.env.EMAIL_KV) return false;
    const result = await this.env.EMAIL_KV.get(`blacklist:${email}`);
    return result !== null;
  }
}

// 便捷函数
export async function checkSpam(message, env, parsed = null) {
  const filter = new SpamFilter(env);

  // 首先检查黑名单
  if (await filter.isBlacklisted(message.from)) {
    return {
      isSpam: true,
      score: 100,
      details: {},
      reason: '发件人在黑名单中'
    };
  }

  return await filter.check(message, parsed);
}

export async function updateSenderReputation(email, isSpam, env) {
  const filter = new SpamFilter(env);
  await filter.updateReputation(email, isSpam);
}
