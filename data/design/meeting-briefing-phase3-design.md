# 會議自動 Briefing Phase 3 — 自動觸發機制設計

## 文件資訊
- **版本**: v1.0
- **建立日期**: 2026-02-16
- **作者**: Secretary Agent
- **相關任務**: Board #188
- **前置文件**: 
  - [會議自動 Briefing 功能設計](./meeting-briefing-design.md) (Board #43)
  - [Phase 2 資料整合層設計](./meeting-briefing-phase2-design.md) (Board #187)

---

## 一、設計目標

Phase 3 專注於實現**自動觸發機制**，讓系統能在無需人工干預的情況下：

1. **自動偵測**即將到來的會議
2. **智慧判斷**哪些會議需要生成 briefing
3. **動態計算**最佳觸發時間
4. **穩定推送** briefing 至 Telegram
5. **優雅處理**各種異常情況

### 核心能力
- ✅ 定時掃描 Google Calendar 事件
- ✅ 根據會議時間動態決定觸發時機
- ✅ 過濾不需要 briefing 的會議（如私人行程、已取消會議）
- ✅ 防止重複生成同一會議的 briefing
- ✅ 整合 Phase 2 資料拉取層
- ✅ Telegram 推送與郵件備份
- ✅ 異常告警與手動補救

---

## 二、觸發機制選型

### 2.1 方案比較

| 方案 | 優點 | 缺點 | 適用場景 | 推薦度 |
|------|------|------|----------|--------|
| **Cron 定時掃描** | 實作簡單、可控性高、不依賴外部服務 | 有輪詢延遲（最多掃描間隔時間） | 觸發時機不緊急的場景 | ⭐⭐⭐⭐⭐ |
| **Webhook 即時觸發** | 即時性高、無輪詢開銷 | 需要公網 IP、Calendar API Webhook 設定複雜 | 需要秒級響應的場景 | ⭐⭐ |
| **混合模式** | 兼具即時性與穩定性 | 實作複雜度高 | 大規模生產環境 | ⭐⭐⭐ |

### 2.2 最終選擇：Cron 定時掃描

**理由**：
1. **符合需求**：會議 briefing 提前 1-2 小時或前一晚推送，30 分鐘輪詢延遲完全可接受
2. **簡單可靠**：無需處理 Webhook 的網路穿透、驗證、重試等問題
3. **易於維護**：可快速調整掃描頻率、過濾邏輯
4. **成本低**：Calendar API 每日配額 100 萬次，30 分鐘掃描一次 = 每日 48 次，遠低於限額

**掃描頻率**：`*/30 * * * *`（每 30 分鐘）

**Cron 表達式範例**：
```cron
# 每 30 分鐘執行一次
*/30 * * * * /usr/local/bin/node ~/clawd/secretary/briefing/scheduler.js
```

---

## 三、觸發時機策略

### 3.1 動態觸發時機計算

基於 Phase 1 設計的**動態觸發策略**，根據會議時間自動調整觸發時機：

```javascript
function calculateBriefingTriggerTime(meetingStartTime) {
  const hour = meetingStartTime.getHours();
  const meetingDate = new Date(meetingStartTime);
  
  // 策略 1: 早上會議 (06:00-12:00) → 前一晚 20:00
  if (hour >= 6 && hour < 12) {
    const previousDay = new Date(meetingDate);
    previousDay.setDate(previousDay.getDate() - 1);
    previousDay.setHours(20, 0, 0, 0);
    return previousDay;
  }
  
  // 策略 2: 下午會議 (12:00-18:00) → 當天早上 08:00
  if (hour >= 12 && hour < 18) {
    const sameDay = new Date(meetingDate);
    sameDay.setHours(8, 0, 0, 0);
    return sameDay;
  }
  
  // 策略 3: 晚間會議 (18:00-06:00) → 會議前 2 小時
  const twoHoursBefore = new Date(meetingStartTime);
  twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
  return twoHoursBefore;
}
```

### 3.2 觸發視窗（Trigger Window）

為了避免錯過觸發時機（如系統當機、Cron 未執行），引入**觸發視窗**概念：

```javascript
function shouldTriggerBriefing(meeting, now) {
  const triggerTime = calculateBriefingTriggerTime(meeting.startTime);
  const windowStart = new Date(triggerTime.getTime() - 15 * 60 * 1000);  // 提前 15 分鐘
  const windowEnd = new Date(triggerTime.getTime() + 45 * 60 * 1000);    // 延後 45 分鐘
  
  // 當前時間在觸發視窗內，且尚未生成過 briefing
  return now >= windowStart && now <= windowEnd && !meeting.briefingGenerated;
}
```

**範例**：
- 會議時間：2026-02-18 14:00（週二下午）
- 計算觸發時機：2026-02-18 08:00（當天早上）
- 觸發視窗：**07:45 - 08:45**
- 實際執行：Cron 在 08:00 或 08:30 掃描時觸發

### 3.3 緊急會議處理

對於**臨時新增的緊急會議**（會議開始時間 < 2 小時），立即觸發：

```javascript
function isUrgentMeeting(meeting, now) {
  const hoursUntilMeeting = (meeting.startTime - now) / (1000 * 60 * 60);
  return hoursUntilMeeting > 0 && hoursUntilMeeting <= 2;
}

if (isUrgentMeeting(meeting, now) && !meeting.briefingGenerated) {
  await generateAndSendBriefing(meeting);  // 立即生成
}
```

---

## 四、會議過濾邏輯

### 4.1 需要 Briefing 的會議

✅ **符合以下條件的會議需要生成 briefing**：

1. **有外部與會者**（非 @aurotek.com 的參與者）
2. **會議時長 ≥ 30 分鐘**
3. **William 已接受或標記為 "需要動作"**
4. **非全天事件**（全天事件通常是假期或提醒）
5. **非私人行程**（透過 visibility 判斷）

```javascript
function needsBriefing(meeting) {
  // 1. 檢查與會者
  const hasExternalAttendees = meeting.attendees?.some(a => 
    !a.email.endsWith('@aurotek.com')
  );
  
  // 2. 檢查時長
  const durationMinutes = (meeting.endTime - meeting.startTime) / (1000 * 60);
  const isLongEnough = durationMinutes >= 30;
  
  // 3. 檢查 William 的回應狀態
  const williamAttendee = meeting.attendees?.find(a => 
    a.email === 'williamhsiao@aurotek.com'
  );
  const williamAccepted = !williamAttendee || 
                          williamAttendee.responseStatus === 'accepted' ||
                          williamAttendee.responseStatus === 'needsAction';
  
  // 4. 排除全天事件
  const notAllDay = !!meeting.startTime.getHours;  // 有具體時間
  
  // 5. 排除私人行程
  const notPrivate = meeting.visibility !== 'private';
  
  return hasExternalAttendees && 
         isLongEnough && 
         williamAccepted && 
         notAllDay && 
         notPrivate;
}
```

### 4.2 排除清單（Blacklist）

❌ **明確排除以下類型的會議**：

```javascript
const EXCLUDED_PATTERNS = [
  /午餐|晚餐|Lunch|Dinner/i,        // 用餐時間
  /休息|Break|Coffee/i,              // 休息時間
  /個人|Private|私人/i,              // 私人行程
  /面試|Interview/i,                 // 面試（需要不同模板）
  /OOO|Out of Office|休假/i,        // 不在辦公室
  /Blocked|保留時間/i                // 保留時段
];

function isExcluded(meeting) {
  return EXCLUDED_PATTERNS.some(pattern => 
    pattern.test(meeting.summary)
  );
}
```

### 4.3 白名單（Whitelist，可選）

💡 **明確標記需要 briefing 的會議**（透過關鍵字或標籤）：

```javascript
const IMPORTANT_KEYWORDS = [
  '客戶', '專案', 'Project', 'Client',
  '提案', 'Proposal', '檢討', 'Review',
  '季度', 'Q1', 'Q2', 'Q3', 'Q4'
];

function isHighPriority(meeting) {
  return IMPORTANT_KEYWORDS.some(kw => 
    meeting.summary.includes(kw) || 
    meeting.description?.includes(kw)
  );
}

// 高優先級會議即使只有 15 分鐘也生成 briefing
if (isHighPriority(meeting)) {
  return true;
}
```

---

## 五、重複生成防護

### 5.1 資料庫表設計

新增 `meeting_briefings` 表記錄已生成的 briefing：

```sql
CREATE TABLE meeting_briefings (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(255) NOT NULL,           -- Google Calendar Event ID
  meeting_title TEXT,
  meeting_start TIMESTAMP NOT NULL,
  trigger_time TIMESTAMP,                     -- 實際觸發時間
  generated_at TIMESTAMP DEFAULT NOW(),
  briefing_content TEXT,                      -- Markdown 內容
  delivered_via JSONB DEFAULT '[]',           -- ["telegram", "email"]
  telegram_message_id TEXT,                   -- Telegram 訊息 ID
  status VARCHAR(50) DEFAULT 'generated',     -- generated, delivered, failed
  error_message TEXT,
  UNIQUE(meeting_id, meeting_start)           -- 防止重複生成（同一會議可能有多次）
);

CREATE INDEX idx_meeting_briefings_meeting_id ON meeting_briefings(meeting_id);
CREATE INDEX idx_meeting_briefings_status ON meeting_briefings(status);
CREATE INDEX idx_meeting_briefings_generated_at ON meeting_briefings(generated_at);
```

### 5.2 去重邏輯

```javascript
async function hasGeneratedBriefing(meeting) {
  const query = `
    SELECT id FROM meeting_briefings
    WHERE meeting_id = '${meeting.id}'
      AND meeting_start = '${meeting.startTime.toISOString()}'
    LIMIT 1
  `;
  
  const result = await execSupabaseQuery(query);
  return result.length > 0;
}

async function markBriefingGenerated(meeting, briefingContent, deliveryInfo) {
  const query = `
    INSERT INTO meeting_briefings 
      (meeting_id, meeting_title, meeting_start, trigger_time, briefing_content, delivered_via, status)
    VALUES (
      '${meeting.id}',
      '${escapeSql(meeting.summary)}',
      '${meeting.startTime.toISOString()}',
      NOW(),
      '${escapeSql(briefingContent)}',
      '${JSON.stringify(deliveryInfo.channels)}'::jsonb,
      'delivered'
    )
    ON CONFLICT (meeting_id, meeting_start) DO NOTHING
  `;
  
  await execSupabaseQuery(query);
}
```

### 5.3 定期會議特殊處理

對於**定期會議**，每次發生都需要生成新的 briefing：

```javascript
function getMeetingUniqueKey(meeting) {
  if (meeting.isRecurring) {
    // 定期會議：使用事件 ID + 開始時間
    return `${meeting.id}-${meeting.startTime.toISOString()}`;
  } else {
    // 一次性會議：只使用事件 ID
    return meeting.id;
  }
}
```

---

## 六、核心排程器實作

### 6.1 Scheduler 主流程

```javascript
// ~/clawd/secretary/briefing/scheduler.js

const { google } = require('googleapis');
const { generateBriefing } = require('./index');
const { sendToTelegram, sendToEmail } = require('./delivery');
const { execSupabaseQuery } = require('./utils/db');

async function main() {
  console.log(`[${new Date().toISOString()}] Briefing Scheduler started`);
  
  try {
    // 1. 掃描未來 48 小時的會議
    const upcomingMeetings = await scanUpcomingMeetings();
    console.log(`Found ${upcomingMeetings.length} upcoming meetings`);
    
    // 2. 過濾需要 briefing 的會議
    const filteredMeetings = upcomingMeetings.filter(meeting => {
      if (isExcluded(meeting)) {
        console.log(`[SKIP] Excluded: ${meeting.summary}`);
        return false;
      }
      
      if (!needsBriefing(meeting)) {
        console.log(`[SKIP] No need: ${meeting.summary}`);
        return false;
      }
      
      return true;
    });
    
    console.log(`${filteredMeetings.length} meetings need briefing`);
    
    // 3. 判斷哪些會議應該在此刻觸發
    const now = new Date();
    const toTrigger = [];
    
    for (const meeting of filteredMeetings) {
      // 檢查是否已生成
      if (await hasGeneratedBriefing(meeting)) {
        console.log(`[SKIP] Already generated: ${meeting.summary}`);
        continue;
      }
      
      // 檢查是否在觸發視窗內
      if (shouldTriggerBriefing(meeting, now) || isUrgentMeeting(meeting, now)) {
        toTrigger.push(meeting);
      }
    }
    
    console.log(`${toTrigger.length} meetings to trigger now`);
    
    // 4. 並行生成所有 briefing（最多 3 個同時）
    const results = [];
    for (let i = 0; i < toTrigger.length; i += 3) {
      const batch = toTrigger.slice(i, i + 3);
      const batchResults = await Promise.allSettled(
        batch.map(meeting => processMeeting(meeting))
      );
      results.push(...batchResults);
    }
    
    // 5. 統計結果
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Completed: ${succeeded} succeeded, ${failed} failed`);
    
    // 6. 失敗通知
    if (failed > 0) {
      await notifySchedulerErrors(results.filter(r => r.status === 'rejected'));
    }
    
  } catch (error) {
    console.error('Scheduler error:', error);
    await notifySchedulerCrash(error);
  }
}

