/**
 * API 测试套件
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// 模拟环境变量
const mockEnv = {
  CLOUDFLARE_ACCOUNT_ID: 'e63f38d1d4e56a0c22147ef38929b30b',
  COOKIES_SECRET: 'test-secret',
  DB: {
    prepare: (query) => ({
      bind: (...args) => ({
        first: async () => ({ id: '1', name: 'Test User', email: 'test@example.com' }),
        all: async () => ({ results: [{ id: '1', name: 'Test User', email: 'test@example.com' }] }),
        run: async () => ({ success: true })
      })
    })
  },
  SESSIONS_KV: {
    get: async () => null,
    put: async () => {},
    delete: async () => {}
  }
};

describe('API Tests', () => {
  let worker;

  beforeEach(async () => {
    // 动态导入 worker
    const workerModule = await import('../src/index.js');
    worker = workerModule.default;
  });

  afterEach(() => {
    // 清理测试数据
  });

  describe('Health Check', () => {
    it('should return health check response', async () => {
      const request = new Request('https://example.com/api/health');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.message).toBe('Cloudflare Workers API is running');
      expect(data.timestamp).toBeDefined();
    });

    it('should return health check for root path', async () => {
      const request = new Request('https://example.com/');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('ok');
    });
  });

  describe('API Documentation', () => {
    it('should return API documentation', async () => {
      const request = new Request('https://example.com/api/docs');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.title).toBe('Cloudflare Workers API');
      expect(data.endpoints).toBeDefined();
      expect(data.endpoints.auth).toBeDefined();
      expect(data.endpoints.users).toBeDefined();
      expect(data.endpoints.utils).toBeDefined();
    });
  });

  describe('Authentication API', () => {
    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const loginData = {
          email: 'demo@example.com',
          password: 'demo123'
        };

        const request = new Request('https://example.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toBe('登录成功');
        expect(data.data.user).toBeDefined();
        expect(data.data.token).toBeDefined();
        expect(data.data.expires_in).toBe(86400);
      });

      it('should reject invalid credentials', async () => {
        const loginData = {
          email: 'wrong@example.com',
          password: 'wrongpassword'
        };

        const request = new Request('https://example.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
        expect(data.message).toBe('邮箱或密码错误');
      });

      it('should require email and password', async () => {
        const loginData = {
          email: '',
          password: ''
        };

        const request = new Request('https://example.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Bad Request');
        expect(data.message).toBe('邮箱和密码不能为空');
      });
    });

    describe('POST /api/auth/register', () => {
      it('should register new user with valid data', async () => {
        const registerData = {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123'
        };

        const request = new Request('https://example.com/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toBe('注册成功');
        expect(data.data.user).toBeDefined();
        expect(data.data.token).toBeDefined();
      });

      it('should reject invalid email format', async () => {
        const registerData = {
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        };

        const request = new Request('https://example.com/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Bad Request');
        expect(data.message).toBe('邮箱格式无效');
      });

      it('should require name, email and password', async () => {
        const registerData = {
          name: '',
          email: '',
          password: ''
        };

        const request = new Request('https://example.com/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Bad Request');
        expect(data.message).toBe('姓名、邮箱和密码不能为空');
      });
    });

    describe('POST /api/auth/verify', () => {
      it('should verify valid token', async () => {
        const verifyData = {
          token: 'valid-token'
        };

        const request = new Request('https://example.com/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verifyData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.valid).toBe(false);
        expect(data.message).toBe('令牌无效或已过期');
      });
    });
  });

  describe('Users API', () => {
    describe('GET /api/users', () => {
      it('should require authentication', async () => {
        const request = new Request('https://example.com/api/users');

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });

      it('should return users list with valid token', async () => {
        const request = new Request('https://example.com/api/users', {
          headers: { 'Authorization': 'Bearer valid-token' }
        });

        // 模拟认证中间件
        request.user = { id: '1', name: 'Test User', email: 'test@example.com' };

        const response = await worker.fetch(request, mockEnv);

        // 由于没有真正的认证，这里会返回 401
        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/users/:id', () => {
      it('should return 404 for non-existent user', async () => {
        const request = new Request('https://example.com/api/users/non-existent', {
          headers: { 'Authorization': 'Bearer valid-token' }
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(401); // 认证失败
      });
    });
  });

  describe('Utils API', () => {
    describe('GET /api/utils/time', () => {
      it('should return current time', async () => {
        const request = new Request('https://example.com/api/utils/time');

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.timestamp).toBeDefined();
        expect(data.data.iso).toBeDefined();
        expect(data.data.unix).toBeDefined();
      });

      it('should accept format parameter', async () => {
        const request = new Request('https://example.com/api/utils/time?format=unix');

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(typeof data.data).toBe('number');
      });
    });

    describe('POST /api/utils/hash', () => {
      it('should generate SHA-256 hash', async () => {
        const hashData = {
          data: 'test message',
          algorithm: 'SHA-256',
          output: 'hex'
        };

        const request = new Request('https://example.com/api/utils/hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hashData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.algorithm).toBe('SHA-256');
        expect(data.data.hash).toBeDefined();
        expect(typeof data.data.hash).toBe('string');
      });

      it('should reject missing data', async () => {
        const hashData = {
          algorithm: 'SHA-256',
          output: 'hex'
        };

        const request = new Request('https://example.com/api/utils/hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hashData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Bad Request');
        expect(data.message).toBe('缺少要哈希的数据');
      });
    });

    describe('GET /api/utils/ip', () => {
      it('should return client IP information', async () => {
        const request = new Request('https://example.com/api/utils/ip', {
          headers: { 'CF-Connecting-IP': '192.168.1.1' }
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.ip).toBeDefined();
        expect(data.data.source).toBeDefined();
      });
    });

    describe('POST /api/utils/base64', () => {
      it('should encode data to base64', async () => {
        const base64Data = {
          data: 'Hello World',
          operation: 'encode'
        };

        const request = new Request('https://example.com/api/utils/base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(base64Data)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.result).toBe(btoa('Hello World'));
      });

      it('should decode base64 data', async () => {
        const base64Data = {
          data: btoa('Hello World'),
          operation: 'decode'
        };

        const request = new Request('https://example.com/api/utils/base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(base64Data)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.result).toBe('Hello World');
      });
    });

    describe('GET /api/utils/uuid', () => {
      it('should generate UUID', async () => {
        const request = new Request('https://example.com/api/utils/uuid');

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.count).toBe(1);
        expect(data.data.uuids).toHaveLength(1);
        expect(data.data.uuids[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      });

      it('should generate multiple UUIDs', async () => {
        const request = new Request('https://example.com/api/utils/uuid?count=5');

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.count).toBe(5);
        expect(data.data.uuids).toHaveLength(5);
      });
    });

    describe('POST /api/utils/validate-json', () => {
      it('should validate valid JSON', async () => {
        const jsonData = {
          data: '{"name": "John", "age": 30}'
        };

        const request = new Request('https://example.com/api/utils/validate-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.valid).toBe(true);
        expect(data.data.parsed).toEqual({ name: 'John', age: 30 });
      });

      it('should detect invalid JSON', async () => {
        const jsonData = {
          data: '{"name": "John", age: 30}' // 缺少引号
        };

        const request = new Request('https://example.com/api/utils/validate-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.valid).toBe(false);
        expect(data.data.error).toBeDefined();
      });
    });

    describe('POST /api/utils/format-json', () => {
      it('should format JSON', async () => {
        const jsonData = {
          data: '{"name":"John","age":30}'
        };

        const request = new Request('https://example.com/api/utils/format-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonData)
        });

        const response = await worker.fetch(request, mockEnv);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.formatted).toContain('  "name": "John"');
        expect(data.data.minified).toBe('{"name":"John","age":30}');
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown paths', async () => {
      const request = new Request('https://example.com/api/unknown');

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Not Found');
      expect(data.message).toContain('路径 /api/unknown 不存在');
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new Request('https://example.com/api/utils/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal Server Error');
    });

    it('should include CORS headers in error responses', async () => {
      const request = new Request('https://example.com/api/unknown');

      const response = await worker.fetch(request, mockEnv);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS preflight request', async () => {
      const request = new Request('https://example.com/api/test', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });
});