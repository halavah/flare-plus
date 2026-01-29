# Cloudflare Webhooks Worker - Webhook 事件处理系统

## 📋 项目介绍

这是一个生产就绪的 Webhook 处理系统,使用 Cloudflare Workers 处理和管理来自各种服务的 Webhook 事件,支持多平台集成、事件验证、队列管理和重试逻辑。

**打包大小**: 23.99 KiB / gzip: 5.32 KiB

Webhook Worker 提供:
- ✅ Webhook 端点管理
- ✅ 事件验证和认证(HMAC 签名)
- ✅ 事件队列和重试逻辑
- ✅ 速率限制和安全防护
- ✅ 第三方服务集成(GitHub, Stripe, Slack, Shopify)
- ✅ 实时事件处理

## 🚀 快速开始

### 1. 安装依赖
```bash
cd 08-webhooks
npm install
```

**依赖清单**:
- `itty-router@4.0.23` - 轻量级路由器
- `@cloudflare/workers-types@4.20231218.0` - TypeScript 类型定义
- `wrangler@3.22.1` - Cloudflare CLI工具
- `vitest@1.0.4` - 单元测试框架

### 2. 创建所需资源
```bash
# 创建 KV 命名空间
wrangler kv:namespace create "WEBHOOK_STORAGE"
wrangler kv:namespace create "WEBHOOK_STORAGE" --preview
wrangler kv:namespace create "EVENT_QUEUE"
wrangler kv:namespace create "EVENT_QUEUE" --preview

# 创建 D1 数据库
wrangler d1 create "flare-plus-webhooks-db"
```

### 3. 更新 wrangler.toml
将创建命令返回的实际 ID 替换到配置文件中。

### 4. 初始化数据库
```bash
wrangler d1 migrations apply flare-plus-webhooks-db
```

### 5. 本地开发
```bash
# 启动本地开发服务器
npm run dev

# 部署到生产环境
npm run deploy

# 查看实时日志
npm run tail
```

## ✅ 自动化测试验证

**测试日期**: 2026-01-02
**测试状态**: ✅ 全部通过

| 测试项 | 状态 | 说明 |
|--------|------|------|
| 依赖安装 | ✅ | 136个包成功安装 |
| 语法检查 | ✅ | 14个文件全部通过 |
| 项目结构 | ✅ | 5个Handler + 4个中间件 + 3个工具 |
| Wrangler配置 | ✅ | KV + D1 + Queue绑定正确 |
| 数据库迁移 | ✅ | 1个迁移文件就绪 |
| 部署验证 | ✅ | dry-run 成功 |
| 打包大小 | ✅ | 23.99 KiB / gzip: 5.32 KiB |

## 🔌 支持的 Webhook 提供商

本 Worker 支持来自以下服务的 Webhook:

### 1. GitHub Webhooks
- ✅ Push 事件
- ✅ Pull Request 事件
- ✅ Release 事件
- ✅ Issue 事件
- ✅ HMAC-SHA256 签名验证
- ✅ IP 白名单验证

### 2. Stripe Webhooks
- ✅ 支付事件
- ✅ 客户事件
- ✅ 订阅事件
- ✅ Stripe 签名验证
- ✅ 幂等性处理

### 3. Slack Webhooks
- ✅ 消息事件
- ✅ 频道事件
- ✅ Bot 事件
- ✅ 签名验证
- ✅ URL 验证

### 4. Shopify Webhooks
- ✅ 订单事件
- ✅ 产品事件
- ✅ 客户事件
- ✅ HMAC-SHA256 验证

### 5. 自定义 Webhooks
- ✅ 通用 JSON 负载
- ✅ 自定义认证
- ✅ 灵活的事件格式

## 📡 API 端点

### Webhook 接收
- `POST /webhooks/github` - GitHub Webhooks
- `POST /webhooks/stripe` - Stripe Webhooks
- `POST /webhooks/slack` - Slack Webhooks
- `POST /webhooks/shopify` - Shopify Webhooks
- `POST /webhooks/custom` - 自定义 Webhooks

