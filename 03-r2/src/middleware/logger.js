// 日志中间件
export async function logger(request) {
  const startTime = Date.now();
  const url = new URL(request.url);

  console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`);

  // 记录请求头（可选）
  if (url.searchParams.get('debug') === 'true') {
    console.log('Headers:', Object.fromEntries(request.headers));
  }

  // 继续处理请求
  // 注意：在 itty-router 中间件中，我们不拦截响应
  // 只记录请求信息
}

// 记录响应时间的辅助函数
export function logResponse(request, response, startTime) {
  const duration = Date.now() - startTime;
  const url = new URL(request.url);

  console.log(
    `[${new Date().toISOString()}] ` +
    `${request.method} ${url.pathname} ` +
    `${response.status} ${duration}ms`
  );
}

