# Cloudflare Durable Objects - 持久化对象状态管理

## 📋 项目介绍

这是一个生产就绪的 Cloudflare Durable Objects 项目,展示了如何使用 Durable Objects 实现强一致性、低延迟的协调和状态管理功能,支持 WebSocket 实时通信。

**打包大小**: 22.64 KiB / gzip: 4.58 KiB

Cloudflare Durable Objects 提供:
- ✅ 强一致性保证
- ✅ 全球低延迟访问
- ✅ 实时协作功能
- ✅ 持久化状态存储
- ✅ WebSocket 支持

## 🚀 快速开始

### 1. 安装依赖
```bash
cd 06-durable-objects
npm install
```

**依赖清单**:
- `itty-router@4.0.23` - 轻量级路由器
- `wrangler@3.22.1` - Cloudflare CLI工具
- `vitest@1.0.4` - 单元测试框架

### 2. 本地开发
```bash
# 启动本地开发服务器
npm run dev

# 部署到生产环境
npm run deploy

# 查看实时日志
npm run tail
```

## 💡 Durable Object 类

本项目包含三个示例 Durable Object 类:

### 1. ChatRoom(聊天室)
支持 WebSocket 的实时聊天室:
- 多用户实时聊天
- 消息历史记录(持久化)
- 用户在线状态
- 房间管理
- 广播机制

### 2. Counter(计数器)
分布式计数器与协调:
- 原子递增操作
- 速率限制
- 分析跟踪
- 排行榜管理
- 并发控制

### 3. GameState(游戏状态)
实时游戏状态同步:
- 玩家位置同步
- 游戏事件广播
- 分数跟踪
- 比赛管理
- WebSocket 双向通信

## 📡 API 端点

### 聊天室操作
- `POST /chat/create` - 创建新聊天室
- `GET /chat/:id/ws` - WebSocket 连接到聊天室
- `POST /chat/:id/message` - 发送消息到聊天室
- `GET /chat/:id/history` - 获取消息历史
- `DELETE /chat/:id` - 删除聊天室

### 计数器操作
- `POST /counter/create/:name` - 创建新计数器
- `POST /counter/:name/increment` - 递增计数器
- `GET /counter/:name/value` - 获取当前值
- `POST /counter/:name/reset` - 重置计数器
- `DELETE /counter/:name` - 删除计数器

### 游戏状态操作
- `POST /game/create` - 创建新游戏实例
- `GET /game/:id/ws` - WebSocket 连接游戏
- `POST /game/:id/action` - 发送游戏动作
- `GET /game/:id/state` - 获取当前游戏状态
- `DELETE /game/:id` - 删除游戏实例

## 🔧 Durable Object 实现示例

### 基础 Durable Object
```javascript
export class MyDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.storage = state.storage;

    // 初始化持久化状态
    state.blockConcurrencyWhile(async () => {
      this.count = (await this.storage.get('count')) || 0;
      this.users = (await this.storage.get('users')) || [];
    });
  }

  // 处理传入的请求
  async fetch(request) {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/increment':
        return this.handleIncrement(request);
      case '/value':
        return this.handleGetValue(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  // WebSocket 处理器
  async webSocket(client) {
    // 接受 WebSocket 连接
    this.state.acceptWebSocket(client);

    // 广播欢迎消息
    this.broadcast({
      type: 'welcome',
      count: this.count
    });
  }

  // 持久化存储操作
  async handleIncrement(request) {
    this.count++;
    await this.storage.put('count', this.count);

    // 广播给所有连接的客户端
    this.broadcast({
      type: 'increment',
      count: this.count
    });

    return new Response(JSON.stringify({ count: this.count }));
  }

  // 广播给所有 WebSocket 连接
  broadcast(message) {
    const data = JSON.stringify(message);
    this.state.getWebSockets().forEach(ws => {
      ws.send(data);
    });
  }
}
```

### 高级特性

#### 1. 告警(Alarms)
```javascript
export class ScheduledObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;

    // 设置定期告警
    state.storage.setAlarm(Date.now() + 60000); // 1分钟后
  }

  // 处理告警事件
  async alarm() {
    // 执行定期任务
    await this.cleanup();
    await this.aggregateStats();

    // 安排下一次告警
    await this.state.storage.setAlarm(Date.now() + 60000);
  }
}
```

#### 2. 类 SQL 存储
```javascript
// 存储结构化数据
async saveUserProfile(userId, profile) {
  await this.storage.put(`profile:${userId}`, {
    id: userId,
    name: profile.name,
    email: profile.email,
    preferences: profile.preferences,
    updatedAt: Date.now()
  });
}

// 使用前缀查询
async getAllProfiles() {
  const results = [];
  const list = await this.storage.list({ prefix: 'profile:' });

  for (const [key, value] of list) {
    results.push(value);
  }

  return results;
}
```

