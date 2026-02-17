-- ============================================
-- William Hub - Trading System Core Tables
-- Essential tables for MVP Week 1
-- ============================================

-- ============================================
-- User Shioaji Credentials Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_shioaji_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Encrypted credential data (TODO: implement AES-256 encryption)
  api_key_encrypted TEXT NOT NULL,
  secret_key_encrypted TEXT NOT NULL,
  ca_cert_encrypted TEXT,
  ca_cert_password_encrypted TEXT,
  
  -- Connection settings
  simulation_mode BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  daily_api_calls INT DEFAULT 0,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- ============================================
-- Enhanced Trade Orders Table
-- ============================================
CREATE TABLE IF NOT EXISTS trade_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Order details
  symbol VARCHAR(10) NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('buy', 'sell')),
  order_type VARCHAR(20) NOT NULL DEFAULT 'limit',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(12,2),
  
  -- Order status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  filled_quantity INTEGER DEFAULT 0,
  filled_price NUMERIC(12,2),
  
  -- Shioaji specific fields
  shioaji_order_id VARCHAR(50),
  margin_trading_type VARCHAR(10) DEFAULT 'cash',
  api_response JSONB,
  
  -- Timestamps
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  filled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Enhanced Stock Quotes Cache Table
-- ============================================
CREATE TABLE IF NOT EXISTS stock_quotes_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(10) NOT NULL,
  market VARCHAR(10) NOT NULL DEFAULT 'TW',
  name VARCHAR(100),
  
  -- Basic price data
  last_price NUMERIC(12,2),
  change NUMERIC(12,2) DEFAULT 0,
  change_percent NUMERIC(8,4) DEFAULT 0,
  volume BIGINT DEFAULT 0,
  high NUMERIC(12,2),
  low NUMERIC(12,2),
  open NUMERIC(12,2),
  previous_close NUMERIC(12,2),
  
  -- Market status
  data_source VARCHAR(20) DEFAULT 'shioaji',
  is_trading_halt BOOLEAN DEFAULT FALSE,
  price_limit_up NUMERIC(12,2),
  price_limit_down NUMERIC(12,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(symbol, market)
);

-- ============================================
-- Basic Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_shioaji_credentials_user ON user_shioaji_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_user ON trade_orders(user_id, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_orders_symbol ON trade_orders(symbol, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_quotes_symbol ON stock_quotes_cache(symbol, market);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE user_shioaji_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_shioaji_credentials_policy ON user_shioaji_credentials;
CREATE POLICY user_shioaji_credentials_policy ON user_shioaji_credentials
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS trade_orders_policy ON trade_orders;
CREATE POLICY trade_orders_policy ON trade_orders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Sample Data for Testing
-- ============================================
INSERT INTO stock_quotes_cache (symbol, market, name, last_price, change, change_percent, volume, high, low, open, previous_close, price_limit_up, price_limit_down)
VALUES 
  ('2330', 'TW', '台積電', 985.00, 15.00, 1.55, 28453, 988.00, 972.00, 975.00, 970.00, 1067.00, 873.00),
  ('2317', 'TW', '鴻海', 178.50, -2.50, -1.38, 45231, 182.00, 177.00, 181.00, 181.00, 199.10, 162.90),
  ('2454', 'TW', '聯發科', 1285.00, 35.00, 2.80, 5621, 1290.00, 1250.00, 1255.00, 1250.00, 1375.00, 1125.00),
  ('2881', 'TW', '富邦金', 85.60, 0.80, 0.94, 18234, 86.20, 84.80, 85.00, 84.80, 93.30, 76.30),
  ('2603', 'TW', '長榮', 198.00, 6.50, 3.39, 85432, 199.00, 191.00, 192.00, 191.50, 210.70, 172.40)
ON CONFLICT (symbol, market) DO UPDATE SET
  last_price = EXCLUDED.last_price,
  change = EXCLUDED.change,
  change_percent = EXCLUDED.change_percent,
  volume = EXCLUDED.volume,
  high = EXCLUDED.high,
  low = EXCLUDED.low,
  open = EXCLUDED.open,
  updated_at = NOW();