import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'miniflare',
    environmentOptions: {
      compat: 'nodejs_compat',
      // 模拟 Cloudflare Workers 环境
      modules: true,
    },
    // 测试文件匹配模式
    include: ['test/**/*.test.js'],
    // 排除文件
    exclude: ['node_modules'],
    // 覆盖率报告
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'scripts/',
        'docs/',
      ],
    },
    // 全局设置
    globals: true,
    // 超时设置
    testTimeout: 10000,
    // 钩子超时
    hookTimeout: 10000,
  },
});