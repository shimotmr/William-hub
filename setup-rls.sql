-- 啟用 RLS 對 agent_messages 和 agent_threads
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_threads ENABLE ROW LEVEL SECURITY;

-- 允許所有用戶讀取 agent_threads
CREATE POLICY "Allow all to read agent_threads" ON agent_threads
  FOR SELECT USING (true);

-- 允許所有用戶插入 agent_threads
CREATE POLICY "Allow all to insert agent_threads" ON agent_threads
  FOR INSERT WITH CHECK (true);

-- 允許所有用戶更新 agent_threads
CREATE POLICY "Allow all to update agent_threads" ON agent_threads
  FOR UPDATE USING (true);

-- 允許所有用戶讀取 agent_messages
CREATE POLICY "Allow all to read agent_messages" ON agent_messages
  FOR SELECT USING (true);

-- 允許所有用戶插入 agent_messages
CREATE POLICY "Allow all to insert agent_messages" ON agent_messages
  FOR INSERT WITH CHECK (true);

-- 允許所有用戶更新 agent_messages
CREATE POLICY "Allow all to update agent_messages" ON agent_messages
  FOR UPDATE USING (true);