# 戰情室 (War Room) - PWA 開發文檔

## 概述

戰情室是 William Hub PWA 的核心監控樞紐，提供即時系統監控、任務追蹤、Agent 活動監看和警報通知功能。

## 功能特性

### 1. 即時系統監控
- **Session 健康狀態**: 顯示活躍/總 sessions 數量
- **存儲空間**: 磁碟使用量監控 (含警告閾值)
- **系統運行時間**: 伺服器 uptime
- **自動刷新**: 每 15 秒自動更新

### 2. 任務狀態追蹤
- 整合看板 API，顯示執行中任務
- 優先級色彩標示 (P0-P3)
- 快速跳轉至任務詳情

### 3. Agent 活動面板
- 即時顯示所有 Agent 狀態
- 工作/閒置/離線狀態指示
- 每個 Agent 的活躍任務數

### 4. 警報通知中心
- P0-P3 分級顯示
- 未讀計數badge
- 快速查看更多警報

### 5. 離線支援
- PWA Service Worker 快取
- 離線狀態偵測與提示
- SessionStorage 資料緩存

## 技術實現

### 快取策略 (next-pwa)
```javascript
// API 請求 - 網絡優先，失敗時使用快取
{ urlPattern: /^https:\/\/.*\/api\/.*$/, handler: 'NetworkFirst' }

// 靜態資源 - CacheFirst
{ urlPattern: /^https:\/\/.*\.(js|css|woff|woff2|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/, handler: 'CacheFirst' }

// 圖片 - 長期快取
{ urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)$/, handler: 'CacheFirst' }
```

### 離線資料獲取
- 使用 `fetchWithCache` 函數包裝 API 請求
- 30 秒 TTL 快取，網路失敗時回退到 sessionStorage

### 響應式設計
- 行動裝置優化佈局
- 桌面端三欄顯示

## PWA 捷徑

Manifest 中已註冊戰情室快捷啟動：
- **名稱**: War Room (戰情室)
- **URL**: `/warroom`

## 頁面路由

- `/warroom` - 戰情室主頁面
- `/warroom` 可離線訪問（需Service Worker生效）

## 相關檔案

- `app/warroom/page.tsx` - 戰情室主頁面
- `app/components/SystemMonitor.tsx` - 系統監控組件
- `app/api/system-status/route.ts` - 系統狀態 API
- `app/api/agents/route.ts` - Agent 列表 API
- `app/api/board/status/route.ts` - 看板任務 API
- `app/api/alerts/route.ts` - 警報 API
- `public/manifest.json` - PWA 配置

## 更新日誌

### 2025-02-25
- 初始版本發布
- 整合系統監控、任務追蹤、Agent 活動、警報通知
- PWA 離線支援
- 響應式設計
