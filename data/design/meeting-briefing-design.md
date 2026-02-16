# 會議自動 Briefing 功能設計

## 功能概述

當 William 有即將到來的會議時，系統自動整理相關背景資料、歷史紀錄、待辦事項，生成會前簡報，並透過適當管道（Telegram/LINE）推送通知。

### 核心價值
- **節省準備時間**：自動收集分散在郵件、行事曆、任務看板的資訊
- **避免遺漏**：系統化整理前次會議結論、待處理事項
- **適應行動場景**：通勤、出差時也能快速掌握會議重點

---

## 資料來源定義

### 1. Google Calendar 事件
**來源**: Google Calendar API
**資料欄位**:
- 會議標題、時間、地點
- 與會者清單（email + 姓名）
- 會議說明（description）
- 附件連結（Google Meet、文件）
- 重複會議的序列 ID

**取得方式**:
```javascript
calendar.events.list({
  calendarId: 'primary',
  timeMin: now,
  timeMax: now + 24h,
  singleEvents: true,
  orderBy: 'startTime'
})
```

### 2. 相關郵件
**來源**: Gmail API + Zimbra SOAP API

**篩選條件**:
- 主旨包含會議關鍵字（與會者姓名、公司名、會議標題關鍵字）
- 寄件人/收件人包含與會者 email
- 時間範圍：會議前 7 天內

**資料欄位**:
- 主旨、寄件人、日期
- 摘要（前 200 字）
- 附件清單

**取得方式**:
```javascript
// Gmail
gmail.users.messages.list({
  q: `from:(${attendee_email}) OR to:(${attendee_email}) after:${7_days_ago}`
})

// Zimbra
SearchRequest with query: 
"from:(${attendee_email}) OR to:(${attendee_email}) after:-7days"
```

### 3. 看板任務
**來源**: Supabase `board_tasks` 表

**篩選條件**:
- `tags` 包含與會者名稱、公司名
- `title` 或 `description` 包含會議關鍵字
- `status` 為「待執行」或「執行中」

**SQL 範例**:
```sql
SELECT id, title, status, priority, due_date, description
FROM board_tasks
WHERE (tags ILIKE '%客戶名%' OR title ILIKE '%客戶名%')
  AND status IN ('待執行', '執行中')
ORDER BY priority DESC, due_date ASC
```

### 4. 記憶檔案
**來源**: Supabase `memories` 表

**篩選條件**:
- `tags` 包含與會者、公司、會議主題標籤
- `memory_type` 為「會議紀錄」、「客戶資訊」、「專案資訊」
- 按 `created_at` 排序（最新優先）

**SQL 範例**:
```sql
SELECT content, tags, memory_type, created_at
FROM memories
WHERE tags && ARRAY['客戶名', '公司名', '專案名']
ORDER BY created_at DESC
LIMIT 5
```

---

## Briefing 模板設計

### 模板結構
```markdown
# 📋 會議簡報：{會議標題}

## 📅 基本資訊
- **時間**: {日期} {星期} {時間} ({時區})
- **地點/連結**: {實體地點 或 Google Meet 連結}
- **與會者**: 
  - {姓名1} ({公司/職稱})
  - {姓名2} ({公司/職稱})
- **會議形式**: {首次會議/定期會議/專案討論}

---

## 🎯 會議議題
{從 Calendar 說明或前次會議紀錄推測}
- 議題 1
- 議題 2

---

## 📝 前次會議結論（如有）
**日期**: {上次會議日期}

**關鍵決議**:
- 決議 1
- 決議 2

**待處理事項**:
- [ ] 事項 1 (負責人：XXX，期限：YYYY-MM-DD)
- [x] 事項 2 (已完成)

---

## 📧 相關郵件（近 7 天）
1. **{主旨}** - {寄件人} ({日期})
   - 摘要：{前 100 字}
   
2. **{主旨}** - {寄件人} ({日期})
   - 摘要：{前 100 字}

---

## ✅ 相關任務
| ID | 任務 | 狀態 | 優先級 | 期限 |
|----|------|------|--------|------|
| #123 | 完成報價單 | 執行中 | 🔴 高 | 2026-02-20 |
| #124 | 準備 demo 環境 | 待執行 | 🟡 中 | 2026-02-25 |

---

## 💡 背景資訊
{從記憶檔案提取}

**客戶背景**:
- 公司規模、產業、主要需求

**專案狀態**:
- 目前進度、痛點、下一步

**歷史互動**:
- 上次拜訪日期、主要聯絡人、合作狀態

---

## ⚠️ 注意事項
- {從郵件/任務中識別的風險或緊急事項}
- {需要攜帶的文件/資料}

---

_此簡報由 Secretary Agent 自動生成於 {生成時間}_
```

