/**
 * 用户管理 API 处理
 */

/**
 * 处理用户相关的 API 请求
 * @param {Request} request - 请求对象
 * @param {Env} env - 环境变量
 * @param {string} pathname - 路径
 * @returns {Response} 响应对象
 */
export async function handleUsers(request, env, pathname) {
  const method = request.method;

  // 获取用户列表
  if (pathname === '/api/users' && method === 'GET') {
    return await handleGetUsers(request, env);
  }

  // 创建用户
  if (pathname === '/api/users' && method === 'POST') {
    return await handleCreateUser(request, env);
  }

  // 获取特定路径（/api/users/:id 或 /api/users/profile）
  const pathParts = pathname.split('/');
  const userId = pathParts[3];

  if (userId) {
    // 获取用户详情
    if (method === 'GET' && userId !== 'profile') {
      return await handleGetUser(request, env, userId);
    }

    // 获取当前用户资料
    if (method === 'GET' && userId === 'profile') {
      return await handleGetProfile(request, env);
    }

    // 更新用户信息
    if (method === 'PUT' || method === 'PATCH') {
      return await handleUpdateUser(request, env, userId);
    }

    // 删除用户
    if (method === 'DELETE' && userId !== 'profile') {
      return await handleDeleteUser(request, env, userId);
    }
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
 * 获取用户列表
 */
async function handleGetUsers(request, env) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // 从数据库查询用户
    let users = [];
    let total = 0;

    if (env.DB) {
      // 构建查询条件
      let whereClause = '1=1';
      let params = [];

      if (search) {
        whereClause = 'name LIKE ? OR email LIKE ?';
        params = [`%${search}%`, `%${search}%`];
      }

      // 查询总数
      const countStmt = env.DB.prepare(`SELECT COUNT(*) as total FROM users WHERE ${whereClause}`);
      const countResult = await countStmt.bind(...params).first();
      total = countResult.total;

      // 查询用户列表
      const listStmt = env.DB.prepare(`
        SELECT id, name, email, created_at, updated_at
        FROM users
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `);
      const results = await listStmt.bind(...params, limit, offset).all();
      users = results.results;
    } else {
      // 演示数据
      users = [
        { id: '1', name: 'Alice Johnson', email: 'alice@example.com', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'Bob Smith', email: 'bob@example.com', created_at: '2024-01-02T00:00:00Z' },
        { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', created_at: '2024-01-03T00:00:00Z' }
      ];

      if (search) {
        users = users.filter(u =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
        );
      }

      total = users.length;
      users = users.slice(offset, offset + limit);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        users: users,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get users error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '获取用户列表失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 获取用户详情
 */
async function handleGetUser(request, env, userId) {
  try {
    let user = null;

    if (env.DB) {
      user = await env.DB.prepare(`
        SELECT id, name, email, created_at, updated_at
        FROM users
        WHERE id = ?
      `).bind(userId).first();
    } else {
      // 演示数据
      const demoUsers = {
        '1': { id: '1', name: 'Alice Johnson', email: 'alice@example.com', created_at: '2024-01-01T00:00:00Z' },
        '2': { id: '2', name: 'Bob Smith', email: 'bob@example.com', created_at: '2024-01-02T00:00:00Z' },
        '3': { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', created_at: '2024-01-03T00:00:00Z' }
      };
      user = demoUsers[userId];
    }

    if (!user) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: '用户不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: user
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '获取用户详情失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 获取当前用户资料
 */
async function handleGetProfile(request, env) {
  try {
    // 从请求中获取用户信息（通过认证中间件设置）
    const userId = request.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: '未认证'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let user = null;

    if (env.DB) {
      user = await env.DB.prepare(`
        SELECT id, name, email, created_at, updated_at
        FROM users
        WHERE id = ?
      `).bind(userId).first();
    } else {
      // 演示数据
      user = {
        id: userId,
        name: 'Demo User',
        email: 'demo@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
    }

    if (!user) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: '用户不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: user
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '获取用户资料失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 创建用户
 */
async function handleCreateUser(request, env) {
  try {
    const { name, email, password } = await request.json();

    // 验证输入
    if (!name || !email) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '姓名和邮箱不能为空'
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

    if (env.DB) {
      // 检查邮箱是否已存在
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
      const passwordHash = password ? await hashPassword(password) : null;
      const now = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(userId, name, email, passwordHash, now, now).run();

      const newUser = {
        id: userId,
        name: name,
        email: email,
        created_at: now,
        updated_at: now
      };

      return new Response(JSON.stringify({
        success: true,
        message: '用户创建成功',
        data: newUser
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 演示模式
    const newUser = {
      id: crypto.randomUUID(),
      name: name,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      message: '用户创建成功（演示模式）',
      data: newUser
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '创建用户失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 更新用户信息
 */
async function handleUpdateUser(request, env, userId) {
  try {
    const { name, email } = await request.json();

    // 验证输入
    if (!name && !email) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '至少需要提供姓名或邮箱'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证邮箱格式（如果提供）
    if (email) {
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
    }

    if (env.DB) {
      // 检查用户是否存在
      const existingUser = await env.DB.prepare('SELECT id FROM users WHERE id = ?')
        .bind(userId)
        .first();

      if (!existingUser) {
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: '用户不存在'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 如果更新邮箱，检查是否已被使用
      if (email) {
        const emailUser = await env.DB.prepare('SELECT id FROM users WHERE email = ? AND id != ?')
          .bind(email, userId)
          .first();

        if (emailUser) {
          return new Response(JSON.stringify({
            error: 'Conflict',
            message: '该邮箱已被其他用户使用'
          }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // 构建更新语句
      let updateFields = [];
      let params = [];
      let setClause = '';

      if (name) {
        updateFields.push('name = ?');
        params.push(name);
      }

      if (email) {
        updateFields.push('email = ?');
        params.push(email);
      }

      updateFields.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(userId);

      setClause = updateFields.join(', ');

      await env.DB.prepare(`
        UPDATE users
        SET ${setClause}
        WHERE id = ?
      `).bind(...params).run();

      // 获取更新后的用户信息
      const updatedUser = await env.DB.prepare(`
        SELECT id, name, email, created_at, updated_at
        FROM users
        WHERE id = ?
      `).bind(userId).first();

      return new Response(JSON.stringify({
        success: true,
        message: '用户信息更新成功',
        data: updatedUser
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 演示模式
    return new Response(JSON.stringify({
      success: true,
      message: '用户信息更新成功（演示模式）',
      data: {
        id: userId,
        name: name || 'Demo User',
        email: email || 'demo@example.com',
        updated_at: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '更新用户信息失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 删除用户
 */
async function handleDeleteUser(request, env, userId) {
  try {
    if (env.DB) {
      // 检查用户是否存在
      const existingUser = await env.DB.prepare('SELECT id FROM users WHERE id = ?')
        .bind(userId)
        .first();

      if (!existingUser) {
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: '用户不存在'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 删除用户（级联删除相关数据）
      await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: '用户删除成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '删除用户失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 哈希密码（简化示例）
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}