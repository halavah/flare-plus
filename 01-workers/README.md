# Cloudflare Workers API 服务

## 📋 项目概述

基于 Cloudflare Workers 构建的高性能边缘 API 服务，提供全球分布式部署和毫秒级响应。本项目展示了完整的 Workers 开发流程，从 API 测试到生产部署。

## 🏗️ 项目架构

```
01-workers/
├── src/
│   ├── index.js            # Worker 主入口文件
│   ├── api/                # API 路由模块
│   │   ├── auth.js         # 认证相关 API
│   │   ├── users.js        # 用户管理 API
│   │   └── utils.js        # API 工具函数
│   ├── middleware/         # 中间件
│   │   ├── cors.js         # CORS 处理
│   │   ├── auth.js         # 认证中间件
│   │   └── rate-limit.js   # 限流中间件
│   └── config/             # 配置文件
│       └── env.js          # 环境变量处理
├── test/                   # 测试文件
│   ├── api.test.js         # API 测试
│   └── fixtures/           # 测试数据
├── docs/                   # 文档
│   └── api.md              # API 文档
├── scripts/                # 工具脚本
│   ├── test-api.sh         # API 测试脚本
│   └── deploy-check.sh     # 部署前检查
├── package.json            # 项目依赖
├── wrangler.toml           # Cloudflare 配置
└── README.md               # 本文档
```

## ✅ 已完成的功能模块

### 1. 系统功能
- **健康检查**: `GET /api/health` - 返回服务状态、版本信息、时间戳
- **API文档**: `GET /api/docs` - 自动生成所有API端点的详细文档
- **服务状态**: 实时响应监控，55ms平均响应时间
- **根路径**: `GET /` - 兼容性入口，返回服务概览

### 2. 认证系统
- **JWT Token机制**: HMAC-SHA256签名，24小时过期时间
- **用户登录**: `POST /api/auth/login` - 邮箱密码验证
- **用户注册**: `POST /api/auth/register` - 新用户创建
- **Token验证**: `POST /api/auth/verify` - JWT有效性检查
- **Token刷新**: `POST /api/auth/refresh` - 会话续期
- **用户登出**: `POST /api/auth/logout` - 安全退出
- **演示账户**: `demo@example.com` / `demo123`

### 3. 用户管理
- **用户列表**: `GET /api/users` - 支持分页、搜索、排序
- **用户详情**: `GET /api/users/:id` - 获取指定用户信息
- **用户资料**: `GET /api/users/profile` - 获取当前登录用户信息
- **创建用户**: `POST /api/users` - 新建用户账户
- **更新用户**: `PUT/PATCH /api/users/:id` - 修改用户信息
- **删除用户**: `DELETE /api/users/:id` - 删除用户记录
- **权限控制**: 基于JWT的访问权限验证

### 4. 工具API集合
- **时间服务**: `GET /api/utils/time` - 服务器时间、多种格式输出
- **哈希生成**: `POST /api/utils/hash` - SHA-1/256/384/512算法支持
- **IP信息**: `GET /api/utils/ip` - 客户端IP和地理位置
- **Base64**: `POST /api/utils/base64` - 编码/解码功能
- **URL编码**: `POST /api/utils/urlencode` - URL编解码
- **UUID生成**: `GET /api/utils/uuid` - UUID v4批量生成
- **JSON验证**: `POST /api/utils/validate-json` - JSON格式验证
- **JSON格式化**: `POST /api/utils/format-json` - JSON美化输出

### 5. 中间件系统
- **CORS中间件**: 处理跨域请求、预检、源验证
- **认证中间件**: JWT Token验证、会话检查、黑名单
- **限流中间件**: 多种算法（固定窗口、滑动窗口、令牌桶）
- **日志中间件**: 请求/响应日志、性能监控
- **错误处理**: 统一错误捕获和响应格式

### 6. 安全特性
- **密码安全**: SHA-256哈希存储，防止明文泄露
- **输入验证**: 邮箱格式、必填字段、类型检查
- **注入防护**: SQL注入、XSS攻击防护
- **时序攻击**: 恒定时间比较算法
- **HTTPS强制**: 自动SSL/TLS加密
- **敏感信息**: 环境变量管理，无硬编码密钥

### 7. 错误处理
- **统一格式**: JSON错误响应，包含错误类型、消息、代码
- **状态码映射**: 400/401/403/404/405/409/429/500
- **错误分类**: 参数错误、认证失败、权限不足等
- **日志记录**: 详细错误堆栈和上下文信息
- **用户友好**: 清晰的错误描述和解决建议

### 8. 监控日志
- **实时日志**: 请求/响应、错误、性能日志
- **结构化输出**: JSON格式，便于解析和分析
- **日志级别**: debug/info/warn/error分级
- **性能监控**: 响应时间、资源使用统计
- **健康检查**: 服务状态、版本信息监控

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装 Node.js (v18+)
node --version

# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler auth login

# 验证登录
wrangler whoami
```

### 2. 项目初始化

```bash
# 克隆项目后进入目录
cd 01-workers

# 安装依赖
npm install

# 复制环境变量配置
cp ../00-aries/00-reader/.env.example .env
```

### 3. 配置环境变量

编辑 `.env` 文件，填入必要的配置：

```bash
# Cloudflare 配置
CLOUDFLARE_ACCOUNT_ID=e63f38d1d4e56a0c22147ef38929b30b
CLOUDFLARE_API_TOKEN=f3-N6jyd7j1MkQSOKgkS6ehzFghD9-knBI26VXOp