---

## 完整模板範例

```markdown
# 📋 會議簡報：Aurotek 與 ABC 科技 Q1 專案檢討

## 📅 基本資訊
- **時間**: 2026-02-18 (二) 14:00-15:00 (GMT+8)
- **地點/連結**: Google Meet - https://meet.google.com/abc-defg-hij
- **與會者**: 
  - 張大明 (ABC 科技 / 技術總監)
  - 李小華 (ABC 科技 / 專案經理)
  - William Hsiao (Aurotek / 業務)
  - 林工程師 (Aurotek / 技術支援)
- **會議形式**: 定期會議（每月第三週）

---

## 🎯 會議議題
- Q1 專案進度檢視（目標達成率 85%）
- 第二階段需求討論
- 技術問題解決方案（API 整合延遲問題）
- Q2 合作計畫

---

## 📝 前次會議結論
**日期**: 2026-01-15

**關鍵決議**:
- 確認採用 RESTful API 架構
- 3 月底前完成第一階段交付
- 每週五提供進度報告

**待處理事項**:
- [x] 提供 API 文件 v2.0 (William, 2026-01-20) - 已於 1/18 完成
- [ ] 安排技術團隊會議 (李小華, 2026-02-10) - 尚未確認
- [x] 報價單修訂 (William, 2026-01-25) - 已於 1/22 寄出

---

## 📧 相關郵件（近 7 天）
1. **Re: API 整合測試問題** - 張大明 (2026-02-14)
   - 摘要：測試環境發現 timeout 問題，建議將 response time 從 30s 延長到 60s，請確認是否影響架構設計...
   
2. **Q2 合作提案初稿** - 李小華 (2026-02-12)
   - 摘要：附上 Q2 合作提案初稿，預計擴大導入範圍至 5 個部門，預算約 NTD 800 萬，希望下次會議討論...

3. **週進度報告 W06** - 林工程師 (2026-02-11)
   - 摘要：本週完成 Module A 測試，發現 3 個 minor bugs 已修復，下週進入 Module B 整合測試...

---

## ✅ 相關任務
| ID | 任務 | 狀態 | 優先級 | 期限 |
|----|------|------|--------|------|
| #156 | 解決 ABC 科技 API timeout 問題 | 執行中 | 🔴 高 | 2026-02-17 |
| #162 | 準備 Q2 提案簡報 | 待執行 | 🟡 中 | 2026-02-18 |
| #145 | ABC 科技專案月報（2月） | 待執行 | 🟢 低 | 2026-02-28 |

---

## 💡 背景資訊

**客戶背景**:
- ABC 科技為中型軟體公司，員工約 200 人
- 主要業務：企業 SaaS 解決方案
- 痛點：既有系統整合困難、開發效率低

**專案狀態**:
- 目前進度：85% (原訂 90%)
- 主要延遲原因：API 整合測試發現技術問題
- 客戶滿意度：中等（對進度略有擔憂）
- 下一步：確認技術解決方案，討論 Q2 擴大合作

**歷史互動**:
- 合作起始：2025-09-15
- 上次實體拜訪：2025-12-20（台北總部）
- 主要聯絡人：張大明（技術決策）、李小華（專案執行）
- 付款狀態：第一期款已收（2025-10-30）

---

## ⚠️ 注意事項
- ⚠️ **緊急**：#156 任務需在會議前完成，避免客戶質疑技術能力
- 📄 需攜帶：Q2 提案簡報、API 問題解決方案文件
- 💰 商機：客戶有意願擴大合作，Q2 預算 800 萬需準備提案
- 🤝 關係維護：客戶對進度略有擔憂，需強調解決問題的積極度

---

_此簡報由 Secretary Agent 自動生成於 2026-02-18 13:00_
```