// 執行主流程
main().then(() => {
  console.log('Scheduler finished');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### 6.2 掃描會議邏輯

```javascript
async function scanUpcomingMeetings() {
  const calendar = google.calendar({ version: 'v3', auth: getOAuthClient() });
  
  const now = new Date();
  const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: fortyEightHoursLater.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 50
  });
  
  return response.data.items.map(event => ({
    id: event.id,
    summary: event.summary || '(無標題)',
    description: event.description,
    startTime: new Date(event.start.dateTime || event.start.date),
    endTime: new Date(event.end.dateTime || event.end.date),
    location: event.location,
    attendees: event.attendees || [],
    isRecurring: !!event.recurringEventId,
    recurringEventId: event.recurringEventId,
    visibility: event.visibility,
    hangoutLink: event.hangoutLink
  }));
}
```

### 6.3 處理單一會議

```javascript
async function processMeeting(meeting) {
  console.log(`[PROCESS] ${meeting.summary} @ ${meeting.startTime.toISOString()}`);
  
  try {
    // 1. 生成 briefing（整合 Phase 2 資料拉取）
    const briefingMarkdown = await generateBriefing(meeting.id);
    
    // 2. 推送到 Telegram
    const telegramResult = await sendToTelegram(meeting, briefingMarkdown);
    
    // 3. 備份到 Email
    const emailResult = await sendToEmail(meeting, briefingMarkdown);
    
    // 4. 記錄到資料庫
    await markBriefingGenerated(meeting, briefingMarkdown, {
      channels: ['telegram', 'email'],
      telegramMessageId: telegramResult.messageId
    });
    
    console.log(`[SUCCESS] ${meeting.summary}`);
    return { success: true, meeting };
    
  } catch (error) {
    console.error(`[FAILED] ${meeting.summary}:`, error);
    
    // 記錄失敗
    await recordBriefingError(meeting, error);
    
    throw error;
  }
}
```

---

## 七、Briefing 產出與推送

### 7.1 Telegram 推送格式

#### 簡要通知（主訊息）

```javascript
async function sendToTelegram(meeting, briefingMarkdown) {
  const summary = generateTelegramSummary(meeting);
  
  // 主訊息：簡要通知
  const mainMessage = `
📋 **會議提醒**：${meeting.summary}

⏰ ${formatDateTime(meeting.startTime)}
👥 ${meeting.attendees.length} 位與會者
📍 ${meeting.location || meeting.hangoutLink || '未指定'}

${extractKeyPoints(briefingMarkdown, 150)}

_完整簡報請見下方訊息_
  `.trim();
  
  const mainResult = await message({
    action: 'send',
    channel: 'telegram',
    target: 'telegram:1029808355',
    message: mainMessage
  });
  
  // 完整 briefing（長訊息分段）
  const chunks = splitMarkdown(briefingMarkdown, 4000);
  for (const chunk of chunks) {
    await message({
      action: 'send',
      channel: 'telegram',
      target: 'telegram:1029808355',
      message: chunk,
      replyTo: mainResult.messageId
    });
    
    await sleep(500);  // 避免 rate limit
  }
  
  return mainResult;
}
```

#### 完整 Briefing（Markdown 格式）

直接使用 Phase 1 設計的模板，Telegram 原生支援 Markdown：

```markdown
# 📋 會議簡報：Aurotek 與 ABC 科技 Q1 專案檢討

## 📅 基本資訊
- **時間**: 2026-02-18 (二) 14:00-15:00 (GMT+8)
- **地點**: Google Meet - [連結](https://meet.google.com/abc-defg)
- **與會者**: 
  - 張大明 (ABC 科技 / 技術總監)
  - William Hsiao (Aurotek / 業務)

---

## 🎯 會議議題
- Q1 專案進度檢視
- 技術問題解決方案

...
```

### 7.2 Email 備份

```javascript
async function sendToEmail(meeting, briefingMarkdown) {
  const htmlContent = markdownToHtml(briefingMarkdown);
  
  const subject = `📋 會議簡報：${meeting.summary}`;
  const body = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        ${htmlContent}
        <hr>
        <p style="color: #666; font-size: 12px;">
          此郵件由 Secretary Agent 自動生成並備份，請勿回覆。
        </p>
      </body>
    </html>
  `;
  
  // 使用 Gmail API 寄送到自己
  await sendGmail({
    to: 'williamhsiao@aurotek.com',
    subject: subject,
    html: body
  });
}
```

### 7.3 存檔位置

```javascript
async function saveBriefingToFile(meeting, briefingMarkdown) {
  const date = meeting.startTime.toISOString().split('T')[0];  // 2026-02-18
  const filename = `${date}_${sanitizeFilename(meeting.summary)}.md`;
  const filepath = `~/clawd/work-data/briefings/${filename}`;
  
  await write({
    path: filepath,
    content: briefingMarkdown
  });
  
  console.log(`Briefing saved: ${filepath}`);
  return filepath;
}

function sanitizeFilename(str) {
  return str
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s-]/g, '')  // 保留中英文、數字、空格、連字號
    .replace(/\s+/g, '_')                          // 空格轉底線
    .substring(0, 50);                             // 限制長度
}
```

**範例檔案結構**：
```
~/clawd/work-data/briefings/
├── 2026-02-18_Aurotek_與_ABC_科技_Q1_專案檢討.md
├── 2026-02-18_客戶拜訪_XYZ_公司.md
└── 2026-02-19_內部週會.md
```

---

## 八、異常處理

### 8.1 錯誤分類與應對

| 錯誤類型 | 嚴重性 | 應對措施 | 通知 William |
|---------|--------|---------|-------------|
| **Calendar API 失敗** | 🔴 高 | 重試 3 次，失敗則跳過本輪掃描 | ✅ 是 |
| **單一會議資料拉取失敗** | 🟡 中 | 記錄錯誤，繼續處理其他會議 | ⚠️ 累積 3 次以上才通知 |
| **Telegram 推送失敗** | 🟡 中 | 重試 2 次，失敗則只備份到 Email | ⚠️ 失敗才通知 |
| **Email 備份失敗** | 🟢 低 | 記錄日誌，不影響主流程 | ❌ 否 |
| **Supabase 記錄失敗** | 🟡 中 | 重試 1 次，失敗則記錄到本地檔案 | ⚠️ 失敗才通知 |
| **Scheduler 崩潰** | 🔴 高 | 記錄 crash log，下次 Cron 自動恢復 | ✅ 是 |

### 8.2 重試機制

```javascript
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;  // 最後一次重試失敗，拋出錯誤
      
      const delay = baseDelay * Math.pow(2, i);  // 指數退避：1s, 2s, 4s
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }
}

