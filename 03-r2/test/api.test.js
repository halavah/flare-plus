// R2 API 测试
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = 'http://localhost:8787';

describe('R2 API Tests', () => {
  // 系统路由测试
  describe('System Routes', () => {
    it('should return service info at root', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.service).toBe('R2 API Worker');
      expect(data.status).toBe('running');
    });

    it('should return health check', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
    });
  });

  // 对象操作测试
  describe('Object Operations', () => {
    const testKey = `test-${Date.now()}.txt`;
    const testContent = 'Hello R2!';

    it('should upload an object', async () => {
      const response = await fetch(`${BASE_URL}/api/objects/${testKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: testContent
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.key).toBe(testKey);
    });

    it('should list objects', async () => {
      const response = await fetch(`${BASE_URL}/api/objects`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.objects)).toBe(true);
    });

    it('should get object', async () => {
      const response = await fetch(`${BASE_URL}/api/objects/${testKey}`);
      const content = await response.text();

      expect(response.status).toBe(200);
      expect(content).toBe(testContent);
    });

    it('should get object metadata', async () => {
      const response = await fetch(`${BASE_URL}/api/objects/${testKey}/metadata`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.key).toBe(testKey);
    });

    it('should delete object', async () => {
      const response = await fetch(`${BASE_URL}/api/objects/${testKey}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // 批量操作测试
  describe('Batch Operations', () => {
    const testKeys = [
      `batch-test-1-${Date.now()}.txt`,
      `batch-test-2-${Date.now()}.txt`,
      `batch-test-3-${Date.now()}.txt`
    ];

    beforeAll(async () => {
      // 创建测试文件
      for (const key of testKeys) {
        await fetch(`${BASE_URL}/api/objects/${key}`, {
          method: 'PUT',
          body: 'test content'
        });
      }
    });

    it('should batch delete objects', async () => {
      const response = await fetch(`${BASE_URL}/api/objects/batch/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keys: testKeys })
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.succeeded).toBe(testKeys.length);
    });
  });

  // 统计信息测试
  describe('Stats', () => {
    it('should get bucket stats', async () => {
      const response = await fetch(`${BASE_URL}/api/stats`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(typeof data.stats.totalObjects).toBe('number');
    });

    it('should get usage stats', async () => {
      const response = await fetch(`${BASE_URL}/api/stats/usage`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.usage).toBeDefined();
    });
  });

  // 配置测试
  describe('Configuration', () => {
    it('should get CORS config', async () => {
      const response = await fetch(`${BASE_URL}/api/config/cors`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.config).toBeDefined();
    });

    it('should update CORS config', async () => {
      const newConfig = {
        allowedOrigins: ['https://example.com'],
        allowedMethods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        maxAge: 3600
      };

      const response = await fetch(`${BASE_URL}/api/config/cors`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // 错误处理测试
  describe('Error Handling', () => {
    it('should return 404 for non-existent object', async () => {
      const response = await fetch(`${BASE_URL}/api/objects/non-existent-file.txt`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should return 404 for invalid route', async () => {
      const response = await fetch(`${BASE_URL}/api/invalid-route`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Not Found');
    });
  });
});

