/**
 * 认证中间件
 */

/**
 * 认证中间件 - 验证 JWT Token
 * @param {Request} request - 请求对象
 * @param {Env} env - 环境变量
 * @returns {Response|null} 认证失败返回错误响应，成功返回 null
 */
export async function authMiddleware(request, env) {
  // 获取 Authorization 头
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: '缺少 Authorization 头',
      code: 'MISSING_AUTH_HEADER'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // 验证 Bearer Token 格式
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
  if (!tokenMatch) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'Authorization 头格式无效，应为: Bearer <token>',
      code: 'INVALID_AUTH_FORMAT'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const token = tokenMatch[1];

  try {
    // 验证 Token
    const payload = await verifyToken(token, env);

    if (!payload) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Token 无效或已过期',
        code: 'INVALID_TOKEN'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 检查 Token 是否在黑名单中
    if (await isTokenBlacklisted(token, env)) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Token 已被撤销',
        code: 'TOKEN_REVOKED'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 将用户信息添加到请求对象
    request.user = payload;
    request.token = token;

    return null; // 认证通过

  } catch (error) {
    console.error('Auth middleware error:', error);

    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'Token 验证失败',
      code: 'TOKEN_VERIFICATION_ERROR',
      details: error.message
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * 验证 JWT Token（简化实现）
 * @param {string} token - JWT Token
 * @param {Env} env - 环境变量
 * @returns {Object|null} 解析后的 payload
 */
async function verifyToken(token, env) {
  try {
    // 分割 Token
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // 解析 Header 和 Payload
    const header = JSON.parse(atob(headerB64));
    const payload = JSON.parse(atob(payloadB64));

    // 验证 Header
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      throw new Error('Invalid token header');
    }

    // 验证过期时间
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    // 验证签发时间
    if (payload.iat && payload.iat > Math.floor(Date.now() / 1000)) {
      throw new Error('Token issued in the future');
    }

    // 验证签名（简化实现）
    const secret = env.COOKIES_SECRET || 'default-secret';
    const expectedSignature = await sign(`${headerB64}.${payloadB64}`, secret);

    if (!constantTimeCompare(signatureB64, expectedSignature)) {
      throw new Error('Invalid signature');
    }

    return payload;

  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * 检查 Token 是否在黑名单中
 * @param {string} token - JWT Token
 * @param {Env} env - 环境变量
 * @returns {Promise<boolean>} 是否在黑名单中
 */
async function isTokenBlacklisted(token, env) {
  if (!env.BLACKLIST_KV) {
    return false;
  }

  const blacklisted = await env.BLACKLIST_KV.get(`blacklist:${token}`);
  return blacklisted !== null;
}

/**
 * 将 Token 加入黑名单
 * @param {string} token - JWT Token
 * @param {Env} env - 环境变量
 * @param {number} ttl - 过期时间（秒）
 */
export async function blacklistToken(token, env, ttl = 86400) {
  if (env.BLACKLIST_KV) {
    await env.BLACKLIST_KV.put(
      `blacklist:${token}`,
      new Date().toISOString(),
      { expirationTtl: ttl }
    );
  }
}

/**
 * 生成 Token 签名（简化实现）
 * @param {string} data - 要签名的数据
 * @param {string} secret - 密钥
 * @returns {Promise<string>} 签名
 */
async function sign(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * 恒定时间比较（防止时序攻击）
 * @param {string} a - 字符串 a
 * @param {string} b - 字符串 b
 * @returns {boolean} 是否相等
 */
function constantTimeCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * 角色验证中间件
 * @param {string[]} allowedRoles - 允许的角色列表
 * @returns {Function} 中间件函数
 */
export function roleMiddleware(allowedRoles) {
  return async (request, env) => {
    // 先进行认证
    const authResult = await authMiddleware(request, env);
    if (authResult) {
      return authResult;
    }

    // 检查角色
    const userRole = request.user?.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: '权限不足',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return null;
  };
}

/**
 * 管理员权限中间件
 */
export const adminMiddleware = roleMiddleware(['admin', 'super_admin']);

/**
 * 超级管理员权限中间件
 */
export const superAdminMiddleware = roleMiddleware(['super_admin']);