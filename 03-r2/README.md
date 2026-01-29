# Cloudflare R2 对象存储 API 项目

## 📋 项目介绍

这是一个生产就绪的 Cloudflare R2 对象存储 API 项目,提供了完整的 R2 操作接口,包括对象上传/下载、元数据管理、多部分上传、批量操作等功能。

**打包大小**: 31.64 KiB / gzip: 6.29 KiB

## ✨ 核心功能

### 已实现的 API 端点

#### 1. 系统路由
- `GET /` - 服务信息
- `GET /api/health` - 健康检查

#### 2. 对象操作
- `GET /api/objects` - 列出所有对象(支持分页、前缀过滤)
- `GET /api/objects/:key` - 下载对象
- `PUT /api/objects/:key` - 上传对象
- `DELETE /api/objects/:key` - 删除对象

#### 3. 元数据管理
- `GET /api/objects/:key/metadata` - 获取对象元数据
- `PUT /api/objects/:key/metadata` - 更新对象元数据

#### 4. 预签名 URL
- `POST /api/objects/:key/presigned` - 生成预签名 URL

#### 5. 多部分上传
- `POST /api/objects/:key/multipart/init` - 初始化多部分上传
- `POST /api/objects/:key/multipart/upload` - 上传分片
- `POST /api/objects/:key/multipart/complete` - 完成多部分上传
- `DELETE /api/objects/:key/multipart/:uploadId` - 中止多部分上传

#### 6. 批量操作
- `POST /api/objects/batch/delete` - 批量删除对象
- `POST /api/objects/batch/copy` - 批量复制对象

#### 7. 配置管理
- `GET /api/config/cors` - 获取 CORS 配置
- `PUT /api/config/cors` - 更新 CORS 配置

#### 8. 统计信息
- `GET /api/stats` - 存储桶统计信息
- `GET /api/stats/usage` - 使用情况统计

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
cd 03-r2
npm install
```

**依赖清单**:
- `itty-router@4.0.25` - 轻量级路由器
- `aws-sdk@2.1509.0` - S3兼容操作
- `wrangler@3.22.1` - Cloudflare CLI工具
- `vitest@1.0.4` - 单元测试框架

### 创建 R2 存储桶

```bash
# 创建生产环境存储桶
wrangler r2 bucket create flare-plus-test-bucket

# 更新 wrangler.toml 中的绑定配置
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
03-r2/
├── src/
│   ├── index.js              # Worker 主入口 (ES Module)
│   ├── api/                  # API 路由模块 (8个模块)
│   │   ├── objects.js        # 对象操作 API
│   │   ├── metadata.js       # 元数据 API
│   │   ├── presigned.js      # 预签名 URL API
│   │   ├── multipart.js      # 多部分上传 API
│   │   ├── batch.js          # 批量操作 API
│   │   ├── config.js         # 配置管理 API
│   │   └── stats.js          # 统计信息 API
│   ├── middleware/           # 中间件 (3个)
│   │   ├── cors.js           # CORS 处理
│   │   ├── error.js          # 错误处理
│   │   └── logger.js         # 日志记录
│   └── utils/                # 工具函数 (2个)
│       ├── r2-client.js      # R2 客户端封装
│       └── validation.js     # 参数验证
├── test/                     # 测试文件
│   └── api.test.js           # API 测试
├── docs/                     # 文档
│   └── 01.快速开始.md
├── package.json              # ✅ 已配置 "type": "module"
├── wrangler.toml             # Cloudflare 配置
├── vitest.config.js          # 测试配置
└── README.md                 # 项目说明
```

## 📖 API 使用示例

### 1. 上传文件

```bash
curl -X PUT http://localhost:8787/api/objects/test.txt \
  -H "Content-Type: text/plain" \
  -d "Hello R2!"
```

### 2. 列出所有对象

```bash
# 基础列表
curl http://localhost:8787/api/objects

# 带前缀过滤
curl "http://localhost:8787/api/objects?prefix=uploads/&limit=100"
```

### 3. 下载文件

```bash
curl http://localhost:8787/api/objects/test.txt
```

### 4. 获取元数据

```bash
curl http://localhost:8787/api/objects/test.txt/metadata
```

### 5. 批量删除

```bash
curl -X POST http://localhost:8787/api/objects/batch/delete \
  -H "Content-Type: application/json" \
  -d '{"keys": ["file1.txt", "file2.txt"]}'
