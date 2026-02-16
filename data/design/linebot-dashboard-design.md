# LINE Bot 品質 Dashboard 設計稿

## 一、概覽

### 頁面路徑
- `/linebot-dashboard`

### 設計原則
- 深色主題，與 William Hub 現有風格一致
- 使用 lucide-react icons（禁止 emoji）
- 響應式設計（RWD）
- 資料視覺化清晰易讀

---

## 二、頁面佈局

### 2.1 整體結構
```
┌─────────────────────────────────────────────┐
│  Header: LINE Bot 品質儀表板                  │
├─────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ KPI1 │ │ KPI2 │ │ KPI3 │ │ KPI4 │       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │   7 天趨勢折線圖                      │   │
│  │                                      │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │   分類準確率表格                      │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 2.2 區塊說明

#### A. Header 區域
- **高度**: 80px
- **背景**: `bg-gray-900`
- **標題**: "LINE Bot 品質儀表板"
- **字體**: text-2xl font-bold
- **顏色**: text-white
- **Icon**: MessageSquare (lucide-react)
- **右側**: 日期範圍選擇器（預設 7 天）

#### B. KPI 卡片區域（上方）
**容器規格**:
- **間距**: gap-4 (16px)
- **佈局**: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- **padding**: p-6

**單一 KPI 卡片規格**:
- **尺寸**: 
  - 桌面: 固定高度 140px，寬度自適應（1/4）
  - 平板: 寬度 50%
  - 手機: 寬度 100%
- **背景**: `bg-gray-800`
- **圓角**: rounded-lg
- **邊框**: border border-gray-700
- **padding**: p-5
- **hover 效果**: hover:bg-gray-750 transition-colors

**卡片內容結構**:
```
┌─────────────────────────┐
│ [Icon]  標籤            │  ← 14px, text-gray-400
│                         │
│ 數值                     │  ← 32px, font-bold, text-white
│                         │
│ 變化趨勢 ↑ +12%         │  ← 12px, text-green-400/red-400
└─────────────────────────┘
```

**四個 KPI 卡片**:

1. **日訊息量**
   - Icon: MessageCircle
   - 標籤: "今日訊息量"
   - 數值: total_messages
   - 趨勢: 與昨日比較（%）
   - Icon 顏色: text-blue-400

2. **回覆率**
   - Icon: Reply
   - 標籤: "Bot 回覆率"
   - 數值: (bot_replies / total_messages * 100).toFixed(1) + "%"
   - 趨勢: 與昨日比較
   - Icon 顏色: text-purple-400

3. **滿意度**
   - Icon: ThumbsUp
   - 標籤: "用戶滿意度"
   - 數值: (positive_feedback / (positive_feedback + negative_feedback) * 100).toFixed(1) + "%"
   - 趨勢: 與昨日比較
   - Icon 顏色: text-green-400

4. **平均回覆長度**
   - Icon: AlignLeft
   - 標籤: "平均回覆長度"
   - 數值: avg_reply_length + " 字"
   - 趨勢: 與昨日比較
   - Icon 顏色: text-yellow-400

#### C. 折線圖區域（中間）
**容器規格**:
- **margin**: mt-6
- **背景**: bg-gray-800
- **圓角**: rounded-lg
- **邊框**: border border-gray-700
- **padding**: p-6
- **高度**: 400px

**標題**:
- 文字: "7 天趨勢分析"
- Icon: TrendingUp
- 字體: text-lg font-semibold text-white

**圖表庫**: Recharts
**圖表類型**: LineChart

**圖表配置**:
- **X 軸**: date (格式: MM/DD)
- **Y 軸**: 
  - 左側: 訊息量 (total_messages, bot_replies)
  - 右側: 百分比 (回覆率, 滿意度)
- **線條**:
  1. 總訊息量 - stroke: #60A5FA (blue-400), strokeWidth: 2
  2. Bot 回覆量 - stroke: #A78BFA (purple-400), strokeWidth: 2
  3. 回覆率 - stroke: #34D399 (green-400), strokeWidth: 2, strokeDasharray: "5 5"
  4. 滿意度 - stroke: #FBBF24 (yellow-400), strokeWidth: 2, strokeDasharray: "5 5"

**圖例**:
- 位置: top
- 顏色: text-gray-300
- 可點擊切換顯示/隱藏

**Tooltip**:
- 背景: bg-gray-900/95
- 邊框: border border-gray-600
- 文字: text-sm text-white

#### D. 分類準確率表格（下方）
**容器規格**:
- **margin**: mt-6 mb-6
- **背景**: bg-gray-800
- **圓角**: rounded-lg
- **邊框**: border border-gray-700
- **padding**: p-6

**標題**:
- 文字: "分類準確率統計"
- Icon: BarChart3
- 字體: text-lg font-semibold text-white

**表格規格**:
- **標題列背景**: bg-gray-700
- **標題文字**: text-sm font-medium text-gray-300 uppercase
- **內容列**: 
  - 偶數列: bg-gray-800
  - 奇數列: bg-gray-750
  - hover: bg-gray-700
- **padding**: py-3 px-4
- **邊框**: border-b border-gray-700

**欄位設計**:
| 欄位名稱 | 寬度 | 對齊 | 內容 |
|---------|------|------|------|
| 分類名稱 | 30% | left | 類別 icon + 名稱 |
| 準確率 | 20% | center | 百分比 + 進度條 |
| 樣本數 | 20% | center | 數字 |
| 信心度 | 15% | center | 百分比 |
| 狀態 | 15% | center | Badge (良好/待改進) |

**進度條設計**:
- 高度: 8px
- 背景: bg-gray-600
- 填充顏色:
  - ≥90%: bg-green-500
  - 70-89%: bg-yellow-500
  - <70%: bg-red-500
- 圓角: rounded-full

---

## 三、配色規範

### 3.1 主色系（深色主題）
```javascript
const colors = {
  // 背景
  background: {
    primary: '#111827',    // gray-900 - 主背景
    secondary: '#1F2937',  // gray-800 - 卡片背景
    tertiary: '#374151',   // gray-700 - 標題列
    hover: '#2D3748',      // gray-750 - hover 狀態
  },
  
  // 文字
  text: {
    primary: '#FFFFFF',    // 主文字
    secondary: '#9CA3AF',  // gray-400 - 次要文字
    tertiary: '#6B7280',   // gray-500 - 輔助文字
  },
  
  // 邊框
  border: {
    default: '#374151',    // gray-700
    hover: '#4B5563',      // gray-600
  },
  
  // 功能色
  functional: {
    blue: '#60A5FA',       // 訊息量
    purple: '#A78BFA',     // 回覆率
    green: '#34D399',      // 滿意度/正面
    yellow: '#FBBF24',     // 平均長度
    red: '#F87171',        // 負面/警告
  },
  
  // 狀態
  status: {
    success: '#10B981',    // green-500
    warning: '#F59E0B',    // yellow-500
    error: '#EF4444',      // red-500
    info: '#3B82F6',       // blue-500
  }
}
```

### 3.2 Tailwind CSS Classes
```javascript
// 常用組合
const styles = {
  card: "bg-gray-800 border border-gray-700 rounded-lg p-5 hover:bg-gray-750 transition-colors",
  cardTitle: "text-sm font-medium text-gray-400 mb-2",
  cardValue: "text-3xl font-bold text-white",
  cardTrend: "text-xs text-green-400 mt-1", // 或 text-red-400
  sectionTitle: "text-lg font-semibold text-white mb-4 flex items-center gap-2",
}
```

---

## 四、響應式設計 (RWD)

### 4.1 斷點
```javascript
const breakpoints = {
  sm: '640px',   // 手機（豎屏）
  md: '768px',   // 平板（豎屏）
  lg: '1024px',  // 桌面
  xl: '1280px',  // 大桌面
}
```

### 4.2 佈局變化

#### 桌面 (≥1024px)
- KPI 卡片: 4 列 (grid-cols-4)
- 折線圖高度: 400px
- 表格: 完整顯示所有欄位
- 內容寬度: max-w-7xl mx-auto

#### 平板 (768px - 1023px)
- KPI 卡片: 2 列 (md:grid-cols-2)
- 折線圖高度: 350px
- 表格: 縮小 padding，保持所有欄位

#### 手機 (< 768px)
- KPI 卡片: 1 列 (grid-cols-1)
- 折線圖高度: 300px
- 折線圖: 橫向滾動或簡化顯示
- 表格: 
  - 隱藏「信心度」欄
  - 簡化顯示，卡片式佈局
  - 每行顯示：名稱、準確率、狀態
- Header: 
  - 標題縮小 (text-xl)
  - 日期選擇器改為 icon button

### 4.3 響應式類別範例
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* KPI Cards */}
</div>

<div className="h-[300px] md:h-[350px] lg:h-[400px]">
  {/* Chart */}
</div>

<div className="hidden sm:block">
  {/* 手機隱藏的欄位 */}
</div>
```