---

## 觸發機制設計

### 觸發時機選項

| 時機 | 優點 | 缺點 | 適用場景 |
|------|------|------|----------|
| **會議前 1 小時** | 資訊最即時 | 通勤中可能無暇閱讀 | 辦公室內會議 |
| **會議前 2 小時** | 有充裕時間準備 | 可能忘記查看 | 重要會議 |
| **當天早上 8:00** | 符合晨間習慣 | 下午會議資訊可能不夠新 | 全天會議整理 |
| **前一晚 20:00** | 可利用晚間通勤時間閱讀 | 隔天可能有變動 | 次日重要會議 |

### 推薦策略：**動態觸發**

根據會議時間自動調整：

```javascript
function calculateBriefingTime(meetingStartTime) {
  const meetingHour = meetingStartTime.getHours();
  
  // 早上會議 (8:00-12:00) → 前一晚 20:00
  if (meetingHour >= 8 && meetingHour < 12) {
    return previousDay(meetingStartTime).setHours(20, 0);
  }
  
  // 下午會議 (13:00-18:00) → 當天 8:00
  if (meetingHour >= 13 && meetingHour < 18) {
    return sameDay(meetingStartTime).setHours(8, 0);
  }
  
  // 晚間會議 (18:00-) → 會議前 2 小時
  return new Date(meetingStartTime - 2 * 60 * 60 * 1000);
}
```

### 手動觸發
額外提供指令：
```
/briefing [會議ID]  # 立即生成指定會議簡報
/briefing today     # 生成今日所有會議簡報
/briefing tomorrow  # 生成明日所有會議簡報
```

---

## 推送管道設計

### 優先順序
1. **Telegram** (主要) - 適合移動查看、支援 Markdown
2. **LINE** (備用) - William 也有使用
3. **Email** (存檔) - 同時寄送到 williamhsiao@aurotek.com 留存

### 訊息格式
```
📋 會議提醒：{會議標題}

⏰ {日期} {時間}
👥 與會者：{人數}人

{簡短摘要（100字內）}

🔗 完整簡報：{連結或附件}
```

### 特殊場景處理
- **出差時**：包含時區轉換提醒
- **首次會議**：加強客戶背景資訊
- **定期會議**：強調前次結論與待辦追蹤

---

## API 整合評估

### 必要整合

| API | 用途 | 優先級 | 現有工具 | 預估工時 |
|-----|------|--------|----------|----------|
| **Google Calendar API** | 取得會議清單與詳情 | 🔴 P0 | 有（OAuth 已設定） | 2 天 |
| **Gmail API** | 搜尋相關郵件 | 🔴 P0 | 有（OAuth 已設定） | 2 天 |
| **Zimbra SOAP API** | 搜尋 Aurotek 郵件 | 🟡 P1 | 有（credentials 已設定） | 3 天 |
| **Supabase REST API** | 查詢任務與記憶 | 🔴 P0 | 有（supabase_sql.sh） | 1 天 |
| **Telegram Bot API** | 推送通知 | 🔴 P0 | 有（message tool） | 1 天 |

### 選用整合

| API | 用途 | 優先級 | 預估工時 |
|-----|------|--------|----------|
| **LINE Messaging API** | 備用推送管道 | 🟢 P2 | 1 天 |
| **Google Meet API** | 取得會議錄影/逐字稿 | 🟢 P2 | 3 天 |
| **OpenAI API** | 郵件摘要生成 | 🟢 P2 | 2 天 |

