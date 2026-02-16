# Agent 活動時間軸元件設計規格

**設計者**: Designer  
**日期**: 2026-02-16  
**版本**: 1.0  
**衍生自**: Board #98 Dashboard 設計

---

## 一、設計概述

### 目的
為 Hub 提供統一的 Agent 活動時間軸元件，可視化展示所有 Agent 的活動記錄，包含任務完成、報告產出、Forum 留言、系統事件等。

### 使用場景
- Dashboard 主頁嵌入顯示
- 獨立的活動歷史頁面
- Agent 個別頁面的活動區塊

### 設計原則
- **清晰性**: 事件類型一目了然
- **可讀性**: 時間分組與內容層次分明
- **可擴展性**: 易於新增事件類型
- **性能優先**: 支援無限捲動與虛擬化

---

## 二、UI 元件結構

### 2.1 整體佈局

```
┌─────────────────────────────────────────────┐
│  [過濾器區域]                                 │
│  [Agent 選擇器] [事件類型選擇器] [時間範圍]    │
├─────────────────────────────────────────────┤
│  今天                                        │
│  ┌───────────────────────────────────────┐  │
│  │ [圖標] Agent名 · 事件標題        14:30 │  │
│  │        事件摘要內容...                 │  │
│  │        [次要操作]                      │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │ [圖標] Agent名 · 事件標題        12:15 │  │
│  │        事件摘要內容...                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  昨天                                        │
│  ┌───────────────────────────────────────┐  │
│  │ [圖標] Agent名 · 事件標題   昨天 18:20 │  │
│  │        事件摘要內容...                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [載入更多...]                               │
└─────────────────────────────────────────────┘
```

### 2.2 事件卡片設計

#### 卡片結構
```tsx
<TimelineCard>
  <CardHeader>
    <EventIcon /> {/* 事件類型圖標 */}
    <AgentAvatar /> {/* Agent 頭像 */}
    <AgentName /> {/* Agent 名稱 */}
    <EventTitle /> {/* 事件標題 */}
    <Timestamp /> {/* 時間戳記 */}
  </CardHeader>
  <CardContent>
    <EventSummary /> {/* 事件摘要 */}
    <Metadata /> {/* 可選的元數據標籤 */}
  </CardContent>
  <CardActions> {/* 可選 */}
    <QuickActions /> {/* 查看詳情、複製連結等 */}
  </CardActions>
</TimelineCard>
```

#### 樣式規範
- **卡片間距**: 12px
- **卡片圓角**: 8px
- **卡片陰影**: `0 1px 3px rgba(0,0,0,0.1)`
- **懸停效果**: `0 4px 6px rgba(0,0,0,0.15)` + 輕微上移
- **邊框**: 左側 3px 彩色邊框，顏色對應 Agent

#### Agent 頭像與顏色標識
- **頭像尺寸**: 32px × 32px (圓形)
- **顏色方案**: 
  ```typescript
  const agentColors = {
    'Architect': '#3B82F6',    // 藍色 - 架構
    'Designer': '#8B5CF6',     // 紫色 - 設計
    'Developer': '#10B981',    // 綠色 - 開發
    'Analyst': '#F59E0B',      // 橙色 - 分析
    'Coordinator': '#EF4444',  // 紅色 - 協調
    'default': '#6B7280'       // 灰色 - 預設
  };
  ```
- **應用方式**:
  - 卡片左側邊框色
  - Agent 頭像背景色
  - Agent 名稱文字色（hover 時）

---

## 三、事件類型與圖標映射

### 3.1 事件類型定義

| 事件類型 | 圖標 (lucide-react) | 顏色主題 | 說明 |
|---------|-------------------|---------|-----|
| `task_completed` | CheckCircle2 | green | 任務完成 |
| `task_started` | PlayCircle | blue | 任務開始 |
| `task_failed` | XCircle | red | 任務失敗 |
| `report_published` | FileText | purple | 報告發布 |
| `forum_post` | MessageSquare | indigo | Forum 發文 |
| `forum_reply` | MessageCircle | indigo | Forum 回覆 |
| `code_committed` | GitCommit | teal | 代碼提交 |
| `deployment` | Rocket | orange | 部署事件 |
| `system_alert` | AlertTriangle | amber | 系統警告 |
| `system_info` | Info | sky | 系統資訊 |
| `collaboration` | Users | pink | 協作事件 |
| `document_updated` | FilePenLine | violet | 文件更新 |
| `milestone` | Flag | rose | 里程碑 |

