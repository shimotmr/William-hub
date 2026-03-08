-- WeCom Classifier Tables (Safe Migration)
-- Migration: 003_create_wecom_tables.sql

-- Companies table
CREATE TABLE IF NOT EXISTS wecom_companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT NOW(),
  updated_at TEXT NOT NULL DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS wecom_conversations (
  external_userid TEXT PRIMARY KEY,
  open_kfid TEXT,
  company_id INTEGER,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT NOW(),
  updated_at TEXT NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS wecom_messages (
  id SERIAL PRIMARY KEY,
  msg_id TEXT,
  external_userid TEXT NOT NULL,
  open_kfid TEXT,
  msg_type TEXT,
  sender_name TEXT,
  content TEXT,
  send_time INTEGER,
  source_event TEXT NOT NULL,
  parent_msg_id TEXT,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT NOW(),
  UNIQUE(msg_id, source_event, sender_name, send_time)
);

-- Notes table
CREATE TABLE IF NOT EXISTS wecom_notes (
  id SERIAL PRIMARY KEY,
  external_userid TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wecom_messages_external_userid ON wecom_messages(external_userid);
CREATE INDEX IF NOT EXISTS idx_wecom_messages_send_time ON wecom_messages(send_time);
CREATE INDEX IF NOT EXISTS idx_wecom_messages_msg_type ON wecom_messages(msg_type);
CREATE INDEX IF NOT EXISTS idx_wecom_notes_external_userid ON wecom_notes(external_userid);
CREATE INDEX IF NOT EXISTS idx_wecom_conversations_company_id ON wecom_conversations(company_id);

-- Enable RLS
ALTER TABLE wecom_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE wecom_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wecom_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wecom_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "wecom_companies_select" ON wecom_companies FOR SELECT USING (true);
CREATE POLICY "wecom_companies_insert" ON wecom_companies FOR INSERT WITH CHECK (true);
CREATE POLICY "wecom_companies_update" ON wecom_companies FOR UPDATE USING (true);

CREATE POLICY "wecom_conversations_select" ON wecom_conversations FOR SELECT USING (true);
CREATE POLICY "wecom_conversations_insert" ON wecom_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "wecom_conversations_update" ON wecom_conversations FOR UPDATE USING (true);

CREATE POLICY "wecom_messages_select" ON wecom_messages FOR SELECT USING (true);
CREATE POLICY "wecom_messages_insert" ON wecom_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "wecom_notes_select" ON wecom_notes FOR SELECT USING (true);
CREATE POLICY "wecom_notes_insert" ON wecom_notes FOR INSERT WITH CHECK (true);
