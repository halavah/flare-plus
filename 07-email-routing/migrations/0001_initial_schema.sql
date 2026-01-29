-- Email Routing 初始数据库 Schema
-- 路由规则表
CREATE TABLE IF NOT EXISTS routing_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('forward', 'store', 'drop')),
  target TEXT,
  priority INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON routing_rules(active);
CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON routing_rules(priority DESC);

-- 邮件日志表
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL,
  recipient TEXT,
  rule_name TEXT,
  email_id TEXT,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_from ON email_logs(from_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_to ON email_logs(to_email);

-- 插入默认规则
INSERT INTO routing_rules (id, name, pattern, action, target, priority, active) VALUES
  ('default-forward', 'Default Forward', '*', 'forward', 'admin@example.com', 0, 1);

