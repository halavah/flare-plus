# Cloudflare KV 键值存储 API 项目

## 📋 项目介绍

这是一个生产就绪的 Cloudflare KV 键值存储 API 项目,提供了完整的 KV 操作接口,包括基础操作、批量操作、搜索、会话管理、缓存和速率限制等功能。

**打包大小**: 31.41 KiB / gzip: 6.58 KiB

## ✨ 核心功能

### 已实现的 API 端点

#### 1. 系统路由
- `GET /` - 服务信息
- `GET /api/health` - 健康检查

#### 2. 基础 KV 操作
- `GET /api/kv/:key` - 获取键值(支持 text、json、arrayBuffer、stream)
- `PUT /api/kv/:key` - 存储键值(支持 TTL、元数据)
- `DELETE /api/kv/:key` - 删除键

#### 3. 列表操作
- `GET /api/kv` - 列出所有键(支持分页、前缀过滤)

#### 4. 元数据操作
- `GET /api/kv/:key/metadata` - 获取键的元数据
- `GET /api/kv/:key/with-metadata` - 同时获取值和元数据

#### 5. 批量操作
- `POST /api/kv/batch/get` - 批量获取
- `POST /api/kv/batch/put` - 批量存储
- `POST /api/kv/batch/delete` - 批量删除

#### 6. 搜索操作
- `GET /api/kv/search` - 前缀搜索

#### 7. 会话管理
- `POST /api/sessions` - 创建会话
- `GET /api/sessions/:id` - 获取会话
- `DELETE /api/sessions/:id` - 删除会话

#### 8. 缓存管理
- `POST /api/cache` - 设置缓存
- `GET /api/cache/:key` - 获取缓存
- `DELETE /api/cache/:key` - 删除缓存

#### 9. 速率限制
- `POST /api/rate-limit/check` - 检查速率限制
- `GET /api/rate-limit/stats/:identifier` - 获取速率限制统计

## 🚀 快速开始

### 前置要求

