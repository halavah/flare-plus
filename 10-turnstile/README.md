# Cloudflare Turnstile 验证码 API 项目

## 📋 项目介绍

这是一个生产就绪的 Cloudflare Turnstile 验证码验证和管理 API 项目,提供了完整的验证服务,包括 Token 验证、会话管理、速率限制、统计分析和监控功能。

**打包大小**: 28.87 KiB / gzip: 6.97 KiB

Cloudflare Turnstile 特性:
- ✅ 隐私优先的 CAPTCHA 替代方案
- ✅ 无需用户交互(智能验证)
- ✅ 快速验证(< 1秒)
- ✅ 支持多种模式(托管/隐形/交互式)
- ✅ 免费无限使用

## ✨ 核心功能

### 已实现的 API 端点

#### 1. 系统路由
- `GET /` - 服务信息
- `GET /api/health` - 健康检查(测试数据库连接)
- `GET /api/site-key` - 获取站点密钥(公开)
- `GET /demo` - 前端集成演示页面

#### 2. 验证 API
- `POST /api/verify` - 验证 Turnstile Token(完整验证 + 生成会话)
- `POST /api/verify/check` - 快速检查(仅验证 Token)

#### 3. 会话管理
- `POST /api/session/validate` - 验证会话令牌
- `GET /api/session/:token` - 获取会话信息
- `DELETE /api/session/:token` - 删除会话

#### 4. 统计信息
- `GET /api/stats/overview` - 统计概览(今日 + 最近1小时)
- `GET /api/stats/metrics` - 详细指标(最近N天)
- `GET /api/stats/logs` - 验证日志查询

#### 5. 速率限制管理
- `POST /api/rate-limit/reset/:identifier` - 重置速率限制
- `GET /api/rate-limit/status/:identifier` - 查询速率限制状态

## 🚀 快速开始

### 1. 安装依赖
```bash
cd 10-turnstile
npm install
```

**依赖清单**:
- `itty-router@4.0.25` - 轻量级路由器
- `wrangler@3.22.1` - Cloudflare CLI工具
- `vitest@1.0.4` - 单元测试框架
- `@cloudflare/workers-types@4.20231218.0` - TypeScript 类型定义

### 2. 创建 Turnstile 站点

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 转到 **Turnstile** 部分
3. 点击 **Add Site**
4. 填写站点信息:
   - **Site name**: 你的站点名称
   - **Domain**: 你的域名(或 localhost 用于开发)
   - **Widget Mode**: 选择 Managed(托管)或 Invisible(隐形)
5. 复制 **Site Key** 和 **Secret Key**

### 3. 创建所需资源
```bash
# 创建 KV 命名空间(用于会话)
wrangler kv:namespace create "TURNSTILE_SESSIONS"
wrangler kv:namespace create "TURNSTILE_SESSIONS" --preview

# 创建 D1 数据库(用于分析)
wrangler d1 create "flare-plus-turnstile-db"
```

### 4. 更新 wrangler.toml

```toml
[vars]
TURNSTILE_SITE_KEY = "0x4AAAAAAAAyour-site-key"
TURNSTILE_SECRET_KEY = "0x4AAAAAAAAyour-secret-key"
SESSION_DURATION = "300"      # 5分钟
MAX_ATTEMPTS = "3"            # 最大尝试次数
RATE_LIMIT_WINDOW = "900"     # 15分钟
```

### 5. 初始化数据库
```bash
wrangler d1 migrations apply flare-plus-turnstile-db
```

### 6. 本地开发
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
| 模块类型 | ✅ | 已配置 `"type": "module"` |
| 依赖配置 | ✅ | 已移除不存在的包 |
| 依赖完整性 | ✅ | itty-router@4.0.25 |
| 依赖安装 | ✅ | 136个包成功安装 |
| 语法检查 | ✅ | 12个文件全部通过 |
| 项目结构 | ✅ | 4个API + 3个中间件 + 4个工具 |
| Wrangler配置 | ✅ | KV + D1绑定配置正确 |
| 数据库迁移 | ✅ | 1个迁移文件就绪 |
| 部署验证 | ✅ | dry-run 成功 |
| 打包大小 | ✅ | 28.87 KiB / gzip: 6.97 KiB |

## 📡 Turnstile 集成示例

