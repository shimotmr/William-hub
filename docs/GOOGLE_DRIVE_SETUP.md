# Google Drive 同步設定完成報告

## 設定完成項目

### 1. 環境變數 ✅
已在 `/Users/travis/clawd/william-hub/.env.local` 設定：
```bash
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
GOOGLE_DRIVE_FOLDER_ID=YOUR_FOLDER_ID
```

### 2. Google Drive 資料夾 ✅
- **名稱**: Clawd Reports
- **ID**: `1VW37tr3FvsiyzNt7dIzCKU-p7oDr4tZK`
- **連結**: https://drive.google.com/drive/folders/1VW37tr3FvsiyzNt7dIzCKU-p7oDr4tZK
- **位置**: 根目錄（My Drive）

### 3. 資料庫遷移 ✅
已執行 `002_add_google_drive_fields.sql`，新增欄位：
- `google_drive_file_id` (TEXT) - Google Drive 檔案 ID
- `google_drive_link` (TEXT) - 直接連結
- `drive_sync_status` (TEXT) - 同步狀態（pending/synced/failed）
- `drive_synced_at` (TIMESTAMP) - 同步時間
- `drive_sync_error` (TEXT) - 錯誤訊息

### 4. 索引優化 ✅
- `idx_reports_drive_file_id` - 快速查詢 Drive ID
- `idx_reports_drive_sync_status` - 快速過濾同步狀態

## 使用方式

### API 端點
詳見 `/william-hub/docs/GOOGLE_DRIVE_SYNC.md`

### 單一上傳
```bash
POST /api/google-drive
Body: { reportId: 123 }
```

### 批量同步
```bash
PUT /api/google-drive
Body: { reportIds: [1, 2, 3, ...] }
```

### 檢查狀態
```bash
GET /api/google-drive?action=status
```

## 注意事項

### 檔名問題 ⚠️
目前 Drive 上有舊檔案使用 `report_數字.md` 格式（如 `report_587.md`）。
新上傳會使用正確的報告標題作為檔名。

**建議清理**：可考慮刪除舊檔案或保留作為歷史備份。

### Vercel 部署
如果部署到 Vercel，需在 Environment Variables 設定：
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID`

## 資料庫統計
- 總報告數：271 篇
- 已同步到 Drive：0 篇（待執行批量同步）

## 完成時間
2026-02-21 20:15

## 相關檔案
- 遷移檔案：`/william-hub/supabase/migrations/002_add_google_drive_fields.sql`
- API 文檔：`/william-hub/docs/GOOGLE_DRIVE_SYNC.md`
- 環境變數：`/william-hub/.env.local`
