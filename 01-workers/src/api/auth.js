/**
 * 认证相关 API 处理
 */

/**
 * 处理认证相关的 API 请求
 * @param {Request} request - 请求对象
 * @param {Env} env - 环境变量
 * @param {string} pathname - 路径
 * @returns {Response} 响应对象
 */
export async function handleAuth(request, env, pathname) {
  const method = request.method;

  // 用户登录
  if (pathname === '/api/auth/login' && method === 'POST') {
    return await handleLogin(request, env);
  }

  // 用户注册
  if (pathname === '/api/auth/register' && method === 'POST') {
    return await handleRegister(request, env);
  }

  // 刷新 Token
  if (pathname === '/api/auth/refresh' && method === 'POST') {
    return await handleRefreshToken(request, env);
  }

  // 登出
  if (pathname === '/api/auth/logout' && method === 'POST') {
    return await handleLogout(request, env);
  }

  // 验证 Token
  if (pathname === '/api/auth/verify' && method === 'POST') {
    return await handleVerifyToken(request, env);
  }

  // 方法不允许
  return new Response(JSON.stringify({
    error: 'Method Not Allowed',
    message: '请求方法不被允许'
  }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * 处理用户登录
 */
async function handleLogin(request, env) {
  try {
    const { email, password } = await request.json();

    // 验证输入
    if (!email || !password) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '邮箱和密码不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 查询用户（示例：从 D1 数据库查询）
    let user = null;
    if (env.DB) {
      const stmt = env.DB.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
      user = await stmt.bind(email).first();
    }

    // 演示模式：使用预设用户
    if (!user && email === 'demo@example.com' && password === 'demo123') {
      user = {
        id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@example.com',
        password_hash: 'demo-hash'
      };
    }

    if (!user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: '邮箱或密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证密码（简化示例）
    // 实际应用中应该使用 bcrypt 等安全的密码哈希算法
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: '邮箱或密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成 JWT Token（简化示例）
    const token = await generateToken(user, env);

    // 存储会话到 KV
    if (env.SESSIONS_KV) {
      await env.SESSIONS_KV.put(
        `session:${token}`,
        JSON.stringify({
          userId: user.id,
          email: user.email,
          createdAt: new Date().toISOString()
        }),
        { expirationTtl: 24 * 60 * 60 } // 24小时过期
      );
    }

    return new Response(JSON.stringify({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token: token,
        expires_in: 24 * 60 * 60 // 24小时
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '登录失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 处理用户注册
 */
async function handleRegister(request, env) {
  try {
    const { name, email, password } = await request.json();

    // 验证输入
    if (!name || !email || !password) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '姓名、邮箱和密码不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '邮箱格式无效'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查邮箱是否已存在
    if (env.DB) {
      const existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
        .bind(email)
        .first();

      if (existingUser) {
        return new Response(JSON.stringify({
          error: 'Conflict',
          message: '该邮箱已被注册'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 创建新用户
      const userId = crypto.randomUUID();
      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(userId, name, email, passwordHash, now, now).run();

      // 生成 Token
      const user = { id: userId, name, email };
      const token = await generateToken(user, env);

      return new Response(JSON.stringify({
        success: true,
        message: '注册成功',
        data: {
          user: {
            id: userId,
            name: name,
            email: email
          },
          token: token
        }
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 演示模式：直接返回成功
    return new Response(JSON.stringify({
      success: true,
      message: '注册成功（演示模式）',
      data: {
        user: { name, email },
        token: 'demo-token-' + Date.now()
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Register error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '注册失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 处理 Token 刷新
 */
async function handleRefreshToken(request, env) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '缺少刷新令牌'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证刷新令牌
    const session = await env.SESSIONS_KV?.get(`refresh:${refresh_token}`);

    if (!session) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: '刷新令牌无效或已过期'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionData = JSON.parse(session);

    // 获取用户信息
    let user = null;
    if (env.DB) {
      user = await env.DB.prepare('SELECT id, name, email FROM users WHERE id = ?')
        .bind(sessionData.userId)
        .first();
    }

    if (!user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: '用户不存在'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成新的访问令牌
    const newToken = await generateToken(user, env);

    return new Response(JSON.stringify({
      success: true,
      message: 'Token 刷新成功',
      data: {
        token: newToken,
        expires_in: 24 * 60 * 60
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: 'Token 刷新失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 处理登出
 */
async function handleLogout(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token && env.SESSIONS_KV) {
      // 删除会话
      await env.SESSIONS_KV.delete(`session:${token}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: '登出成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '登出失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 验证 Token
 */
async function handleVerifyToken(request, env) {
  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '缺少访问令牌'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = await env.SESSIONS_KV?.get(`session:${token}`);

    if (!session) {
      return new Response(JSON.stringify({
        valid: false,
        message: '令牌无效或已过期'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      valid: true,
      message: '令牌有效'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Verify token error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '验证失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 生成 JWT Token（简化示例）
 */
async function generateToken(user, env) {
  // 实际应用中应使用 jwt 库
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时
  };

  const headerBase64 = btoa(JSON.stringify(header));
  const payloadBase64 = btoa(JSON.stringify(payload));

  // 使用环境变量中的密钥签名（简化示例）
  const signature = await sign(`${headerBase64}.${payloadBase64}`, env.COOKIES_SECRET || 'default-secret');

  return `${headerBase64}.${payloadBase64}.${signature}`;
}

/**
 * 签名函数（简化示例）
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
 * 验证密码（简化示例）
 */
async function verifyPassword(password, hash) {
  // 实际应用中应使用 bcrypt 等安全算法
  if (hash === 'demo-hash') {
    return password === 'demo123';
  }
  return password === hash; // 仅用于演示
}

/**
 * 哈希密码（简化示例）
 */
async function hashPassword(password) {
  // 实际应用中应使用 bcrypt 等安全算法
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}