### 3.2 圖標樣式
- **尺寸**: 20px × 20px
- **筆觸寬度**: 2px
- **位置**: 卡片左上角，與頭像並排
- **顏色**: 對應事件類型主題色

### 3.3 TypeScript 類型定義

```typescript
type EventType = 
  | 'task_completed'
  | 'task_started'
  | 'task_failed'
  | 'report_published'
  | 'forum_post'
  | 'forum_reply'
  | 'code_committed'
  | 'deployment'
  | 'system_alert'
  | 'system_info'
  | 'collaboration'
  | 'document_updated'
  | 'milestone';

interface TimelineEvent {
  id: string;
  type: EventType;
  agentId: string;
  agentName: string;
  title: string;
  summary?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  actionUrl?: string;
}

interface EventIconMapping {
  icon: LucideIcon;
  color: string;
  label: string;
}
```

---

## 四、時間分組設計

### 4.1 分組邏輯

```typescript
enum TimeGroup {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  OLDER = 'older'
}

const groupLabels = {
  today: '今天',
  yesterday: '昨天',
  this_week: '本週',
  last_week: '上週',
  this_month: '本月',
  older: '更早'
};
```

### 4.2 分組標題樣式
- **字體大小**: 14px
- **字重**: 600 (Semi-bold)
- **顏色**: text-gray-500
- **間距**: 上 24px，下 12px
- **樣式**: 左側短線裝飾（可選）

### 4.3 時間戳記顯示規則
- **今天**: 僅顯示時間 "14:30"
- **昨天**: "昨天 18:20"
- **本週**: "週三 15:00" 或 "2 天前"
- **更早**: "2月12日" 或 "1月25日"
- **跨年**: "2025年12月30日"

---

## 五、過濾器設計

### 5.1 過濾器元件

#### Agent 選擇器
```tsx
<MultiSelect
  placeholder="所有 Agent"
  options={agents}
  value={selectedAgents}
  onChange={setSelectedAgents}
  renderOption={(agent) => (
    <div className="flex items-center gap-2">
      <Avatar color={agent.color} size="sm" />
      <span>{agent.name}</span>
    </div>
  )}
/>
```

#### 事件類型選擇器
```tsx
<MultiSelect
  placeholder="所有事件類型"
  options={eventTypes}
  value={selectedTypes}
  onChange={setSelectedTypes}
  renderOption={(type) => (
    <div className="flex items-center gap-2">
      <EventIcon type={type} size={16} />
      <span>{type.label}</span>
    </div>
  )}
/>
```

#### 時間範圍選擇器
```tsx
<Select
  options={[
    { value: 'today', label: '今天' },
    { value: 'week', label: '最近 7 天' },
    { value: 'month', label: '最近 30 天' },
    { value: 'all', label: '全部' }
  ]}
  value={timeRange}
  onChange={setTimeRange}
/>
```

### 5.2 過濾器佈局
- **排列**: 水平並排（桌面），垂直堆疊（行動）
- **間距**: 12px
- **位置**: 時間軸上方，固定或隨捲動

### 5.3 過濾狀態顯示
當有過濾條件時，顯示活動的過濾標籤：
```tsx
<FilterBadges>
  <Badge variant="filter" onRemove={() => removeAgent(id)}>
    <Avatar size="xs" /> Agent名
  </Badge>
  <Badge variant="filter" onRemove={() => removeType(type)}>
    <Icon /> 任務完成
  </Badge>
  <Button variant="ghost" size="sm" onClick={clearAll}>
    清除全部
  </Button>
</FilterBadges>
```

---

## 六、無限捲動與性能優化

### 6.1 實作方式
- **方案**: React Virtual + Intersection Observer
- **初始載入**: 20 個事件
- **每次載入**: 15 個事件
- **觸發點**: 距離底部 300px

### 6.2 載入狀態設計

#### 載入中
```tsx
<LoadingSpinner className="mx-auto my-8">
  <Loader2 className="animate-spin" />
  <span className="text-sm text-gray-500">載入中...</span>
</LoadingSpinner>
```

