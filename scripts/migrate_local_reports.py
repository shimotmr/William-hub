#!/usr/bin/env python3
"""
Migration script: Upload local .md reports to Supabase
Run: python3 scripts/migrate_local_reports.py
"""

import os
import re
import json
import subprocess
import glob
from pathlib import Path

# Config
DATA_DIR = Path.home() / "projects/William-hub" / "data"
SUPABASE_URL = "https://eznawjbgzmcnkxcisrjj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0"

def run_supabase_query(query):
    """Execute SQL via Supabase Management API"""
    token = json.load(open(os.path.expanduser("~/.openclaw/credentials/supabase-access-token.json")))['access_token']
    project = "eznawjbgzmcnkxcisrjj"
    
    cmd = [
        "curl", "-s", "-X", "POST",
        "-H", f"Authorization: Bearer {token}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"query": query}),
        f"https://api.supabase.com/v1/projects/{project}/database/query"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)

def get_existing_titles():
    """Get all existing report titles from Supabase"""
    result = run_supabase_query("SELECT LOWER(title) as title FROM reports")
    if isinstance(result, list):
        return set(item['title'] for item in result)
    return set()

def extract_metadata(content, filepath):
    """Extract title, author, date from markdown content"""
    # Extract title (first # header)
    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else Path(filepath).stem
    
    # Extract date
    date = None
    for pattern in [
        r'\*\*日期\*\*[：:]\s*(\d{4}-\d{2}-\d{2})',
        r'日期[：:]\s*(\d{4}-\d{2}-\d{2})',
        r'測試日期[：:]\s*(\d{4}-\d{2}-\d{2})',
        r'(\d{4}-\d{2}-\d{2})',
    ]:
        match = re.search(pattern, content)
        if match:
            date = match.group(1)
            break
    
    # Fallback: extract from filename
    if not date:
        filename_match = re.search(r'(\d{4}-\d{2}-\d{2})', filepath)
        if filename_match:
            date = filename_match.group(1)
    
    if not date:
        date = "2026-02-17"
    
    # Extract author
    author = "System"
    for pattern in [
        r'\*\*作者\*\*[：:]\s*(.+)',
        r'作者[：:]\s*(.+)',
        r'測試人員[：:]\s*(.+)',
    ]:
        match = re.search(pattern, content)
        if match:
            author = match.group(1).strip()
            break
    
    # Get category from path
    rel_path = filepath.replace(str(DATA_DIR), "").lstrip("/")
    category = rel_path.split("/")[0] if "/" in rel_path else "other"
    
    return {
        'title': title,
        'date': date,
        'author': author,
        'category': category,
        'content': content
    }

def main():
    print("=== Step 1: Get existing report titles from Supabase ===")
    existing_titles = get_existing_titles()
    print(f"Found {len(existing_titles)} existing reports in Supabase")
    
    print("\n=== Step 2: Scan local .md files ===")
    
    md_files = list(DATA_DIR.rglob("*.md"))
    print(f"Found {len(md_files)} .md files in {DATA_DIR}")
    
    to_upload = []
    skipped = []
    
    for mdfile in md_files:
        try:
            content = mdfile.read_text(encoding='utf-8')
            metadata = extract_metadata(content, str(mdfile))
            
            lower_title = metadata['title'].lower()
            
            if lower_title in existing_titles:
                print(f"SKIP: {metadata['title']} (already exists)")
                skipped.append(metadata['title'])
            else:
                print(f"UPLOAD: {metadata['title']} (date: {metadata['date']}, author: {metadata['author']}, category: {metadata['category']})")
                to_upload.append(metadata)
                existing_titles.add(lower_title)  # Prevent duplicates within this run
        except Exception as e:
            print(f"ERROR reading {mdfile}: {e}")
    
    print(f"\n=== Step 3: Insert new reports ===")
    print(f"Reports to upload: {len(to_upload)}")
    print(f"Reports to skip: {len(skipped)}")
    
    if to_upload:
        # Insert each report
        for report in to_upload:
            # Escape single quotes
            title_escaped = report['title'].replace("'", "''")
            author_escaped = report['author'].replace("'", "''")
            content_escaped = report['content'].replace("'", "''")
            
            query = f"""INSERT INTO reports (title, date, author, type, md_content, category, created_at, updated_at)
VALUES ('{title_escaped}', '{report['date']}', '{author_escaped}', 'md', '{content_escaped}', '{report['category']}', NOW(), NOW())"""
            
            try:
                result = run_supabase_query(query)
                print(f"✓ Inserted: {report['title']}")
            except Exception as e:
                print(f"✗ Failed to insert {report['title']}: {e}")
    
    print("\n=== Migration Complete ===")
    print(f"Uploaded: {len(to_upload)}")
    print(f"Skipped: {len(skipped)}")
    
    return len(to_upload), len(skipped)

if __name__ == "__main__":
    main()
