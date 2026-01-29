# Cloudflare D1 数据库 API 项目

## 📋 项目介绍

这是一个生产就绪的 Cloudflare D1 SQL 数据库 API 项目,提供了完整的数据库操作接口,包括用户管理、文章管理、高级查询、事务处理、批量操作和统计分析等功能。

**打包大小**: 34.07 KiB / gzip: 7.38 KiB

## ✨ 核心功能

### 已实现的 API 端点

#### 1. 系统路由
- `GET /` - 服务信息
- `GET /api/health` - 健康检查(测试数据库连接)

#### 2. 用户管理(CRUD)
- `GET /api/users` - 获取用户列表(支持分页、按城市过滤)
- `GET /api/users/:id` - 获取单个用户详情
- `POST /api/users` - 创建新用户
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户

#### 3. 文章管理(CRUD)
- `GET /api/articles` - 获取文章列表(支持分页、按状态过滤)
- `GET /api/articles/:id` - 获取单篇文章详情(自动增加浏览量)
- `POST /api/articles` - 创建新文章
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章
- `GET /api/articles/author/:authorId` - 获取指定作者的所有文章

#### 4. 高级查询
- `POST /api/query/execute` - 执行原始 SQL 查询(仅支持 SELECT)
- `POST /api/query/prepared` - 执行参数化查询
- `GET /api/query/search` - 全文搜索(支持搜索文章和用户)

#### 5. 事务处理
- `POST /api/transaction/transfer` - 资金转账示例(事务)
- `POST /api/transaction/order` - 创建订单示例(复杂事务)

#### 6. 批量操作
- `POST /api/batch/insert` - 批量插入数据
- `POST /api/batch/update` - 批量更新数据
- `POST /api/batch/delete` - 批量删除数据

#### 7. 统计信息
- `GET /api/stats/users` - 用户统计(总数、按城市分布、平均年龄)
- `GET /api/stats/articles` - 文章统计(总数、按状态分布、热门作者、总浏览量)
- `GET /api/stats/database` - 数据库统计(表数量、各表记录数)

## 🗄️ 数据库 Schema

### 用户表 (users)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  age INTEGER,
  city TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 文章表 (articles)
```sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  author_id INTEGER NOT NULL,
  status TEXT DEFAULT 'draft',
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME,
  FOREIGN KEY (author_id) REFERENCES users(id)
);
```

### 其他表
- **comments** - 评论表
- **tags** - 标签表
- **article_tags** - 文章标签关联表

完整 Schema 请参考 `migrations/0001_initial_schema.sql`

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
cd 04-d1
npm install
```

**依赖清单**:
- `itty-router@4.0.25` - 轻量级路由器
- `wrangler@3.22.1` - Cloudflare CLI工具
- `vitest@1.0.4` - 单元测试框架
- `@cloudflare/workers-types@4.20231218.0` - TypeScript 类型定义

### 创建 D1 数据库

```bash
# 创建生产数据库
wrangler d1 create flare-plus-database

# 创建预览数据库(可选)
wrangler d1 create flare-plus-database-preview

# 更新 wrangler.toml 中的 database_id
```

### 运行数据库迁移

```bash
# 本地环境迁移
npm run db:local

# 生产环境迁移
npm run db:migrate
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
04-d1/
├── src/
│   ├── index.js              # Worker 主入口 (ES Module)
│   ├── api/                  # API 路由模块 (6个模块)
│   │   ├── users.js          # 用户管理 API
│   │   ├── articles.js       # 文章管理 API
│   │   ├── query.js          # 高级查询 API
│   │   ├── transaction.js    # 事务处理 API
│   │   ├── batch.js          # 批量操作 API
│   │   └── stats.js          # 统计信息 API
│   ├── middleware/           # 中间件 (3个)
│   │   ├── cors.js           # CORS 处理
│   │   ├── error.js          # 错误处理
│   │   └── logger.js         # 日志记录
│   └── utils/                # 工具函数 (2个)
│       ├── db-helpers.js     # 数据库操作封装
│       └── validation.js     # 参数验证
├── migrations/               # 数据库迁移文件
│   └── 0001_initial_schema.sql
├── docs/                     # 文档
│   └── 01.快速开始.md
├── test/                     # 测试文件
│   └── api.test.js
├── package.json              # ✅ 已配置 "type": "module"
├── wrangler.toml             # Cloudflare 配置
└── README.md
```

## 📖 API 使用示例

### 1. 创建用户

```bash
curl -X POST http://localhost:8787/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "张三", "email": "zhangsan@example.com", "age": 25, "city": "北京"}'
```

### 2. 获取用户列表

```bash
# 基础列表
curl http://localhost:8787/api/users