#### 沒有更多內容
```tsx
<EndMessage className="text-center py-8 text-gray-400">
  <CheckCircle2 size={24} className="mx-auto mb-2" />
  <p>已顯示全部活動</p>
</EndMessage>
```

#### 載入失敗
```tsx
<ErrorState className="text-center py-8">
  <AlertCircle className="text-red-500 mx-auto mb-2" />
  <p className="text-gray-600">載入失敗</p>
  <Button variant="outline" size="sm" onClick={retry}>
    重試
  </Button>
</ErrorState>
```

### 6.3 虛擬化建議
當事件總數 > 100 時，考慮使用 `@tanstack/react-virtual`：
```typescript
const virtualizer = useVirtualizer({
  count: events.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 120, // 預估卡片高度
  overscan: 5
});
```

---

## 七、響應式設計

### 7.1 斷點定義
```css
/* Mobile: < 640px */
/* Tablet: 640px - 1024px */
/* Desktop: >= 1024px */
```

### 7.2 佈局調整

#### 桌面 (>= 1024px)
- 卡片寬度: 最大 800px，置中
- 過濾器: 水平並排，固定在頂部
- 事件卡片: 完整內容顯示
- Agent 頭像: 32px

#### 平板 (640px - 1023px)
- 卡片寬度: 100%，左右 padding 16px
- 過濾器: 可摺疊抽屜
- 事件摘要: 最多 3 行
- Agent 頭像: 28px

#### 行動 (< 640px)
- 卡片寬度: 100%，左右 padding 12px
- 過濾器: 底部彈出選單
- 事件摘要: 最多 2 行
- Agent 頭像: 24px
- 時間戳記: 相對時間優先（"2小時前"）

### 7.3 觸控優化
- **最小觸控目標**: 44px × 44px
- **卡片間距**: 增加至 16px（行動裝置）
- **滑動手勢**: 左滑顯示操作選單（可選）

---

## 八、空狀態設計

### 8.1 無活動記錄
```tsx
<EmptyState className="text-center py-16">
  <Activity className="text-gray-300 mx-auto mb-4" size={64} />
  <h3 className="text-lg font-medium text-gray-700 mb-2">
    尚無活動記錄
  </h3>
  <p className="text-gray-500 mb-4">
    當 Agent 開始工作時，活動記錄會顯示在這裡
  </p>
</EmptyState>
```

### 8.2 過濾後無結果
```tsx
<EmptyState className="text-center py-12">
  <Search className="text-gray-300 mx-auto mb-3" size={48} />
  <h3 className="text-base font-medium text-gray-700 mb-1">
    找不到符合的活動
  </h3>
  <p className="text-sm text-gray-500 mb-3">
    請嘗試調整過濾條件
  </p>
  <Button variant="outline" size="sm" onClick={clearFilters}>
    清除過濾器
  </Button>
</EmptyState>
```

---

## 九、互動設計

### 9.1 卡片互動

#### 懸停效果
- 陰影加深
- 輕微上移 (translateY: -2px)
- 過渡時間: 200ms

#### 點擊行為
- 預設: 展開顯示完整內容（如有截斷）
- 可選: 導航至詳細頁面
- 元數據標籤: 可點擊過濾同類型

### 9.2 快速操作

每個卡片右上角提供下拉選單：
```tsx
<DropdownMenu>
  <DropdownMenuItem onClick={viewDetails}>
    <ExternalLink size={16} /> 查看詳情
  </DropdownMenuItem>
  <DropdownMenuItem onClick={copyLink}>
    <Link size={16} /> 複製連結
  </DropdownMenuItem>
  <DropdownMenuItem onClick={filterSimilar}>
    <Filter size={16} /> 過濾同類事件
  </DropdownMenuItem>
</DropdownMenu>
```

### 9.3 鍵盤導航
- **Tab**: 卡片間導航
- **Enter/Space**: 開啟選中的卡片
- **Escape**: 關閉展開的卡片
- **Arrow Keys**: 上下移動焦點

---

## 十、可訪問性 (Accessibility)

