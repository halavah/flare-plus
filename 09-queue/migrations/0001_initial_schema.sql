-- 队列任务表
CREATE TABLE IF NOT EXISTS queue_tasks (
  id TEXT PRIMARY KEY,
  queue_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at INTEGER,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER
);

CREATE INDEX idx_tasks_queue ON queue_tasks(queue_name);
CREATE INDEX idx_tasks_status ON queue_tasks(status);
CREATE INDEX idx_tasks_scheduled ON queue_tasks(scheduled_at);
CREATE INDEX idx_tasks_priority ON queue_tasks(priority DESC);

-- 队列统计表
CREATE TABLE IF NOT EXISTS queue_stats (
  date TEXT NOT NULL,
  queue_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  total_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_duration_ms INTEGER DEFAULT 0,
  PRIMARY KEY (date, queue_name, task_type)
);

-- 死信队列表
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id TEXT PRIMARY KEY,
  original_queue TEXT NOT NULL,
  task_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_dlq_queue ON dead_letter_queue(original_queue);
CREATE INDEX idx_dlq_created ON dead_letter_queue(created_at);

-- 队列日志表
CREATE TABLE IF NOT EXISTS queue_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_logs_task ON queue_logs(task_id);
CREATE INDEX idx_logs_created ON queue_logs(created_at);