### 1. 前端集成(HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Turnstile 示例</title>
  <!-- 引入 Turnstile 脚本 -->
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
  <form id="myForm">
    <!-- Turnstile Widget -->
    <div class="cf-turnstile"
         data-sitekey="0x4AAAAAAAAyour-site-key"
         data-callback="onTurnstileSuccess"
         data-error-callback="onTurnstileError"
         data-theme="light"
         data-size="normal">
    </div>

    <button type="submit">提交</button>
  </form>

  <script>
    function onTurnstileSuccess(token) {
      console.log('Turnstile token:', token);

      // 发送 token 到后端验证
      fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('验证成功！会话:', data.sessionToken);
          // 继续业务逻辑
        } else {
          console.error('验证失败:', data.error);
        }
      });
    }

    function onTurnstileError() {
      console.error('Turnstile 验证失败');
      alert('验证失败,请刷新页面重试');
    }

    document.getElementById('myForm').addEventListener('submit', function(e) {
      e.preventDefault();
      // 表单提交逻辑
    });
  </script>
</body>
</html>
```

### 2. 后端验证

```javascript
// API 验证端点
async handleVerify(request, env) {
  const { token, action = 'verify' } = await request.json();

  if (!token) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing token'
    }), { status: 400 });
  }

  // 验证 Turnstile token
  const verification = await this.verifyTurnstileToken(token, env, {
    remoteip: request.headers.get('CF-Connecting-IP'),
    action
  });

  if (!verification.success) {
    // 记录失败
    await this.logVerification(token, false, verification['error-codes'], request, env);

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid verification token',
      errorCodes: verification['error-codes']
    }), { status: 400 });
  }

  // 生成会话令牌
  const sessionToken = await this.generateSessionToken(verification, env);

  // 记录成功
  await this.logVerification(token, true, null, request, env);

  return new Response(JSON.stringify({
    success: true,
    sessionToken,
    verification: {
      action: verification.action,
      timestamp: verification.challenge_ts,
      hostname: verification.hostname
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 调用 Cloudflare API 验证
async verifyTurnstileToken(token, env, options = {}) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: options.remoteip || '',
      idempotency_key: crypto.randomUUID()
    })
  });

  return await response.json();
}
```

### 3. 会话管理

```javascript
// 生成会话令牌
async generateSessionToken(verification, env) {
  const sessionToken = crypto.randomUUID();
  const sessionData = {
    token: sessionToken,
    verified: true,
    action: verification.action,
    timestamp: Date.now(),
    expiresAt: Date.now() + (parseInt(env.SESSION_DURATION) * 1000),
    hostname: verification.hostname
  };

  // 存储到 KV(自动过期)
  await env.TURNSTILE_SESSIONS.put(
    `session:${sessionToken}`,
    JSON.stringify(sessionData),
    { expirationTtl: parseInt(env.SESSION_DURATION) }
  );

  return sessionToken;
}

// 验证会话令牌
async validateSessionToken(sessionToken, env) {
  const sessionData = await env.TURNSTILE_SESSIONS.get(`session:${sessionToken}`);

  if (!sessionData) {
    return { valid: false, reason: 'Session not found or expired' };
  }

  const session = JSON.parse(sessionData);

  if (Date.now() > session.expiresAt) {
    await env.TURNSTILE_SESSIONS.delete(`session:${sessionToken}`);
    return { valid: false, reason: 'Session expired' };
  }

  return { valid: true, session };
}
```

### 4. 速率限制

```javascript
async checkRateLimit(identifier, env) {
  const now = Date.now();
  const window = parseInt(env.RATE_LIMIT_WINDOW) * 1000;
  const windowStart = Math.floor(now / window) * window;

  const rateLimitKey = `rate_limit:${identifier}`;

  // 查询当前窗口的尝试次数
  const existing = await env.TURNSTILE_DB.prepare(`
    SELECT attempts, window_start FROM rate_limits WHERE id = ?
  `).bind(rateLimitKey).first();

  const maxAttempts = parseInt(env.MAX_ATTEMPTS);

  if (existing) {
    if (existing.window_start === windowStart) {
      if (existing.attempts >= maxAttempts) {
        return { allowed: false, attempts: existing.attempts, limit: maxAttempts };
      }
    }
  }

  // 更新尝试次数
  await env.TURNSTILE_DB.prepare(`
    INSERT INTO rate_limits (id, identifier, attempts, window_start)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(id) DO UPDATE SET
      attempts = CASE
        WHEN window_start = ? THEN attempts + 1
        ELSE 1
      END,
      window_start = ?
  `).bind(rateLimitKey, identifier, windowStart, windowStart, windowStart).run();

  const updated = await env.TURNSTILE_DB.prepare(`
    SELECT attempts FROM rate_limits WHERE id = ?
  `).bind(rateLimitKey).first();

  return {
    allowed: updated.attempts <= maxAttempts,
    attempts: updated.attempts,
    limit: maxAttempts
  };
}
```

## 📁 项目结构

```
10-turnstile/
├── src/
│   ├── index.js              # Worker 主入口 (ES Module)
│   ├── api/                  # API 模块 (4个)
│   │   ├── verify.js         # Token 验证 + 会话生成
│   │   ├── session.js        # 会话管理
│   │   ├── stats.js          # 统计信息
│   │   └── rate-limit.js     # 速率限制
│   ├── middleware/           # 中间件 (3个)
│   │   ├── cors.js           # CORS 处理
│   │   ├── error.js          # 错误处理
│   │   └── logger.js         # 日志记录
│   └── utils/                # 工具函数 (4个)
│       ├── helpers.js        # 辅助函数
│       ├── analytics.js      # 分析跟踪
│       ├── session.js        # 会话工具
│       └── rate-limit.js     # 限流工具
├── migrations/               # 数据库迁移 (1个)
│   └── 0001_initial_schema.sql
├── docs/                     # 文档
│   └── 01.快速开始.md
├── package.json              # ✅ 已配置 "type": "module"
├── wrangler.toml             # ✅ KV + D1绑定配置
└── README.md
```

## 📖 使用示例

### 1. 验证 Turnstile Token

```bash
curl -X POST http://localhost:8787/api/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "0.XXX...your_turnstile_token"}'
```

### 2. 验证会话令牌

```bash
curl -X POST http://localhost:8787/api/session/validate \
  -H "Content-Type: application/json" \
  -d '{"sessionToken": "your-session-token"}'
