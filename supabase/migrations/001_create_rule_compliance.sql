-- Migration: Create rule_compliance table
-- Created: 2026-02-17
-- Purpose: Store rule compliance scan results for Hub /rules page

CREATE TABLE IF NOT EXISTS rule_compliance (
  id SERIAL PRIMARY KEY,
  rule_name TEXT NOT NULL,
  level TEXT CHECK (level IN ('RED', 'YELLOW', 'GREEN')),
  status TEXT CHECK (status IN ('complete', 'partial', 'dead')),
  binding_score INT DEFAULT 0,
  max_score INT DEFAULT 4,
  has_binding_section BOOLEAN DEFAULT FALSE,
  has_trigger BOOLEAN DEFAULT FALSE,
  has_executor BOOLEAN DEFAULT FALSE,
  has_verification BOOLEAN DEFAULT FALSE,
  missing_elements TEXT[] DEFAULT '{}',
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rule_name)
);

-- Enable Row Level Security
ALTER TABLE rule_compliance ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for Vercel deployment)
CREATE POLICY "Allow public read" ON rule_compliance
  FOR SELECT USING (true);

-- Allow service role write access
CREATE POLICY "Allow service role write" ON rule_compliance
  FOR ALL USING (true) WITH CHECK (true);
