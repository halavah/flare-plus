-- Webhook 事件表
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  signature TEXT,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  processed_at INTEGER
);

CREATE INDEX idx_events_provider ON webhook_events(provider);
CREATE INDEX idx_events_status ON webhook_events(status);
CREATE INDEX idx_events_created ON webhook_events(created_at);

-- Webhook 端点配置表
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Webhook 统计表
CREATE TABLE IF NOT EXISTS webhook_stats (
  date TEXT NOT NULL,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  total_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  PRIMARY KEY (date, provider, event_type)
);

-- Webhook 日志表
CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES webhook_events(id)
);

CREATE INDEX idx_logs_event ON webhook_logs(event_id);
CREATE INDEX idx_logs_created ON webhook_logs(created_at);

