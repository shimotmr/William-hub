-- Agent 系統提示詞模板表
CREATE TABLE IF NOT EXISTS agent_prompts (
  id BIGSERIAL PRIMARY KEY,
  agent_name TEXT NOT NULL UNIQUE, -- secretary, travis, coder, etc.
  display_name TEXT NOT NULL, -- Secretary, Travis, Coder, etc.
  content TEXT NOT NULL, -- 完整 markdown 內容
  version TEXT DEFAULT '1.0.0',
  emoji TEXT DEFAULT '🤖', -- agent 代表 emoji
  description TEXT, -- 簡短描述
  file_path TEXT, -- 原始檔案路徑
  last_synced_at TIMESTAMPTZ, -- 最後同步時間
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_agent_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_prompts_updated_at
BEFORE UPDATE ON agent_prompts
FOR EACH ROW
EXECUTE FUNCTION update_agent_prompts_updated_at();

-- 建立索引
CREATE INDEX idx_agent_prompts_name ON agent_prompts(agent_name);
CREATE INDEX idx_agent_prompts_updated ON agent_prompts(updated_at DESC);

-- Agent metadata 配置
COMMENT ON TABLE agent_prompts IS 'Agent 系統提示詞模板庫';
COMMENT ON COLUMN agent_prompts.agent_name IS 'Agent 識別名稱（小寫，用於路由）';
COMMENT ON COLUMN agent_prompts.display_name IS 'Agent 顯示名稱';
COMMENT ON COLUMN agent_prompts.content IS '完整系統提示詞 Markdown';
COMMENT ON COLUMN agent_prompts.last_synced_at IS '最後從檔案系統同步時間';
