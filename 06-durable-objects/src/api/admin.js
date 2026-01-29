// 管理 API
export const handleAdmin = {
  // 获取所有活跃对象统计
  async getStats(request, env) {
    try {
      // 注意：Durable Objects 没有直接的方式列出所有实例
      // 这里返回概览信息
      return new Response(JSON.stringify({
        success: true,
        stats: {
          message: 'Durable Objects are stateful and created on demand',
          availableTypes: ['ChatRoom', 'Counter', 'GameState']
        }
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
  },

  // 健康检查
  async health(request, env) {
    return new Response(JSON.stringify({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

