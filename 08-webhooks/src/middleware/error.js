// 错误处理中间件
export function errorHandler(error, request, env) {
  console.error('Error:', error);

  let status = 500;
  let message = 'Internal Server Error';

  if (error.name === 'ValidationError') {
    status = 400;
    message = error.message;
  } else if (error.name === 'SignatureError') {
    status = 401;
    message = 'Invalid webhook signature';
  } else if (error.name === 'RateLimitError') {
    status = 429;
    message = 'Too many requests';
  } else if (error.message) {
    message = error.message;
  }

  return new Response(JSON.stringify({
    success: false,
    error: {
      type: error.name || 'Error',
      message,
      timestamp: new Date().toISOString()
    }
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SignatureError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SignatureError';
  }
}

export class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
  }
}