---

## 五、元件規格詳細

### 5.1 字體規格
```javascript
const typography = {
  // 標題
  pageTitle: 'text-2xl md:text-3xl font-bold',
  sectionTitle: 'text-lg md:text-xl font-semibold',
  cardTitle: 'text-sm font-medium',
  
  // 數值
  kpiValue: 'text-3xl md:text-4xl font-bold',
  tableValue: 'text-sm',
  
  // 輔助文字
  label: 'text-xs uppercase tracking-wide',
  trend: 'text-xs font-medium',
}
```

### 5.2 間距規範
```javascript
const spacing = {
  // 容器 padding
  pageContainer: 'p-4 md:p-6 lg:p-8',
  cardPadding: 'p-4 md:p-5',
  sectionPadding: 'p-5 md:p-6',
  
  // 元素間距
  sectionGap: 'space-y-6',
  cardGap: 'gap-4',
  elementGap: 'space-y-2',
  
  // Margin
  sectionMargin: 'mt-6',
  elementMargin: 'mt-2 mb-4',
}
```

### 5.3 圓角與陰影
```javascript
const effects = {
  // 圓角
  cardRadius: 'rounded-lg',      // 8px
  buttonRadius: 'rounded-md',    // 6px
  badgeRadius: 'rounded-full',   // 全圓
  
  // 陰影（可選，深色主題較少用）
  cardShadow: 'shadow-lg shadow-black/10',
  hoverShadow: 'hover:shadow-xl hover:shadow-black/20',
}
```

