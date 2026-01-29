// 日志中间件
export async function logger(request) {
  const url = new URL(request.url);
  console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`);
}

