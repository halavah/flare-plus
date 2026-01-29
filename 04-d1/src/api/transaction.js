// 事务处理 API
import { getDB } from '../utils/db-helpers.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';

export const handleTransaction = {
  // 资金转账（事务示例）
  async transfer(request, env) {
    try {
      const body = await request.json();
      const { fromUserId, toUserId, amount } = body;

      if (!fromUserId || !toUserId || !amount) {
        throw new ValidationError('fromUserId, toUserId, and amount are required');
      }

      if (amount <= 0) {
        throw new ValidationError('Amount must be positive');
      }

      const db = getDB(env);

      // 使用批量操作模拟事务
      const results = await db.batch([
        // 检查转出用户
        db.prepare('SELECT id, name FROM users WHERE id = ?').bind(fromUserId),

        // 检查转入用户
        db.prepare('SELECT id, name FROM users WHERE id = ?').bind(toUserId)
      ]);

      if (!results[0].results[0]) {
        throw new NotFoundError('From user not found');
      }

      if (!results[1].results[0]) {
        throw new NotFoundError('To user not found');
      }

      // 记录转账（实际应用中应该有账户余额表）
      // 这里仅作示例，展示事务的概念
      return new Response(JSON.stringify({
        success: true,
        message: 'Transfer completed successfully',
        from: results[0].results[0].name,
        to: results[1].results[0].name,
        amount
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 创建订单（复杂事务）
  async createOrder(request, env) {
    try {
      const body = await request.json();
      const { userId, items, total } = body;

      if (!userId || !items || !Array.isArray(items) || items.length === 0) {
        throw new ValidationError('userId and items array are required');
      }

      if (!total || total <= 0) {
        throw new ValidationError('Valid total amount is required');
      }

      const db = getDB(env);

      // 检查用户是否存在
      const user = await db.prepare('SELECT id, name FROM users WHERE id = ?').bind(userId).first();
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // 使用批量操作执行订单创建
      // 1. 创建订单记录（使用文章表模拟订单）
      const orderResult = await db.prepare(`
        INSERT INTO articles (title, content, author_id, status)
        VALUES (?, ?, ?, ?)
      `).bind(
        `订单-${Date.now()}`,
        JSON.stringify({ items, total }),
        userId,
        'published'
      ).run();

      const orderId = orderResult.meta.last_row_id;

      return new Response(JSON.stringify({
        success: true,
        message: 'Order created successfully',
        data: {
          orderId,
          userId,
          userName: user.name,
          items: items.length,
          total
        }
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  }
};

