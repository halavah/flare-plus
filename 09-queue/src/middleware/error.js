// 错误处理中间件
export function errorHandler(error, request, env) {
  console.error('Error:', error);

  let status = 500;
  let message = 'Internal Server Error';

  if (error.name === 'ValidationError') {
    status = 400;
    message = error.message;
  } else if (error.name === 'QueueFullError') {
    status = 503;
    message = 'Queue is full, try again later';
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

export class QueueFullError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QueueFullError';
  }
}

