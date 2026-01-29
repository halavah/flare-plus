/**
 * 工具类 API 处理
 */

/**
 * 处理工具相关的 API 请求
 * @param {Request} request - 请求对象
 * @param {Env} env - 环境变量
 * @param {string} pathname - 路径
 * @returns {Response} 响应对象
 */
export async function handleUtils(request, env, pathname) {
  const method = request.method;

  // 获取服务器时间
  if (pathname === '/api/utils/time' && method === 'GET') {
    return await handleGetTime(request, env);
  }

  // 生成哈希值
  if (pathname === '/api/utils/hash' && method === 'POST') {
    return await handleGenerateHash(request, env);
  }

  // 获取客户端 IP
  if (pathname === '/api/utils/ip' && method === 'GET') {
    return await handleGetClientIP(request, env);
  }

  // 编码/解码 Base64
  if (pathname === '/api/utils/base64' && method === 'POST') {
    return await handleBase64(request, env);
  }

  // URL 编码/解码
  if (pathname === '/api/utils/urlencode' && method === 'POST') {
    return await handleUrlEncode(request, env);
  }

  // 生成 UUID
  if (pathname === '/api/utils/uuid' && method === 'GET') {
    return await handleGenerateUUID(request, env);
  }

  // 验证 JSON
  if (pathname === '/api/utils/validate-json' && method === 'POST') {
    return await handleValidateJSON(request, env);
  }

  // 格式化 JSON
  if (pathname === '/api/utils/format-json' && method === 'POST') {
    return await handleFormatJSON(request, env);
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
 * 获取服务器时间
 */
async function handleGetTime(request, env) {
  try {
    const now = new Date();

    // 获取时区参数
    const url = new URL(request.url);
    const timezone = url.searchParams.get('timezone') || 'UTC';
    const format = url.searchParams.get('format') || 'iso';

    let timeData = {
      timestamp: now.getTime(),
      iso: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      timezone: 'UTC',
      utc: {
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
        day: now.getUTCDate(),
        hour: now.getUTCHours(),
        minute: now.getUTCMinutes(),
        second: now.getUTCSeconds(),
        millisecond: now.getUTCMilliseconds()
      },
      local: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        millisecond: now.getMilliseconds()
      }
    };

    // 根据格式返回
    if (format === 'timestamp') {
      timeData = timeData.timestamp;
    } else if (format === 'unix') {
      timeData = timeData.unix;
    } else if (format === 'iso') {
      timeData = timeData.iso;
    }

    return new Response(JSON.stringify({
      success: true,
      data: timeData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get time error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '获取时间失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 生成哈希值
 */
async function handleGenerateHash(request, env) {
  try {
    const { data, algorithm = 'SHA-256', output = 'hex' } = await request.json();

    if (!data) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '缺少要哈希的数据'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const encoder = new TextEncoder();
    const dataArray = encoder.encode(data);

    let hashAlgorithm;
    switch (algorithm.toUpperCase()) {
      case 'SHA-1':
        hashAlgorithm = 'SHA-1';
        break;
      case 'SHA-256':
        hashAlgorithm = 'SHA-256';
        break;
      case 'SHA-384':
        hashAlgorithm = 'SHA-384';
        break;
      case 'SHA-512':
        hashAlgorithm = 'SHA-512';
        break;
      default:
        return new Response(JSON.stringify({
          error: 'Bad Request',
          message: '不支持的哈希算法'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    const hashBuffer = await crypto.subtle.digest(hashAlgorithm, dataArray);

    let hashResult;
    if (output === 'base64') {
      hashResult = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    } else if (output === 'hex') {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hashResult = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      hashResult = new Uint8Array(hashBuffer);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        algorithm: algorithm,
        input: data,
        hash: hashResult,
        output_format: output
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Generate hash error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '生成哈希失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 获取客户端 IP
 */
async function handleGetClientIP(request, env) {
  try {
    // 获取各种可能的 IP 头
    const ipHeaders = [
      'CF-Connecting-IP',
      'X-Forwarded-For',
      'X-Real-IP',
      'X-Client-IP',
      'X-Forwarded',
      'Forwarded-For',
      'Forwarded'
    ];

    let clientIP = null;
    let source = 'unknown';

    for (const header of ipHeaders) {
      const value = request.headers.get(header);
      if (value) {
        // X-Forwarded-For 可能包含多个 IP，取第一个
        clientIP = value.split(',')[0].trim();
        source = header;
        break;
      }
    }

    // 如果没有找到 IP 头，返回默认值
    if (!clientIP) {
      clientIP = '127.0.0.1';
      source = 'default';
    }

    // 获取其他相关信息
    const country = request.headers.get('CF-IPCountry') || 'Unknown';
    const city = request.cf?.city || 'Unknown';
    const timezone = request.cf?.timezone || 'Unknown';

    return new Response(JSON.stringify({
      success: true,
      data: {
        ip: clientIP,
        source: source,
        location: {
          country: country,
          city: city,
          timezone: timezone
        },
        headers: Object.fromEntries(request.headers.entries())
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get client IP error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '获取客户端 IP 失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Base64 编码/解码
 */
async function handleBase64(request, env) {
  try {
    const { data, operation = 'encode' } = await request.json();

    if (!data) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '缺少要处理的数据'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let result;

    if (operation === 'encode') {
      // 编码
      if (typeof data === 'object') {
        result = btoa(JSON.stringify(data));
      } else {
        result = btoa(String(data));
      }
    } else if (operation === 'decode') {
      // 解码
      try {
        const decoded = atob(data);
        // 尝试解析为 JSON
        try {
          result = JSON.parse(decoded);
        } catch {
          result = decoded;
        }
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Bad Request',
          message: 'Base64 解码失败，可能不是有效的 Base64 字符串'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '不支持的操作，支持：encode, decode'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        operation: operation,
        input: data,
        result: result
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Base64 error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: 'Base64 处理失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * URL 编码/解码
 */
async function handleUrlEncode(request, env) {
  try {
    const { data, operation = 'encode' } = await request.json();

    if (!data) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '缺少要处理的数据'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let result;

    if (operation === 'encode') {
      result = encodeURIComponent(data);
    } else if (operation === 'decode') {
      result = decodeURIComponent(data);
    } else {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '不支持的操作，支持：encode, decode'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        operation: operation,
        input: data,
        result: result
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('URL encode error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: 'URL 编码/解码失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 生成 UUID
 */
async function handleGenerateUUID(request, env) {
  try {
    const url = new URL(request.url);
    const count = parseInt(url.searchParams.get('count') || '1');
    const version = url.searchParams.get('version') || '4';

    if (count < 1 || count > 100) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'count 参数必须在 1-100 之间'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uuids = [];
    for (let i = 0; i < count; i++) {
      uuids.push(crypto.randomUUID());
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        count: uuids.length,
        version: version,
        uuids: uuids
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Generate UUID error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '生成 UUID 失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 验证 JSON
 */
async function handleValidateJSON(request, env) {
  try {
    const { data } = await request.json();

    if (!data) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '缺少要验证的 JSON 数据'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let isValid = false;
    let parsedData = null;
    let error = null;

    try {
      parsedData = JSON.parse(data);
      isValid = true;
    } catch (e) {
      error = {
        message: e.message,
        position: extractErrorPosition(e.message)
      };
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        valid: isValid,
        parsed: parsedData,
        error: error,
        size: data.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Validate JSON error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: 'JSON 验证失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 格式化 JSON
 */
async function handleFormatJSON(request, env) {
  try {
    const { data, indent = 2 } = await request.json();

    if (!data) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '缺少要格式化的 JSON 数据'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '无效的 JSON 格式',
        details: e.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formatted = JSON.stringify(parsedData, null, indent);
    const minified = JSON.stringify(parsedData);

    return new Response(JSON.stringify({
      success: true,
      data: {
        formatted: formatted,
        minified: minified,
        indent: indent,
        original_size: data.length,
        formatted_size: formatted.length,
        minified_size: minified.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Format JSON error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: 'JSON 格式化失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 从错误消息中提取位置信息
 */
function extractErrorPosition(errorMessage) {
  const match = errorMessage.match(/position (\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  return null;
}