---

## 技術架構設計

### 系統流程圖
```
┌─────────────────┐
│  Cron Job       │  每 30 分鐘執行
│  (Node.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Calendar Scanner           │
│  - 掃描未來 24 小時會議     │
│  - 檢查是否已生成 briefing  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Briefing Generator         │
│  1. 呼叫 Calendar API       │
│  2. 搜尋相關郵件 (並行)    │
│  3. 查詢任務看板 (並行)    │
│  4. 查詢記憶檔案 (並行)    │
│  5. 組裝 Markdown 模板      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Delivery Service           │
│  - Telegram 推送            │
│  - Email 備份               │
│  - 記錄到 Supabase          │
└─────────────────────────────┘
```

### 資料庫設計

新增表：`meeting_briefings`
```sql
CREATE TABLE meeting_briefings (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(255) NOT NULL,  -- Google Calendar Event ID
  meeting_title TEXT,
  meeting_start TIMESTAMP,
  generated_at TIMESTAMP DEFAULT NOW(),
  briefing_content TEXT,  -- Markdown 內容
  delivered_via JSONB,    -- ["telegram", "email"]
  status VARCHAR(50),     -- generated, delivered, failed
  UNIQUE(meeting_id)
);
```

---

## 實作計畫

### Phase 1：基礎功能（1 週內完成）
**目標**: 實現核心 briefing 生成與推送

**範圍**:
- ✅ Google Calendar 事件讀取
- ✅ 基礎模板生成（會議資訊 + 與會者）
- ✅ Telegram 推送
- ✅ 手動觸發指令 `/briefing today`

**技術任務**:
1. 建立 `~/clawd/secretary/briefing-generator.js`
2. 實作 Calendar API 讀取函式
3. 實作 Markdown 模板組裝
4. 整合 Telegram 推送
5. 測試：建立測試會議，手動觸發生成

**驗收標準**:
- 可成功讀取今日會議
- 生成包含基本資訊的 Markdown 簡報
- Telegram 收到推送通知

---

### Phase 2：資料整合（1-2 週）
**目標**: 整合郵件、任務、記憶資料

**範圍**:
- ✅ Gmail + Zimbra 郵件搜尋
- ✅ Supabase 任務查詢
- ✅ Supabase 記憶查詢
- ✅ 資料去重與排序邏輯

**技術任務**:
1. 實作郵件搜尋（關鍵字提取、與會者匹配）
2. 實作任務查詢（tag 匹配邏輯）
3. 實作記憶查詢（相關性排序）
4. 優化模板：整合所有資料來源
5. 測試：使用真實會議資料驗證

**驗收標準**:
- 能找到相關郵件（準確率 > 70%）
- 能匹配相關任務
- 能提取相關記憶

---

### Phase 3：自動觸發（1 週）
**目標**: 實現自動定時生成與推送

**範圍**:
- ✅ Cron Job 排程
- ✅ 動態觸發時機計算
- ✅ 重複生成防護
- ✅ 錯誤處理與重試

**技術任務**:
1. 建立 Cron Job (`*/30 * * * *` 每 30 分鐘)
2. 實作 `meeting_briefings` 表與去重邏輯
3. 實作動態觸發時機演算法
4. 加入錯誤日誌與 Telegram 異常通知
5. 測試：運行 24 小時觀察穩定性

**驗收標準**:
- Cron Job 穩定運行
- 同一會議不重複生成
- 錯誤時發送通知給 William

---

### Phase 4：智慧優化（2-3 週）
**目標**: AI 摘要與個人化

**範圍**:
- ✅ OpenAI API 整合（郵件摘要）
- ✅ 前次會議紀錄自動匹配
- ✅ 風險與注意事項自動識別
- ✅ 個人化建議（根據歷史行為）