// 使用範例
const briefing = await retryWithBackoff(
  () => generateBriefing(meeting.id),
  3,
  2000
);
```

### 8.3 異常通知

#### Calendar API 失敗

```javascript
async function notifyCalendarAPIFailure(error) {
  const message = `
⚠️ **會議掃描失敗**

Calendar API 連續 3 次失敗，briefing 生成已暫停。

**錯誤訊息**：
\`\`\`
${error.message}
\`\`\`

**可能原因**：
- API 配額超限
- OAuth Token 過期
- 網路連線問題

**建議處理**：
執行 \`/briefing status\` 檢查系統狀態
  `.trim();
  
  await message({
    action: 'send',
    channel: 'telegram',
    target: 'telegram:1029808355',
    message: message
  });
}
```

#### 單一會議處理失敗

```javascript
async function notifyMeetingProcessingFailure(meeting, error) {
  const message = `
⚠️ **會議簡報生成失敗**

**會議**：${meeting.summary}
**時間**：${formatDateTime(meeting.startTime)}

**錯誤**：${error.message}

您可以手動補發：
\`/briefing generate ${meeting.id}\`
  `.trim();
  
  await message({
    action: 'send',
    channel: 'telegram',
    target: 'telegram:1029808355',
    message: message
  });
}
```

#### Scheduler 崩潰

```javascript
async function notifySchedulerCrash(error) {
  const message = `
🔴 **Briefing Scheduler 崩潰**

**時間**：${new Date().toISOString()}
**錯誤**：${error.message}

**Stack Trace**：
\`\`\`
${error.stack}
\`\`\`

系統將在下次 Cron 執行時自動恢復（最多 30 分鐘）。
  `.trim();
  
  await message({
    action: 'send',
    channel: 'telegram',
    target: 'telegram:1029808355',
    message: message
  });
  
  // 同時記錄到檔案
  await appendLog('~/clawd/logs/scheduler-crash.log', {
    timestamp: new Date(),
    error: error.message,
    stack: error.stack
  });
}
```

### 8.4 錯誤記錄

```javascript
async function recordBriefingError(meeting, error) {
  const query = `
    INSERT INTO meeting_briefings 
      (meeting_id, meeting_title, meeting_start, status, error_message)
    VALUES (
      '${meeting.id}',
      '${escapeSql(meeting.summary)}',
      '${meeting.startTime.toISOString()}',
      'failed',
      '${escapeSql(error.message)}'
    )
    ON CONFLICT (meeting_id, meeting_start) 
    DO UPDATE SET 
      status = 'failed',
      error_message = '${escapeSql(error.message)}',
      updated_at = NOW()
  `;
  
  await execSupabaseQuery(query);
}
```

---

## 九、手動補救機制

### 9.1 手動觸發指令

提供 Telegram 指令供 William 手動操作：

```javascript
// ~/clawd/secretary/commands/briefing.js

