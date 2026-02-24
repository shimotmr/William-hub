-- Add Google Drive sync fields to reports table
-- Migration: 002_add_google_drive_fields.sql
-- Date: 2026-02-21

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS google_drive_file_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_link TEXT,
ADD COLUMN IF NOT EXISTS drive_sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS drive_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS drive_sync_error TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_drive_file_id ON reports(google_drive_file_id);
CREATE INDEX IF NOT EXISTS idx_reports_drive_sync_status ON reports(drive_sync_status);

-- Add comments
COMMENT ON COLUMN reports.google_drive_file_id IS 'Google Drive file ID from upload';
COMMENT ON COLUMN reports.google_drive_link IS 'Direct link to Google Drive file';
COMMENT ON COLUMN reports.drive_sync_status IS 'Sync status: pending, synced, failed';
COMMENT ON COLUMN reports.drive_synced_at IS 'Last successful sync timestamp';
COMMENT ON COLUMN reports.drive_sync_error IS 'Error message if sync failed';