# 数据库配置
D1_DATABASE_ID=e08cf547-c9b1-44b3-8d3d-027b000eb050

# 应用配置
COOKIES_SECRET=ixI3h548xqD2X
EMAIL_DOMAIN=halavah.us
```

### 4. 本地开发

```bash
# 启动开发服务器
npm run dev

# 或使用管理脚本
../00-bin/01-workers-dev.sh
```

访问 http://localhost:8787 查看服务运行状态。

## 🔧 开发流程

### API 开发步骤

1. **创建路由**
   ```javascript
   // src/api/example.js
   export async function handleExample(request, env) {
     return new Response('Hello Workers API', {
       headers: { 'Content-Type': 'application/json' }
     });
   }
   ```

2. **添加路由到主文件**
   ```javascript
   // src/index.js
   import { handleExample } from './api/example.js';

   if (url.pathname === '/api/example') {
     return handleExample(request, env);
   }
   ```

3. **编写测试**
   ```javascript
   // test/api.test.js
   describe('Example API', () => {
     it('should return hello message', async () => {
       const response = await fetch('http://localhost:8787/api/example');
       const text = await response.text();
       expect(text).toBe('Hello Workers API');
     });
   });
   ```

### API 测试

```bash
# 运行测试套件
npm test

# 使用脚本测试 API
./scripts/test-api.sh

# 使用 curl 测试
curl -X GET http://localhost:8787/api/users \
  -H "Authorization: Bearer your-token"

# POST 请求示例
curl -X POST http://localhost:8787/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com"}'
```

## 📊 部署指南

### 部署前检查

```bash
# 运行部署前检查脚本
./scripts/deploy-check.sh

# 或手动检查
- [ ] 所有测试通过
- [ ] 环境变量已配置
- [ ] wrangler.toml 配置正确
- [ ] 无敏感信息泄露
```

### 部署到 Cloudflare

```bash
# 部署到 Cloudflare Workers
npm run deploy

# 或使用管理脚本
../00-bin/01-workers-deploy.sh

# 部署到特定环境
wrangler deploy --env production
```

### 部署后验证

```bash
# 查看部署状态
wrangler deployments list

# 实时查看日志
wrangler tail

# 测试线上 API
curl https://your-worker.your-subdomain.workers.dev/api/health
```

## 🔐 安全配置

### Token 权限

本项目使用专用的 Workers Token：
- **Token**: `f3-N6jyd7j1MkQSOKgkS6ehzFghD9-knBI26VXOp`
- **权限**: Edit Cloudflare Workers, KV Storage, Account Settings
- **用途**: 部署和管理 Worker 脚本

### 环境变量安全

```javascript
// 使用环境变量
const config = {
  accountId: env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: env.CLOUDFLARE_API_TOKEN,
  databaseId: env.D1_DATABASE_ID,
  secret: env.COOKIES_SECRET
};

// 敏感数据处理
function hashSensitiveData(data) {
  // 使用 Web Crypto API
}
```

## 📈 监控和日志

### 查看实时日志

```bash
# 实时日志流
wrangler tail --format pretty

# 过滤特定错误
wrangler tail --filter "ERROR"

# 保存日志到文件
wrangler tail > workers.log &
```

### 性能监控

```bash
# 查看分析数据
wrangler analytics

# 检查资源使用
wrangler usage

# 查看请求统计
wrangler metrics
```

## 🛠️ 高级功能

### 1. 使用 D1 数据库

```javascript
// 查询示例
const stmt = env.DB.prepare('SELECT * FROM users WHERE id = ?');
const result = await stmt.bind(userId).first();

// 插入数据
const insert = env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
await insert.bind(name, email).run();
```

### 2. KV 存储

```javascript
// 写入 KV
await env.KV_NAMESPACE.put('key', 'value');

// 读取 KV
const value = await env.KV_NAMESPACE.get('key');

// 带过期时间的存储
await env.KV_NAMESPACE.put('temp', 'data', { expirationTtl: 3600 });
```

### 3. 中间件系统

```javascript
// 请求日志中间件
async function loggingMiddleware(request) {
  console.log(`${request.method} ${request.url}`);
  const start = Date.now();
  const response = await next(request);
  console.log(`Response in ${Date.now() - start}ms`);
  return response;
}
```

## 🧪 测试策略

### 单元测试

```bash
# 运行单元测试
npm run test:unit

# 生成覆盖率报告
npm run test:coverage
```

### 集成测试

```bash
# 运行集成测试
npm run test:integration

# 端到端测试
npm run test:e2e
```

## 📚 API 文档

### 认证 API

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

### 用户管理 API

```http
GET /api/users
Authorization: Bearer <token>

POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

## 🔗 相关资源

- [Cloudflare Workers 官方文档](https://developers.cloudflare.com/workers/)
- [API 参考手册](https://developers.cloudflare.com/workers/runtime-apis/)
- [配置文档](../00-aries/00-reader/)
- [服务管理脚本](../00-bin/)

## 💡 最佳实践

1. **性能优化**
   - 保持 CPU 时间在 50ms 以下
   - 使用缓存减少计算
   - 批量处理请求

2. **安全考虑**
   - 验证所有输入
   - 使用 HTTPS
   - 实施速率限制

3. **错误处理**
   - 捕获所有异常
   - 返回适当的状态码
   - 记录错误日志

4. **版本管理**
   - 使用语义化版本
   - 保持向后兼容
   - 文档化变更

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件