### 5.4 Icons 使用
```javascript
import { 
  MessageCircle,    // 訊息量
  Reply,            // 回覆率
  ThumbsUp,         // 滿意度
  AlignLeft,        // 平均長度
  TrendingUp,       // 趨勢圖
  BarChart3,        // 分類表格
  Calendar,         // 日期選擇
  ChevronDown,      // 下拉選單
  ChevronUp,        // 上升趨勢
  ChevronDown,      // 下降趨勢
  Minus,            // 持平
} from 'lucide-react';

// Icon 尺寸
const iconSizes = {
  small: 16,    // w-4 h-4
  medium: 20,   // w-5 h-5
  large: 24,    // w-6 h-6
}
```

---

## 六、資料來源與 API 設計

### 6.1 Supabase 表結構
```sql
-- 現有表：bot_metrics
CREATE TABLE bot_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  total_messages INTEGER DEFAULT 0,
  bot_replies INTEGER DEFAULT 0,
  positive_feedback INTEGER DEFAULT 0,
  negative_feedback INTEGER DEFAULT 0,
  avg_reply_length NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 建議新增：分類準確率表
CREATE TABLE bot_classification_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  accuracy NUMERIC(5,2),        -- 準確率 (%)
  sample_count INTEGER,          -- 樣本數
  confidence NUMERIC(5,2),       -- 信心度 (%)
  status VARCHAR(20),            -- 'good' | 'needs_improvement'
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_bot_metrics_date ON bot_metrics(date DESC);
CREATE INDEX idx_classification_date ON bot_classification_metrics(date DESC);
```

### 6.2 API Endpoints

#### A. 獲取儀表板概覽資料
```
GET /api/linebot/dashboard/overview
Query Parameters:
  - startDate: YYYY-MM-DD (預設: 7 天前)
  - endDate: YYYY-MM-DD (預設: 今天)

Response:
{
  "success": true,
  "data": {
    "kpis": {
      "today": {
        "totalMessages": 1250,
        "replyRate": 94.5,
        "satisfaction": 87.3,
        "avgReplyLength": 156
      },
      "yesterday": {
        "totalMessages": 1180,
        "replyRate": 92.1,
        "satisfaction": 85.8,
        "avgReplyLength": 148
      },
      "trends": {
        "totalMessages": "+5.9%",
        "replyRate": "+2.6%",
        "satisfaction": "+1.7%",
        "avgReplyLength": "+5.4%"
      }
    },
    "chart": [
      {
        "date": "2026-02-09",
        "totalMessages": 1100,
        "botReplies": 1020,
        "replyRate": 92.7,
        "satisfaction": 86.2
      },
      // ... 7 天資料
    ],
    "lastUpdated": "2026-02-15T21:00:00Z"
  }
}
```

