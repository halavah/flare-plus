// 高级查询 API
import { getDB } from '../utils/db-helpers.js';
import { ValidationError } from '../middleware/error.js';

export const handleQuery = {
  // 执行原始 SQL 查询
  async execute(request, env) {
    try {
      const body = await request.json();
      const { sql, params = [] } = body;

      if (!sql) {
        throw new ValidationError('SQL query is required');
      }

      // 只允许 SELECT 查询（安全限制）
      if (!sql.trim().toUpperCase().startsWith('SELECT')) {
        throw new ValidationError('Only SELECT queries are allowed');
      }

      const db = getDB(env);
      const result = await db.prepare(sql).bind(...params).all();

      return new Response(JSON.stringify({
        success: true,
        data: result.results,
        total: result.results.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 参数化查询
  async prepared(request, env) {
    try {
      const body = await request.json();
      const { query, params = [] } = body;

      if (!query) {
        throw new ValidationError('Query is required');
      }

      const db = getDB(env);
      const result = await db.prepare(query).bind(...params).all();

      return new Response(JSON.stringify({
        success: true,
        data: result.results,
        total: result.results.length,
        meta: result.meta
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 全文搜索
  async search(request, env) {
    try {
      const url = new URL(request.url);
      const keyword = url.searchParams.get('keyword');
      const table = url.searchParams.get('table') || 'articles';

      if (!keyword) {
        throw new ValidationError('Keyword is required');
      }

      const db = getDB(env);
      let result;

      if (table === 'articles') {
        result = await db.prepare(`
          SELECT a.*, u.name as author_name
          FROM articles a
          LEFT JOIN users u ON a.author_id = u.id
          WHERE a.title LIKE ? OR a.content LIKE ?
          ORDER BY a.created_at DESC
          LIMIT 50
        `).bind(`%${keyword}%`, `%${keyword}%`).all();
      } else if (table === 'users') {
        result = await db.prepare(`
          SELECT * FROM users
          WHERE name LIKE ? OR email LIKE ? OR city LIKE ?
          ORDER BY created_at DESC
          LIMIT 50
        `).bind(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`).all();
      } else {
        throw new ValidationError('Invalid table name');
      }

      return new Response(JSON.stringify({
        success: true,
        keyword,
        table,
        data: result.results,
        total: result.results.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  }
};

