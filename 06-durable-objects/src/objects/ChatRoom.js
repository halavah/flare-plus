// ChatRoom Durable Object
export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
    this.messages = [];
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    if (request.method === 'POST') {
      const body = await request.json();
      this.broadcast(body.message);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Chat Room', { status: 200 });
  }

  handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);
    this.sessions.push(server);

    server.accept();
    server.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to chat room'
    }));

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  broadcast(message) {
    const data = JSON.stringify({ type: 'message', message });
    this.sessions.forEach(session => {
      try {
        session.send(data);
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    });
  }

  async webSocketMessage(ws, message) {
    this.broadcast(message);
  }

  async webSocketClose(ws) {
    this.sessions = this.sessions.filter(session => session !== ws);
  }
}

