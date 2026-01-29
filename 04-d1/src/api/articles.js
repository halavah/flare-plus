// 文章管理 API
import { getDB } from '../utils/db-helpers.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';

export const handleArticles = {
  // 获取文章列表
  async list(request, env) {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = parseInt(url.searchParams.get('limit')) || 10;
      const status = url.searchParams.get('status');
      const offset = (page - 1) * limit;

      const db = getDB(env);

      let query = `
        SELECT a.*, u.name as author_name
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
      `;
      let countQuery = 'SELECT COUNT(*) as total FROM articles';
      const params = [];

      if (status) {
        query += ' WHERE a.status = ?';
        countQuery += ' WHERE status = ?';
        params.push(status);
      }

      query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';

      const [articles, countResult] = await Promise.all([
        db.prepare(query).bind(...params, limit, offset).all(),
        db.prepare(countQuery).bind(...params).first()
      ]);

      return new Response(JSON.stringify({
        success: true,
        data: articles.results,
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

  // 获取单篇文章
  async get(request, env) {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/api/articles/')[1];

      if (!id) {
        throw new ValidationError('Article ID is required');
      }

      const db = getDB(env);

      // 获取文章详情和作者信息
      const article = await db.prepare(`
        SELECT a.*, u.name as author_name, u.email as author_email
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        WHERE a.id = ?
      `).bind(id).first();

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      // 增加浏览量
      await db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').bind(id).run();
      article.views = article.views + 1;

      return new Response(JSON.stringify({
        success: true,
        data: article
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 创建文章
  async create(request, env) {
    try {
      const body = await request.json();
      const { title, content, author_id, status = 'draft' } = body;

      if (!title || !content || !author_id) {
        throw new ValidationError('title, content, and author_id are required');
      }

      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError('Invalid status');
      }

      const db = getDB(env);

      // 检查作者是否存在
      const author = await db.prepare('SELECT id FROM users WHERE id = ?').bind(author_id).first();
      if (!author) {
        throw new NotFoundError('Author not found');
      }

      const published_at = status === 'published' ? new Date().toISOString() : null;

      const result = await db.prepare(`
        INSERT INTO articles (title, content, author_id, status, published_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(title, content, author_id, status, published_at).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Article created successfully',
        data: {
          id: result.meta.last_row_id,
          title,
          status
        }
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 更新文章
  async update(request, env) {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/api/articles/')[1];
      const body = await request.json();
      const { title, content, status } = body;

      if (!id) {
        throw new ValidationError('Article ID is required');
      }

      const db = getDB(env);

      // 检查文章是否存在
      const article = await db.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
      if (!article) {
        throw new NotFoundError('Article not found');
      }

      // 构建更新语句
      const updates = [];
      const params = [];

      if (title) {
        updates.push('title = ?');
        params.push(title);
      }
      if (content) {
        updates.push('content = ?');
        params.push(content);
      }
      if (status) {
        const validStatuses = ['draft', 'published', 'archived'];
        if (!validStatuses.includes(status)) {
          throw new ValidationError('Invalid status');
        }
        updates.push('status = ?');
        params.push(status);

        // 如果状态变为发布且之前未发布，设置发布时间
        if (status === 'published' && article.status !== 'published') {
          updates.push('published_at = CURRENT_TIMESTAMP');
        }
      }

      if (updates.length === 0) {
        throw new ValidationError('No fields to update');
      }

      params.push(id);
      const result = await db.prepare(
        `UPDATE articles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(...params).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Article updated successfully',
        changes: result.meta.changes
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 删除文章
  async delete(request, env) {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/api/articles/')[1];

      if (!id) {
        throw new ValidationError('Article ID is required');
      }

      const db = getDB(env);

      // 检查文章是否存在
      const article = await db.prepare('SELECT id FROM articles WHERE id = ?').bind(id).first();
      if (!article) {
        throw new NotFoundError('Article not found');
      }

      const result = await db.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Article deleted successfully',
        changes: result.meta.changes
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 根据作者获取文章
  async getByAuthor(request, env) {
    try {
      const url = new URL(request.url);
      const authorId = url.pathname.split('/api/articles/author/')[1];

      if (!authorId) {
        throw new ValidationError('Author ID is required');
      }

      const db = getDB(env);
      const articles = await db.prepare(`
        SELECT * FROM articles
        WHERE author_id = ?
        ORDER BY created_at DESC
      `).bind(authorId).all();

      return new Response(JSON.stringify({
        success: true,
        data: articles.results,
        total: articles.results.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  }
};