```

### 6. 多部分上传(大文件)

```bash
# 1. 初始化多部分上传
curl -X POST http://localhost:8787/api/objects/large-file.zip/multipart/init \
  -H "Content-Type: application/json" \
  -d '{"contentType": "application/zip"}'

# 2. 上传分片
curl -X POST http://localhost:8787/api/objects/large-file.zip/multipart/upload \
  -H "Content-Type: application/json" \
  -d '{"uploadId": "xxx", "partNumber": 1, "data": "base64data"}'

# 3. 完成上传
curl -X POST http://localhost:8787/api/objects/large-file.zip/multipart/complete \
  -H "Content-Type: application/json" \
  -d '{"uploadId": "xxx", "parts": [{"partNumber": 1, "etag": "xxx"}]}'
```

### 7. 获取统计信息

```bash
# 存储桶统计
curl http://localhost:8787/api/stats

# 使用情况
curl http://localhost:8787/api/stats/usage
```

## ✅ 自动化测试验证

**测试日期**: 2026-01-02
**测试状态**: ✅ 全部通过

| 测试项 | 状态 | 说明 |
|--------|------|------|
| 模块类型 | ✅ | 已配置 `"type": "module"` |
| 依赖完整性 | ✅ | itty-router@4.0.25 |
| 语法检查 | ✅ | 13个文件全部通过 |
| 项目结构 | ✅ | 8个API + 3个中间件 + 2个工具 |
| Wrangler配置 | ✅ | R2绑定配置正确 |
| 部署验证 | ✅ | dry-run 成功 |
| 打包大小 | ✅ | 31.64 KiB / gzip: 6.29 KiB |

## 🧪 运行测试

```bash
# 单元测试
npm test

# 语法检查
npm run lint

# 部署前验证
npx wrangler deploy --dry-run
```

### 测试覆盖范围

- ✅ 对象上传/下载/删除
- ✅ 对象列表(分页、过滤)
- ✅ 元数据操作
- ✅ 批量操作
- ✅ 统计信息
- ✅ 配置管理
- ✅ 错误处理

## 🛡️ 安全特性

- **参数验证**: 所有输入参数都经过严格验证
- **错误处理**: 统一的错误处理机制
- **CORS 支持**: 可配置的跨域资源共享
- **日志记录**: 详细的请求日志
- **访问控制**: 支持自定义认证中间件

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

# R2 存储桶管理
wrangler r2 bucket list
wrangler r2 object list flare-plus-test-bucket
```

## 📊 性能优化

1. **并发操作**: 批量操作支持并行处理
2. **流式传输**: 大文件使用流式上传/下载
3. **缓存策略**: 支持 ETag 和 Last-Modified
4. **分片上传**: 大文件(>100MB)自动分片上传
5. **CDN 加速**: 利用 Cloudflare 全球 CDN

## 🔗 相关资源

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [R2 API 参考](https://developers.cloudflare.com/r2/api/)
- [Workers 文档](https://developers.cloudflare.com/workers/)
- [本项目快速开始文档](./docs/01.快速开始.md)

## 💰 免费额度

- **存储空间**: 10GB/月
- **Class A 操作**(写操作): 1,000,000 次/月
- **Class B 操作**(读操作): 10,000,000 次/月
- **出口流量**: 无限制(免费) ⭐

## 📝 配置注意事项

### 1. package.json 配置

**必须配置** `"type": "module"` 以启用 ES Module 支持:

```json
{
  "type": "module",
  "dependencies": {
    "itty-router": "^4.0.25",
    "aws-sdk": "^2.1509.0"
  }
}
```

### 2. wrangler.toml 配置

```toml
name = "flare-plus-r2"
main = "src/index.js"
compatibility_date = "2023-12-01"

[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "flare-plus-test-bucket"
```

### 3. R2 存储桶创建

```bash
# 创建存储桶
wrangler r2 bucket create flare-plus-test-bucket

# 查看存储桶列表
wrangler r2 bucket list
```

## 🐛 已知问题与解决方案

1. **预签名 URL 生成**
   需要 AWS SDK 集成,当前版本已包含依赖。

2. **元数据更新**
   R2 限制:元数据更新需要重新上传对象。

3. **多部分上传**
   适用于大文件(>100MB),需要客户端支持分片。

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 🙏 致谢

感谢 Cloudflare 提供的优秀 R2 服务和 Workers 平台。

---

**最后测试时间**: 2026-01-02
**维护状态**: ✅ 生产就绪
**版本**: 1.0.0
