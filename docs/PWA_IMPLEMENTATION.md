# William Hub PWA 實作文檔

## 概述
本文件記錄 William Hub PWA 改造的實作細節，符合 SRD Phase3 規格要求。

## 實作內容

### 1. PWA 核心功能

#### Service Worker
- 使用 `next-pwa` 套件自動生成 Service Worker
- 註冊於 `public/sw.js`
- 支援離線緩存和網絡優先策略

#### manifest.json
- 路徑: `/manifest.json`
- 應用名稱: William Hub
- 顯示模式: standalone (可安裝到主畫面)
- 主題顏色: #4F46E5 (Indigo)
- 支援的圖示尺寸: 72x72 到 512x512

### 2. 緩存策略

| 資源類型 | 策略 | 過期時間 |
|---------|------|----------|
| 靜態資源 (JS, CSS, Fonts) | CacheFirst | 30 天 |
| API 請求 | NetworkFirst | 1 天 |
| 圖片 | CacheFirst | 30 天 |
| Supabase 請求 | NetworkFirst | 1 天 |

### 3. 安裝支援

#### 桌面端 (Chrome, Edge, Firefox)
- 瀏覽器會自動檢測 PWA 並顯示安裝提示
- 使用者可將應用安裝到系統

#### 行動端 (iOS Safari, Android Chrome)
- iOS: 使用 Safari 的「分享 > 加入主畫面」
- Android: 自動顯示安裝提示或使用 Chrome 選單

### 4. 離線支援

- 離線頁面: `/offline`
- 緩存的靜態資源可在離線時存取
- API 請求在離線時會顯示離線提示

## 檔案結構

```
William-hub/
├── public/
│   ├── manifest.json          # PWA 清單
│   ├── favicon.ico            # 網站圖示
│   ├── icons/                 # PWA 圖示
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   └── ...
│   └── sw.js                  # Service Worker (建置時生成)
│   └── workbox-*.js           # Workbox 庫 (建置時生成)
├── app/
│   ├── layout.tsx             # 已更新 PWA meta 標籤
│   └── offline/
│       └── page.tsx           # 離線提示頁面
├── next.config.js             # 已更新 PWA 配置
└── scripts/
    └── generate-icons.js      # 圖示生成腳本
```

## 驗收標準

- [x] PWA 可安裝到桌面/手機
- [x] 離線功能正常
- [x] 符合 SRD 規格要求
- [x] 完整文檔和測試

## 建置與測試

### 建置 PWA
```bash
cd ~/clawd/William-hub
npm run build
```

### 開發模式測試
```bash
npm run dev
# 訪問 http://localhost:3000
# 打開 DevTools > Application > Service Workers 檢查
```

### Lighthouse 測試
```bash
npx lighthouse http://localhost:3000 --view
```

## 已知限制

1. 開發模式下 PWA 功能預設關閉
2. 某些 API 請求可能需要網絡連線才能正常工作
3. iOS Safari 不支援部分 PWA 功能

## 實作者
- Blake Subagent (task-1134-pwa)

## 完成時間
- 2026-02-25
