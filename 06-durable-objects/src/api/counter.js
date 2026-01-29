// 计数器管理 API
import { validateCounterName } from '../utils/validation.js';
import { ValidationError } from '../middleware/error.js';

export const handleCounter = {
  // 创建计数器
  async create(request, env) {
    try {
      const body = await request.json();
      const { name, initialValue = 0 } = body;

      if (!validateCounterName(name)) {
        throw new ValidationError('Invalid counter name');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Counter created',
        name,
        initialValue
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 增加计数
  async increment(request, env, name) {
    try {
      if (!validateCounterName(name)) {
        throw new ValidationError('Invalid counter name');
      }

      const id = env.COUNTER.idFromName(name);
      const stub = env.COUNTER.get(id);

      return stub.fetch(request);
    } catch (error) {
      throw error;
    }
  },

  // 获取计数值
  async getValue(request, env, name) {
    try {
      if (!validateCounterName(name)) {
        throw new ValidationError('Invalid counter name');
      }

      const id = env.COUNTER.idFromName(name);
      const stub = env.COUNTER.get(id);

      return stub.fetch(request);
    } catch (error) {
      throw error;
    }
  },

  // 重置计数器
  async reset(request, env, name) {
    try {
      if (!validateCounterName(name)) {
        throw new ValidationError('Invalid counter name');
      }

      const id = env.COUNTER.idFromName(name);
      const stub = env.COUNTER.get(id);

      return stub.fetch(new Request(request.url + '/reset', {
        method: 'POST'
      }));
    } catch (error) {
      throw error;
    }
  }
};