#### B. 獲取分類準確率資料
```
GET /api/linebot/dashboard/classification
Query Parameters:
  - date: YYYY-MM-DD (預設: 今天)

Response:
{
  "success": true,
  "data": [
    {
      "categoryName": "產品諮詢",
      "accuracy": 94.5,
      "sampleCount": 320,
      "confidence": 88.7,
      "status": "good"
    },
    {
      "categoryName": "技術支援",
      "accuracy": 87.2,
      "sampleCount": 185,
      "confidence": 82.3,
      "status": "good"
    },
    {
      "categoryName": "訂單查詢",
      "accuracy": 68.9,
      "sampleCount": 95,
      "confidence": 71.4,
      "status": "needs_improvement"
    }
  ]
}
```

### 6.3 資料獲取邏輯

#### Next.js API Route 範例
```typescript
// app/api/linebot/dashboard/overview/route.ts
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
  const startDate = searchParams.get('startDate') || 
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 獲取圖表資料 (7天)
  const { data: chartData, error: chartError } = await supabase
    .from('bot_metrics')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (chartError) {
    return Response.json({ success: false, error: chartError.message }, { status: 500 });
  }

  // 獲取今天資料
  const today = chartData?.[chartData.length - 1];
  const yesterday = chartData?.[chartData.length - 2];

  // 計算 KPI
  const kpis = {
    today: {
      totalMessages: today?.total_messages || 0,
      replyRate: today ? (today.bot_replies / today.total_messages * 100) : 0,
      satisfaction: today ? (today.positive_feedback / (today.positive_feedback + today.negative_feedback) * 100) : 0,
      avgReplyLength: today?.avg_reply_length || 0,
    },
    yesterday: {
      totalMessages: yesterday?.total_messages || 0,
      replyRate: yesterday ? (yesterday.bot_replies / yesterday.total_messages * 100) : 0,
      satisfaction: yesterday ? (yesterday.positive_feedback / (yesterday.positive_feedback + yesterday.negative_feedback) * 100) : 0,
      avgReplyLength: yesterday?.avg_reply_length || 0,
    },
    trends: calculateTrends(today, yesterday),
  };

  // 格式化圖表資料
  const chart = chartData.map(d => ({
    date: d.date,
    totalMessages: d.total_messages,
    botReplies: d.bot_replies,
    replyRate: (d.bot_replies / d.total_messages * 100).toFixed(1),
    satisfaction: (d.positive_feedback / (d.positive_feedback + d.negative_feedback) * 100).toFixed(1),
  }));

  return Response.json({
    success: true,
    data: { kpis, chart, lastUpdated: new Date().toISOString() }
  });
}

function calculateTrends(today: any, yesterday: any) {
  if (!today || !yesterday) return {};
  
  const calc = (t: number, y: number) => {
    const change = ((t - y) / y * 100).toFixed(1);
    return change > 0 ? `+${change}%` : `${change}%`;
  };

  return {
    totalMessages: calc(today.total_messages, yesterday.total_messages),
    replyRate: calc(
      today.bot_replies / today.total_messages,
      yesterday.bot_replies / yesterday.total_messages
    ),
    satisfaction: calc(
      today.positive_feedback / (today.positive_feedback + today.negative_feedback),
      yesterday.positive_feedback / (yesterday.positive_feedback + yesterday.negative_feedback)
    ),
    avgReplyLength: calc(today.avg_reply_length, yesterday.avg_reply_length),
  };
}
```

