// 统计信息 API
import { getDB } from '../utils/db-helpers.js';

export const handleStats = {
  // 用户统计
  async users(request, env) {
    try {
      const db = getDB(env);

      const [total, byCity, avgAge] = await Promise.all([
        db.prepare('SELECT COUNT(*) as total FROM users').first(),
        db.prepare(`
          SELECT city, COUNT(*) as count
          FROM users
          WHERE city IS NOT NULL
          GROUP BY city
          ORDER BY count DESC
        `).all(),
        db.prepare('SELECT AVG(age) as avg_age FROM users WHERE age IS NOT NULL').first()
      ]);

      return new Response(JSON.stringify({
        success: true,
        stats: {
          total: total.total,
          averageAge: avgAge.avg_age ? Math.round(avgAge.avg_age * 10) / 10 : null,
          byCity: byCity.results
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 文章统计
  async articles(request, env) {
    try {
      const db = getDB(env);

      const [total, byStatus, byAuthor, totalViews] = await Promise.all([
        db.prepare('SELECT COUNT(*) as total FROM articles').first(),
        db.prepare(`
          SELECT status, COUNT(*) as count
          FROM articles
          GROUP BY status
        `).all(),
        db.prepare(`
          SELECT u.name, COUNT(a.id) as article_count
          FROM users u
          LEFT JOIN articles a ON u.id = a.author_id
          GROUP BY u.id, u.name
          HAVING article_count > 0
          ORDER BY article_count DESC
          LIMIT 10
        `).all(),
        db.prepare('SELECT SUM(views) as total_views FROM articles').first()
      ]);

      return new Response(JSON.stringify({
        success: true,
        stats: {
          total: total.total,
          totalViews: totalViews.total_views || 0,
          byStatus: byStatus.results,
          topAuthors: byAuthor.results
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 数据库统计
  async database(request, env) {
    try {
      const db = getDB(env);

      const tables = await db.prepare(`
        SELECT name, sql
        FROM sqlite_master
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      `).all();

      const tableCounts = await Promise.all(
        tables.results.map(async (table) => {
          const count = await db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).first();
          return {
            table: table.name,
            count: count.count
          };
        })
      );

      return new Response(JSON.stringify({
        success: true,
        stats: {
          tables: tables.results.length,
          tableCounts
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  }
};

