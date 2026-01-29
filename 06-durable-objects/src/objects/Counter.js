// Counter Durable Object
export class Counter {
  constructor(state, env) {
    this.state = state;
    this.env = env;

    state.blockConcurrencyWhile(async () => {
      this.value = (await state.storage.get('value')) || 0;
    });
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.endsWith('/increment')) {
      this.value++;
      await this.state.storage.put('value', this.value);

      return new Response(JSON.stringify({
        value: this.value
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname.endsWith('/value')) {
      return new Response(JSON.stringify({
        value: this.value
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Counter', { status: 200 });
  }
}

