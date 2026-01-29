// 路由规则管理 API
import { ValidationError, NotFoundError } from '../middleware/error.js';

export const handleRules = {
  // 获取规则列表
  async list(request, env) {
    try {
      const url = new URL(request.url);
      const active = url.searchParams.get('active');

      let query = 'SELECT * FROM routing_rules';
      const params = [];

      if (active !== null) {
        query += ' WHERE active = ?';
        params.push(active === 'true' ? 1 : 0);
      }

      query += ' ORDER BY priority DESC, created_at DESC';

      const rules = await env.EMAIL_DB.prepare(query).bind(...params).all();

      return new Response(JSON.stringify({
        success: true,
        rules: rules.results,
        total: rules.results.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 获取单个规则
  async get(request, env) {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/api/rules/')[1];

      if (!id) {
        throw new ValidationError('Rule ID is required');
      }

      const rule = await env.EMAIL_DB.prepare(
        'SELECT * FROM routing_rules WHERE id = ?'
      ).bind(id).first();

      if (!rule) {
        throw new NotFoundError('Rule not found');
      }

      return new Response(JSON.stringify({
        success: true,
        rule
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 创建规则
  async create(request, env) {
    try {
      const body = await request.json();
      const { name, pattern, action, target, priority = 0, active = true } = body;

      if (!name || !pattern || !action) {
        throw new ValidationError('name, pattern, and action are required');
      }

      const validActions = ['forward', 'store', 'drop'];
      if (!validActions.includes(action)) {
        throw new ValidationError('Invalid action. Must be: forward, store, or drop');
      }

      if (action === 'forward' && !target) {
        throw new ValidationError('target is required for forward action');
      }

      const id = crypto.randomUUID();
      await env.EMAIL_DB.prepare(`
        INSERT INTO routing_rules (id, name, pattern, action, target, priority, active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(id, name, pattern, action, target || null, priority, active ? 1 : 0).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Rule created successfully',
        rule: {
          id,
          name,
          pattern,
          action,
          target,
          priority,
          active
        }
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 更新规则
  async update(request, env) {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/api/rules/')[1];
      const body = await request.json();

      if (!id) {
        throw new ValidationError('Rule ID is required');
      }

      const rule = await env.EMAIL_DB.prepare(
        'SELECT id FROM routing_rules WHERE id = ?'
      ).bind(id).first();

      if (!rule) {
        throw new NotFoundError('Rule not found');
      }

      const updates = [];
      const params = [];

      if (body.name) {
        updates.push('name = ?');
        params.push(body.name);
      }
      if (body.pattern) {
        updates.push('pattern = ?');
        params.push(body.pattern);
      }
      if (body.action) {
        updates.push('action = ?');
        params.push(body.action);
      }
      if (body.target !== undefined) {
        updates.push('target = ?');
        params.push(body.target);
      }
      if (body.priority !== undefined) {
        updates.push('priority = ?');
        params.push(body.priority);
      }
      if (body.active !== undefined) {
        updates.push('active = ?');
        params.push(body.active ? 1 : 0);
      }

      if (updates.length === 0) {
        throw new ValidationError('No fields to update');
      }

      params.push(id);
      await env.EMAIL_DB.prepare(
        `UPDATE routing_rules SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(...params).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Rule updated successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 删除规则
  async delete(request, env) {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/api/rules/')[1];

      if (!id) {
        throw new ValidationError('Rule ID is required');
      }

      const rule = await env.EMAIL_DB.prepare(
        'SELECT id FROM routing_rules WHERE id = ?'
      ).bind(id).first();

      if (!rule) {
        throw new NotFoundError('Rule not found');
      }

      await env.EMAIL_DB.prepare('DELETE FROM routing_rules WHERE id = ?').bind(id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Rule deleted successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  }
};