### 10.1 語義化 HTML
```tsx
<section aria-label="Agent 活動時間軸">
  <div role="feed" aria-busy={isLoading}>
    <article aria-label={`${agent} ${title} at ${time}`}>
      {/* 事件卡片內容 */}
    </article>
  </div>
</section>
```

### 10.2 ARIA 屬性
- `aria-label`: 為圖標提供文字描述
- `aria-busy`: 載入狀態
- `aria-live="polite"`: 新事件通知區域
- `role="feed"`: 時間軸容器

### 10.3 對比度
- 文字與背景對比度 >= 4.5:1
- 圖標與背景對比度 >= 3:1
- 顏色編碼需配合圖標/文字標籤

### 10.4 螢幕閱讀器優化
```tsx
<span className="sr-only">
  {`${agentName} 在 ${formatTime(timestamp)} ${eventTypeLabel}: ${title}`}
</span>
```

---

## 十一、元件 API 設計

### 11.1 Props 定義

```typescript
interface ActivityTimelineProps {
  // 資料源
  events?: TimelineEvent[];
  fetchEvents?: (params: FetchParams) => Promise<TimelineEvent[]>;
  
  // 過濾器
  enableFilters?: boolean;
  defaultFilters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  
  // 顯示選項
  groupByTime?: boolean;
  showAgentAvatar?: boolean;
  showEventIcon?: boolean;
  compactMode?: boolean;
  
  // 分頁與載入
  pageSize?: number;
  enableInfiniteScroll?: boolean;
  enableVirtualization?: boolean;
  
  // 樣式
  className?: string;
  cardClassName?: string;
  maxWidth?: number;
  
  // 互動
  onEventClick?: (event: TimelineEvent) => void;
  onEventAction?: (action: string, event: TimelineEvent) => void;
  
  // 空狀態
  emptyStateMessage?: string;
  emptyStateIcon?: LucideIcon;
}

interface FilterState {
  agents?: string[];
  types?: EventType[];
  timeRange?: 'today' | 'week' | 'month' | 'all';
  customRange?: { start: Date; end: Date };
}

interface FetchParams {
  offset: number;
  limit: number;
  filters: FilterState;
}
```

### 11.2 使用範例

```tsx
// Dashboard 嵌入（精簡模式）
<ActivityTimeline
  pageSize={10}
  compactMode
  enableFilters={false}
  onEventClick={(event) => navigate(`/event/${event.id}`)}
  maxWidth={600}
/>

// 獨立頁面（完整功能）
<ActivityTimeline
  fetchEvents={fetchActivityEvents}
  enableFilters
  enableInfiniteScroll
  enableVirtualization
  defaultFilters={{ timeRange: 'week' }}
  onFilterChange={handleFilterChange}
/>
```

---

## 十二、資料流設計

### 12.1 狀態管理建議

```typescript
interface TimelineState {
  events: TimelineEvent[];
  filters: FilterState;
  loading: boolean;
  hasMore: boolean;
  error: Error | null;
  selectedEvent: TimelineEvent | null;
}

// 使用 Zustand 或 Context
const useTimelineStore = create<TimelineState>((set, get) => ({
  events: [],
  filters: {},
  loading: false,
  hasMore: true,
  error: null,
  selectedEvent: null,
  
  fetchEvents: async () => { /* ... */ },
  loadMore: async () => { /* ... */ },
  applyFilters: (filters) => { /* ... */ },
  clearFilters: () => { /* ... */ },
}));
```

### 12.2 快取策略
- **SWR/React Query**: 自動重新驗證與快取
- **快取時間**: 30 秒
- **重試策略**: 3 次，指數退避
- **樂觀更新**: 新事件即時顯示，背景同步

### 12.3 即時更新（可選）
使用 WebSocket 或 SSE 推送新事件：
```typescript
useEffect(() => {
  const unsubscribe = subscribeToEvents((newEvent) => {
    addEvent(newEvent);
    showToast(`新活動: ${newEvent.title}`);
  });
  
  return unsubscribe;
}, []);
```

---

## 十三、視覺設計細節

### 13.1 顏色系統

#### 淺色模式
```css
--timeline-bg: #ffffff;
--timeline-border: #e5e7eb;
--timeline-text-primary: #111827;
--timeline-text-secondary: #6b7280;
--timeline-hover: #f9fafb;
--timeline-shadow: rgba(0, 0, 0, 0.1);
```