```

### 3. 查看统计信息

```bash
# 概览统计
curl http://localhost:8787/api/stats/overview

# 详细指标
curl "http://localhost:8787/api/stats/metrics?days=7"

# 验证日志
curl "http://localhost:8787/api/stats/logs?limit=100&success=true"
```

### 4. 速率限制管理

```bash
# 查询状态
curl http://localhost:8787/api/rate-limit/status/user123

# 重置限制
curl -X POST http://localhost:8787/api/rate-limit/reset/user123
```

## 🎯 Widget 配置选项

### 托管模式(Managed)
```html
<div class="cf-turnstile"
     data-sitekey="YOUR_SITE_KEY"
     data-callback="onSuccess"
     data-error-callback="onError"
     data-size="normal"               <!-- normal / compact -->
     data-theme="light"               <!-- light / dark / auto -->
     data-language="zh-CN"
     data-action="login"              <!-- 自定义动作标识 -->
     data-cdata="session_123">        <!-- 自定义数据 -->
</div>
```

### 隐形模式(Invisible)
```html
<div class="cf-turnstile"
     data-sitekey="YOUR_SITE_KEY"
     data-callback="onSuccess"
     data-size="invisible"
     data-execution="execute">        <!-- execute / render -->
</div>

<script>
// 程序化执行
turnstile.execute('#container');
</script>
```

## 🔐 安全特性

1. **Token 验证**: 所有 Token 必须通过 Cloudflare API 验证
2. **会话管理**: 使用 KV 存储,自动过期
3. **速率限制**: 防止暴力破解(默认 3次/15分钟)
4. **隐私优先**: 不收集用户个人信息
5. **统计分析**: 完整的验证日志和统计
6. **监控**: 实时健康检查和指标

## 💰 免费额度

- **验证次数**: ✅ 无限制(完全免费)
- **KV 操作**: 100,000 读取/天,1,000 写入/天
- **D1 查询**: 5,000,000 次/天
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
```

## 📝 配置注意事项

### 1. package.json 配置

**必须配置** `"type": "module"`:

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
[[kv_namespaces]]
binding = "TURNSTILE_SESSIONS"
id = "your-kv-id"
preview_id = "your-preview-kv-id"

[[d1_databases]]
binding = "TURNSTILE_DB"
database_name = "flare-plus-turnstile-db"
database_id = "your-database-id"

[vars]
TURNSTILE_SITE_KEY = "0x4AAAAAAAAsite-key"
TURNSTILE_SECRET_KEY = "0x4AAAAAAAAsecret-key"
SESSION_DURATION = "300"
MAX_ATTEMPTS = "3"
RATE_LIMIT_WINDOW = "900"
```

## 💡 使用场景

1. **表单保护** - 登录、注册、联系表单
2. **API 保护** - 防止机器人滥用 API
3. **支付保护** - 防止欺诈性交易
4. **投票系统** - 防止刷票
5. **评论系统** - 防止垃圾评论
6. **下载限制** - 防止批量下载

## 🔗 相关资源

- [Cloudflare Turnstile 文档](https://developers.cloudflare.com/turnstile/)
- [Widget 配置](https://developers.cloudflare.com/turnstile/reference/widget-configuration/)
- [服务端验证](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [本项目快速开始文档](./docs/01.快速开始.md)

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 🙏 致谢

感谢 Cloudflare 提供的优秀 Turnstile 服务和 Workers 平台。

---

**最后测试时间**: 2026-01-02
**维护状态**: ✅ 生产就绪
**版本**: 1.0.0