### 6.4 前端資料獲取
```typescript
// hooks/useLineBotDashboard.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useLineBotDashboard(dateRange = 7) {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - (dateRange - 1) * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const { data, error, isLoading } = useSWR(
    `/api/linebot/dashboard/overview?startDate=${startDate}&endDate=${endDate}`,
    fetcher,
    { refreshInterval: 60000 } // 每分鐘更新
  );

  return {
    kpis: data?.data?.kpis,
    chart: data?.data?.chart,
    lastUpdated: data?.data?.lastUpdated,
    isLoading,
    error
  };
}

export function useClassificationMetrics(date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const { data, error, isLoading } = useSWR(
    `/api/linebot/dashboard/classification?date=${targetDate}`,
    fetcher,
    { refreshInterval: 300000 } // 每 5 分鐘更新
  );

  return {
    classifications: data?.data || [],
    isLoading,
    error
  };
}
```

---

## 七、元件實作範例

### 7.1 KPI Card 元件
```tsx
// components/linebot/KPICard.tsx
import { LucideIcon } from 'lucide-react';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: string;
  icon: LucideIcon;
  iconColor: string;
}

export function KPICard({ title, value, trend, icon: Icon, iconColor }: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.startsWith('+')) return <ChevronUp className="w-3 h-3" />;
    if (trend.startsWith('-')) return <ChevronDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-400';
    if (trend.startsWith('+')) return 'text-green-400';
    if (trend.startsWith('-')) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 hover:bg-gray-750 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className="text-sm font-medium text-gray-400">{title}</span>
      </div>
      
      <div className="text-3xl font-bold text-white mb-1">
        {value}
      </div>
      
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{trend}</span>
          <span className="text-gray-500">vs 昨日</span>
        </div>
      )}
    </div>
  );
}
```

### 7.2 趨勢圖元件
```tsx
// components/linebot/TrendChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TrendChartProps {
  data: Array<{
    date: string;
    totalMessages: number;
    botReplies: number;
    replyRate: number;
    satisfaction: number;
  }>;
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">7 天趨勢分析</h2>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#111827',
              border: '1px solid #4B5563',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#FFFFFF' }}
          />
          <Legend 
            wrapperStyle={{ color: '#9CA3AF' }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="totalMessages" 
            stroke="#60A5FA" 
            strokeWidth={2}
            name="總訊息量"
            dot={{ fill: '#60A5FA' }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="botReplies" 
            stroke="#A78BFA" 
            strokeWidth={2}
            name="Bot 回覆量"
            dot={{ fill: '#A78BFA' }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="replyRate" 
            stroke="#34D399" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="回覆率 (%)"
            dot={{ fill: '#34D399' }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="satisfaction" 
            stroke="#FBBF24" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="滿意度 (%)"
            dot={{ fill: '#FBBF24' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 7.3 分類準確率表格元件
```tsx
// components/linebot/ClassificationTable.tsx
import { BarChart3 } from 'lucide-react';

interface Classification {
  categoryName: string;
  accuracy: number;
  sampleCount: number;
  confidence: number;
  status: 'good' | 'needs_improvement';
}

interface ClassificationTableProps {
  data: Classification[];
}

