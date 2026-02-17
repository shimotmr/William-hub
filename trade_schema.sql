-- ============================================
-- William Hub - Trading System Database Schema
-- Shioaji Integration Tables for MVP Week 1
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

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
  max_concurrent_connections INT DEFAULT 1,
  
  -- Status management
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  login_count INT DEFAULT 0,
  
  -- Usage statistics
  daily_api_calls INT DEFAULT 0,
  daily_quota_reset_at DATE DEFAULT CURRENT_DATE,
  monthly_trading_volume NUMERIC(16,2) DEFAULT 0,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id),
  CHECK(api_key_encrypted != ''),
  CHECK(secret_key_encrypted != '')
);

-- ============================================
-- Shioaji Connection Management Table
-- ============================================
CREATE TABLE IF NOT EXISTS shioaji_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Connection info
  connection_id VARCHAR(50) NOT NULL,
  session_id VARCHAR(100),
  server_ip INET,
  server_port INT,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'connecting', -- connecting/connected/disconnected/error
  is_ca_activated BOOLEAN DEFAULT FALSE,
  last_heartbeat TIMESTAMPTZ,
  
  -- Statistics
  api_calls_count INT DEFAULT 0,
  bandwidth_used_mb NUMERIC(10,2) DEFAULT 0,
  
  -- Error tracking
  error_count INT DEFAULT 0,
  last_error VARCHAR(500),
  
  -- Timestamps
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  order_type VARCHAR(20) NOT NULL DEFAULT 'limit' CHECK (order_type IN ('limit', 'market', 'stop', 'stop_limit')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(12,2),
  
  -- Order status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'partial', 'filled', 'cancelled', 'rejected')),
  filled_quantity INTEGER DEFAULT 0,
  filled_price NUMERIC(12,2),
  
  -- Shioaji specific fields
  shioaji_order_id VARCHAR(50),
  shioaji_account VARCHAR(20),
  api_response JSONB,
  order_via VARCHAR(10) DEFAULT 'manual' CHECK (order_via IN ('manual', 'api', 'strategy')),
  execution_algo VARCHAR(20),
  margin_trading_type VARCHAR(10) DEFAULT 'cash' CHECK (margin_trading_type IN ('cash', 'margin', 'short', 'daytrade')),
  
  -- Error handling
  error_code VARCHAR(10),
  error_message TEXT,
  
  -- Timestamps
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  filled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (filled_quantity <= quantity),
  CHECK (order_type != 'limit' OR price IS NOT NULL)
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
  
  -- Real-time order book (best bid/ask)
  bid_price_1 NUMERIC(12,2),
  bid_volume_1 INT,
  ask_price_1 NUMERIC(12,2),
  ask_volume_1 INT,
  total_bid_volume BIGINT,
  total_ask_volume BIGINT,
  
  -- Market status
  tick_type VARCHAR(2), -- B/S/N (Buy/Sell/Neutral)
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
-- Stock Ticks History Table (Partitioned)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_ticks_history (
  id UUID DEFAULT uuid_generate_v4(),
  symbol VARCHAR(10) NOT NULL,
  market VARCHAR(10) NOT NULL DEFAULT 'TW',
  tick_time TIMESTAMPTZ NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  volume INT NOT NULL,
  bid_price NUMERIC(12,2),
  ask_price NUMERIC(12,2),
  tick_type VARCHAR(2), -- B/S/N (Buy/Sell/Neutral)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (tick_time);

-- ============================================
-- Account Balances Table
-- ============================================
CREATE TABLE IF NOT EXISTS account_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type VARCHAR(20) DEFAULT 'stock' CHECK (account_type IN ('stock', 'future', 'option')),
  
  -- Balance information
  cash_balance NUMERIC(16,2) DEFAULT 0,
  available_balance NUMERIC(16,2) DEFAULT 0,
  margin_available NUMERIC(16,2) DEFAULT 0,
  short_available NUMERIC(16,2) DEFAULT 0,
  
  -- Portfolio values
  total_market_value NUMERIC(16,2) DEFAULT 0,
  total_cost_basis NUMERIC(16,2) DEFAULT 0,
  unrealized_pnl NUMERIC(16,2) DEFAULT 0,
  realized_pnl_today NUMERIC(16,2) DEFAULT 0,
  
  -- Timestamps
  balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, account_type, balance_date)
);

