-- 啟用 Realtime for agent_messages 表
ALTER PUBLICATION supabase_realtime ADD TABLE agent_messages;

-- 也可以為 agent_threads 表啟用 Realtime（用於討論串更新）
ALTER PUBLICATION supabase_realtime ADD TABLE agent_threads;

-- 檢查啟用狀態
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';