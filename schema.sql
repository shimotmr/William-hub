-- Agent Threads 表
CREATE TABLE IF NOT EXISTS agent_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  task_id INTEGER -- 關聯 board_tasks 表
);

-- Agent Messages 表
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES agent_threads(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_type VARCHAR(20) DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_agent_messages_thread_id ON agent_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_timestamp ON agent_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_messages_sender ON agent_messages(sender);
CREATE INDEX IF NOT EXISTS idx_agent_threads_created_at ON agent_threads(created_at);

-- 插入一些示例數據
INSERT INTO agent_threads (title, description, created_by) VALUES 
('任務 #402 討論', 'Agent 聊天室功能開發相關討論', 'designer'),
('系統優化提案', 'William Hub 系統架構優化討論', 'architect'),
('UI/UX 改進', '使用者介面改善建議', 'designer')
ON CONFLICT DO NOTHING;

-- 插入示例訊息
WITH thread_data AS (
  SELECT id, title FROM agent_threads LIMIT 3
)
INSERT INTO agent_messages (thread_id, sender, content) 
SELECT 
  (SELECT id FROM agent_threads WHERE title = '任務 #402 討論' LIMIT 1),
  'designer',
  '開始開發 Agent 聊天室功能 Phase 1'
UNION ALL
SELECT 
  (SELECT id FROM agent_threads WHERE title = '任務 #402 討論' LIMIT 1),
  'architect',
  '建議使用 Supabase 作為後端，Next.js 作為前端框架'
UNION ALL
SELECT 
  (SELECT id FROM agent_threads WHERE title = '任務 #402 討論' LIMIT 1),
  'designer',
  '同意，已開始實作基礎架構'
UNION ALL
SELECT 
  (SELECT id FROM agent_threads WHERE title = '系統優化提案' LIMIT 1),
  'architect',
  '目前系統回應時間可以進一步優化'
UNION ALL
SELECT 
  (SELECT id FROM agent_threads WHERE title = 'UI/UX 改進' LIMIT 1),
  'designer',
  '建議改善導航列的使用者體驗'
ON CONFLICT DO NOTHING;