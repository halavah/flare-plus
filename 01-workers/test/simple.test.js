// 简化的基础测试，用于验证模块加载和基本功能

describe('Basic Module Tests', () => {
  it('should load index module', async () => {
    const { default: worker } = await import('../src/index.js');
    expect(worker).toBeDefined();
    expect(worker.fetch).toBeInstanceOf(Function);
  });

  it('should load auth module', async () => {
    const { handleAuth } = await import('../src/api/auth.js');
    expect(handleAuth).toBeInstanceOf(Function);
  });

  it('should load users module', async () => {
    const { handleUsers } = await import('../src/api/users.js');
    expect(handleUsers).toBeInstanceOf(Function);
  });

  it('should load utils module', async () => {
    const { handleUtils } = await import('../src/api/utils.js');
    expect(handleUtils).toBeInstanceOf(Function);
  });

  it('should load cors middleware', async () => {
    const { corsMiddleware } = await import('../src/middleware/cors.js');
    expect(corsMiddleware).toBeInstanceOf(Function);
  });

  it('should load auth middleware', async () => {
    const { authMiddleware } = await import('../src/middleware/auth.js');
    expect(authMiddleware).toBeInstanceOf(Function);
  });

  it('should load rate limit middleware', async () => {
    const { rateLimitMiddleware } = await import('../src/middleware/rate-limit.js');
    expect(rateLimitMiddleware).toBeInstanceOf(Function);
  });

  it('should load config module', async () => {
    const { getConfig } = await import('../src/config/env.js');
    expect(getConfig).toBeInstanceOf(Function);
  });
});