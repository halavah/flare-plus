// 邮件解析器
export class EmailParser {
  constructor(message) {
    this.message = message;
    this.parsed = null;
  }

  // 解析完整的邮件
  async parse() {
    if (this.parsed) return this.parsed;

    try {
      const headers = await this.parseHeaders();
      const body = await this.parseBody();
      const attachments = await this.parseAttachments();

      this.parsed = {
        from: this.parseAddress(this.message.from),
        to: this.parseAddress(this.message.to),
        subject: headers.subject || '(无主题)',
        date: headers.date || new Date().toISOString(),
        messageId: headers['message-id'] || this.generateMessageId(),
        headers,
        body,
        attachments,
        size: parseInt(headers['content-length'] || '0'),
        raw: await this.message.raw()
      };

      return this.parsed;
    } catch (error) {
      console.error('Failed to parse email:', error);
      throw error;
    }
  }

  // 解析邮件头
  async parseHeaders() {
    const headers = {};

    for (const [key, value] of this.message.headers) {
      headers[key.toLowerCase()] = value;
    }

    return headers;
  }

  // 解析邮件正文
  async parseBody() {
    try {
      const rawBody = await this.message.raw();
      const headers = await this.parseHeaders();
      const contentType = headers['content-type'] || 'text/plain';

      // 简单的内容类型判断
      if (contentType.includes('multipart')) {
        return this.parseMultipart(rawBody, contentType);
      } else if (contentType.includes('text/html')) {
        return {
          html: this.decodeBody(rawBody, headers),
          text: this.stripHtml(rawBody)
        };
      } else {
        return {
          text: this.decodeBody(rawBody, headers),
          html: null
        };
      }
    } catch (error) {
      console.error('Failed to parse body:', error);
      return { text: '', html: null };
    }
  }

  // 解析多部分邮件
  parseMultipart(raw, contentType) {
    // 提取 boundary
    const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/);
    if (!boundaryMatch) {
      return { text: '', html: null };
    }

    const boundary = boundaryMatch[1];
    const parts = raw.split(`--${boundary}`);

    let textPart = '';
    let htmlPart = null;

    for (const part of parts) {
      if (part.includes('Content-Type: text/plain')) {
        textPart = this.extractPartContent(part);
      } else if (part.includes('Content-Type: text/html')) {
        htmlPart = this.extractPartContent(part);
      }
    }

    return {
      text: textPart,
      html: htmlPart
    };
  }

  // 提取部分内容
  extractPartContent(part) {
    const lines = part.split('\n');
    let contentStarted = false;
    let content = [];

    for (const line of lines) {
      if (contentStarted) {
        content.push(line);
      } else if (line.trim() === '') {
        contentStarted = true;
      }
    }

    return content.join('\n').trim();
  }

  // 解码邮件正文
  decodeBody(raw, headers) {
    const encoding = headers['content-transfer-encoding'];

    if (encoding === 'base64') {
      try {
        return atob(raw);
      } catch (e) {
        return raw;
      }
    } else if (encoding === 'quoted-printable') {
      return this.decodeQuotedPrintable(raw);
    }

    return raw;
  }

  // 解码 Quoted-Printable
  decodeQuotedPrintable(str) {
    return str.replace(/=([0-9A-F]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    }).replace(/=\r?\n/g, '');
  }

  // 去除 HTML 标签
  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 解析附件
  async parseAttachments() {
    const headers = await this.parseHeaders();
    const contentType = headers['content-type'] || '';
    const attachments = [];

    // 简单的附件检测
    if (contentType.includes('multipart/mixed') ||
        contentType.includes('multipart/related')) {
      const raw = await this.message.raw();
      const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/);

      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = raw.split(`--${boundary}`);

        for (const part of parts) {
          if (this.isAttachment(part)) {
            attachments.push(this.extractAttachment(part));
          }
        }
      }
    }

    return attachments;
  }

  // 判断是否为附件
  isAttachment(part) {
    return part.includes('Content-Disposition: attachment') ||
           part.includes('Content-Disposition: inline');
  }

  // 提取附件信息
  extractAttachment(part) {
    const lines = part.split('\n');
    let filename = 'unknown';
    let contentType = 'application/octet-stream';
    let encoding = 'base64';

    for (const line of lines) {
      if (line.includes('filename=')) {
        const match = line.match(/filename="?([^";\n]+)"?/);
        if (match) filename = match[1];
      } else if (line.startsWith('Content-Type:')) {
        contentType = line.split(':')[1].trim().split(';')[0];
      } else if (line.includes('Content-Transfer-Encoding:')) {
        encoding = line.split(':')[1].trim();
      }
    }

    return {
      filename,
      contentType,
      encoding,
      size: part.length
    };
  }

  // 解析邮件地址
  parseAddress(address) {
    if (!address) return { email: '', name: '' };

    const match = address.match(/^(.+?)\s*<(.+?)>$/) ||
                  address.match(/^(.+)$/);

    if (!match) return { email: address, name: '' };

    if (match[2]) {
      return {
        name: match[1].trim().replace(/"/g, ''),
        email: match[2].trim()
      };
    }

    return {
      name: '',
      email: match[1].trim()
    };
  }

  // 生成消息 ID
  generateMessageId() {
    return `<${crypto.randomUUID()}@cloudflare-email-routing>`;
  }

  // 获取纯文本内容
  async getTextContent() {
    const parsed = await this.parse();
    return parsed.body.text || this.stripHtml(parsed.body.html) || '';
  }

  // 获取 HTML 内容
  async getHtmlContent() {
    const parsed = await this.parse();
    return parsed.body.html || parsed.body.text;
  }

  // 检查是否有附件
  async hasAttachments() {
    const parsed = await this.parse();
    return parsed.attachments.length > 0;
  }

  // 获取邮件摘要
  async getSummary() {
    const parsed = await this.parse();
    const textContent = await this.getTextContent();

    return {
      from: parsed.from,
      to: parsed.to,
      subject: parsed.subject,
      date: parsed.date,
      preview: textContent.substring(0, 200) + (textContent.length > 200 ? '...' : ''),
      hasAttachments: parsed.attachments.length > 0,
      attachmentCount: parsed.attachments.length,
      size: parsed.size
    };
  }
}

// 便捷函数
export async function parseEmail(message) {
  const parser = new EmailParser(message);
  return await parser.parse();
}

export async function getEmailSummary(message) {
  const parser = new EmailParser(message);
  return await parser.getSummary();
}

