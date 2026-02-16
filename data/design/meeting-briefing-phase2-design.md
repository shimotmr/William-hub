# 會議自動 Briefing Phase 2 — 資料整合層設計

## 文件資訊
- **版本**: v1.0
- **建立日期**: 2026-02-16
- **作者**: Secretary Agent
- **相關任務**: Board #187
- **前置文件**: [會議自動 Briefing 功能設計](./meeting-briefing-design.md) (Board #43)

---

## 一、設計目標

Phase 2 專注於建立**資料整合層**，實現從多個異質資料來源自動拉取、標準化、組裝會議相關上下文的能力。

### 核心能力
1. **多源資料拉取**：並行從 Gmail、Zimbra、Google Calendar、Supabase 拉取資料
2. **智慧關聯匹配**：根據會議資訊自動識別相關郵件、任務、記憶
3. **資料標準化**：統一資料格式，便於模板組裝
4. **去重與排序**：處理重複資料，按相關性排序
5. **容錯與降級**：單一資料源失敗不影響整體生成

---

## 二、整體架構

### 2.1 資料整合流程圖

```
┌──────────────────────────────────────────────────────────────┐
│                     Briefing Generator                        │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   Data Aggregator (資料聚合器)                │
│  - 接收會議基本資訊 (MeetingContext)                          │
│  - 並行觸發各資料源 Fetcher                                   │
│  - 合併回傳結果                                                │
└─────────────────────────┬────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬─────────────────┐
        │                 │                 │                 │
        ▼                 ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Email Fetcher│  │Calendar      │  │ Task Fetcher │  │Memory Fetcher│
│              │  │Fetcher       │  │              │  │              │
│ - Gmail API  │  │ - Google Cal │  │ - Supabase   │  │ - Supabase   │
│ - Zimbra API │  │   API        │  │   board_     │  │   memories   │
│              │  │              │  │   tasks      │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Raw Email Data│  │Raw Calendar  │  │Raw Task Data │  │Raw Memory    │
│              │  │Data          │  │              │  │Data          │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       └─────────────────┼─────────────────┴─────────────────┘
                         ▼
                ┌─────────────────┐
                │  Data Normalizer │
                │  (資料標準化器)  │
                │  - 統一格式      │
                │  - 去重          │
                │  - 排序          │
                └────────┬─────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Normalized Data  │
                │ (標準化資料集)   │
                └────────┬─────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Template Engine  │
                │ (模板組裝)       │
                └────────┬─────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Markdown Output  │
                └─────────────────┘
```

### 2.2 核心元件說明

| 元件 | 職責 | 輸入 | 輸出 |
|------|------|------|------|
| **Data Aggregator** | 協調各資料源並行拉取 | MeetingContext | AggregatedRawData |
| **Email Fetcher** | 搜尋相關郵件 | MeetingContext | Email[] |
| **Calendar Fetcher** | 取得會議詳情與前次會議 | Meeting ID | CalendarEvent |
| **Task Fetcher** | 查詢相關任務 | Keywords, Attendees | Task[] |
| **Memory Fetcher** | 查詢相關記憶 | Keywords, Tags | Memory[] |
| **Data Normalizer** | 標準化、去重、排序 | AggregatedRawData | NormalizedData |
| **Template Engine** | 組裝 Markdown 簡報 | NormalizedData | Markdown String |

---

## 三、資料模型定義

### 3.1 輸入：MeetingContext

會議基礎資訊，由 Calendar Fetcher 提供：

```typescript
interface MeetingContext {
  id: string;                    // Google Calendar Event ID
  summary: string;               // 會議標題
  description?: string;          // 會議說明
  startTime: Date;               // 開始時間
  endTime: Date;                 // 結束時間
  location?: string;             // 地點或 Meet 連結
  attendees: Attendee[];         // 與會者清單
  isRecurring: boolean;          // 是否為定期會議
  recurringEventId?: string;     // 定期會議系列 ID
}

interface Attendee {
  email: string;
  displayName?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
}
```

### 3.2 中間層：AggregatedRawData

各資料源的原始回傳結果：

```typescript
interface AggregatedRawData {
  meeting: MeetingContext;
  emails: RawEmail[];
  previousMeeting?: CalendarEvent;
  tasks: RawTask[];
  memories: RawMemory[];
  errors: DataSourceError[];      // 記錄失敗的資料源
}

interface DataSourceError {
  source: 'gmail' | 'zimbra' | 'calendar' | 'tasks' | 'memories';
  error: string;
  timestamp: Date;
}
```

### 3.3 輸出：NormalizedData

標準化後的資料集：

```typescript
interface NormalizedData {
  meeting: MeetingInfo;
  emails: NormalizedEmail[];
  previousMeeting?: PreviousMeetingInfo;
  tasks: NormalizedTask[];
  memories: NormalizedMemory[];
  metadata: {
    generatedAt: Date;
    dataSources: {
      gmail: boolean;
      zimbra: boolean;
      tasks: boolean;
      memories: boolean;
    };
  };
}
```

#### NormalizedEmail
```typescript
interface NormalizedEmail {
  id: string;
  subject: string;
  from: string;                   // "張大明 <zhang@abc.com>"
  date: Date;
  snippet: string;                // 摘要（前 200 字）
  source: 'gmail' | 'zimbra';
  relevanceScore: number;         // 0-100 相關性評分
  hasAttachments: boolean;
  attachmentNames?: string[];
}
```

#### NormalizedTask
```typescript
interface NormalizedTask {
  id: number;
  title: string;
  status: string;                 // 待執行、執行中、已完成
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  description?: string;
  tags: string[];
  assignee?: string;
  relevanceScore: number;
}
```

#### NormalizedMemory
```typescript
interface NormalizedMemory {
  id: number;
  content: string;
  memoryType: string;             // 會議紀錄、客戶資訊、專案資訊
  tags: string[];
  createdAt: Date;
  relevanceScore: number;
}
```

#### PreviousMeetingInfo
```typescript
interface PreviousMeetingInfo {
  date: Date;
  summary: string;
  decisions?: string[];           // 從 description 提取
  actionItems?: ActionItem[];
}

interface ActionItem {
  description: string;
  assignee?: string;
  dueDate?: Date;
  completed: boolean;
}
```

---

## 四、資料拉取規格

### 4.1 Email Fetcher

#### 4.1.1 Gmail API 整合

**端點**: `gmail.users.messages.list`

**搜尋策略**:
```javascript
async function searchGmail(meetingContext) {
  const keywords = extractKeywords(meetingContext);
  const attendeeEmails = meetingContext.attendees.map(a => a.email);
  
  // 構建查詢字串
  const queries = [];
  
  // 策略 1: 與會者郵件往來
  attendeeEmails.forEach(email => {
    queries.push(`from:(${email}) OR to:(${email})`);
  });
  
  // 策略 2: 主旨關鍵字
  keywords.forEach(kw => {
    queries.push(`subject:"${kw}"`);
  });
  
  // 時間範圍：會議前 7 天
  const sevenDaysAgo = new Date(meetingContext.startTime);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const afterDate = formatDate(sevenDaysAgo, 'yyyy/MM/dd');
  
  const query = `(${queries.join(' OR ')}) after:${afterDate}`;
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 20
  });
  
  return response.data.messages || [];
}
```

**資料提取**:
```javascript
async function fetchGmailDetails(messageIds) {
  return Promise.all(messageIds.map(async (id) => {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'full'
    });
    
    const headers = msg.data.payload.headers;
    const getHeader = (name) => 
      headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value;
    
    return {
      id: msg.data.id,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      date: new Date(parseInt(msg.data.internalDate)),
      snippet: msg.data.snippet,
      source: 'gmail',
      hasAttachments: hasAttachments(msg.data.payload)
    };
  }));
}
```

#### 4.1.2 Zimbra SOAP API 整合

**端點**: `SearchRequest`

**SOAP 請求範例**:
```xml
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <context xmlns="urn:zimbra">
      <authToken>{AUTH_TOKEN}</authToken>
    </context>
  </soap:Header>
  <soap:Body>
    <SearchRequest xmlns="urn:zimbraMail" 
                   types="message" 
                   limit="20"
                   sortBy="dateDesc">
      <query>
        (from:({ATTENDEE_EMAILS}) OR to:({ATTENDEE_EMAILS})) 
        AND after:-7days
      </query>
    </SearchRequest>
  </soap:Body>
</soap:Envelope>
```

**Node.js 實作**:
```javascript
async function searchZimbra(meetingContext) {
  const credentials = JSON.parse(
    fs.readFileSync('~/.openclaw/credentials/zimbra.json')
  );
  
  // 1. 取得 Auth Token
  const authToken = await zimbraAuth(credentials);
  
  // 2. 構建搜尋查詢
  const attendeeEmails = meetingContext.attendees
    .map(a => a.email)
    .join(' OR ');
  
  const query = `(from:(${attendeeEmails}) OR to:(${attendeeEmails})) AND after:-7days`;
  
  // 3. 發送 SearchRequest
  const soapBody = `
    <SearchRequest xmlns="urn:zimbraMail" types="message" limit="20">
      <query>${escapeXml(query)}</query>
    </SearchRequest>
  `;
  
  const response = await zimbraSoapRequest(authToken, soapBody);
  
  // 4. 解析回應
  return parseZimbraMessages(response);
}
```

#### 4.1.3 郵件合併與去重

```javascript
function mergeAndDeduplicateEmails(gmailEmails, zimbraEmails) {
  const allEmails = [...gmailEmails, ...zimbraEmails];
  
  // 去重邏輯：Message-ID 相同視為重複
  const uniqueEmails = [];
  const seenMessageIds = new Set();
  
  allEmails.forEach(email => {
    const messageId = email.messageId || `${email.source}-${email.id}`;
    if (!seenMessageIds.has(messageId)) {
      seenMessageIds.add(messageId);
      uniqueEmails.push(email);
    }
  });
  
  return uniqueEmails;
}
```

---

### 4.2 Calendar Fetcher

#### 4.2.1 取得會議詳情

```javascript
async function fetchMeetingDetails(eventId) {
  const event = await calendar.events.get({
    calendarId: 'primary',
    eventId: eventId
  });
  
  return {
    id: event.data.id,
    summary: event.data.summary,
    description: event.data.description,
    startTime: new Date(event.data.start.dateTime || event.data.start.date),
    endTime: new Date(event.data.end.dateTime || event.data.end.date),
    location: event.data.location,
    attendees: event.data.attendees || [],
    isRecurring: !!event.data.recurringEventId,
    recurringEventId: event.data.recurringEventId,
    hangoutLink: event.data.hangoutLink
  };
}
```

#### 4.2.2 尋找前次會議

**策略 1：定期會議系列**
```javascript
async function findPreviousMeeting(meetingContext) {
  if (!meetingContext.isRecurring) {
    return null;  // 非定期會議無前次紀錄
  }
  
  // 取得同系列的所有會議
  const events = await calendar.events.instances({
    calendarId: 'primary',
    eventId: meetingContext.recurringEventId,
    timeMax: meetingContext.startTime.toISOString(),
    orderBy: 'startTime',
    maxResults: 1,
    singleEvents: true
  });
  
  if (events.data.items.length > 0) {
    return parseEventToMeetingInfo(events.data.items[0]);
  }
  
  return null;
}
```

**策略 2：相似主題會議（備用）**
```javascript
async function findSimilarMeeting(meetingContext) {
  const twoWeeksAgo = new Date(meetingContext.startTime);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: twoWeeksAgo.toISOString(),
    timeMax: meetingContext.startTime.toISOString(),
    q: extractMainKeyword(meetingContext.summary),
    singleEvents: true,
    orderBy: 'startTime'
  });
  
  // 計算標題相似度，選擇最接近的
  return findMostSimilar(events.data.items, meetingContext.summary);
}
```

---

### 4.3 Task Fetcher

#### 4.3.1 Supabase 查詢邏輯

```javascript
async function fetchRelatedTasks(meetingContext) {
  const keywords = extractKeywords(meetingContext);
  const attendeeNames = extractAttendeeNames(meetingContext.attendees);
  
  // 構建 SQL 查詢
  const query = `
    SELECT 
      id, title, status, priority, due_date, description, tags, assignee
    FROM board_tasks
    WHERE 
      (
        -- 標籤匹配
        tags && ARRAY[${keywords.map(k => `'${k}'`).join(',')}]
        OR
        -- 標題包含關鍵字
        ${keywords.map(k => `title ILIKE '%${k}%'`).join(' OR ')}
        OR
        -- 與會者姓名匹配
        ${attendeeNames.map(n => `assignee ILIKE '%${n}%'`).join(' OR ')}
      )
      AND status IN ('待執行', '執行中')
    ORDER BY 
      CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
      END,
      due_date ASC NULLS LAST
    LIMIT 10
  `;
  
  const result = await exec({
    command: `~/clawd/scripts/supabase_sql.sh "${query}"`
  });
  
  return JSON.parse(result.output);
}
```

#### 4.3.2 關鍵字提取函式

```javascript
function extractKeywords(meetingContext) {
  const keywords = new Set();
  
  // 1. 從標題提取公司名
  const companyPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(科技|股份|有限|公司|Corp|Inc|Ltd)/g;
  const companies = meetingContext.summary.match(companyPattern);
  if (companies) {
    companies.forEach(c => keywords.add(c.trim()));
  }
  
  // 2. 從標題提取專案名（大寫字母開頭的連續詞）
  const projectPattern = /\b([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*)*)\b/g;
  const projects = meetingContext.summary.match(projectPattern);
  if (projects) {
    projects.forEach(p => {
      if (p.length >= 3) keywords.add(p);
    });
  }
  
  // 3. 從與會者 email 提取 domain
  meetingContext.attendees.forEach(attendee => {
    const domain = attendee.email.split('@')[1];
    const company = domain.split('.')[0];  // e.g., "aurotek" from "aurotek.com"
    keywords.add(company);
  });
  
  // 4. 從與會者顯示名稱提取公司（若格式為「姓名 (公司)」）
  meetingContext.attendees.forEach(attendee => {
    if (attendee.displayName) {
      const companyMatch = attendee.displayName.match(/\(([^)]+)\)/);
      if (companyMatch) {
        keywords.add(companyMatch[1]);
      }
    }
  });
  
  return Array.from(keywords);
}
```

---

### 4.4 Memory Fetcher

#### 4.4.1 記憶查詢策略

```javascript
async function fetchRelatedMemories(meetingContext) {
  const keywords = extractKeywords(meetingContext);
  
  // 策略 1: 標籤匹配（優先）
  const tagMatchQuery = `
    SELECT id, content, tags, memory_type, created_at
    FROM memories
    WHERE tags && ARRAY[${keywords.map(k => `'${k}'`).join(',')}]
    ORDER BY created_at DESC
    LIMIT 5
  `;
  
  const tagMatches = await execSupabaseQuery(tagMatchQuery);
  
  // 策略 2: 內容全文搜尋（補充）
  if (tagMatches.length < 3) {
    const keywordPattern = keywords.join('|');
    const contentMatchQuery = `
      SELECT id, content, tags, memory_type, created_at
      FROM memories
      WHERE content ~* '${keywordPattern}'
        AND id NOT IN (${tagMatches.map(m => m.id).join(',') || 'NULL'})
      ORDER BY created_at DESC
      LIMIT ${5 - tagMatches.length}
    `;
    
    const contentMatches = await execSupabaseQuery(contentMatchQuery);
    return [...tagMatches, ...contentMatches];
  }
  
  return tagMatches;
}
```

#### 4.4.2 記憶類型優先級

針對不同類型的會議，優先提取不同類型的記憶：

```javascript
function prioritizeMemoryTypes(meetingContext) {
  const priorities = [];
  
  // 判斷會議類型
  if (isCustomerMeeting(meetingContext)) {
    priorities.push('客戶資訊', '會議紀錄', '專案資訊');
  } else if (isProjectMeeting(meetingContext)) {
    priorities.push('專案資訊', '會議紀錄', '技術文件');
  } else if (isInternalMeeting(meetingContext)) {
    priorities.push('會議紀錄', '決策紀錄', '專案資訊');
  } else {
    priorities.push('會議紀錄', '客戶資訊', '專案資訊');
  }
  
  return priorities;
}
```

---

## 五、資料標準化與評分

### 5.1 相關性評分演算法

#### 5.1.1 郵件相關性評分

```javascript
function scoreEmailRelevance(email, meetingContext) {
  let score = 0;
  const keywords = extractKeywords(meetingContext);
  const attendeeEmails = meetingContext.attendees.map(a => a.email.toLowerCase());
  
  // 1. 寄件人是與會者 (+20 分)
  if (attendeeEmails.includes(email.from.toLowerCase())) {
    score += 20;
  }
  
  // 2. 主旨包含關鍵字 (+5 分/關鍵字，最高 25 分)
  let keywordMatches = 0;
  keywords.forEach(kw => {
    if (email.subject.toLowerCase().includes(kw.toLowerCase())) {
      keywordMatches++;
    }
  });
  score += Math.min(keywordMatches * 5, 25);
  
  // 3. 時間接近度 (最高 30 分)
  const daysDiff = Math.abs(
    (email.date - meetingContext.startTime) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 1) score += 30;
  else if (daysDiff <= 3) score += 20;
  else if (daysDiff <= 7) score += 10;
  
  // 4. 有附件 (+10 分)
  if (email.hasAttachments) {
    score += 10;
  }
  
  // 5. 主旨包含「Re:」或「Fw:」(+5 分，表示持續討論)
  if (/^(Re:|Fw:|轉寄:|回覆:)/.test(email.subject)) {
    score += 5;
  }
  
  return Math.min(score, 100);  // 最高 100 分
}
```

#### 5.1.2 任務相關性評分

```javascript
function scoreTaskRelevance(task, meetingContext) {
  let score = 0;
  const keywords = extractKeywords(meetingContext);
  
  // 1. 標籤完全匹配 (+30 分/標籤，最高 60 分)
  const tagMatches = task.tags.filter(tag => 
    keywords.some(kw => tag.toLowerCase().includes(kw.toLowerCase()))
  );
  score += Math.min(tagMatches.length * 30, 60);
  
  // 2. 標題包含關鍵字 (+15 分/關鍵字，最高 30 分)
  let titleMatches = 0;
  keywords.forEach(kw => {
    if (task.title.toLowerCase().includes(kw.toLowerCase())) {
      titleMatches++;
    }
  });
  score += Math.min(titleMatches * 15, 30);
  
  // 3. 優先級加成
  if (task.priority === 'high') score += 20;
  else if (task.priority === 'medium') score += 10;
  
  // 4. 期限接近會議日期 (+10 分)
  if (task.dueDate) {
    const daysDiff = Math.abs(
      (task.dueDate - meetingContext.startTime) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff <= 3) score += 10;
  }
  
  return Math.min(score, 100);
}
```

#### 5.1.3 記憶相關性評分

```javascript
function scoreMemoryRelevance(memory, meetingContext) {
  let score = 0;
  const keywords = extractKeywords(meetingContext);
  
  // 1. 標籤匹配 (+25 分/標籤，最高 50 分)
  const tagMatches = memory.tags.filter(tag =>
    keywords.some(kw => tag.toLowerCase() === kw.toLowerCase())
  );
  score += Math.min(tagMatches.length * 25, 50);
  
  // 2. 記憶類型優先級
  const typePriorities = prioritizeMemoryTypes(meetingContext);
  const typeIndex = typePriorities.indexOf(memory.memoryType);
  if (typeIndex !== -1) {
    score += 30 - (typeIndex * 10);  // 第一優先 +30, 第二 +20, 第三 +10
  }
  
  // 3. 時間新鮮度 (最高 20 分)
  const daysSinceCreated = Math.abs(
    (new Date() - memory.createdAt) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreated <= 7) score += 20;
  else if (daysSinceCreated <= 30) score += 10;
  else if (daysSinceCreated <= 90) score += 5;
  
  return Math.min(score, 100);
}
```

### 5.2 資料排序與截斷

```javascript
function normalizeAndSort(aggregatedData) {
  // 1. 計算相關性評分
  const scoredEmails = aggregatedData.emails.map(email => ({
    ...email,
    relevanceScore: scoreEmailRelevance(email, aggregatedData.meeting)
  }));
  
  const scoredTasks = aggregatedData.tasks.map(task => ({
    ...task,
    relevanceScore: scoreTaskRelevance(task, aggregatedData.meeting)
  }));
  
  const scoredMemories = aggregatedData.memories.map(memory => ({
    ...memory,
    relevanceScore: scoreMemoryRelevance(memory, aggregatedData.meeting)
  }));
  
  // 2. 排序（相關性由高到低）
  scoredEmails.sort((a, b) => b.relevanceScore - a.relevanceScore);
  scoredTasks.sort((a, b) => b.relevanceScore - a.relevanceScore);
  scoredMemories.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // 3. 過濾低分項目並截斷
  return {
    meeting: aggregatedData.meeting,
    emails: scoredEmails.filter(e => e.relevanceScore >= 30).slice(0, 5),
    tasks: scoredTasks.filter(t => t.relevanceScore >= 40).slice(0, 8),
    memories: scoredMemories.filter(m => m.relevanceScore >= 50).slice(0, 3),
    previousMeeting: aggregatedData.previousMeeting,
    metadata: {
      generatedAt: new Date(),
      dataSources: {
        gmail: aggregatedData.emails.some(e => e.source === 'gmail'),
        zimbra: aggregatedData.emails.some(e => e.source === 'zimbra'),
        tasks: aggregatedData.tasks.length > 0,
        memories: aggregatedData.memories.length > 0
      }
    }
  };
}
```

---

## 六、並行拉取與容錯

### 6.1 並行執行架構

```javascript
async function aggregateData(meetingContext) {
  const results = await Promise.allSettled([
    fetchGmailEmails(meetingContext),
    fetchZimbraEmails(meetingContext),
    findPreviousMeeting(meetingContext),
    fetchRelatedTasks(meetingContext),
    fetchRelatedMemories(meetingContext)
  ]);
  
  // 處理結果與錯誤
  const [gmailResult, zimbraResult, prevMeetingResult, tasksResult, memoriesResult] = results;
  
  const aggregatedData = {
    meeting: meetingContext,
    emails: [
      ...(gmailResult.status === 'fulfilled' ? gmailResult.value : []),
      ...(zimbraResult.status === 'fulfilled' ? zimbraResult.value : [])
    ],
    previousMeeting: prevMeetingResult.status === 'fulfilled' ? prevMeetingResult.value : null,
    tasks: tasksResult.status === 'fulfilled' ? tasksResult.value : [],
    memories: memoriesResult.status === 'fulfilled' ? memoriesResult.value : [],
    errors: []
  };
  
  // 記錄錯誤
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const sources = ['gmail', 'zimbra', 'calendar', 'tasks', 'memories'];
      aggregatedData.errors.push({
        source: sources[index],
        error: result.reason.message,
        timestamp: new Date()
      });
    }
  });
  
  return aggregatedData;
}
```

### 6.2 降級策略

```javascript
function applyFallbackStrategies(aggregatedData) {
  // 策略 1: 郵件來源降級
  if (aggregatedData.errors.some(e => e.source === 'gmail') && 
      aggregatedData.emails.filter(e => e.source === 'zimbra').length > 0) {
    console.warn('Gmail 失敗，使用 Zimbra 郵件');
  }
  
  // 策略 2: 無前次會議紀錄時，從記憶中查找
  if (!aggregatedData.previousMeeting && aggregatedData.memories.length > 0) {
    const meetingMemories = aggregatedData.memories.filter(
      m => m.memoryType === '會議紀錄'
    );
    if (meetingMemories.length > 0) {
      aggregatedData.previousMeeting = {
        date: meetingMemories[0].createdAt,
        summary: '從記憶檔案還原',
        content: meetingMemories[0].content
      };
    }
  }
  
  // 策略 3: 無任務時，從郵件中提取待辦
  if (aggregatedData.tasks.length === 0 && aggregatedData.emails.length > 0) {
    const todoKeywords = ['待辦', '請', 'TODO', 'action item', '麻煩'];
    aggregatedData.emails.forEach(email => {
      if (todoKeywords.some(kw => email.snippet.includes(kw))) {
        email.hasPotentialTodos = true;
      }
    });
  }
  
  return aggregatedData;
}
```

### 6.3 錯誤通知

```javascript
async function notifyDataSourceErrors(errors, meetingContext) {
  if (errors.length === 0) return;
  
  const errorSummary = errors.map(e => 
    `- ${e.source}: ${e.error}`
  ).join('\n');
  
  const message = `
⚠️ 會議簡報資料拉取部分失敗

**會議**: ${meetingContext.summary}
**時間**: ${formatDate(meetingContext.startTime)}

**失敗來源**:
${errorSummary}

簡報已使用現有資料生成，但可能不完整。
  `.trim();
  
  // 透過 Telegram 通知 William
  await message({
    action: 'send',
    channel: 'telegram',
    target: 'telegram:1029808355',
    message: message
  });
}
```

---

## 七、API 規格定義

### 7.1 主要 API

#### aggregateData
```typescript
/**
 * 聚合所有資料源
 * @param meetingContext - 會議基本資訊
 * @returns Promise<AggregatedRawData>
 */
async function aggregateData(
  meetingContext: MeetingContext
): Promise<AggregatedRawData>
```

#### normalizeData
```typescript
/**
 * 標準化、評分、排序資料
 * @param aggregatedData - 原始資料集
 * @returns NormalizedData
 */
function normalizeData(
  aggregatedData: AggregatedRawData
): NormalizedData
```

#### generateBriefing
```typescript
/**
 * 完整流程：拉取 → 標準化 → 生成 Markdown
 * @param meetingId - Google Calendar Event ID
 * @returns Promise<string> Markdown 內容
 */
async function generateBriefing(
  meetingId: string
): Promise<string>
```

### 7.2 輔助 API

#### extractKeywords
```typescript
/**
 * 從會議資訊提取關鍵字
 * @param meetingContext - 會議資訊
 * @returns string[] 關鍵字陣列
 */
function extractKeywords(
  meetingContext: MeetingContext
): string[]
```

#### scoreRelevance
```typescript
/**
 * 計算資料項目與會議的相關性
 * @param item - 資料項目（Email/Task/Memory）
 * @param meetingContext - 會議資訊
 * @returns number 0-100 的評分
 */
function scoreRelevance(
  item: Email | Task | Memory,
  meetingContext: MeetingContext
): number
```

---

## 八、實作檔案結構

```
~/clawd/secretary/
├── briefing/
│   ├── index.js                  # 主入口
│   ├── aggregator.js             # Data Aggregator
│   ├── fetchers/
│   │   ├── email-fetcher.js      # Email Fetcher (Gmail + Zimbra)
│   │   ├── calendar-fetcher.js   # Calendar Fetcher
│   │   ├── task-fetcher.js       # Task Fetcher
│   │   └── memory-fetcher.js     # Memory Fetcher
│   ├── normalizer.js             # Data Normalizer
│   ├── scorer.js                 # 相關性評分邏輯
│   ├── template.js               # Template Engine
│   └── utils/
│       ├── keyword-extractor.js  # 關鍵字提取
│       ├── zimbra-client.js      # Zimbra SOAP 客戶端
│       └── date-utils.js         # 日期處理
├── config.js                     # 設定檔（API 金鑰、閾值）
└── types.d.ts                    # TypeScript 型別定義
```

---

## 九、測試計畫

### 9.1 單元測試

| 測試項目 | 測試內容 | 預期結果 |
|---------|---------|---------|
| **extractKeywords** | 輸入「Aurotek 與 ABC 科技 Q1 專案檢討」 | 回傳 `['Aurotek', 'ABC 科技', 'Q1']` |
| **scoreEmailRelevance** | 與會者郵件 + 3 天內 + 有附件 | 評分 ≥ 60 |
| **mergeAndDeduplicate** | Gmail 與 Zimbra 有重複郵件 | 去重後只保留一封 |
| **normalizeData** | 10 封郵件，評分差異大 | 只保留前 5 封且評分 ≥ 30 |

### 9.2 整合測試

#### 測試案例 1：標準客戶會議
```javascript
const testMeeting = {
  id: 'test123',
  summary: 'Aurotek 與 ABC 科技 Q1 專案檢討',
  startTime: new Date('2026-02-18T14:00:00+08:00'),
  attendees: [
    { email: 'zhang@abc.com', displayName: '張大明 (ABC 科技)' },
    { email: 'williamhsiao@aurotek.com', displayName: 'William Hsiao' }
  ]
};

const briefing = await generateBriefing(testMeeting.id);

// 預期結果
assert(briefing.includes('張大明'));
assert(briefing.includes('ABC 科技'));
assert(briefing.emails.length >= 1);  // 至少找到 1 封相關郵件
assert(briefing.tasks.length >= 0);   // 可能有相關任務
```

#### 測試案例 2：資料源部分失敗
```javascript
// 模擬 Gmail API 失敗
mock.gmail.users.messages.list = () => { throw new Error('API quota exceeded'); };

const briefing = await generateBriefing('test123');

// 預期結果
assert(briefing.errors.some(e => e.source === 'gmail'));
assert(briefing.emails.some(e => e.source === 'zimbra'));  // 降級到 Zimbra
assert(briefing !== null);  // 仍然生成簡報
```

### 9.3 端到端測試

在測試環境建立真實會議，驗證完整流程：

1. 在 Google Calendar 建立測試會議
2. 發送 2-3 封相關郵件（Gmail + Zimbra）
3. 在 Supabase 建立相關任務與記憶
4. 執行 `generateBriefing()`
5. 驗證：
   - Markdown 格式正確
   - 所有資料來源都有提取
   - 相關性評分合理
   - 無錯誤或錯誤已通知

---

## 十、效能考量

### 10.1 效能目標

| 指標 | 目標值 |
|------|--------|
| **總執行時間** | < 10 秒 |
| **Gmail API 呼叫** | ≤ 3 次/會議 |
| **Zimbra API 呼叫** | ≤ 2 次/會議 |
| **Supabase 查詢** | ≤ 5 次/會議 |
| **記憶體使用** | < 100 MB |

### 10.2 優化策略

#### 快取機制
```javascript
const cache = new Map();

async function fetchWithCache(key, fetchFn, ttl = 3600) {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < ttl * 1000) {
    return cached.data;
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// 使用範例
const emails = await fetchWithCache(
  `emails-${meetingId}`,
  () => fetchGmailEmails(meetingContext),
  1800  // 快取 30 分鐘
);
```

#### 分頁與限制
```javascript
// Gmail: 限制最多回傳 20 封
gmail.users.messages.list({ maxResults: 20 });

// Supabase: 限制查詢結果
SELECT ... LIMIT 10;
```

#### 並行執行
```javascript
// ✅ 正確：並行執行獨立請求
Promise.allSettled([
  fetchGmail(),
  fetchZimbra(),
  fetchTasks()
]);

// ❌ 錯誤：序列執行浪費時間
await fetchGmail();
await fetchZimbra();
await fetchTasks();
```

---

## 十一、安全性與隱私

### 11.1 憑證管理

```javascript
// ❌ 錯誤：硬編碼憑證
const password = 'mypassword123';

// ✅ 正確：從安全檔案讀取
const credentials = JSON.parse(
  fs.readFileSync('~/.openclaw/credentials/zimbra.json', 'utf8')
);
```

### 11.2 資料脫敏

```javascript
function sanitizeForLogging(data) {
  return {
    ...data,
    attendees: data.attendees.map(a => ({
      email: maskEmail(a.email),  // z***@abc.com
      displayName: a.displayName?.split(' ')[0]  // 只保留名字
    })),
    description: data.description ? '[已隱藏]' : null
  };
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
}
```

### 11.3 存取控制

```javascript
// Supabase Row Level Security (RLS) 政策
CREATE POLICY "William only can access his briefings"
ON meeting_briefings
FOR SELECT
USING (auth.uid() = 'william-uuid');
```

---

## 十二、後續規劃

### Phase 3：自動觸發（Board #188）
- 實作 Cron Job 定時掃描
- 整合 Phase 2 資料拉取層
- 實作推送邏輯

### Phase 4：智慧優化（未來）
- OpenAI API 整合生成郵件摘要
- 前次會議決議自動提取（NLP）
- 風險識別（逾期任務、緊急郵件關鍵字）

---

## 十三、附錄

### A. 相依套件

```json
{
  "dependencies": {
    "googleapis": "^118.0.0",
    "node-fetch": "^3.3.0",
    "xml2js": "^0.6.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "jest": "^29.0.0"
  }
}
```

### B. 環境變數

```bash
# ~/.openclaw/.env
GOOGLE_CALENDAR_ID=primary
GMAIL_USER_ID=me
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
ZIMBRA_SOAP_URL=https://webmail.aurotek.com/service/soap
```

### C. 錯誤碼定義

| 錯誤碼 | 說明 | 處理方式 |
|--------|------|----------|
| `E_GMAIL_QUOTA` | Gmail API 配額超限 | 降級至 Zimbra，通知 William |
| `E_ZIMBRA_AUTH` | Zimbra 認證失敗 | 跳過 Zimbra 郵件，通知 William |
| `E_SUPABASE_TIMEOUT` | Supabase 查詢逾時 | 重試 1 次，失敗則跳過 |
| `E_NO_MEETING` | 找不到會議 | 回傳錯誤訊息 |
| `E_EMPTY_BRIEFING` | 所有資料源都失敗 | 通知 William，不生成簡報 |

---

## 審查與回饋

**下次審查時間**: Phase 2 實作完成後  
**審查重點**:
- 資料匹配準確率是否達標 (> 75%)
- 相關性評分演算法是否合理
- 效能是否符合目標 (< 10 秒)
- 錯誤處理是否完善

**回饋管道**: William 使用 1 週後填寫回饋表單

---

**文件狀態**: ✅ 設計完成，待實作  
**預估實作時間**: 1-2 週  
**負責人**: Secretary Agent