**技術任務**:
1. 整合 OpenAI API 生成郵件摘要
2. 實作前次會議匹配邏輯（定期會議序列、主題相似度）
3. 實作風險識別（逾期任務、緊急郵件）
4. A/B 測試模板格式

**驗收標準**:
- 郵件摘要精準且簡潔
- 能自動匹配 80% 定期會議的前次紀錄
- 風險提示準確（誤報率 < 20%）

---

### Phase 5：進階功能（未來規劃）
- 語音簡報（TTS）
- 會議後自動追蹤（待辦事項提醒）
- 與會者背景即時更新（LinkedIn 整合）
- 多語言支援（英文會議）

---

## 行動場景考量

### 通勤時間長
- **推送時機**: 利用晚間通勤（19:00-20:00）推送次日早會簡報
- **格式優化**: Telegram 優先，支援離線閱讀
- **長度控制**: 摘要版 < 500 字，完整版連結

### 常出差
- **時區提醒**: 自動偵測會議時區，顯示當地時間與台北時間
  ```
  ⏰ 2026-02-18 14:00 (GMT+8 台北)
     = 2026-02-18 07:00 (GMT+1 柏林) ← 您目前位置
  ```
- **離線支援**: Email 備份附帶 PDF 附件
- **網路彈性**: 失敗自動重試 3 次，間隔 5/10/15 分鐘

### 多裝置同步
- Telegram 桌面版 + 手機版同步
- Email 作為永久存檔

---

## 風險與應對

| 風險 | 影響 | 應對措施 |
|------|------|----------|
| **API 配額超限** | 無法生成 briefing | 實作快取機制、降低掃描頻率 |
| **郵件搜尋不準確** | 資訊遺漏 | 人工回饋機制、優化關鍵字演算法 |
| **時區計算錯誤** | 錯過會議 | 多重驗證、顯示多時區 |
| **個資外洩** | 合規問題 | Supabase RLS、Telegram 加密、不記錄敏感內容 |
| **系統當機** | 漏發通知 | 健康檢查、異常告警、手動補發指令 |

---

## 成功指標

### 量化指標
- **使用率**: 80% 的會議自動生成簡報
- **準確率**: 相關資料匹配準確率 > 75%
- **及時性**: 99% 在預定時間推送
- **滿意度**: William 主觀評分 > 4/5

### 質化指標
- 減少會前手動整理資料時間
- 提升會議準備充分度
- 降低遺漏重要資訊的次數

---

## 附錄：技術細節

### 關鍵字提取邏輯
```javascript
function extractKeywords(meeting) {
  const keywords = new Set();
  
  // 從標題提取
  const title = meeting.summary;
  keywords.add(title);
  
  // 提取公司名（常見模式）
  const companyPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(科技|股份|有限|公司|Corp|Inc|Ltd)/g;
  const companies = title.match(companyPattern);
  if (companies) companies.forEach(c => keywords.add(c));
  
  // 提取與會者姓名與 domain
  meeting.attendees.forEach(attendee => {
    keywords.add(attendee.email);
    const domain = attendee.email.split('@')[1];
    keywords.add(domain);
  });
  
  return Array.from(keywords);
}
```

### 郵件相關性評分
```javascript
function scoreEmailRelevance(email, meeting) {
  let score = 0;
  const keywords = extractKeywords(meeting);
  
  // 主旨匹配 (+3 分/關鍵字)
  keywords.forEach(kw => {
    if (email.subject.includes(kw)) score += 3;
  });
  
  // 寄件人匹配 (+5 分)
  if (meeting.attendees.some(a => a.email === email.from)) {
    score += 5;
  }
  
  // 時間接近度 (越近越高，最高 +5 分)
  const daysDiff = Math.abs(email.date - meeting.start) / (1000 * 60 * 60 * 24);
  score += Math.max(0, 5 - daysDiff);
  
  return score;
}
```

---

**文件版本**: v1.0  
**建立日期**: 2026-02-15  
**作者**: Secretary Agent  
**下次審查**: Phase 1 完成後
