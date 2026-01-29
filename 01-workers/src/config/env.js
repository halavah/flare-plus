/**
 * 环境变量配置管理
 */

/**
 * 获取配置
 * @param {Env} env - Cloudflare 环境变量
 * @returns {Object} 配置对象
 */
export function getConfig(env) {
  return {
    // 基础配置
    VERSION: env.VERSION || '1.0.0',
    ENVIRONMENT: env.ENVIRONMENT || 'development',
    DEBUG: env.DEBUG === 'true' || false,

    // Cloudflare 配置
    CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID || '',

    // 数据库配置
    D1_DATABASE_ID: env.D1_DATABASE_ID || '',
    D1_DATABASE_NAME: env.D1_DATABASE_NAME || 'flare-vmail',

    // 应用配置
    EMAIL_DOMAIN: env.EMAIL_DOMAIN || '',
    COOKIES_SECRET: env.COOKIES_SECRET || '',

    // JWT 配置
    JWT_SECRET: env.JWT_SECRET || env.COOKIES_SECRET || '',
    JWT_EXPIRES_IN: env.JWT_EXPIRES_IN || '24h',
    REFRESH_TOKEN_EXPIRES_IN: env.REFRESH_TOKEN_EXPIRES_IN || '7d',

    // KV 命名空间
    SESSIONS_KV: env.SESSIONS_KV,
    BLACKLIST_KV: env.BLACKLIST_KV,
    RATE_LIMIT_KV: env.RATE_LIMIT_KV,
    TOKEN_BUCKET_KV: env.TOKEN_BUCKET_KV,
    CACHE_KV: env.CACHE_KV,

    // R2 配置
    R2_BUCKET: env.R2_BUCKET,
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT: env.R2_ENDPOINT || 'https://auto.r2.cloudflarestorage.com',

    // API 限流配置
    RATE_LIMIT_GLOBAL: parseInt(env.RATE_LIMIT_GLOBAL) || 100, // 每分钟
    RATE_LIMIT_AUTH: parseInt(env.RATE_LIMIT_AUTH) || 5,
    RATE_LIMIT_WRITE: parseInt(env.RATE_LIMIT_WRITE) || 30,
    RATE_LIMIT_READ: parseInt(env.RATE_LIMIT_READ) || 100,

    // CORS 配置
    CORS_ORIGINS: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : ['*'],
    CORS_METHODS: env.CORS_METHODS ? env.CORS_METHODS.split(',') : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    CORS_HEADERS: env.CORS_HEADERS ? env.CORS_HEADERS.split(',') : ['Content-Type', 'Authorization', 'X-Requested-With'],

    // 外部服务配置
    TURNSTILE_SECRET_KEY: env.TURNSTILE_SECRET_KEY || '',
    TURNSTILE_SITE_KEY: env.TURNSTILE_SITE_KEY || '',

    // 缓存配置
    CACHE_TTL: parseInt(env.CACHE_TTL) || 300, // 5分钟
    CACHE_MAX_SIZE: parseInt(env.CACHE_MAX_SIZE) || 100,

    // 日志配置
    LOG_LEVEL: env.LOG_LEVEL || 'info', // debug, info, warn, error
    LOG_FORMAT: env.LOG_FORMAT || 'json', // json, text

    // 功能开关
    ENABLE_ANALYTICS: env.ENABLE_ANALYTICS === 'true' || false,
    ENABLE_METRICS: env.ENABLE_METRICS === 'true' || true,
    ENABLE_COMPRESSION: env.ENABLE_COMPRESSION === 'true' || true,
    ENABLE_CACHE: env.ENABLE_CACHE === 'true' || true,

    // 安全配置
    ENABLE_RATE_LIMIT: env.ENABLE_RATE_LIMIT !== 'false' || true,
    ENABLE_CORS: env.ENABLE_CORS !== 'false' || true,
    ENABLE_SECURITY_HEADERS: env.ENABLE_SECURITY_HEADERS !== 'false' || true,
    MAX_REQUEST_SIZE: parseInt(env.MAX_REQUEST_SIZE) || 10 * 1024 * 1024, // 10MB

    // 监控配置
    WEBHOOK_URL: env.WEBHOOK_URL,
    SENTRY_DSN: env.SENTRY_DSN,
    ANALYTICS_API_KEY: env.ANALYTICS_API_KEY,

    // 开发配置
    MOCK_DATA: env.MOCK_DATA === 'true' || false,
    BYPASS_AUTH: env.BYPASS_AUTH === 'true' || false,
  };
}

/**
 * 获取数据库配置
 * @param {Env} env - Cloudflare 环境变量
 * @returns {Object} 数据库配置
 */
