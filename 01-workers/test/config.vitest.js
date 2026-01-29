import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 基础测试配置
    include: ['test/**/*.test.js'],
    exclude: ['node_modules'],
    // 简化的环境配置
    environment: 'node',
    globals: true,
  },
});