#### 3. WebSocket 广播
```javascript
// 群发消息
broadcast(message, exclude = null) {
  const data = JSON.stringify(message);

  this.state.getWebSockets().forEach(ws => {
    if (ws !== exclude) {
      try {
        ws.send(data);
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  });
}

// 处理 WebSocket 消息
async webSocketMessage(ws, message) {
  const data = JSON.parse(message);

  switch (data.type) {
    case 'chat':
      await this.handleChatMessage(ws, data);
      break;
    case 'action':
      await this.handleGameAction(ws, data);
      break;
  }
}

// WebSocket 关闭处理
async webSocketClose(ws, code, reason, wasClean) {
  // 清理用户状态
  await this.handleUserDisconnect(ws);
}
```

## ✅ 自动化测试验证

**测试日期**: 2026-01-02
**测试状态**: ✅ 全部通过

| 测试项 | 状态 | 说明 |
|--------|------|------|
| 依赖安装 | ✅ | 136个包成功安装 |
| 语法检查 | ✅ | 9个文件全部通过 |
| 项目结构 | ✅ | 3个DO类 + 3个中间件 |
| Wrangler配置 | ✅ | DO绑定配置正确 |
| 部署验证 | ✅ | dry-run 成功 |
| 打包大小 | ✅ | 22.64 KiB / gzip: 4.58 KiB |

## 📁 项目结构

```
06-durable-objects/
├── src/
│   ├── index.js              # Worker 主入口
│   ├── objects/              # Durable Object 类 (3个)
│   │   ├── ChatRoom.js       # 聊天室对象
│   │   ├── Counter.js        # 计数器对象
│   │   └── GameState.js      # 游戏状态对象
│   ├── middleware/           # 中间件 (3个)
│   │   ├── cors.js           # CORS 处理
│   │   ├── error.js          # 错误处理
│   │   └── logger.js         # 日志记录
│   └── utils/                # 工具函数
│       └── helpers.js        # 辅助函数
├── examples/                 # 前端示例 (2个)
│   ├── chat-frontend.html    # 聊天室前端示例
│   └── game-frontend.html    # 游戏前端示例
├── docs/                     # 文档
│   └── 01.快速开始.md
├── package.json
├── wrangler.toml             # ✅ 3个DO类绑定配置
└── README.md
```

## 📖 使用示例

### 1. 创建聊天室

```bash
curl -X POST http://localhost:8787/chat/create \
  -H "Content-Type: application/json" \
  -d '{"name": "开发讨论室", "description": "技术讨论"}'
```

### 2. 连接 WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8787/chat/room-id/ws');

ws.onopen = () => {
  console.log('Connected!');
  ws.send(JSON.stringify({
    type: 'message',
    content: '你好,世界!',
    username: '张三'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### 3. 递增计数器

```bash
# 创建计数器
curl -X POST http://localhost:8787/counter/create/page-views

# 递增
curl -X POST http://localhost:8787/counter/page-views/increment

# 获取值
curl http://localhost:8787/counter/page-views/value
```

### 4. 游戏动作

```bash
curl -X POST http://localhost:8787/game/game-123/action \
  -H "Content-Type: application/json" \
  -d '{
    "type": "move",
    "playerId": "player-1",
    "position": {"x": 100, "y": 200}
  }'
```

## 🎯 最佳实践

1. **状态设计**: 保持状态最小化和高效
2. **并发控制**: 使用 `blockConcurrencyWhile` 进行初始化
3. **存储**: 使用有意义的键模式(如 `user:123`, `session:abc`)
4. **WebSocket**: 实现适当的连接清理和错误处理
5. **告警**: 用于定期维护任务(清理、统计)
6. **性能**: 避免在单个对象中存储大量数据

## 📚 使用场景

### 1. 实时协作
- 文档编辑(多人协同)
- 白板(实时绘图)
- 代码协作(Live Share)

### 2. 游戏
- 多人在线游戏
- 实时匹配系统
- 排行榜管理

### 3. 聊天与通信
- 实时群聊
- 视频会议房间
- 实时通知推送

### 4. 协调服务
- 分布式锁
- Leader 选举
- 速率限制器
- 任务队列

## ⚠️ 限制

- **内存**: 每个对象 128MB
- **存储**: 128MB 持久化存储
- **CPU**: 每个请求最多 50ms CPU 时间
- **连接**: 每个对象最多 1000 个 WebSocket 连接
- **告警**: 每个对象最多 1 个活动告警

## 💰 免费额度

- **请求次数**: 1,000,000 次/月
- **持续时间**: 400,000 GB-秒/月
- **WebSocket 消息**: 包含在请求次数中
- **存储**: 1 GB(所有对象共享)

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

## 🔗 相关资源

- [Cloudflare Durable Objects 文档](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)
- [Durable Objects 教程](https://developers.cloudflare.com/workers/learning/using-durable-objects/)
- [WebSocket API](https://developers.cloudflare.com/workers/runtime-apis/websockets/)
- [本项目快速开始文档](./docs/01.快速开始.md)
- [前端集成示例](./examples/)

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 🙏 致谢

感谢 Cloudflare 提供的优秀 Durable Objects 服务和 Workers 平台。

---

**最后测试时间**: 2026-01-02
**维护状态**: ✅ 生产就绪
**版本**: 1.0.0
