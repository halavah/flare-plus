/**
 * CORS (跨域资源共享) 中间件
 */

/**
 * CORS 中间件 - 处理跨域请求
 * @param {Request} request - 请求对象
 * @returns {Response|null} 如果是 OPTIONS 请求则返回响应，否则返回 null
 */
export async function corsMiddleware(request) {
  // 获取请求来源
  const origin = request.headers.get('Origin');

  // 定义允许的源（生产环境中应该从环境变量读取）
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8787',
    'https://halavah.us',
    'https://*.halavah.us',
    '*'
  ];

  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(origin, allowedOrigins),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRFToken',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24小时
    'Vary': 'Origin'
  };

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    // 处理预检请求中的特定头
    const requestedHeaders = request.headers.get('Access-Control-Request-Headers');
    const requestedMethod = request.headers.get('Access-Control-Request-Method');

    // 验证请求的方法
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
    if (requestedMethod && !allowedMethods.includes(requestedMethod)) {
      return new Response(null, {
        status: 405,
        headers: {
          ...corsHeaders,
          'Allow': allowedMethods.join(', ')
        }
      });
    }

    // 验证请求的头
    if (requestedHeaders) {
      const headers = requestedHeaders.split(',').map(h => h.trim().toLowerCase());
      const allowedHeaders = ['content-type', 'authorization', 'x-requested-with', 'x-csrftoken'];

      for (const header of headers) {
        if (!allowedHeaders.includes(header)) {
          return new Response(null, {
            status: 400,
            headers: corsHeaders
          });
        }
      }
    }

    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // 如果不是预检请求，返回 null 让请求继续
  return null;
}

/**
 * 获取允许的源
 * @param {string} origin - 请求来源
 * @param {string[]} allowedOrigins - 允许的源列表
 * @returns {string} 允许的源
 */
function getAllowedOrigin(origin, allowedOrigins) {
  // 如果没有 origin（如同源请求），返回 '*'
  if (!origin) {
    return '*';
  }

  // 检查是否在允许列表中
  for (const allowedOrigin of allowedOrigins) {
    if (allowedOrigin === '*') {
      return '*';
    }

    // 支持通配符
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return origin; // 返回实际源，而不是通配符
      }
    }

    if (allowedOrigin === origin) {
      return origin;
    }
  }

  // 如果不在允许列表中，返回第一个允许的源或拒绝
  // 生产环境中可能需要返回 null 来拒绝跨域
  return allowedOrigins[0];
}

/**
 * 添加 CORS 头到响应
 * @param {Response} response - 响应对象
 * @param {string} origin - 请求来源
 * @returns {Response} 添加了 CORS 头的响应
 */
export function addCorsHeaders(response, origin = null) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8787',
    'https://halavah.us',
    'https://*.halavah.us'
  ];

  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', getAllowedOrigin(origin, allowedOrigins));
  newHeaders.set('Access-Control-Allow-Credentials', 'true');
  newHeaders.set('Vary', 'Origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}