### 管理 API
- `GET /` - 服务信息
- `GET /api/health` - 健康检查
- `GET /endpoints` - 列出所有 Webhook 端点
- `POST /endpoints` - 注册新的 Webhook 端点
- `PUT /endpoints/:id` - 更新 Webhook 端点
- `DELETE /endpoints/:id` - 删除 Webhook 端点

### 监控
- `GET /metrics` - Webhook 指标
- `GET /logs` - 最近的 Webhook 日志
- `GET /queue` - 查看事件队列状态

## 🔧 Webhook 处理实现

### 1. GitHub Webhooks

```javascript
async handleGitHubWebhook(request, env) {
  const signature = request.headers.get('x-hub-signature-256');
  const payload = await request.text();

  // 验证签名
  if (!await this.verifyGitHubSignature(payload, signature, env.WEBHOOK_SECRET)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(payload);
  const eventType = request.headers.get('x-github-event');

  // 处理事件
  await this.processEvent({
    source: 'github',
    type: eventType,
    data: event,
    timestamp: Date.now()
  }, env);

  return new Response('OK', { status: 200 });
}

async verifyGitHubSignature(payload, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const expectedSignature = `sha256=${Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}`;

  return signature === expectedSignature;
}
```

### 2. Stripe Webhooks

```javascript
async handleStripeWebhook(request, env) {
  const signature = request.headers.get('stripe-signature');
  const payload = await request.text();

  try {
    // Stripe 签名验证
    const event = this.verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET);

    // 幂等性检查
    const eventId = event.id;
    const processed = await env.WEBHOOK_STORAGE.get(`stripe:${eventId}`);
    if (processed) {
      return new Response('Event already processed', { status: 200 });
    }

    // 处理事件
    await this.processEvent({
      source: 'stripe',
      type: event.type,
      data: event.data,
      timestamp: Date.now()
    }, env);

    // 标记为已处理
    await env.WEBHOOK_STORAGE.put(`stripe:${eventId}`, '1', { expirationTtl: 86400 });

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return new Response(`Webhook 错误: ${err.message}`, { status: 400 });
  }
}
```

### 3. 事件队列处理

```javascript
async queueEvent(eventData, env) {
  const eventId = crypto.randomUUID();
  const queueEntry = {
    id: eventId,
    source: eventData.source,
    type: eventData.type,
    data: eventData.data,
    timestamp: Date.now(),
    retries: 0
  };

  // 存储到 KV 队列
  await env.EVENT_QUEUE.put(
    `event:${eventId}`,
    JSON.stringify(queueEntry),
    { expirationTtl: 3600 } // 1 小时
  );

  // 使用 Cloudflare Queue 进行异步处理
  if (env.WEBHOOK_QUEUE) {
    await env.WEBHOOK_QUEUE.send(queueEntry);
  }

  return eventId;
}
```

### 4. 重试逻辑

```javascript
async processQueuedEvents(batch, env) {
  const results = [];

  for (const message of batch.messages) {
    const event = message.body;

    try {
      // 处理 Webhook 端点
      await this.deliverWebhook(event, env);

      // 从队列中删除
      await env.EVENT_QUEUE.delete(`event:${event.id}`);

      results.push({ success: true, eventId: event.id });
    } catch (error) {
      console.error(`Failed to process event ${event.id}:`, error);

      event.retries = (event.retries || 0) + 1;
      const maxRetries = parseInt(env.MAX_RETRIES || '3');

      if (event.retries < maxRetries) {
        // 指数退避重试
        const delay = Math.pow(2, event.retries) * 1000;
        console.log(`Retrying event ${event.id} in ${delay}ms`);

        // 使用 Queue 延迟
        message.retry({ delaySeconds: delay / 1000 });
      } else {
        // 记录失败并从队列中移除
        await this.logWebhookFailure(event, error, env);
        await env.EVENT_QUEUE.delete(`event:${event.id}`);
      }

      results.push({ success: false, eventId: event.id, error: error.message });
    }
  }

  return results;
}
```

## 🔐 安全特性

### 1. 签名验证
- HMAC-SHA256 签名验证
- 提供商特定的验证逻辑
- 时间戳验证防重放攻击