export function ClassificationTable({ data }: ClassificationTableProps) {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'bg-green-500';
    if (accuracy >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status: string) => {
    const styles = status === 'good'
      ? 'bg-green-500/10 text-green-400 border-green-500/20'
      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    
    const text = status === 'good' ? '良好' : '待改進';
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles}`}>
        {text}
      </span>
    );
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">分類準確率統計</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700 border-b border-gray-600">
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 uppercase">分類名稱</th>
              <th className="py-3 px-4 text-center text-sm font-medium text-gray-300 uppercase">準確率</th>
              <th className="py-3 px-4 text-center text-sm font-medium text-gray-300 uppercase">樣本數</th>
              <th className="py-3 px-4 text-center text-sm font-medium text-gray-300 uppercase hidden sm:table-cell">信心度</th>
              <th className="py-3 px-4 text-center text-sm font-medium text-gray-300 uppercase">狀態</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr 
                key={index}
                className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-white">{item.categoryName}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-medium text-white">{item.accuracy}%</span>
                    <div className="w-full max-w-[120px] h-2 bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getAccuracyColor(item.accuracy)} transition-all`}
                        style={{ width: `${item.accuracy}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center text-sm text-gray-300">{item.sampleCount}</td>
                <td className="py-3 px-4 text-center text-sm text-gray-300 hidden sm:table-cell">{item.confidence}%</td>
                <td className="py-3 px-4 text-center">{getStatusBadge(item.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 八、頁面整合範例

```tsx
// app/linebot-dashboard/page.tsx
'use client';

import { MessageSquare, MessageCircle, Reply, ThumbsUp, AlignLeft } from 'lucide-react';
import { KPICard } from '@/components/linebot/KPICard';
import { TrendChart } from '@/components/linebot/TrendChart';
import { ClassificationTable } from '@/components/linebot/ClassificationTable';
import { useLineBotDashboard, useClassificationMetrics } from '@/hooks/useLineBotDashboard';

export default function LineBotDashboard() {
  const { kpis, chart, isLoading } = useLineBotDashboard(7);
  const { classifications } = useClassificationMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 h-20 flex items-center px-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">LINE Bot 品質儀表板</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="今日訊息量"
            value={kpis?.today?.totalMessages || 0}
            trend={kpis?.trends?.totalMessages}
            icon={MessageCircle}
            iconColor="text-blue-400"
          />
          <KPICard
            title="Bot 回覆率"
            value={`${kpis?.today?.replyRate.toFixed(1) || 0}%`}
            trend={kpis?.trends?.replyRate}
            icon={Reply}
            iconColor="text-purple-400"
          />
          <KPICard
            title="用戶滿意度"
            value={`${kpis?.today?.satisfaction.toFixed(1) || 0}%`}
            trend={kpis?.trends?.satisfaction}
            icon={ThumbsUp}
            iconColor="text-green-400"
          />
          <KPICard
            title="平均回覆長度"
            value={`${kpis?.today?.avgReplyLength || 0} 字`}
            trend={kpis?.trends?.avgReplyLength}
            icon={AlignLeft}
            iconColor="text-yellow-400"
          />
        </div>

        {/* Trend Chart */}
        {chart && <TrendChart data={chart} />}

        {/* Classification Table */}
        {classifications && <ClassificationTable data={classifications} />}
      </main>
    </div>
  );
}
```

---

## 九、實作檢查清單

### 9.1 開發階段
- [ ] 建立 API routes (`/api/linebot/dashboard/overview`, `/api/linebot/dashboard/classification`)
- [ ] 建立 Supabase 查詢邏輯
- [ ] 實作自訂 hooks (`useLineBotDashboard`, `useClassificationMetrics`)
- [ ] 開發 KPICard 元件
- [ ] 開發 TrendChart 元件（整合 Recharts）
- [ ] 開發 ClassificationTable 元件
- [ ] 整合主頁面 (`/linebot-dashboard`)
- [ ] 實作響應式設計
- [ ] 新增載入狀態與錯誤處理

### 9.2 測試階段
- [ ] 測試各種資料情況（空資料、單日資料、完整 7 天）
- [ ] 測試響應式佈局（手機、平板、桌面）
- [ ] 測試深色主題一致性
- [ ] 效能測試（大量資料渲染）
- [ ] 無障礙測試（鍵盤導航、螢幕閱讀器）

### 9.3 部署前
- [ ] 確認所有 Icons 來自 lucide-react（無 emoji）
- [ ] 檢查配色與現有 Hub 一致
- [ ] 確認 API 回應時間 <500ms
- [ ] 設定適當的資料快取策略
- [ ] 新增錯誤邊界（Error Boundary）

---

## 十、未來擴充建議

### 10.1 功能擴充
- 匯出報表（PDF/Excel）
- 自訂日期範圍選擇
- 即時資料更新（WebSocket）
- 分類準確率歷史趨勢圖
- 警報設定（準確率低於閾值時通知）
- 使用者旅程分析

### 10.2 視覺優化
- 圖表動畫效果
- 深色/淺色主題切換
- 可自訂配色方案
- 資料鑽取（drill-down）功能

### 10.3 效能優化
- 虛擬滾動（大量表格資料）
- 圖表資料分頁
- Server-side rendering
- 增量資料更新

---

## 結語

本設計稿提供 LINE Bot 品質儀表板的完整規格，包含佈局、配色、元件、API 設計及實作範例。所有設計遵循深色主題風格，使用 lucide-react icons，並確保響應式體驗。

開發時請依照「實作檢查清單」逐步完成，確保品質與一致性。