#### 深色模式（未來擴展）
```css
--timeline-bg: #1f2937;
--timeline-border: #374151;
--timeline-text-primary: #f9fafb;
--timeline-text-secondary: #9ca3af;
--timeline-hover: #111827;
--timeline-shadow: rgba(0, 0, 0, 0.3);
```

### 13.2 排版
- **標題**: 16px / font-medium / line-height: 1.5
- **摘要**: 14px / font-normal / line-height: 1.6
- **時間戳記**: 13px / font-medium / text-gray-500
- **Agent 名稱**: 14px / font-medium / agent color

### 13.3 動畫
```css
/* 卡片進入動畫 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 新事件高亮 */
@keyframes highlightNew {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(59, 130, 246, 0.1); }
}
```

---

## 十四、測試考量

### 14.1 單元測試
- 時間分組邏輯
- 過濾器邏輯
- 事件類型映射
- 日期格式化

### 14.2 整合測試
- 無限捲動載入
- 過濾器應用
- 事件點擊處理
- 錯誤處理

### 14.3 視覺回歸測試
- Chromatic 或 Percy
- 測試不同螢幕尺寸
- 測試空狀態
- 測試載入狀態

---

## 十五、實作優先級

### P0 (必須)
- [x] 基本卡片設計與佈局
- [x] 事件類型圖標映射
- [x] 時間分組顯示
- [x] 基本響應式設計
- [x] Agent 顏色標識

### P1 (重要)
- [ ] 過濾器（Agent + 事件類型）
- [ ] 無限捲動
- [ ] 空狀態設計
- [ ] 錯誤處理

### P2 (期望)
- [ ] 虛擬化（性能優化）
- [ ] 快速操作選單
- [ ] 鍵盤導航
- [ ] 即時更新

### P3 (未來)
- [ ] 深色模式
- [ ] 進階過濾（日期範圍選擇器）
- [ ] 匯出功能
- [ ] 活動統計圖表

---

## 十六、技術棧建議

### 核心庫
- **React**: 18+
- **TypeScript**: 5+
- **Tailwind CSS**: 3+

### UI 組件
- **lucide-react**: 圖標
- **@radix-ui/react-dropdown-menu**: 下拉選單
- **@radix-ui/react-select**: 選擇器
- **@radix-ui/react-avatar**: 頭像

### 性能優化
- **@tanstack/react-virtual**: 虛擬捲動
- **@tanstack/react-query**: 資料管理
- **react-intersection-observer**: 無限捲動

### 日期處理
- **date-fns**: 輕量且樹搖優化

---

## 十七、後續工作

1. **原型製作**: 使用 Figma 製作高保真原型
2. **開發實作**: 基於本規格實作 React 元件
3. **資料整合**: 連接 Hub API 取得真實事件資料
4. **使用者測試**: 收集反饋並迭代
5. **文件編寫**: 元件使用文件與 Storybook

---

## 附錄 A：事件資料結構範例

```json
{
  "id": "evt_abc123",
  "type": "task_completed",
  "agentId": "agent_developer_001",
  "agentName": "Developer",
  "title": "完成 Auth API 開發",
  "summary": "實作了 JWT 驗證、密碼雜湊、以及 refresh token 機制",
  "timestamp": "2026-02-16T14:30:00Z",
  "metadata": {
    "taskId": "task_123",
    "boardId": "board_dev",
    "tags": ["backend", "security"],
    "duration": "3h 45m"
  },
  "actionUrl": "/tasks/123"
}
```

---

## 附錄 B：Lucide React 圖標引用

```tsx
import {
  CheckCircle2,
  PlayCircle,
  XCircle,
  FileText,
  MessageSquare,
  MessageCircle,
  GitCommit,
  Rocket,
  AlertTriangle,
  Info,
  Users,
  FilePenLine,
  Flag,
  Loader2,
  AlertCircle,
  Activity,
  Search,
  ExternalLink,
  Link,
  Filter
} from 'lucide-react';
```

---

**設計完成日期**: 2026-02-16  
**狀態**: 待審核  
**下一步**: 提交 Board #206 並等待 Coordinator 或 Architect 審核
