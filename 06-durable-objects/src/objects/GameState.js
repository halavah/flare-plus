// GameState Durable Object - 游戏状态管理
export class GameState {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.players = new Map();

    // 初始化游戏状态
    state.blockConcurrencyWhile(async () => {
      this.gameData = (await state.storage.get('gameData')) || {
        started: false,
        players: [],
        scores: {},
        currentRound: 0,
        startTime: null
      };
    });
  }

  async fetch(request) {
    const url = new URL(request.url);

    // WebSocket 连接处理
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // HTTP API 处理
    if (url.pathname.endsWith('/start')) {
      return this.handleStartGame(request);
    }

    if (url.pathname.endsWith('/action')) {
      return this.handleGameAction(request);
    }

    if (url.pathname.endsWith('/state')) {
      return this.handleGetState(request);
    }

    if (url.pathname.endsWith('/reset')) {
      return this.handleReset(request);
    }

    return new Response('Game State', { status: 200 });
  }

  // WebSocket 连接处理
  handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);

    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, server);

    server.accept();
    server.send(JSON.stringify({
      type: 'connected',
      sessionId,
      gameState: this.gameData
    }));

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  // 开始游戏
  async handleStartGame(request) {
    try {
      const body = await request.json();
      const { playerIds } = body;

      if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid player IDs'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      this.gameData = {
        started: true,
        players: playerIds,
        scores: playerIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
        currentRound: 1,
        startTime: Date.now()
      };

      await this.state.storage.put('gameData', this.gameData);

      this.broadcast({
        type: 'game_started',
        gameState: this.gameData
      });

      return new Response(JSON.stringify({
        success: true,
        gameState: this.gameData
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 处理游戏动作
  async handleGameAction(request) {
    try {
      const body = await request.json();
      const { playerId, action, data } = body;

      if (!this.gameData.started) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Game not started'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 更新分数（示例逻辑）
      if (action === 'score') {
        this.gameData.scores[playerId] = (this.gameData.scores[playerId] || 0) + (data.points || 1);
        await this.state.storage.put('gameData', this.gameData);

        this.broadcast({
          type: 'score_update',
          playerId,
          scores: this.gameData.scores
        });
      }

      return new Response(JSON.stringify({
        success: true,
        gameState: this.gameData
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 获取游戏状态
  async handleGetState(request) {
    return new Response(JSON.stringify({
      success: true,
      gameState: this.gameData,
      activePlayers: this.sessions.size
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 重置游戏
  async handleReset(request) {
    this.gameData = {
      started: false,
      players: [],
      scores: {},
      currentRound: 0,
      startTime: null
    };

    await this.state.storage.put('gameData', this.gameData);

    this.broadcast({
      type: 'game_reset'
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Game reset'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 广播消息
  broadcast(message) {
    const data = JSON.stringify(message);

    for (const [sessionId, ws] of this.sessions) {
      try {
        ws.send(data);
      } catch (error) {
        console.error(`Failed to send to session ${sessionId}:`, error);
        this.sessions.delete(sessionId);
      }
    }
  }

  // WebSocket 消息处理
  async webSocketMessage(ws, message) {
    try {
      const data = JSON.parse(message);

      if (data.type === 'player_action') {
        await this.handleGameAction(new Request('http://localhost', {
          method: 'POST',
          body: JSON.stringify(data)
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  }

  // WebSocket 关闭处理
  async webSocketClose(ws) {
    for (const [sessionId, socket] of this.sessions) {
      if (socket === ws) {
        this.sessions.delete(sessionId);
        console.log(`Session ${sessionId} disconnected`);
        break;
      }
    }
  }
}

