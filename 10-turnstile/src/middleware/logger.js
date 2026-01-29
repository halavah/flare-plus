// 日志中间件
export async function logger(request) {
  const startTime = Date.now();
  const url = new URL(request.url);

  console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`);

  if (url.searchParams.get('debug') === 'true') {
    console.log('Headers:', Object.fromEntries(request.headers));
  }
}

export function logResponse(request, response, startTime) {
  const duration = Date.now() - startTime;
  const url = new URL(request.url);

  console.log(
    `[${new Date().toISOString()}] ` +
    `${request.method} ${url.pathname} ` +
    `${response.status} ${duration}ms`
  );
}