export function getDatabaseConfig(env) {
  return {
    D1: {
      id: env.D1_DATABASE_ID || '',
      name: env.D1_DATABASE_NAME || 'flare-vmail',
      binding: env.DB || null
    },
    KV: {
      sessions: env.SESSIONS_KV,
      blacklist: env.BLACKLIST_KV,
      rateLimit: env.RATE_LIMIT_KV,
      tokenBucket: env.TOKEN_BUCKET_KV,
      cache: env.CACHE_KV
    },
    R2: {
      bucket: env.R2_BUCKET,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      endpoint: env.R2_ENDPOINT || 'https://auto.r2.cloudflarestorage.com'
    }
  };
}

/**
 * 获取认证配置
 * @param {Env} env - Cloudflare 环境变量
 * @returns {Object} 认证配置
 */
export function getAuthConfig(env) {
  return {
    secret: env.JWT_SECRET || env.COOKIES_SECRET || '',
    expiresIn: env.JWT_EXPIRES_IN || '24h',
    refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    algorithm: 'HS256',
    issuer: env.JWT_ISSUER || 'flare-plus',
    audience: env.JWT_AUDIENCE || 'flare-plus-users',
    cookieName: env.COOKIE_NAME || 'token',
    bypass: env.BYPASS_AUTH === 'true' || false
  };
}

/**
 * 获取限流配置
 * @param {Env} env - Cloudflare 环境变量
 * @returns {Object} 限流配置
 */
export function getRateLimitConfig(env) {
  return {
    enabled: env.ENABLE_RATE_LIMIT !== 'false' || true,
    global: {
      limit: parseInt(env.RATE_LIMIT_GLOBAL) || 100,
      window: 60 // 秒
    },
    auth: {
      limit: parseInt(env.RATE_LIMIT_AUTH) || 5,
      window: 60
    },
    write: {
      limit: parseInt(env.RATE_LIMIT_WRITE) || 30,
      window: 60
    },
    read: {
      limit: parseInt(env.RATE_LIMIT_READ) || 100,
      window: 60
    },
    storage: {
      type: 'kv', // kv, memory
      kv: env.RATE_LIMIT_KV
    }
  };
}

/**
 * 获取 CORS 配置
 * @param {Env} env - Cloudflare 环境变量
 * @returns {Object} CORS 配置
 */
export function getCorsConfig(env) {
  return {
    enabled: env.ENABLE_CORS !== 'false' || true,
    origins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : ['*'],
    methods: env.CORS_METHODS ? env.CORS_METHODS.split(',') : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: env.CORS_HEADERS ? env.CORS_HEADERS.split(',') : ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // 24小时
  };
}

/**
 * 获取缓存配置
 * @param {Env} env - Cloudflare 环境变量
 * @returns {Object} 缓存配置
 */
export function getCacheConfig(env) {
  return {
    enabled: env.ENABLE_CACHE === 'true' || true,
    ttl: parseInt(env.CACHE_TTL) || 300, // 5分钟
    maxSize: parseInt(env.CACHE_MAX_SIZE) || 100,
    storage: env.CACHE_KV,
    strategies: {
      'api': {
        ttl: 300, // 5分钟
        vary: ['Authorization', 'Accept']
      },
      'static': {
        ttl: 86400, // 24小时
        vary: []
      },
      'user': {
        ttl: 600, // 10分钟
        vary: ['Authorization']
      }
    }
  };
}

/**
 * 验证必需的环境变量
 * @param {Env} env - Cloudflare 环境变量
 * @returns {Object} 验证结果
 */
export function validateEnvironment(env) {
  const required = [
    'CLOUDFLARE_ACCOUNT_ID',
    'COOKIES_SECRET'
  ];

  const optional = [
    'D1_DATABASE_ID',
    'SESSIONS_KV',
    'RATE_LIMIT_KV'
  ];

  const missing = [];
  const warnings = [];

  // 检查必需变量
  for (const key of required) {
    if (!env[key]) {
      missing.push(key);
    }
  }

  // 检查可选变量
  for (const key of optional) {
    if (!env[key]) {
      warnings.push(key);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    environment: env.ENVIRONMENT || 'development'
  };
}

/**
 * 获取环境变量摘要（用于调试）
 * @param {Env} env - Cloudflare 环境变量
 * @returns {Object} 环境变量摘要（不包含敏感信息）
 */
export function getEnvironmentSummary(env) {
  const sensitiveKeys = ['SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'PRIVATE'];

  const summary = {};
  for (const [key, value] of Object.entries(env)) {
    const isSensitive = sensitiveKeys.some(sensitive => key.toUpperCase().includes(sensitive));

    if (isSensitive) {
      summary[key] = '[REDACTED]';
    } else {
      summary[key] = value;
    }
  }

  return summary;
}

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG = {
  API: {
    VERSION: '1.0.0',
    PREFIX: '/api'
  },
  HTTP: {
    TIMEOUT: 30000, // 30秒
    MAX_RETRIES: 3
  },
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900, // 15分钟
    SESSION_TIMEOUT: 86400 // 24小时
  },
  DATABASE: {
    BATCH_SIZE: 100,
    QUERY_TIMEOUT: 5000 // 5秒
  }
};