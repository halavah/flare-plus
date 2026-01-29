// 邮件管理 API
import { ValidationError, NotFoundError } from '../middleware/error.js';

export const handleEmails = {
  // 获取邮件列表
  async list(request, env) {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = parseInt(url.searchParams.get('limit')) || 20;
      const status = url.searchParams.get('status');
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM email_logs';
      let countQuery = 'SELECT COUNT(*) as total FROM email_logs';
      const params = [];

      if (status) {
        query += ' WHERE status = ?';
        countQuery += ' WHERE status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

      const [emails, countResult] = await Promise.all([
        env.EMAIL_DB.prepare(query).bind(...params, limit, offset).all(),
        env.EMAIL_DB.prepare(countQuery).bind(...params).first()
      ]);

      return new Response(JSON.stringify({
        success: true,
        emails: emails.results,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 获取单个邮件
  async get(request, env) {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/api/emails/')[1];

      if (!id) {
        throw new ValidationError('Email ID is required');
      }

      const email = await env.EMAIL_DB.prepare(
        'SELECT * FROM email_logs WHERE id = ?'
      ).bind(id).first();

      if (!email) {
        throw new NotFoundError('Email not found');
      }

      // 如果有存储的邮件内容，从 R2 获取
      if (email.email_id && env.EMAIL_STORAGE) {
        try {
          const content = await env.EMAIL_STORAGE.get(`emails/${email.email_id}`);
          if (content) {
            const emailData = JSON.parse(await content.text());
            email.content = emailData;
          }
        } catch (error) {
          console.error('Failed to fetch email content:', error);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        email
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 删除邮件记录
  async delete(request, env) {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/api/emails/')[1];

      if (!id) {
        throw new ValidationError('Email ID is required');
      }

      const email = await env.EMAIL_DB.prepare(
        'SELECT id, email_id FROM email_logs WHERE id = ?'
      ).bind(id).first();

      if (!email) {
        throw new NotFoundError('Email not found');
      }

      // 删除 R2 中的邮件内容
      if (email.email_id && env.EMAIL_STORAGE) {
        try {
          await env.EMAIL_STORAGE.delete(`emails/${email.email_id}`);
        } catch (error) {
          console.error('Failed to delete email content:', error);
        }
      }

      // 删除数据库记录
      await env.EMAIL_DB.prepare('DELETE FROM email_logs WHERE id = ?').bind(id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Email deleted successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  }
};

