// 批量操作 API
import { getDB } from '../utils/db-helpers.js';
import { ValidationError } from '../middleware/error.js';

export const handleBatch = {
  // 批量插入
  async insert(request, env) {
    try {
      const body = await request.json();
      const { table, items } = body;

      if (!table || !items || !Array.isArray(items) || items.length === 0) {
        throw new ValidationError('table and items array are required');
      }

      const db = getDB(env);
      const statements = [];

      if (table === 'users') {
        for (const item of items) {
          if (!item.name || !item.email) {
            throw new ValidationError('Each item must have name and email');
          }
          statements.push(
            db.prepare('INSERT INTO users (name, email, age, city) VALUES (?, ?, ?, ?)')
              .bind(item.name, item.email, item.age || null, item.city || null)
          );
        }
      } else if (table === 'articles') {
        for (const item of items) {
          if (!item.title || !item.content || !item.author_id) {
            throw new ValidationError('Each item must have title, content, and author_id');
          }
          statements.push(
            db.prepare('INSERT INTO articles (title, content, author_id, status) VALUES (?, ?, ?, ?)')
              .bind(item.title, item.content, item.author_id, item.status || 'draft')
          );
        }
      } else {
        throw new ValidationError('Invalid table name');
      }

      const results = await db.batch(statements);

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch insert completed',
        table,
        inserted: results.length,
        firstId: results[0]?.meta?.last_row_id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 批量更新
  async update(request, env) {
    try {
      const body = await request.json();
      const { table, updates } = body;

      if (!table || !updates || !Array.isArray(updates) || updates.length === 0) {
        throw new ValidationError('table and updates array are required');
      }

      const db = getDB(env);
      const statements = [];

      if (table === 'users') {
        for (const update of updates) {
          if (!update.id) {
            throw new ValidationError('Each update must have an id');
          }

          const fields = [];
          const params = [];

          if (update.name) {
            fields.push('name = ?');
            params.push(update.name);
          }
          if (update.email) {
            fields.push('email = ?');
            params.push(update.email);
          }
          if (update.age !== undefined) {
            fields.push('age = ?');
            params.push(update.age);
          }
          if (update.city !== undefined) {
            fields.push('city = ?');
            params.push(update.city);
          }

          if (fields.length > 0) {
            params.push(update.id);
            statements.push(
              db.prepare(`UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
                .bind(...params)
            );
          }
        }
      } else if (table === 'articles') {
        for (const update of updates) {
          if (!update.id) {
            throw new ValidationError('Each update must have an id');
          }

          const fields = [];
          const params = [];

          if (update.title) {
            fields.push('title = ?');
            params.push(update.title);
          }
          if (update.content) {
            fields.push('content = ?');
            params.push(update.content);
          }
          if (update.status) {
            fields.push('status = ?');
            params.push(update.status);
          }

          if (fields.length > 0) {
            params.push(update.id);
            statements.push(
              db.prepare(`UPDATE articles SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
                .bind(...params)
            );
          }
        }
      } else {
        throw new ValidationError('Invalid table name');
      }

      if (statements.length === 0) {
        throw new ValidationError('No valid updates to perform');
      }

      const results = await db.batch(statements);
      const totalChanges = results.reduce((sum, r) => sum + (r.meta.changes || 0), 0);

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch update completed',
        table,
        updated: totalChanges,
        operations: results.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 批量删除
  async delete(request, env) {
    try {
      const body = await request.json();
      const { table, ids } = body;

      if (!table || !ids || !Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError('table and ids array are required');
      }

      const db = getDB(env);
      const statements = ids.map(id =>
        db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id)
      );

      const results = await db.batch(statements);
      const totalChanges = results.reduce((sum, r) => sum + (r.meta.changes || 0), 0);

      return new Response(JSON.stringify({
        success: true,
        message: 'Batch delete completed',
        table,
        deleted: totalChanges,
        operations: results.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  }
};

