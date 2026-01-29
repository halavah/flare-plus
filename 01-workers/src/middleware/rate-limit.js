/**
 * 限流中间件
 */

/**
 * 限流中间件 - 基于 IP 和用户的请求频率限制
 * @param {Request} request - 请求对象
 * @param {Env} env - 环境变量
 * @returns {Response|null} 超限返回错误响应，正常返回 null
 */
export async function rateLimitMiddleware(request, env) {
  try {
    // 获取客户端标识
    const identifier = await getClientIdentifier(request, env);

    // 获取限流配置
    const config = getRateLimitConfig(request.url, request.method);

    // 生成限流键
    const key = `rate_limit:${config.type}:${identifier}:${config.window}`;

    // 获取当前计数
    const current = await env.RATE_LIMIT_KV?.get(key);

    let count = current ? parseInt(current) : 0;

    // 检查是否超过限制
    if (count >= config.limit) {
      const ttl = await env.RATE_LIMIT_KV?.get(key + ':ttl');
      const resetTime = ttl ? new Date(parseInt(ttl) * 1000).toISOString() : null;

      return new Response(JSON.stringify({
        error: 'Too Many Requests',
        message: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000),
        limit: config.limit,
        window: config.window,
        current: count
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime || new Date(Date.now() + config.window * 1000).toISOString(),
          'Retry-After': Math.ceil(config.window).toString()
        }
      });
    }

    // 增加计数
    count++;
    const expirationTtl = config.window;

    // 存储新计数
    await env.RATE_LIMIT_KV?.put(key, count.toString(), { expirationTtl });

    // 存储 TTL 信息
    const resetTime = Math.floor((Date.now() + config.window * 1000) / 1000);
    await env.RATE_LIMIT_KV?.put(key + ':ttl', resetTime.toString(), { expirationTtl });

    // 添加限流头到请求（供后续中间件使用）
    request.rateLimit = {
      limit: config.limit,
      remaining: config.limit - count,
      reset: resetTime,
      window: config.window
    };

    return null;

  } catch (error) {
    console.error('Rate limit middleware error:', error);
    // 如果限流系统出错，允许请求通过
    return null;
  }
}

/**
 * 获取客户端标识
 * @param {Request} request - 请求对象
 * @param {Env} env - 环境变量
 * @returns {Promise<string>} 客户端标识
 */
async function getClientIdentifier(request, env) {
  // 优先使用用户 ID（如果已认证）
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyToken(token, env);
      if (payload && payload.sub) {
        return `user:${payload.sub}`;
      }
    } catch (error) {
      // Token 无效，继续使用 IP
    }
  }

  // 使用 IP 地址
  const ip = getClientIP(request);
  return `ip:${ip}`;
}

/**
 * 获取客户端 IP
 * @param {Request} request - 请求对象
 * @returns {string} IP 地址
 */
function getClientIP(request) {
  const ipHeaders = [
    'CF-Connecting-IP',
    'X-Forwarded-For',
    'X-Real-IP',
    'X-Client-IP'
  ];

  for (const header of ipHeaders) {
    const value = request.headers.get(header);
    if (value) {
      return value.split(',')[0].trim();
    }
  }

  return '127.0.0.1';
}

/**
 * 获取限流配置
 * @param {string} url - 请求 URL
 * @param {string} method - 请求方法
 * @returns {Object} 限流配置
 */
function getRateLimitConfig(url, method) {
  const pathname = new URL(url).pathname;

  // 认证相关 API - 更严格的限制
  if (pathname.startsWith('/api/auth/')) {
    return {
      type: 'auth',
      limit: 5, // 每分钟 5 次
      window: 60 // 60秒
    };
  }

  // POST/PUT/DELETE 请求 - 中等限制
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return {
      type: 'write',
      limit: 30, // 每分钟 30 次
      window: 60
    };
  }

  // GET 请求 - 宽松限制
  if (pathname.startsWith('/api/')) {
    return {
      type: 'read',
      limit: 100, // 每分钟 100 次
      window: 60
    };
  }

  // 默认限制
  return {
    type: 'default',
    limit: 60, // 每分钟 60 次
    window: 60
  };
}

/**
 * 简化的 Token 验证函数
 * @param {string} token - JWT Token
 * @param {Env} env - 环境变量
 * @returns {Object|null} 解析后的 payload
 */
async function verifyToken(token, env) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));

    // 验证过期时间
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * 高级限流中间件 - 滑动窗口实现
 * @param {number} limit - 限制次数
 * @param {number} window - 时间窗口（秒）
 * @returns {Function} 中间件函数
 */
export function slidingWindowRateLimit(limit, window) {
  return async (request, env) => {
    const identifier = await getClientIdentifier(request, env);
    const now = Date.now();
    const windowStart = now - (window * 1000);

    // 获取当前窗口内的请求记录
    const key = `sliding_window:${identifier}`;
    const records = await env.RATE_LIMIT_KV?.get(key);

    let requests = [];
    if (records) {
      requests = JSON.parse(records);
      // 清理过期的记录
      requests = requests.filter(timestamp => timestamp > windowStart);
    }

    // 检查是否超过限制
    if (requests.length >= limit) {
      return new Response(JSON.stringify({
        error: 'Too Many Requests',
        message: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: limit,
        window: window
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 添加当前请求
    requests.push(now);

    // 更新记录
    await env.RATE_LIMIT_KV?.put(
      key,
      JSON.stringify(requests),
      { expirationTtl: window }
    );

    return null;
  };
}

/**
 * 令牌桶限流中间件
 * @param {number} capacity - 桶容量
 * @param {number} refillRate - 补充速率（每秒）
 * @returns {Function} 中间件函数
 */
export function tokenBucketRateLimit(capacity, refillRate) {
  return async (request, env) => {
    const identifier = await getClientIdentifier(request, env);
    const key = `token_bucket:${identifier}`;

    const now = Date.now();
    const record = await env.TOKEN_BUCKET_KV?.get(key);

    let bucket;
    if (record) {
      bucket = JSON.parse(record);
      // 计算补充的令牌数
      const timePassed = (now - bucket.lastRefill) / 1000;
      const tokensToAdd = Math.floor(timePassed * refillRate);
      bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    } else {
      bucket = {
        tokens: capacity,
        lastRefill: now
      };
    }

    // 检查是否有足够的令牌
    if (bucket.tokens < 1) {
      const waitTime = Math.ceil((1 - bucket.tokens) / refillRate);
      return new Response(JSON.stringify({
        error: 'Too Many Requests',
        message: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: waitTime,
        capacity: capacity,
        refill_rate: refillRate
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': waitTime.toString()
        }
      });
    }

    // 消耗一个令牌
    bucket.tokens--;

    // 保存桶状态
    await env.TOKEN_BUCKET_KV?.put(
      key,
      JSON.stringify(bucket),
      { expirationTtl: Math.ceil(capacity / refillRate) + 60 }
    );

    return null;
  };
}

/**
 * 添加限流头到响应
 * @param {Request} request - 请求对象
 * @param {Response} response - 响应对象
 * @returns {Response} 添加了限流头的响应
 */
export function addRateLimitHeaders(request, response) {
  if (request.rateLimit) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', request.rateLimit.limit.toString());
    newHeaders.set('X-RateLimit-Remaining', request.rateLimit.remaining.toString());
    newHeaders.set('X-RateLimit-Reset', new Date(request.rateLimit.reset * 1000).toISOString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }

  return response;
}