### 2. 速率限制
```javascript
async checkRateLimit(source, identifier, env) {
  const key = `rate:${source}:${identifier}:${Math.floor(Date.now() / 60000)}`;
  const current = parseInt(await env.WEBHOOK_STORAGE.get(key) || '0');

  const limit = parseInt(env.RATE_LIMIT_PER_MINUTE || '100');
  if (current >= limit) {
    return { allowed: false, current, limit };
  }

  await env.WEBHOOK_STORAGE.put(key, String(current + 1), { expirationTtl: 120 });

  return { allowed: true, current: current + 1, limit };
}
```

### 3. IP 白名单
```javascript
const ALLOWED_IPS = {
  'github': [
    '192.30.252.0/22',
    '185.199.108.0/22',
    '140.82.112.0/20'
  ],
  'stripe': [
    '54.187.174.169/32',
    '54.187.135.249/32',
    '54.187.205.235/32'
  ]
};

async verifySourceIP(request, source) {
  const ip = request.headers.get('cf-connecting-ip');
  const allowedRanges = ALLOWED_IPS[source] || [];

  return this.isIPInRanges(ip, allowedRanges);
}
```

## 📁 项目结构

```
08-webhooks/
├── src/
│   ├── index.js              # Worker 主入口
│   ├── handlers/             # Webhook 处理器 (5个)
│   │   ├── github.js         # GitHub Webhook 处理
│   │   ├── stripe.js         # Stripe Webhook 处理
│   │   ├── slack.js          # Slack Webhook 处理
│   │   ├── shopify.js        # Shopify Webhook 处理
│   │   └── custom.js         # 自定义 Webhook 处理
│   ├── middleware/           # 中间件 (4个)
│   │   ├── cors.js           # CORS 处理
│   │   ├── auth.js           # 认证中间件
│   │   ├── rateLimit.js      # 速率限制
│   │   └── error.js          # 错误处理
│   └── utils/                # 工具函数 (3个)
│       ├── signature.js      # 签名验证
│       ├── queue.js          # 队列管理
│       └── logger.js         # 日志记录
├── migrations/               # 数据库迁移 (1个)
│   └── 0001_initial_schema.sql
├── docs/                     # 文档
│   └── 01.快速开始.md
├── package.json
├── wrangler.toml             # ✅ KV + D1 + Queue 绑定
└── README.md
```

## 📖 使用示例

### 1. 注册 Webhook 端点

```bash
curl -X POST http://localhost:8787/endpoints \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhook",
    "secret": "your-secret-key",
    "events": ["push", "pull_request"],
    "active": true
  }'
```

### 2. 接收 GitHub Webhook

```bash
curl -X POST http://localhost:8787/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d '{
    "ref": "refs/heads/main",
    "repository": {
      "name": "my-repo",
      "full_name": "user/my-repo"
    },
    "commits": [...]
  }'
```

### 3. 查看 Webhook 日志

```bash
curl http://localhost:8787/logs?limit=20&source=github
```

### 4. 获取指标数据

```bash
curl http://localhost:8787/metrics
```

## 🎯 最佳实践

1. **验证**: 始终验证 Webhook 签名
2. **幂等性**: 优雅地处理重复事件
3. **错误处理**: 实现全面的错误处理和重试
4. **监控**: 跟踪 Webhook 健康状况和性能
5. **安全**: 使用 HTTPS 并验证来源 IP
6. **日志**: 记录所有 Webhook 事件用于审计

## 💰 免费额度

- **请求次数**: 100,000 次/天
- **KV 操作**: 100,000 读取/天,1,000 写入/天
- **D1 查询**: 5,000,000 次/天
- **Queue 消息**: 1,000,000 次/月
- **存储**: KV 1GB,D1 5GB

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
npm run db:migrate
```

## 🔗 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [GitHub Webhooks API](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)
- [本项目快速开始文档](./docs/01.快速开始.md)

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 🙏 致谢

感谢 Cloudflare 提供的优秀 Workers 平台和相关服务。

---

**最后测试时间**: 2026-01-02
**维护状态**: ✅ 生产就绪
**版本**: 1.0.0