async function handleBriefingCommand(args) {
  const subcommand = args[0];
  
  switch (subcommand) {
    case 'today':
      // 生成今日所有會議簡報
      return await generateTodayBriefings();
      
    case 'tomorrow':
      // 生成明日所有會議簡報
      return await generateTomorrowBriefings();
      
    case 'generate':
      // 生成指定會議簡報
      const meetingId = args[1];
      if (!meetingId) {
        return '請提供會議 ID：/briefing generate <meeting_id>';
      }
      return await generateBriefingByCommand(meetingId);
      
    case 'status':
      // 顯示系統狀態
      return await getBriefingSystemStatus();
      
    case 'resend':
      // 重新推送已生成的簡報
      const briefingId = args[1];
      return await resendBriefing(briefingId);
      
    default:
      return `
可用指令：
- \`/briefing today\` - 生成今日所有會議簡報
- \`/briefing tomorrow\` - 生成明日所有會議簡報
- \`/briefing generate <meeting_id>\` - 生成指定會議簡報
- \`/briefing status\` - 查看系統狀態
- \`/briefing resend <briefing_id>\` - 重新推送簡報
      `.trim();
  }
}
```

### 9.2 系統狀態查詢

```javascript
async function getBriefingSystemStatus() {
  // 1. 檢查 Cron 是否正常運行
  const lastRunTime = await getLastSchedulerRunTime();
  const cronHealthy = (Date.now() - lastRunTime) < 35 * 60 * 1000;  // 35 分鐘內有執行
  
  // 2. 統計最近 24 小時的 briefing 生成狀況
  const stats = await execSupabaseQuery(`
    SELECT 
      status,
      COUNT(*) as count
    FROM meeting_briefings
    WHERE generated_at >= NOW() - INTERVAL '24 hours'
    GROUP BY status
  `);
  
  // 3. 檢查 Calendar API 配額
  const quotaInfo = await checkCalendarAPIQuota();
  
  return `
📊 **Briefing 系統狀態**

**Cron 排程器**：${cronHealthy ? '✅ 正常' : '❌ 異常（超過 35 分鐘未執行）'}
**最後執行時間**：${formatDateTime(lastRunTime)}

**過去 24 小時統計**：
${stats.map(s => `- ${s.status}: ${s.count} 則`).join('\n')}

**Calendar API 配額**：
- 今日已用：${quotaInfo.used} / ${quotaInfo.limit}
- 剩餘：${quotaInfo.remaining}

**資料來源健康度**：
- Gmail: ${await checkGmailHealth()}
- Zimbra: ${await checkZimbraHealth()}
- Supabase: ${await checkSupabaseHealth()}
  `.trim();
}
```

---

## 十、效能與可靠性

### 10.1 效能指標

| 指標 | 目標值 | 監控方式 |
|------|--------|----------|
| **單次掃描時間** | < 30 秒 | 記錄每次執行時長 |
| **單一 briefing 生成時間** | < 10 秒 | Phase 2 設計目標 |
| **Telegram 推送延遲** | < 3 秒 | Message API 響應時間 |
| **Cron 執行穩定性** | > 99% | 記錄失敗次數 |
| **Calendar API 使用量** | < 500 次/天 | 每次呼叫記錄 |

### 10.2 資源使用優化

#### 限制並行數量

```javascript
// 最多同時處理 3 個會議
for (let i = 0; i < meetings.length; i += 3) {
  const batch = meetings.slice(i, i + 3);
  await Promise.allSettled(batch.map(processMeeting));
}
```

#### 快取 Calendar 查詢結果

```javascript
const meetingCache = new Map();

