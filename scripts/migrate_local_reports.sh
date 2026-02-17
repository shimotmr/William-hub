#!/bin/bash
# Migration script: Upload local .md reports to Supabase
# Run from ~/projects/William-hub directory

set -e

DATA_DIR="$HOME/projects/William-hub/data"
SQL_SCRIPT="/tmp/migrate_reports_$$.sql"
TITLES_FILE="/tmp/existing_titles_$$.txt"

echo "=== Step 1: Get existing report titles from Supabase ==="
~/clawd/scripts/supabase_sql.sh "SELECT LOWER(title) as title FROM reports" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data:
    print(item['title'])
" > "$TITLES_FILE"

EXISTING_TITLES=$(cat "$TITLES_FILE" | sort | uniq)
echo "Found $(echo "$EXISTING_TITLES" | wc -l) existing reports in Supabase"

echo "=== Step 2: Scan local .md files ==="

# Create SQL script to insert new reports
echo "BEGIN;" > "$SQL_SCRIPT"

UPLOADED=0
SKIPPED=0

for mdfile in $(find "$DATA_DIR" -name "*.md" -type f); do
    # Extract title from first # header
    TITLE=$(head -n 50 "$mdfile" | grep -m1 "^# " | sed 's/^# //' | sed 's/"/\\"/g' | sed "s/'/\\'/g")
    
    if [ -z "$TITLE" ]; then
        TITLE=$(basename "$mdfile" .md)
    fi
    
    # Extract date - try various patterns
    DATE=$(grep -om1 "日期[：:]\s*[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}" "$mdfile" | grep -o "[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}" | head -1)
    if [ -z "$DATE" ]; then
        DATE=$(grep -om1 "測試日期[：:]\s*[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}" "$mdfile" | grep -o "[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}" | head -1)
    fi
    if [ -z "$DATE" ]; then
        DATE=$(echo "$mdfile" | grep -o "[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}" | head -1)
    fi
    if [ -z "$DATE" ]; then
        DATE="2026-02-17"  # fallback
    fi
    
    # Extract author
    AUTHOR=$(grep -om1 "作者[：:]\s*[^\n]*" "$mdfile" | head -1 | sed 's/作者[：:]\s*//')
    if [ -z "$AUTHOR" ]; then
        AUTHOR=$(grep -om1 "測試人員[：:]\s*[^\n]*" "$mdfile" | head -1 | sed 's/測試人員[：:]\s*//')
    fi
    if [ -z "$AUTHOR" ]; then
        AUTHOR="System"
    fi
    AUTHOR=$(echo "$AUTHOR" | sed 's/"/\\"/g' | sed "s/'/\\'/g")
    
    # Check if title already exists (case-insensitive)
    LOWER_TITLE=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]')
    
    if echo "$EXISTING_TITLES" | grep -q "^${LOWER_TITLE}$"; then
        echo "SKIP: $TITLE (already exists)"
        SKIPPED=$((SKIPPED + 1))
    else
        # Get category from path
        CATEGORY=$(echo "$mdfile" | sed "s|$DATA_DIR/||" | cut -d'/' -f1)
        
        # Read full content
        CONTENT=$(cat "$mdfile" | sed 's/"/\\"/g' | sed "s/'/\\'/g")
        
        # Escape for SQL
        TITLE_ESC=$(echo "$TITLE" | sed 's/"/\\"/g' | sed "s/'/\\\\'/g")
        
        cat >> "$SQL_SCRIPT" << EOF
INSERT INTO reports (title, date, author, type, md_content, category, created_at, updated_at)
VALUES ('$TITLE_ESC', '$DATE', '$AUTHOR', 'md', '$CONTENT', '$CATEGORY', NOW(), NOW());
EOF
        echo "UPLOAD: $TITLE (date: $DATE, author: $AUTHOR, category: $CATEGORY)"
        UPLOADED=$((UPLOADED + 1))
    fi
done

echo "COMMIT;" >> "$SQL_SCRIPT"

echo ""
echo "=== Step 3: Execute migration ==="
echo "Reports to upload: $UPLOADED"
echo "Reports to skip: $SKIPPED"

if [ $UPLOADED -gt 0 ]; then
    echo "Executing SQL..."
    cat "$SQL_SCRIPT" | ~/clawd/scripts/supabase_sql.sh "$(cat $SQL_SCRIPT)" 2>&1 || true
    # The supabase_sql.sh doesn't read from stdin, let's use a different approach
    ~/clawd/scripts/supabase_sql.sh "$(cat $SQL_SCRIPT)"
else
    echo "No new reports to upload."
fi

# Cleanup
rm -f "$SQL_SCRIPT" "$TITLES_FILE"

echo ""
echo "=== Migration Complete ==="
echo "Uploaded: $UPLOADED"
echo "Skipped: $SKIPPED"
