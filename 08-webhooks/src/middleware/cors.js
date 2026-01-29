// CORS 中间件
export async function cors(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Signature, X-GitHub-Event, X-Slack-Signature',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
}

export function addCorsHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Signature');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

