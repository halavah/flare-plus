// 附件处理器
export class AttachmentHandler {
  constructor(env) {
    this.env = env;
    this.maxSize = 25 * 1024 * 1024; // 25MB
    this.allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
  }

  // 提取所有附件
  async extractAttachments(message) {
    try {
      const raw = await message.raw();
      const headers = this.parseHeaders(message);
      const contentType = headers['content-type'] || '';

      if (!contentType.includes('multipart')) {
        return [];
      }

      const boundary = this.extractBoundary(contentType);
      if (!boundary) return [];

      const parts = this.splitParts(raw, boundary);
      const attachments = [];

      for (const part of parts) {
        if (this.isAttachment(part)) {
          const attachment = await this.parseAttachment(part);
          if (attachment) {
            attachments.push(attachment);
          }
        }
      }

      return attachments;
    } catch (error) {
      console.error('Failed to extract attachments:', error);
      return [];
    }
  }

  // 解析邮件头
  parseHeaders(message) {
    const headers = {};
    for (const [key, value] of message.headers) {
      headers[key.toLowerCase()] = value;
    }
    return headers;
  }

  // 提取边界
  extractBoundary(contentType) {
    const match = contentType.match(/boundary="?([^";\s]+)"?/);
    return match ? match[1] : null;
  }

  // 分割部分
  splitParts(raw, boundary) {
    return raw.split(`--${boundary}`).filter(part => part.trim().length > 0);
  }

  // 判断是否为附件
  isAttachment(part) {
    return part.includes('Content-Disposition: attachment') ||
           (part.includes('Content-Disposition: inline') && part.includes('filename='));
  }

  // 解析单个附件
  async parseAttachment(part) {
    try {
      const lines = part.split('\n');
      let filename = 'unknown';
      let contentType = 'application/octet-stream';
      let encoding = 'base64';
      let contentId = null;
      let contentStartIndex = 0;

      // 解析头部
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === '') {
          contentStartIndex = i + 1;
          break;
        }

        if (line.includes('filename=')) {
          const match = line.match(/filename="?([^";\n]+)"?/);
          if (match) filename = this.sanitizeFilename(match[1]);
        } else if (line.startsWith('Content-Type:')) {
          contentType = line.split(':')[1].trim().split(';')[0];
        } else if (line.includes('Content-Transfer-Encoding:')) {
          encoding = line.split(':')[1].trim();
        } else if (line.includes('Content-ID:')) {
          contentId = line.split(':')[1].trim().replace(/[<>]/g, '');
        }
      }

      // 提取内容
      const content = lines.slice(contentStartIndex).join('\n').trim();

      // 解码内容
      const decoded = this.decodeContent(content, encoding);

      return {
        filename,
        contentType,
        encoding,
        contentId,
        size: decoded.length,
        data: decoded,
        isAllowed: this.isAllowedType(contentType),
        isSafe: this.isSafeFile(filename, contentType)
      };
    } catch (error) {
      console.error('Failed to parse attachment:', error);
      return null;
    }
  }

  // 解码内容
  decodeContent(content, encoding) {
    if (encoding === 'base64') {
      try {
        return atob(content.replace(/\s/g, ''));
      } catch (e) {
        console.error('Failed to decode base64:', e);
        return content;
      }
    } else if (encoding === 'quoted-printable') {
      return this.decodeQuotedPrintable(content);
    }
    return content;
  }

  // 解码 Quoted-Printable
  decodeQuotedPrintable(str) {
    return str
      .replace(/=([0-9A-F]{2})/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      })
      .replace(/=\r?\n/g, '');
  }

  // 清理文件名
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  // 检查文件类型是否允许
  isAllowedType(contentType) {
    return this.allowedTypes.includes(contentType);
  }

  // 检查文件是否安全
  isSafeFile(filename, contentType) {
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar',
      '.com', '.pif', '.msi', '.dll', '.sh', '.bash'
    ];

    const filenameLower = filename.toLowerCase();

    for (const ext of dangerousExtensions) {
      if (filenameLower.endsWith(ext)) {
        return false;
      }
    }

    return true;
  }

  // 保存附件到 R2
  async saveToR2(attachment, emailId) {
    if (!this.env.EMAIL_STORAGE) {
      throw new Error('R2 storage not configured');
    }

    try {
      const key = `attachments/${emailId}/${attachment.filename}`;

      await this.env.EMAIL_STORAGE.put(key, attachment.data, {
        httpMetadata: {
          contentType: attachment.contentType
        },
        customMetadata: {
          originalFilename: attachment.filename,
          emailId,
          size: attachment.size.toString()
        }
      });

      return {
        success: true,
        key,
        url: `/attachments/${emailId}/${attachment.filename}`,
        size: attachment.size
      };
    } catch (error) {
      console.error('Failed to save attachment to R2:', error);
      throw error;
    }
  }

  // 保存所有附件
  async saveAll(attachments, emailId) {
    const results = [];

    for (const attachment of attachments) {
      // 检查文件安全性
      if (!attachment.isSafe) {
        console.warn(`Skipping dangerous file: ${attachment.filename}`);
        results.push({
          filename: attachment.filename,
          success: false,
          error: 'File type not allowed'
        });
        continue;
      }

      // 检查文件大小
      if (attachment.size > this.maxSize) {
        console.warn(`Skipping large file: ${attachment.filename} (${attachment.size} bytes)`);
        results.push({
          filename: attachment.filename,
          success: false,
          error: 'File too large'
        });
        continue;
      }

      try {
        const result = await this.saveToR2(attachment, emailId);
        results.push({
          filename: attachment.filename,
          ...result
        });
      } catch (error) {
        results.push({
          filename: attachment.filename,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // 生成附件下载链接
  generateDownloadUrl(emailId, filename, expiresIn = 3600) {
    const key = `attachments/${emailId}/${filename}`;
    const expires = Date.now() + (expiresIn * 1000);

    // 简单的签名（生产环境应使用更安全的方法）
    const signature = this.generateSignature(key, expires);

    return `/api/attachments/${emailId}/${filename}?expires=${expires}&signature=${signature}`;
  }

  // 生成签名
  generateSignature(data, expires) {
    // 简化版签名，生产环境应使用 HMAC
    const str = `${data}:${expires}`;
    return btoa(str).substring(0, 32);
  }

  // 验证下载链接
  verifyDownloadUrl(emailId, filename, expires, signature) {
    if (Date.now() > parseInt(expires)) {
      return false;
    }

    const key = `attachments/${emailId}/${filename}`;
    const expectedSignature = this.generateSignature(key, expires);

    return signature === expectedSignature;
  }

  // 获取附件
  async getAttachment(emailId, filename) {
    if (!this.env.EMAIL_STORAGE) {
      throw new Error('R2 storage not configured');
    }

    const key = `attachments/${emailId}/${filename}`;
    const object = await this.env.EMAIL_STORAGE.get(key);

    if (!object) {
      return null;
    }

    return {
      data: await object.arrayBuffer(),
      contentType: object.httpMetadata.contentType,
      size: object.size,
      metadata: object.customMetadata
    };
  }

  // 删除附件
  async deleteAttachment(emailId, filename) {
    if (!this.env.EMAIL_STORAGE) {
      throw new Error('R2 storage not configured');
    }

    const key = `attachments/${emailId}/${filename}`;
    await this.env.EMAIL_STORAGE.delete(key);

    return { success: true };
  }

  // 扫描病毒（集成外部 API）
  async scanForVirus(attachment) {
    // 这里可以集成 VirusTotal 或其他病毒扫描 API
    // 简化版本：仅基于文件类型和扩展名判断
    return {
      isSafe: attachment.isSafe,
      scanDate: new Date().toISOString(),
      method: 'basic_check'
    };
  }
}

// 便捷函数
export async function extractAttachments(message, env) {
  const handler = new AttachmentHandler(env);
  return await handler.extractAttachments(message);
}

export async function saveAttachments(attachments, emailId, env) {
  const handler = new AttachmentHandler(env);
  return await handler.saveAll(attachments, emailId);
}

export async function getAttachment(emailId, filename, env) {
  const handler = new AttachmentHandler(env);
  return await handler.getAttachment(emailId, filename);
}

