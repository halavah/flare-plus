-- Turnstile 初始数据库 Schema
-- 验证日志表
CREATE TABLE IF NOT EXISTS verification_logs (
  id TEXT PRIMARY KEY,
  site_key TEXT NOT NULL,
  success INTEGER NOT NULL,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_verification_logs_site_key ON verification_logs(site_key);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_logs_success ON verification_logs(success);

-- 速率限制表
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  attempts INTEGER DEFAULT 1,
  window_start INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

-- 分析统计表
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  site_key TEXT NOT NULL,
  total_verifications INTEGER DEFAULT 0,
  successful_verifications INTEGER DEFAULT 0,
  failed_verifications INTEGER DEFAULT 0,
  UNIQUE(date, site_key)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_site_key ON analytics(site_key);