-- ============================================
-- Audit Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(20) DEFAULT 'general',
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- User credentials indexes
CREATE INDEX IF NOT EXISTS idx_user_shioaji_credentials_user ON user_shioaji_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shioaji_credentials_active ON user_shioaji_credentials(user_id, is_active);

-- Connections indexes
CREATE INDEX IF NOT EXISTS idx_shioaji_connections_user ON shioaji_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_shioaji_connections_status ON shioaji_connections(user_id, status, connected_at DESC);

-- Trade orders indexes
CREATE INDEX IF NOT EXISTS idx_trade_orders_user ON trade_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_status ON trade_orders(user_id, status, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_orders_symbol ON trade_orders(symbol, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_orders_shioaji_id ON trade_orders(shioaji_order_id);

-- Stock quotes indexes
CREATE INDEX IF NOT EXISTS idx_stock_quotes_symbol ON stock_quotes_cache(symbol, market);
CREATE INDEX IF NOT EXISTS idx_stock_quotes_updated ON stock_quotes_cache(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_quotes_trading ON stock_quotes_cache(market, is_trading_halt, updated_at);

-- Stock ticks indexes (will be created on partitions)
-- CREATE INDEX idx_stock_ticks_symbol_time ON stock_ticks_history(symbol, tick_time DESC);
-- CREATE INDEX idx_stock_ticks_market_time ON stock_ticks_history(market, tick_time DESC);

-- Account balances indexes
CREATE INDEX IF NOT EXISTS idx_account_balances_user ON account_balances(user_id, balance_date DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type, created_at DESC);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all user-specific tables
ALTER TABLE user_shioaji_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE shioaji_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User credentials policies
DROP POLICY IF EXISTS user_shioaji_credentials_policy ON user_shioaji_credentials;
CREATE POLICY user_shioaji_credentials_policy ON user_shioaji_credentials
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Connections policies
DROP POLICY IF EXISTS shioaji_connections_policy ON shioaji_connections;
CREATE POLICY shioaji_connections_policy ON shioaji_connections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trade orders policies
DROP POLICY IF EXISTS trade_orders_policy ON trade_orders;
CREATE POLICY trade_orders_policy ON trade_orders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Account balances policies
DROP POLICY IF EXISTS account_balances_policy ON account_balances;
CREATE POLICY account_balances_policy ON account_balances
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Audit logs policies (read-only for users)
DROP POLICY IF EXISTS audit_logs_policy ON audit_logs;
CREATE POLICY audit_logs_policy ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trg_user_shioaji_credentials_updated_at ON user_shioaji_credentials;
CREATE TRIGGER trg_user_shioaji_credentials_updated_at 
  BEFORE UPDATE ON user_shioaji_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_shioaji_connections_updated_at ON shioaji_connections;
CREATE TRIGGER trg_shioaji_connections_updated_at 
  BEFORE UPDATE ON shioaji_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_trade_orders_updated_at ON trade_orders;
CREATE TRIGGER trg_trade_orders_updated_at 
  BEFORE UPDATE ON trade_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_stock_quotes_cache_updated_at ON stock_quotes_cache;
CREATE TRIGGER trg_stock_quotes_cache_updated_at 
  BEFORE UPDATE ON stock_quotes_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_account_balances_updated_at ON account_balances;
CREATE TRIGGER trg_account_balances_updated_at 
  BEFORE UPDATE ON account_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Partition Management Functions
-- ============================================

-- Function to create daily partitions for stock_ticks_history
CREATE OR REPLACE FUNCTION create_daily_partition(table_name TEXT, partition_date DATE)
RETURNS VOID AS $$
DECLARE
  partition_name TEXT;
  start_date TEXT;
  end_date TEXT;
BEGIN
  partition_name := table_name || '_' || to_char(partition_date, 'YYYY_MM_DD');
  start_date := partition_date::TEXT;
  end_date := (partition_date + INTERVAL '1 day')::TEXT;
  
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
    FOR VALUES FROM (%L) TO (%L)
  ', partition_name, table_name, start_date, end_date);
  
  -- Create indexes on the partition
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_%I_symbol_time 
    ON %I(symbol, tick_time DESC)
  ', partition_name, partition_name);
  
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_%I_market_time 
    ON %I(market, tick_time DESC)
  ', partition_name, partition_name);
  
END;
$$ LANGUAGE plpgsql;

-- Create partitions for today and tomorrow
SELECT create_daily_partition('stock_ticks_history', CURRENT_DATE);
SELECT create_daily_partition('stock_ticks_history', CURRENT_DATE + 1);

-- ============================================
-- Sample Data for Testing
-- ============================================

-- Insert sample stock quotes for testing
INSERT INTO stock_quotes_cache (symbol, market, name, last_price, change, change_percent, volume, high, low, open, previous_close, price_limit_up, price_limit_down)
VALUES 
  ('2330', 'TW', '台積電', 985.00, 15.00, 1.55, 28453, 988.00, 972.00, 975.00, 970.00, 1067.00, 873.00),
  ('2317', 'TW', '鴻海', 178.50, -2.50, -1.38, 45231, 182.00, 177.00, 181.00, 181.00, 199.10, 162.90),
  ('2454', 'TW', '聯發科', 1285.00, 35.00, 2.80, 5621, 1290.00, 1250.00, 1255.00, 1250.00, 1375.00, 1125.00),
  ('2881', 'TW', '富邦金', 85.60, 0.80, 0.94, 18234, 86.20, 84.80, 85.00, 84.80, 93.30, 76.30),
  ('2412', 'TW', '中華電', 132.50, 0.00, 0.00, 5432, 133.00, 132.00, 132.50, 132.50, 145.80, 119.30),
  ('2603', 'TW', '長榮', 198.00, 6.50, 3.39, 85432, 199.00, 191.00, 192.00, 191.50, 210.70, 172.40),
  ('2382', 'TW', '廣達', 312.00, 8.50, 2.80, 18923, 315.00, 303.00, 305.00, 303.50, 334.00, 273.00),
  ('3711', 'TW', '日月光投控', 168.00, 5.50, 3.38, 12543, 169.00, 162.00, 163.00, 162.50, 179.00, 146.00)
ON CONFLICT (symbol, market) DO UPDATE SET
  last_price = EXCLUDED.last_price,
  change = EXCLUDED.change,
  change_percent = EXCLUDED.change_percent,
  volume = EXCLUDED.volume,
  high = EXCLUDED.high,
  low = EXCLUDED.low,
  open = EXCLUDED.open,
  updated_at = NOW();

-- ============================================
-- Completion Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Trading System Database Schema Created Successfully!';
  RAISE NOTICE '- User credentials table: user_shioaji_credentials';
  RAISE NOTICE '- Connection management: shioaji_connections';
  RAISE NOTICE '- Trade orders: trade_orders (enhanced)';
  RAISE NOTICE '- Stock quotes cache: stock_quotes_cache (enhanced)';
  RAISE NOTICE '- Stock ticks history: stock_ticks_history (partitioned)';
  RAISE NOTICE '- Account balances: account_balances';
  RAISE NOTICE '- Audit logs: audit_logs';
  RAISE NOTICE '- Sample stock data inserted';
  RAISE NOTICE 'Ready for Shioaji integration!';
END $$;