1. 安装 [Node.js](https://nodejs.org/) (v18+)
2. 安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
   ```bash
   npm install -g wrangler
   ```
3. 登录 Cloudflare 账户
   ```bash
   wrangler auth login
   ```

### 安装依赖

```bash
cd 05-kv
npm install
```

**依赖清单**:
- `itty-router@4.0.25` - 轻量级路由器
- `wrangler@3.22.1` - Cloudflare CLI工具
- `vitest@1.0.4` - 单元测试框架
- `@cloudflare/workers-types@4.20231218.0` - TypeScript 类型定义

### 创建 KV 命名空间

```bash
# 创建生产环境命名空间
wrangler kv:namespace create "MY_KV_NAMESPACE"

# 创建预览环境命名空间
wrangler kv:namespace create "MY_KV_NAMESPACE" --preview

# 记录返回的 id 和 preview_id，更新到 wrangler.toml
```

### 本地开发

```bash
npm run dev
```

访问 http://localhost:8787 查看 API 服务。

### 部署到 Cloudflare

```bash
npm run deploy
```

## 📁 项目结构

```
05-kv/
├── src/
│   ├── index.js              # Worker 主入口 (ES Module)
│   ├── api/                  # API 路由模块 (8个模块)
│   │   ├── kv.js             # 基础 KV API
│   │   ├── list.js           # 列表 API
│   │   ├── metadata.js       # 元数据 API
│   │   ├── batch.js          # 批量操作 API
│   │   ├── search.js         # 搜索 API
│   │   ├── session.js        # 会话管理 API
│   │   ├── cache.js          # 缓存 API
│   │   └── rate-limit.js     # 速率限制 API
│   ├── middleware/           # 中间件 (3个)
│   │   ├── cors.js           # CORS 处理
│   │   ├── error.js          # 错误处理
│   │   └── logger.js         # 日志记录
│   └── utils/                # 工具函数 (2个)
│       ├── kv-helpers.js     # KV 操作封装
│       └── validation.js     # 参数验证
├── docs/                     # 文档
│   └── 01.快速开始.md
├── test/                     # 测试文件
│   └── api.test.js
├── package.json              # ✅ 已配置 "type": "module"
├── wrangler.toml             # Cloudflare 配置
└── README.md
```

## 📖 API 使用示例

### 1. 存储键值

```bash
# 存储简单文本
curl -X PUT http://localhost:8787/api/kv/mykey \
  -H "Content-Type: application/json" \
  -d '{"value": "Hello KV!"}'

# 存储 JSON 对象 + TTL
curl -X PUT http://localhost:8787/api/kv/user:123 \
  -H "Content-Type: application/json" \
  -d '{
    "value": {"name": "张三", "email": "zhangsan@example.com"},
    "expirationTtl": 3600
  }'
```

### 2. 获取键值

```bash
# 获取文本值
curl http://localhost:8787/api/kv/mykey

# 获取 JSON 值
curl "http://localhost:8787/api/kv/user:123?type=json"
```

### 3. 列出所有键

```bash
# 基础列表
curl http://localhost:8787/api/kv

# 带前缀过滤
curl "http://localhost:8787/api/kv?prefix=user:&limit=100"
```

### 4. 批量操作

```bash
# 批量获取
curl -X POST http://localhost:8787/api/kv/batch/get \
  -H "Content-Type: application/json" \
  -d '{"keys": ["user:1", "user:2", "user:3"]}'

# 批量存储
curl -X POST http://localhost:8787/api/kv/batch/put \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"key": "key1", "value": "value1", "expirationTtl": 3600},
      {"key": "key2", "value": "value2"}
    ]
  }'

# 批量删除
curl -X POST http://localhost:8787/api/kv/batch/delete \
  -H "Content-Type: application/json" \
  -d '{"keys": ["key1", "key2", "key3"]}'
```

### 5. 会话管理

```bash
# 创建会话
curl -X POST http://localhost:8787/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "data": {"role": "admin", "permissions": ["read", "write"]},
    "expiresIn": 1800
  }'

# 获取会话
curl http://localhost:8787/api/sessions/{sessionId}

# 删除会话
curl -X DELETE http://localhost:8787/api/sessions/{sessionId}
```

### 6. 缓存管理

```bash
# 设置缓存
curl -X POST http://localhost:8787/api/cache \
  -H "Content-Type: application/json" \
  -d '{
    "key": "api:users:list",
    "value": [{"id": 1, "name": "张三"}],
    "ttl": 300
  }'

# 获取缓存
curl http://localhost:8787/api/cache/api:users:list
```

### 7. 速率限制

```bash
# 检查速率限制
curl -X POST http://localhost:8787/api/rate-limit/check \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user123",
    "limit": 100,
    "window": 60
  }'

# 获取速率限制状态
curl http://localhost:8787/api/rate-limit/stats/user123
```

## ✅ 自动化测试验证

**测试日期**: 2026-01-02
**测试状态**: ✅ 全部通过

| 测试项 | 状态 | 说明 |
|--------|------|------|
| 模块类型 | ✅ | 已配置 `"type": "module"` |
| 依赖完整性 | ✅ | itty-router@4.0.25 |
| 语法检查 | ✅ | 14个文件全部通过 |
| 项目结构 | ✅ | 8个API + 3个中间件 + 2个工具 |
| Wrangler配置 | ✅ | KV绑定配置正确 |
| 部署验证 | ✅ | dry-run 成功 |
| 打包大小 | ✅ | 31.41 KiB / gzip: 6.58 KiB |

## 🧪 运行测试

```bash
# 单元测试
npm test

# 语法检查
find src -name "*.js" | xargs node --check

# 部署前验证
npx wrangler deploy --dry-run

# KV 命令行操作
wrangler kv:key list --namespace-id=your-namespace-id
wrangler kv:key get --namespace-id=your-namespace-id "mykey"
wrangler kv:key put --namespace-id=your-namespace-id "mykey" "myvalue"
```

## 🛡️ 安全特性

- **参数验证**: 所有输入参数都经过严格验证
- **错误处理**: 统一的错误处理机制
- **CORS 支持**: 可配置的跨域资源共享
- **日志记录**: 详细的请求日志
- **速率限制**: 内置速率限制功能
- **TTL 管理**: 自动过期机制

## 💰 免费额度

- **存储空间**: 1GB
- **读取操作**: 100,000 次/天
- **写入操作**: 1,000 次/天
- **列表操作**: 1,000 次/天
- **键数量**: 无限制
- **值大小**: 最大 25MB
- **键长度**: 最大 512 字节

## 🔧 开发命令

```bash
# 本地开发
npm run dev

# 部署到生产环境
npm run deploy

# 运行测试
npm test

# 查看实时日志
npm run tail

# KV 数据管理
npm run kv:preview     # 查看预览环境键列表
npm run kv:production  # 查看生产环境键列表
```

## 📊 性能优化

1. **全球分布**: KV 数据自动复制到全球各地
2. **边缘缓存**: 读取操作在边缘节点执行
3. **批量操作**: 减少 API 调用次数
4. **TTL 管理**: 自动清理过期数据
5. **元数据**: 存储额外信息而不增加值大小

## 📝 配置注意事项

### 1. package.json 配置

**必须配置** `"type": "module"` 以启用 ES Module 支持:

```json
{
  "type": "module",
  "dependencies": {
    "itty-router": "^4.0.25"
  }
}
```

### 2. wrangler.toml 配置

```toml
name = "flare-plus-kv"
main = "src/index.js"
compatibility_date = "2023-12-01"

[[kv_namespaces]]
binding = "MY_KV_NAMESPACE"
id = "your-kv-namespace-id"           # 从创建命令获取
preview_id = "your-kv-preview-id"     # 从创建命令获取
```

### 3. KV 命名空间创建

```bash
# 创建生产环境命名空间
wrangler kv:namespace create "MY_KV_NAMESPACE"
# 输出: 🌀 Creating namespace with title "worker-MY_KV_NAMESPACE"
# ✨ Success!
# Add the following to your configuration file:
# [[kv_namespaces]]
# binding = "MY_KV_NAMESPACE"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 创建预览环境命名空间
wrangler kv:namespace create "MY_KV_NAMESPACE" --preview
```

## 🐛 已知问题与解决方案

1. **最终一致性**
   KV 数据是最终一致性的,写入后全球同步需要时间(通常 <60秒)。

2. **值大小限制**
   单个值最大 25MB,超过需要分片存储。

3. **键长度限制**
   键最大 512 字节,需要合理设计键名规则。

4. **列表操作限制**
   列表操作相对慢,建议使用前缀过滤减少结果集。

## 💡 使用场景

1. **会话管理** - 用户会话、JWT Token 存储
2. **缓存系统** - API 响应缓存、数据缓存
3. **速率限制** - IP 限流、API 配额管理
4. **配置存储** - 应用配置、特性开关
5. **用户偏好** - 用户设置、主题配置
6. **计数器** - 浏览量、点赞数统计

## 🔗 相关资源

- [Cloudflare KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [KV API 参考](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Workers 文档](https://developers.cloudflare.com/workers/)
- [本项目快速开始文档](./docs/01.快速开始.md)

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 🙏 致谢

感谢 Cloudflare 提供的优秀 KV 服务和 Workers 平台。

---

**最后测试时间**: 2026-01-02
**维护状态**: ✅ 生产就绪
**版本**: 1.0.0
