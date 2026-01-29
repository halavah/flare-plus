// 游戏状态管理 API
import { validateGameId } from '../utils/validation.js';
import { ValidationError } from '../middleware/error.js';

export const handleGame = {
  // 创建游戏
  async create(request, env) {
    try {
      const body = await request.json();
      const { gameId, players } = body;

      if (!gameId) {
        throw new ValidationError('Game ID is required');
      }

      if (!validateGameId(gameId)) {
        throw new ValidationError('Invalid game ID');
      }

      if (!players || !Array.isArray(players) || players.length === 0) {
        throw new ValidationError('Players array is required');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Game created',
        gameId,
        players: players.length,
        wsUrl: `/game/${gameId}/ws`
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 开始游戏
  async start(request, env, gameId) {
    try {
      if (!validateGameId(gameId)) {
        throw new ValidationError('Invalid game ID');
      }

      const id = env.GAME_STATE.idFromName(gameId);
      const stub = env.GAME_STATE.get(id);

      return stub.fetch(request);
    } catch (error) {
      throw error;
    }
  },

  // 游戏动作
  async action(request, env, gameId) {
    try {
      if (!validateGameId(gameId)) {
        throw new ValidationError('Invalid game ID');
      }

      const id = env.GAME_STATE.idFromName(gameId);
      const stub = env.GAME_STATE.get(id);

      return stub.fetch(request);
    } catch (error) {
      throw error;
    }
  },

  // 获取游戏状态
  async getState(request, env, gameId) {
    try {
      if (!validateGameId(gameId)) {
        throw new ValidationError('Invalid game ID');
      }

      const id = env.GAME_STATE.idFromName(gameId);
      const stub = env.GAME_STATE.get(id);

      return stub.fetch(request);
    } catch (error) {
      throw error;
    }
  },

  // 重置游戏
  async reset(request, env, gameId) {
    try {
      if (!validateGameId(gameId)) {
        throw new ValidationError('Invalid game ID');
      }

      const id = env.GAME_STATE.idFromName(gameId);
      const stub = env.GAME_STATE.get(id);

      return stub.fetch(new Request(request.url + '/reset', {
        method: 'POST'
      }));
    } catch (error) {
      throw error;
    }
  },

  // WebSocket 连接
  async connect(request, env, gameId) {
    try {
      if (!validateGameId(gameId)) {
        throw new ValidationError('Invalid game ID');
      }

      const id = env.GAME_STATE.idFromName(gameId);
      const stub = env.GAME_STATE.get(id);

      return stub.fetch(request);
    } catch (error) {
      throw error;
    }
  }
};

