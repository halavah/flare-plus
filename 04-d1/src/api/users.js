// 用户管理 API
import { getDB } from '../utils/db-helpers.js';
import { validateEmail, validateAge } from '../utils/validation.js';
import { ValidationError, NotFoundError } from '../middleware/error.js';

export const handleUsers = {
  // 获取用户列表
  async list(request, env) {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = parseInt(url.searchParams.get('limit')) || 10;
      const city = url.searchParams.get('city');
      const offset = (page - 1) * limit;

      const db = getDB(env);

      let query = 'SELECT * FROM users';
      let countQuery = 'SELECT COUNT(*) as total FROM users';
      const params = [];

      if (city) {
        query += ' WHERE city = ?';
        countQuery += ' WHERE city = ?';
        params.push(city);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

      const [users, countResult] = await Promise.all([
        db.prepare(query).bind(...params, limit, offset).all(),
        db.prepare(countQuery).bind(...params).first()
      ]);

      return new Response(JSON.stringify({
        success: true,
        data: users.results,
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

  // 获取单个用户
  async get(request, env) {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/api/users/')[1];

      if (!id) {
        throw new ValidationError('User ID is required');
      }

      const db = getDB(env);
      const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return new Response(JSON.stringify({
        success: true,
        data: user
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 创建用户
  async create(request, env) {
    try {
      const body = await request.json();
      const { name, email, age, city } = body;

      if (!name || !email) {
        throw new ValidationError('name and email are required');
      }

      if (!validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }

      if (age && !validateAge(age)) {
        throw new ValidationError('Age must be between 1 and 120');
      }

      const db = getDB(env);

      // 检查邮箱是否已存在
      const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      if (existing) {
        throw new ValidationError('Email already exists');
      }

      const result = await db.prepare(
        'INSERT INTO users (name, email, age, city) VALUES (?, ?, ?, ?)'
      ).bind(name, email, age || null, city || null).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'User created successfully',
        data: {
          id: result.meta.last_row_id,
          name,
          email,
          age,
          city
        }
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 更新用户
  async update(request, env) {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/api/users/')[1];
      const body = await request.json();
      const { name, email, age, city } = body;

      if (!id) {
        throw new ValidationError('User ID is required');
      }

      if (email && !validateEmail(email)) {
        throw new ValidationError('Invalid email format');
      }

      if (age && !validateAge(age)) {
        throw new ValidationError('Age must be between 1 and 120');
      }

      const db = getDB(env);

      // 检查用户是否存在
      const user = await db.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // 构建更新语句
      const updates = [];
      const params = [];

      if (name) {
        updates.push('name = ?');
        params.push(name);
      }
      if (email) {
        updates.push('email = ?');
        params.push(email);
      }
      if (age !== undefined) {
        updates.push('age = ?');
        params.push(age);
      }
      if (city !== undefined) {
        updates.push('city = ?');
        params.push(city);
      }

      if (updates.length === 0) {
        throw new ValidationError('No fields to update');
      }

      params.push(id);
      const result = await db.prepare(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(...params).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'User updated successfully',
        changes: result.meta.changes
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 删除用户
  async delete(request, env) {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/api/users/')[1];

      if (!id) {
        throw new ValidationError('User ID is required');
      }

      const db = getDB(env);

      // 检查用户是否存在
      const user = await db.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const result = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'User deleted successfully',
        changes: result.meta.changes
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  }
};

