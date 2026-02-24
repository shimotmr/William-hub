-- 磁碟清理記錄表
CREATE TABLE IF NOT EXISTS cleanup_log (
  id BIGSERIAL PRIMARY KEY,
  cleanup_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger_reason TEXT NOT NULL, -- manual, scheduled, quota_alert, emergency
  before_usage_percent INTEGER, -- 清理前磁碟使用率 %
  after_usage_percent INTEGER, -- 清理後磁碟使用率 %
  space_freed_mb INTEGER, -- 釋放空間 MB
  items_deleted JSONB, -- 刪除項目詳情
  notes TEXT,
  performed_by TEXT DEFAULT 'system', -- system, agent, user
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 清理項目詳細記錄表（正規化）
CREATE TABLE IF NOT EXISTS cleanup_items (
  id BIGSERIAL PRIMARY KEY,
  cleanup_log_id BIGINT REFERENCES cleanup_log(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  size_mb INTEGER,
  category TEXT, -- duplicate_project, duplicate_venv, cache, test_data, etc.
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 磁碟健康度歷史記錄
CREATE TABLE IF NOT EXISTS disk_health_history (
  id BIGSERIAL PRIMARY KEY,
  check_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_gb INTEGER,
  used_gb INTEGER,
  free_gb INTEGER,
  usage_percent INTEGER,
  openclaw_size_mb INTEGER,
  clawd_size_mb INTEGER,
  alert_level TEXT, -- green, yellow, orange, red
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_cleanup_log_date ON cleanup_log(cleanup_date DESC);
CREATE INDEX idx_cleanup_items_log ON cleanup_items(cleanup_log_id);
CREATE INDEX idx_disk_health_date ON disk_health_history(check_date DESC);

-- 自動計算釋放空間的 trigger
CREATE OR REPLACE FUNCTION calculate_space_freed()
RETURNS TRIGGER AS $$
BEGIN
  -- 計算 items_deleted 中所有項目的總大小
  IF NEW.items_deleted IS NOT NULL THEN
    NEW.space_freed_mb := (
      SELECT COALESCE(SUM((item->>'size_mb')::INTEGER), 0)
      FROM jsonb_array_elements(NEW.items_deleted) AS item
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_log_calculate_freed
BEFORE INSERT OR UPDATE ON cleanup_log
FOR EACH ROW
EXECUTE FUNCTION calculate_space_freed();

-- Comments
COMMENT ON TABLE cleanup_log IS '磁碟清理操作記錄';
COMMENT ON TABLE cleanup_items IS '清理項目詳細記錄';
COMMENT ON TABLE disk_health_history IS '磁碟健康度歷史趨勢';
