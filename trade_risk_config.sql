-- ============================================
-- Trade Risk Configuration Table
-- ============================================
CREATE TABLE IF NOT EXISTS trade_risk_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Risk limits (amounts in TWD)
  single_order_limit NUMERIC(16,2) DEFAULT 1000000,    -- 單筆金額上限 (預設100萬)
  daily_volume_limit NUMERIC(16,2) DEFAULT 5000000,    -- 日累計金額上限 (預設500萬)
  position_concentration_limit NUMERIC(5,4) DEFAULT 0.30, -- 持倉集中度上限 (預設30%)
  
  -- Additional risk settings
  max_daily_trades INTEGER DEFAULT 100,                 -- 每日最大交易筆數
  cool_down_minutes INTEGER DEFAULT 5,                  -- 頻繁交易冷卻時間(分鐘)
  max_trades_per_cooldown INTEGER DEFAULT 10,           -- 冷卻時間內最大交易次數
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  risk_level VARCHAR(10) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id),
  CHECK(single_order_limit > 0),
  CHECK(daily_volume_limit > 0),
  CHECK(position_concentration_limit > 0 AND position_concentration_limit <= 1)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_trade_risk_config_user ON trade_risk_config(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_risk_config_active ON trade_risk_config(user_id, is_active);

-- RLS policy
ALTER TABLE trade_risk_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY trade_risk_config_policy ON trade_risk_config
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_trade_risk_config_updated_at
  BEFORE UPDATE ON trade_risk_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default risk config for existing users
INSERT INTO trade_risk_config (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM trade_risk_config)
ON CONFLICT (user_id) DO NOTHING;