# 带过滤和分页
curl "http://localhost:8787/api/users?page=1&limit=10&city=北京"
```

### 3. 创建文章

```bash
curl -X POST http://localhost:8787/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的第一篇文章",
    "content": "这是文章内容...",
    "author_id": 1,
    "status": "published"
  }'
```

### 4. 全文搜索

```bash
# 搜索文章
curl "http://localhost:8787/api/query/search?keyword=Cloudflare&table=articles"

# 搜索用户
curl "http://localhost:8787/api/query/search?keyword=张三&table=users"
```

### 5. 批量插入

```bash
curl -X POST http://localhost:8787/api/batch/insert \
  -H "Content-Type: application/json" \
  -d '{
    "table": "users",
    "items": [
      {"name": "用户1", "email": "user1@example.com", "age": 20},
      {"name": "用户2", "email": "user2@example.com", "age": 30}
    ]
  }'
```

### 6. 获取统计信息

```bash
# 用户统计
curl http://localhost:8787/api/stats/users

# 文章统计
curl http://localhost:8787/api/stats/articles

# 数据库统计
curl http://localhost:8787/api/stats/database
```

## ✅ 自动化测试验证

**测试日期**: 2026-01-02
**测试状态**: ✅ 全部通过

| 测试项 | 状态 | 说明 |
|--------|------|------|
| 模块类型 | ✅ | 已配置 `"type": "module"` |
| 依赖完整性 | ✅ | itty-router@4.0.25 |
| 语法检查 | ✅ | 11个文件全部通过 |
| 项目结构 | ✅ | 6个API + 3个中间件 + 2个工具 |
| Wrangler配置 | ✅ | D1绑定配置正确 |
| 数据库迁移 | ✅ | 1个迁移文件就绪 |
| 部署验证 | ✅ | dry-run 成功 |
| 打包大小 | ✅ | 34.07 KiB / gzip: 7.38 KiB |

## 🧪 运行测试

```bash
# 单元测试
npm test

# 语法检查
find src -name "*.js" | xargs node --check

# 数据库迁移测试
npm run db:local

# 部署前验证
npx wrangler deploy --dry-run
```

## 🛡️ 安全特性

- **参数验证**: 所有输入参数都经过严格验证
- **SQL 注入防护**: 使用参数化查询
- **错误处理**: 统一的错误处理机制
- **CORS 支持**: 可配置的跨域资源共享
- **日志记录**: 详细的请求日志
- **外键约束**: 保证数据完整性
- **触发器**: 自动更新时间戳

## 💰 免费额度

- **数据库数量**: 10 个
- **数据库大小**: 5GB / 数据库
- **读取操作**: 5,000,000 次/天
- **写入操作**: 100,000 次/天
- **存储空间**: 总计 50GB
- **查询时间**: 30秒超时

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

# 数据库迁移
npm run db:migrate      # 生产环境
npm run db:local        # 本地环境

# D1 数据库管理
wrangler d1 execute flare-plus-database --command "SELECT * FROM users LIMIT 10"
```

## 📊 性能优化

1. **索引优化**: 为常用查询字段创建索引
2. **批量操作**: 使用 batch() 方法提高吞吐量
3. **连接复用**: Worker 自动管理数据库连接
4. **查询优化**: 使用参数化查询和预编译语句
5. **分页查询**: 避免一次性加载大量数据

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
name = "flare-plus-d1"
main = "src/index.js"
compatibility_date = "2023-12-01"

[[d1_databases]]
binding = "DB"
database_name = "flare-plus-database"
database_id = "your-database-id"  # 从 wrangler d1 create 命令获取
```

### 3. 数据库迁移

```bash
# 创建迁移文件
# migrations/0001_initial_schema.sql

# 应用迁移(生产环境)
wrangler d1 migrations apply flare-plus-database

# 应用迁移(本地环境)
wrangler d1 migrations apply flare-plus-database --local
```

## 🐛 已知问题与解决方案

1. **D1 基于 SQLite**
   兼容大部分 SQLite 语法,不支持某些高级特性。

2. **查询超时**
   单个查询最多 30 秒,需要优化复杂查询。

3. **事务支持**
   使用 `batch()` 方法实现原子操作。

4. **并发限制**
   D1 在 Worker 中自动管理并发连接。

## 🔗 相关资源

- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [D1 API 参考](https://developers.cloudflare.com/d1/platform/client-api/)
- [SQLite 文档](https://www.sqlite.org/docs.html)
- [Workers 文档](https://developers.cloudflare.com/workers/)
- [本项目快速开始文档](./docs/01.快速开始.md)

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 🙏 致谢

感谢 Cloudflare 提供的优秀 D1 数据库服务和 Workers 平台。

---

**最后测试时间**: 2026-01-02
**维护状态**: ✅ 生产就绪
**版本**: 1.0.0
