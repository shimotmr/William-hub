# Skills 調研報告 — LINE Bot / 爬蟲 / 預測模型

**日期**：2026-02-15  
**調研範圍**：ClawHub + 開源社群  
**目的**：為經銷商智能助理系統尋找合適的技能和工具

---

## 📱 LINE Bot 開發

### 官方工具
- **@line/bot-sdk** (Node.js)
  - 官方維護的 SDK
  - 完整支援 Messaging API webhook
  - 文檔：https://line.github.io/line-bot-sdk-nodejs/
  - 成熟度：⭐⭐⭐⭐⭐

### ClawHub Skills
- ❌ **未找到 LINE 專用 Skill**
- ✅ **參考架構**：BlueBubbles skill（messaging webhook 架構）
  - 路徑：`openclaw/skills/skills/kevin19830331/bluebubbles/`
  - 可借鑑 webhook 處理邏輯

### 建議
**自行開發 LINE Bot Skill**，參考：
1. BlueBubbles skill 的 webhook 架構
2. Discord skill 的訊息處理流程
3. OpenClaw 官方的 Telegram plugin

---

## 🕷️ 網站爬蟲

### 工具比較

| 工具 | 適用場景 | 優勢 | 劣勢 |
|------|---------|------|------|
| **Playwright** | 動態網頁、SPA、需 JS 渲染 | 跨瀏覽器、穩定、官方維護 | 資源消耗大 |
| **Puppeteer** | Chrome 專用、簡單自動化 | 輕量、Chrome DevTools 整合 | 只支援 Chrome 系 |
| **Cheerio** | 靜態 HTML、API 回傳的 HTML | 極快、低資源 | 不支援 JS 渲染 |

### ClawHub Skills
✅ **playwright-cli** — `openclaw/skills/skills/gumadeiras/playwright-cli/`
- 已有現成 skill！
- 支援頁面開啟、元素互動、截圖
- 適合動態網頁爬取

### 建議
1. **優先使用 playwright-cli skill**（已存在）
2. 若目標網站是靜態 HTML，用 Cheerio（更快）
3. 普渡官網、紛享銷客可能需要 Playwright

---

## 📈 預測模型

### Python 框架（推薦）

| 框架 | 適用場景 | 學習曲線 | 維護狀態 |
|------|---------|---------|---------|
| **Prophet (Meta)** | 時序預測、業務數據 | 低（自動化高） | ✅ 活躍 |
| **ARIMA (statsmodels)** | 經典時序、學術 | 中（需調參） | ✅ 活躍 |
| **混合模型** | ARIMA + Prophet | 中高 | 研究階段 |

### Node.js 選項
- **arima** (npm package)
  - GitHub：https://github.com/zemlyansky/arima
  - 功能：ARIMA, SARIMA, SARIMAX, AutoARIMA
  - ⚠️ 成熟度不如 Python 版本

### ClawHub Skills
❌ **未找到庫存預測或時序預測 Skill**

### 建議
1. **用 Python + Prophet** — 最適合庫存預測
   - 自動處理節假日、趨勢、季節性
   - Meta 官方維護
2. **透過 exec 或 subprocess 呼叫 Python 腳本**
3. **未來考慮封裝成 OpenClaw Skill**

---

## 🎯 推薦安裝清單

### 立即可用
1. ✅ **playwright-cli** — 爬蟲基礎建設
2. ✅ **web-search** (已安裝) — 產品資訊搜尋
3. ✅ **brave-search** (已安裝) — 備用搜尋引擎

### 需自行開發
1. **LINE Bot Skill** — 參考 BlueBubbles 架構
2. **庫存預測 Skill** — 封裝 Python Prophet

### 需外部安裝
1. **Python Prophet** — `pip install prophet`
2. **@line/bot-sdk** — `npm install @line/bot-sdk`

---

## 📌 後續行動

### 短期（本週）
1. 安裝 playwright-cli skill
2. 測試紛享銷客網站爬蟲可行性
3. 評估 Prophet 安裝與庫存數據格式

### 中期（2 週內）
1. 開發 LINE Bot Skill（Phase 0）
2. 建立爬蟲 SOP（哪些網站、更新頻率）
3. Prophet 預測模型 PoC

### 長期
1. 將爬蟲+預測流程封裝成獨立 Skills
2. 發布到 ClawHub 供社群使用

---

## 🔍 參考資料

### LINE Bot
- 官方文檔：https://developers.line.biz/en/docs/messaging-api/
- Node.js SDK：https://line.github.io/line-bot-sdk-nodejs/

### 爬蟲
- Playwright vs Puppeteer：https://proxyway.com/guides/cheerio-vs-puppeteer-for-web-scraping
- Best Node.js Scrapers 2026：https://www.scrapingbee.com/blog/best-node-js-web-scrapers/

### 預測模型
- Prophet 文檔：https://facebook.github.io/prophet/
- ARIMA Tutorial：https://www.influxdata.com/blog/python-ARIMA-tutorial-influxDB/
- 混合模型論文：https://www.sciencedirect.com/science/article/pii/S2590123025017748

---

**調研者**：Travis (Researcher)  
**完成時間**：2026-02-15 09:03
