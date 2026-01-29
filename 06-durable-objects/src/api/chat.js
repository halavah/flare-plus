// 聊天室管理 API
import { validateRoomId, validateMessage, validateUsername } from '../utils/validation.js';
import { ValidationError } from '../middleware/error.js';

export const handleChat = {
  // 创建聊天室
  async create(request, env) {
    try {
      const body = await request.json();
      const { roomId, name } = body;

      if (!validateRoomId(roomId)) {
        throw new ValidationError('Invalid room ID');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Chat room created',
        roomId,
        name: name || `Room ${roomId}`,
        wsUrl: `/chat/${roomId}/ws`
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      throw error;
    }
  },

  // 发送消息到聊天室
  async sendMessage(request, env, roomId) {
    try {
      const body = await request.json();
      const { message, username } = body;

      if (!validateRoomId(roomId)) {
        throw new ValidationError('Invalid room ID');
      }

      if (!validateMessage(message)) {
        throw new ValidationError('Invalid message');
      }

      if (!validateUsername(username)) {
        throw new ValidationError('Invalid username');
      }

      // 获取 Durable Object
      const id = env.CHAT_ROOM.idFromName(roomId);
      const stub = env.CHAT_ROOM.get(id);

      // 转发请求到 Durable Object
      return stub.fetch(request);
    } catch (error) {
      throw error;
    }
  },

  // 获取聊天室历史
  async getHistory(request, env, roomId) {
    try {
      if (!validateRoomId(roomId)) {
        throw new ValidationError('Invalid room ID');
      }

      const id = env.CHAT_ROOM.idFromName(roomId);
      const stub = env.CHAT_ROOM.get(id);

      return stub.fetch(request);
    } catch (error) {
      throw error;
    }
  },

  // WebSocket 连接
  async connect(request, env, roomId) {
    try {
      if (!validateRoomId(roomId)) {
        throw new ValidationError('Invalid room ID');
      }

      const id = env.CHAT_ROOM.idFromName(roomId);
      const stub = env.CHAT_ROOM.get(id);

      return stub.fetch(request);
    } catch (error) {
      throw error;
    }
  }
};