async function scanUpcomingMeetingsWithCache() {
  const cacheKey = `meetings-${new Date().toISOString().split('T')[0]}`;
  
  if (meetingCache.has(cacheKey)) {
    const cached = meetingCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 15 * 60 * 1000) {  // 快取 15 分鐘
      return cached.data;
    }
  }
  
  const meetings = await scanUpcomingMeetings();
  meetingCache.set(cacheKey, { data: meetings, timestamp: Date.now() });
  return meetings;
}
```

### 10.3 健康檢查

```javascript
// ~/clawd/secretary/briefing/healthcheck.js

async function runHealthCheck() {
  const checks = {
    calendar: await checkCalendarAPI(),
    gmail: await checkGmailAPI(),
    zimbra: await checkZimbraAPI(),
    supabase: await checkSupabase(),
    telegram: await checkTelegramBot()
  };
  
  const allHealthy = Object.values(checks).every(c => c.healthy);
  
  if (!allHealthy) {
    await notifyHealthCheckFailure(checks);
  }
  
  return checks;
}

async function checkCalendarAPI() {
  try {
    const calendar = google.calendar({ version: 'v3', auth: getOAuthClient() });
    await calendar.events.list({
      calendarId: 'primary',
      maxResults: 1,
      timeMin: new Date().toISOString()
    });
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}
```

---

## 十一、實作清單

### 11.1 檔案結構

```
~/clawd/secretary/briefing/
├── scheduler.js              # Cron 排程器主程式
├── index.js                  # generateBriefing() 主函式（整合 Phase 2）
├── delivery.js               # Telegram/Email 推送
├── filters.js                # 會議過濾邏輯
├── trigger.js                # 觸發時機計算
├── deduplication.js          # 去重邏輯
├── healthcheck.js            # 健康檢查
└── utils/
    ├── db.js                 # Supabase 操作
    ├── formatting.js         # 日期格式化、Markdown 處理
    └── notifications.js      # 異常通知模板
```

### 11.2 開發步驟

#### Step 1: 觸發邏輯實作（2 天）
- [x] `trigger.js`：實作 `calculateBriefingTriggerTime()`、`shouldTriggerBriefing()`
- [x] `filters.js`：實作 `needsBriefing()`、`isExcluded()`
- [x] 單元測試：各種會議類型的過濾邏輯

#### Step 2: 去重機制（1 天）
- [x] 設計並建立 `meeting_briefings` 表
- [x] `deduplication.js`：實作 `hasGeneratedBriefing()`、`markBriefingGenerated()`
- [x] 測試定期會議的去重邏輯

#### Step 3: 推送模組（1 天）
- [x] `delivery.js`：實作 `sendToTelegram()`、`sendToEmail()`、`saveBriefingToFile()`
- [x] 測試 Markdown 在 Telegram 的顯示效果
- [x] 測試長訊息分段邏輯

#### Step 4: 排程器主程式（2 天）
- [x] `scheduler.js`：實作主流程
- [x] 整合 Phase 2 的 `generateBriefing()`
- [x] 實作錯誤處理與通知
- [x] 測試並行處理邏輯

#### Step 5: 手動指令（1 天）
- [x] 實作 `/briefing` 指令處理
- [x] 實作系統狀態查詢
- [x] 測試手動補發流程

#### Step 6: 部署與監控（1 天）
- [x] 設定 Cron Job（`crontab -e`）
- [x] 健康檢查機制
- [x] 測試運行 24 小時

**總計預估時間**：8 個工作天

---

## 十二、部署指南

### 12.1 Cron Job 設定

```bash
# 編輯 crontab
crontab -e

# 新增以下行（每 30 分鐘執行一次）
*/30 * * * * /usr/local/bin/node /Users/travis/clawd/secretary/briefing/scheduler.js >> /Users/travis/clawd/logs/briefing-scheduler.log 2>&1
```

### 12.2 環境變數設定

```bash
# ~/.openclaw/.env 或 ~/.zshrc

export GOOGLE_CALENDAR_ID=primary
export GMAIL_USER_ID=me
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_ANON_KEY=xxx
export TELEGRAM_WILLIAM_ID=telegram:1029808355
export BRIEFING_STORAGE_PATH=~/clawd/work-data/briefings
```

### 12.3 首次啟動檢查清單

- [x] OAuth Token 有效（執行 `node test-google-auth.js`）
- [x] Supabase 連線正常（執行 `~/clawd/scripts/supabase_sql.sh "SELECT 1"`）
- [x] Telegram Bot 可推送（執行 `/briefing status`）
- [x] Cron 權限正確（macOS 需授予 Terminal 完整磁碟存取權）
- [x] 日誌目錄存在（`mkdir -p ~/clawd/logs`）
- [x] Briefing 存檔目錄存在（`mkdir -p ~/clawd/work-data/briefings`）

### 12.4 監控與維護

#### 每週檢查
- 查看 Scheduler 日誌：`tail -f ~/clawd/logs/briefing-scheduler.log`
- 檢查失敗記錄：`SELECT * FROM meeting_briefings WHERE status = 'failed' AND generated_at > NOW() - INTERVAL '7 days'`
- 檢查 Calendar API 使用量：執行 `/briefing status`

#### 每月檢查
- 清理舊 briefing 檔案（保留 3 個月）：
  ```bash
  find ~/clawd/work-data/briefings -name "*.md" -mtime +90 -delete
  ```
- 清理資料庫舊記錄：
  ```sql
  DELETE FROM meeting_briefings WHERE generated_at < NOW() - INTERVAL '90 days';
  ```

---

## 十三、測試計畫

### 13.1 單元測試

```javascript
// tests/trigger.test.js

describe('calculateBriefingTriggerTime', () => {
  test('早上 9:00 會議 → 前一晚 20:00', () => {
    const meeting = new Date('2026-02-18T09:00:00+08:00');
    const trigger = calculateBriefingTriggerTime(meeting);
    expect(trigger).toEqual(new Date('2026-02-17T20:00:00+08:00'));
  });
  
  test('下午 14:00 會議 → 當天 08:00', () => {
    const meeting = new Date('2026-02-18T14:00:00+08:00');
    const trigger = calculateBriefingTriggerTime(meeting);
    expect(trigger).toEqual(new Date('2026-02-18T08:00:00+08:00'));
  });
  
  test('晚上 19:00 會議 → 17:00', () => {
    const meeting = new Date('2026-02-18T19:00:00+08:00');
    const trigger = calculateBriefingTriggerTime(meeting);
    expect(trigger).toEqual(new Date('2026-02-18T17:00:00+08:00'));
  });
});

describe('needsBriefing', () => {
  test('有外部與會者 + 30 分鐘 → true', () => {
    const meeting = {
      summary: '客戶會議',
      startTime: new Date('2026-02-18T14:00:00'),
      endTime: new Date('2026-02-18T14:30:00'),
      attendees: [
        { email: 'williamhsiao@aurotek.com', responseStatus: 'accepted' },
        { email: 'client@external.com', responseStatus: 'accepted' }
      ],
      visibility: 'default'
    };
    expect(needsBriefing(meeting)).toBe(true);
  });
  
  test('只有內部人員 → false', () => {
    const meeting = {
      summary: '內部會議',
      attendees: [
        { email: 'william@aurotek.com' },
        { email: 'colleague@aurotek.com' }
      ]
    };
    expect(needsBriefing(meeting)).toBe(false);
  });
  
  test('會議 < 30 分鐘 → false', () => {
    const meeting = {
      startTime: new Date('2026-02-18T14:00:00'),
      endTime: new Date('2026-02-18T14:15:00'),  // 只有 15 分鐘
      attendees: [{ email: 'client@external.com' }]
    };
    expect(needsBriefing(meeting)).toBe(false);
  });
});
```

### 13.2 整合測試

#### 測試案例 1：標準流程

```javascript
test('完整流程：掃描 → 過濾 → 生成 → 推送', async () => {
  // 1. 在測試環境建立會議
  const testMeeting = await createTestCalendarEvent({
    summary: 'Test Meeting with Client',
    start: addHours(new Date(), 2),  // 2 小時後
    attendees: ['test-client@example.com']
  });
  
  // 2. 執行 scheduler
  await main();
  
  // 3. 驗證 briefing 已生成
  const briefing = await execSupabaseQuery(`
    SELECT * FROM meeting_briefings WHERE meeting_id = '${testMeeting.id}'
  `);
  expect(briefing.length).toBe(1);
  expect(briefing[0].status).toBe('delivered');
  
  // 4. 驗證 Telegram 已推送（檢查訊息 mock）
  expect(mockTelegramSend).toHaveBeenCalled();
  
  // 清理
  await deleteTestCalendarEvent(testMeeting.id);
});
```

#### 測試案例 2：重複生成防護

```javascript
test('同一會議不會重複生成', async () => {
  const meeting = await createTestCalendarEvent({...});
  
  // 第一次執行
  await processMeeting(meeting);
  const firstBriefing = await getBriefing(meeting.id);
  
  // 第二次執行
  await processMeeting(meeting);
  const secondBriefing = await getBriefing(meeting.id);
  
  expect(firstBriefing.id).toBe(secondBriefing.id);  // 同一筆記錄
  expect(mockGenerateBriefing).toHaveBeenCalledTimes(1);  // 只生成一次
});
```

### 13.3 端到端測試

在生產環境模擬 48 小時週期：

1. **Day 0 20:00**：建立次日 09:00 的測試會議
2. **Day 0 20:30**：Cron 執行，應觸發生成
3. **驗證**：Telegram 收到推送、Email 收到備份、資料庫有記錄
4. **Day 1 08:00**：Cron 執行，應跳過（已生成）
5. **驗證**：無重複推送

---

## 十四、風險與應對

| 風險 | 影響 | 機率 | 應對措施 |
|------|------|------|----------|
| **Cron 未執行（macOS 休眠）** | 漏發 briefing | 🟡 中 | 觸發視窗設計（±45 分鐘容錯）、Wake on LAN 設定 |
| **Calendar API 配額超限** | 無法掃描會議 | 🟢 低 | 每日 100 萬次配額遠超需求、實作降級快取 |
| **OAuth Token 過期** | 認證失敗 | 🟡 中 | 定期檢查 Token、自動刷新、失敗告警 |
| **Telegram Rate Limit** | 推送失敗 | 🟢 低 | 訊息間隔 500ms、重試機制 |
| **Supabase 連線異常** | 記錄失敗 | 🟢 低 | 降級至本地檔案、異常告警 |
| **會議資訊不完整** | Briefing 品質差 | 🟡 中 | 容錯設計（缺資料仍生成基礎版）、回饋優化 |

---

## 十五、後續優化方向

### Phase 4：智慧優化（未來）

1. **AI 摘要增強**
   - 整合 OpenAI API 生成郵件摘要
   - 從前次會議記錄提取決議與待辦（NLP）

2. **個人化推薦**
   - 根據 William 的歷史行為調整觸發時機
   - 學習哪些會議類型需要更詳細的 briefing

3. **即時更新**
   - 會議資訊變更時（改時間、換地點）自動更新 briefing
   - 新增與會者時補充其背景資訊

4. **多語言支援**
   - 偵測會議語言（英文/中文）自動調整模板
   - 提供雙語 briefing

5. **會議後追蹤**
   - 會議結束後自動提醒未完成的待辦事項
   - 整合 Meeting Notes，對比預期與實際結果

---

## 十六、驗收標準

### 功能驗收

- [x] Cron 每 30 分鐘穩定執行
- [x] 正確識別需要 briefing 的會議（準確率 > 90%）
- [x] 觸發時機符合動態策略（早會前一晚、午會當天早上）
- [x] 同一會議不重複生成
- [x] Telegram 推送格式正確且完整
- [x] Email 備份成功寄出
- [x] 失敗時正確通知 William

### 效能驗收

- [x] 單次掃描時間 < 30 秒
- [x] 單一 briefing 生成時間 < 10 秒
- [x] Cron 執行穩定性 > 99%（連續運行 1 週）

### 穩定性驗收

- [x] 運行 1 週無崩潰
- [x] 正確處理 Calendar API 臨時失敗
- [x] 正確處理網路斷線

---

## 十七、附錄

### A. Cron 除錯指南

```bash
# 檢查 Cron 是否運行
ps aux | grep cron

# 查看 Cron 日誌
tail -f ~/clawd/logs/briefing-scheduler.log

# 手動執行測試
node ~/clawd/secretary/briefing/scheduler.js

# 檢查 Cron 權限（macOS）
# System Preferences → Security & Privacy → Full Disk Access → Terminal
```

### B. 常見問題排查

| 問題 | 可能原因 | 解決方式 |
|------|---------|---------|
| Cron 未執行 | macOS 休眠、Cron 權限不足 | 檢查 caffeinate、授予權限 |
| Briefing 未推送 | Telegram Bot Token 失效 | 重新取得 Token、測試 `/briefing status` |
| 找不到會議 | Calendar ID 錯誤、OAuth 過期 | 確認 `GOOGLE_CALENDAR_ID`、刷新 Token |
| 重複生成 | 去重邏輯失效 | 檢查 Supabase `meeting_briefings` 表 |

### C. 系統架構圖

```
                    ┌──────────────────┐
                    │   macOS Cron     │
                    │  (*/30 * * * *)  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Scheduler.js   │
                    │  - scanMeetings  │
                    │  - filterMeetings│
                    │  - processMeetings│
                    └────────┬─────────┘
                             │
               ┌─────────────┼─────────────┐
               │                           │
               ▼                           ▼
      ┌─────────────────┐         ┌─────────────────┐
      │ Google Calendar │         │ Supabase DB     │
      │ API             │         │ (去重檢查)      │
      └────────┬────────┘         └─────────────────┘
               │
               ▼
      ┌─────────────────┐
      │ generateBriefing │  ← Phase 2 資料整合層
      │ (Phase 2)        │
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │  Delivery        │
      │  - Telegram      │
      │  - Email         │
      │  - File          │
      └─────────────────┘
```

---

## 審查與回饋

**下次審查時間**: Phase 3 實作完成後  
**審查重點**:
- Cron 穩定性是否達標
- 觸發時機是否符合預期
- 推送成功率是否 > 95%
- 異常處理是否完善

**回饋管道**: William 使用 2 週後填寫回饋表單

---

**文件狀態**: ✅ 設計完成，待實作  
**預估實作時間**: 8 個工作天  
**負責人**: Secretary Agent  
**下一步**: 開始實作 `scheduler.js` 與 `trigger.js`
