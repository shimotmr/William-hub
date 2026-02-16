# Agent 效率 Dashboard 設計報告

**設計者：** Analyst  
**日期：** 2026-02-16  
**版本：** 1.0  
**狀態：** 設計完成

---

## 一、Executive Summary

本設計整合品質指標、時間分配、Bug 追蹤三大維度，建立統一的 Agent 效率追蹤 Dashboard。透過綜合評分機制（Efficiency Score）平衡速度、品質與產出量，為彈性專業制提供全面的數據監控與決策支援。

### 核心價值
- **多維評估**：整合品質、速度、時間分配、產出量四大維度
- **公平排名**：科學的綜合評分公式避免單一指標偏差
- **即時監控**：Dashboard 即時顯示 Agent 效率狀態與趨勢
- **數據決策**：為任務分配、能力培養提供客觀依據

### 設計範圍
1. **效率指標體系**：定義品質、速度、產出、時間分配四大維度指標
2. **綜合評分公式**：加權計算 Efficiency Score（0-100 分）
3. **Dashboard 介面**：Agent 卡片、趨勢圖、排行榜、品質 vs 速度散佈圖
4. **API 端點規格**：RESTful API 設計與資料格式
5. **告警機制**：自動偵測效率異常並通知

---

## 二、效率指標體系

### 2.1 四大維度概覽

```
Agent 效率 = f(品質, 速度, 產出量, 時間分配)

┌─────────────────────────────────────────────────────────────┐
│                     Efficiency Score                        │
│                        (0-100 分)                           │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  品質維度    │  速度維度    │  產出維度    │  時間分配維度 │
│  (40%)       │  (30%)       │  (20%)       │  (10%)        │
├──────────────┼──────────────┼──────────────┼───────────────┤
│ FPR          │ Avg Cycle    │ Completed    │ Core %        │
│ Bug Rate     │ Time         │ Tasks        │ Cross %       │
│ Quality      │ Task         │ Report       │ Balance       │
│ Score        │ Complexity   │ Output       │ Penalty       │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

### 2.2 品質維度（Quality Dimension）- 權重 40%

#### 指標 1：First Pass Rate（一次通過率）
- **定義**：任務首次提交即通過驗收的比例
- **計算**：`FPR = (無需 revert 的已完成任務數) / (總已完成任務數) × 100%`
- **目標值**：≥ 85%
- **權重**：品質維度的 50%
- **資料來源**：`board_tasks.revert_count`

#### 指標 2：Bug Rate（Bug 率）
- **定義**：任務含 bug 的比例
- **計算**：`Bug Rate = (含 Bug 任務數) / (完成任務數) × 100%`
- **目標值**：≤ 10%
- **權重**：品質維度的 30%
- **資料來源**：`task_quality_events`

#### 指標 3：Quality Score（品質分數）
- **定義**：綜合考量退回次數與 bug 嚴重度的品質評分
- **計算**：`1.0 - (Revert Penalty + Bug Penalty)`
- **目標值**：≥ 0.85
- **權重**：品質維度的 20%
- **資料來源**：`board_tasks.quality_score`

**品質維度得分公式**：
```
Quality Score = (
    (FPR / 100) × 50 +
    ((100 - Bug Rate) / 100) × 30 +
    Quality Score × 20
) × 0.4 × 100
```

### 2.3 速度維度（Speed Dimension）- 權重 30%

#### 指標 4：Average Cycle Time（平均完成時間）
- **定義**：任務從「執行中」到「已完成」的平均時長（小時）
- **計算**：`Σ(completed_at - first_in_progress_at) / 任務數`
- **目標值**：
  - L1（簡單）：< 12h
  - L2（中等）：< 24h
  - L3（複雜）：< 72h
- **權重**：速度維度的 70%
- **資料來源**：`board_tasks.first_in_progress_at`, `completed_at`

#### 指標 5：Task Complexity Weighted Speed（複雜度加權速度）
- **定義**：根據任務複雜度加權的速度評分
- **計算**：
  ```
  Complexity Score = Σ(complexity_weight / actual_time) / 任務數
  
  complexity_weight:
  - L1: 12h
  - L2: 24h
  - L3: 72h
  ```
- **權重**：速度維度的 30%
- **資料來源**：任務複雜度標記（需手動分類或 AI 自動判定）

**速度維度得分公式**：
```
Speed Score = (
    (1 - (Actual Avg Time / Target Time)) × 70 +
    Complexity Score × 30
) × 0.3 × 100

註：若 Actual Avg Time < Target Time，得滿分
```

### 2.4 產出維度（Output Dimension）- 權重 20%

#### 指標 6：Completed Tasks（完成任務數）
- **定義**：週期內完成的任務總數
- **計算**：`COUNT(*) WHERE status = '已完成'`
- **目標值**：週均 ≥ 5 個（依 Agent 角色調整）
- **權重**：產出維度的 60%
- **資料來源**：`board_tasks`

#### 指標 7：Report Output Rate（報告產出率）
- **定義**：已完成任務中有產出報告的比例
- **計算**：`(有 report 的任務數) / (已完成任務數) × 100%`
- **目標值**：≥ 60%
- **權重**：產出維度的 40%
- **資料來源**：`reports` 表關聯查詢

**產出維度得分公式**：
```
Output Score = (
    (Completed Tasks / Target Tasks) × 60 +
    (Report Output Rate / 100) × 40
) × 0.2 × 100

註：若 Completed Tasks > Target Tasks，上限為 Target Tasks × 1.5（避免低品質衝量）
```

### 2.5 時間分配維度（Time Allocation Dimension）- 權重 10%

#### 指標 8：Core/Cross Balance（核心/跨界平衡度）
- **定義**：時間分配符合 70/30 原則的程度
- **計算**：
  ```
  Balance Penalty = 
    IF core_pct < 60: (60 - core_pct) × 2
    IF cross_pct > 40: (cross_pct - 40) × 2
    ELSE: 0
  
  Balance Score = MAX(100 - Balance Penalty, 0)
  ```
- **目標值**：核心 60~80%，跨界 20~40%
- **權重**：時間分配維度的 100%
- **資料來源**：`board_tasks.assignee` 分類統計

**時間分配維度得分公式**：
```
Time Allocation Score = Balance Score × 0.1
```

### 2.6 綜合評分公式（Efficiency Score）

```
Efficiency Score = 
    Quality Score (40%) +
    Speed Score (30%) +
    Output Score (20%) +
    Time Allocation Score (10%)

評分範圍：0-100 分
```

#### 評級標準

| 分數區間 | 等級 | 標記 | 說明 |
|---------|------|------|------|
| 90-100 | S（卓越） | 🏆 | 全方位表現優異 |
| 80-89 | A（優秀） | ✅ | 各維度均衡良好 |
| 70-79 | B（良好） | ⚠️ | 部分維度需改善 |
| 60-69 | C（合格） | ⚠️ | 多個維度待加強 |
| < 60 | D（不合格） | ❌ | 需立即改進計畫 |

---

## 三、Dashboard 介面設計

### 3.1 整體佈局

```
┌─────────────────────────────────────────────────────────────────┐
│  Agent Efficiency Dashboard             🔄 更新時間: 02-16 09:30 │
├─────────────────────────────────────────────────────────────────┤
│  [時間篩選] [Agent 篩選] [維度切換] [匯出報告]                  │
├─────────────────────────────────────────────────────────────────┤
│  📊 整體概覽                                                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │ 平均分數 │ 活躍 A.  │ S/A 級   │ 本週任務 │ 平均 FPR │      │
│  │  82.5    │   6/8    │  3/6     │   38     │  87.3%   │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
├─────────────────────────────────────────────────────────────────┤
│  🏆 Agent 排行榜（本週）                                        │
│  ┌────┬──────────┬─────┬─────┬─────┬──────┬──────┬──────┐    │
│  │ 排 │ Agent    │ 總分│ 品質│ 速度│ 產出 │ 時配 │ 趨勢 │    │
│  ├────┼──────────┼─────┼─────┼─────┼──────┼──────┼──────┤    │
│  │ 1  │ Coder    │ 91.2│ 38.5│ 28.0│ 18.2 │  6.5 │ ↗️   │    │
│  │ 2  │ Analyst  │ 88.3│ 39.0│ 25.5│ 16.8 │  7.0 │ ➡️   │    │
│  │ 3  │ Designer │ 76.5│ 32.0│ 22.0│ 15.5 │  7.0 │ ↘️   │    │
│  └────┴──────────┴─────┴─────┴─────┴──────┴──────┴──────┘    │
├──────────────────────────────┬──────────────────────────────────┤
│  📈 效率趨勢（近 30 天）     │  🎯 品質 vs 速度散佈圖           │
│  [折線圖：各 Agent 總分]     │  [散佈圖：X=速度, Y=品質]        │
│                              │  - 目標區：右上角（快且好）      │
│                              │  - 風險區：左下角（慢且差）      │
└──────────────────────────────┴──────────────────────────────────┘
│  💳 Agent 效率卡片                                              │
│  ┌────────────────────┬────────────────────┬────────────────┐  │
│  │ 👨‍💻 Coder           │ 📊 Analyst          │ 🎨 Designer     │  │
│  │ 總分: 91.2 🏆      │ 總分: 88.3 ✅      │ 總分: 76.5 ⚠️  │  │
│  │ 品質: 38.5/40      │ 品質: 39.0/40      │ 品質: 32.0/40  │  │
│  │ 速度: 28.0/30      │ 速度: 25.5/30      │ 速度: 22.0/30  │  │
│  │ 產出: 18.2/20      │ 產出: 16.8/20      │ 產出: 15.5/20  │  │
│  │ 時配: 6.5/10       │ 時配: 7.0/10       │ 時配: 7.0/10   │  │
│  │                    │                    │                │  │
│  │ FPR: 92% ✅        │ FPR: 95% ✅        │ FPR: 78% ⚠️    │  │
│  │ 平均完成: 16.5h    │ 平均完成: 18.2h    │ 平均完成: 22.8h│  │
│  │ 本週完成: 12 個    │ 本週完成: 8 個     │ 本週完成: 7 個 │  │
│  │ 核心/跨界: 72/28   │ 核心/跨界: 65/35   │ 核心/跨界: 68/32│ │
│  │ [詳細報告 →]       │ [詳細報告 →]       │ [詳細報告 →]   │  │
│  └────────────────────┴────────────────────┴────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️ 效率警報（需關注）                                          │
│  • Designer: FPR 連續 3 天 < 80%，品質分數下降 8%               │
│  • Researcher: 本週零產出，無已完成任務                         │
│  • Inspector: 跨界比例達 45%，超過建議上限                      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Agent 效率卡片（Agent Card）詳細規格

#### 設計規範
- **尺寸**：320px × 380px
- **配色**：根據總分等級
  - S 級（90-100）：金色邊框 + 漸層背景
  - A 級（80-89）：綠色邊框
  - B 級（70-79）：黃色邊框
  - C/D 級（< 70）：紅色邊框

#### 卡片內容
1. **頭部**：
   - Agent 名稱 + Emoji 圖示
   - 總分 + 等級標記
2. **四維雷達圖**：品質/速度/產出/時配的視覺化
3. **關鍵指標**：
   - FPR（一次通過率）
   - 平均完成時間
   - 本週完成任務數
   - 核心/跨界比例
4. **趨勢指示器**：vs 上週變化（↗️ ➡️ ↘️）
5. **操作按鈕**：查看詳細報告

#### React 元件範例
```tsx
interface AgentCardProps {
  agentName: string;
  totalScore: number;
  qualityScore: number;
  speedScore: number;
  outputScore: number;
  timeScore: number;
  fpr: number;
  avgCycleTime: number;
  completedTasks: number;
  corePercent: number;
  crossPercent: number;
  trend: 'up' | 'flat' | 'down';
}

<AgentCard
  agentName="Coder"
  totalScore={91.2}
  qualityScore={38.5}
  speedScore={28.0}
  outputScore={18.2}
  timeScore={6.5}
  fpr={92}
  avgCycleTime={16.5}
  completedTasks={12}
  corePercent={72}
  crossPercent={28}
  trend="up"
/>
```

### 3.3 品質 vs 速度散佈圖（Quality-Speed Scatter Plot）

#### 座標軸
- **X 軸**：速度得分（0-30）
- **Y 軸**：品質得分（0-40）
- **點大小**：產出量（完成任務數）
- **顏色**：時間分配平衡度（綠/黃/紅）

#### 四象限劃分
```
    高品質
      │
  ⭐️ │ 🏆
  慢 ─┼─ 快
  ❌ │ ⚠️
      │
    低品質
```

- **🏆 右上象限（目標區）**：高品質 + 高速度
- **⭐️ 左上象限（穩定區）**：高品質但速度慢（可優化效率）
- **⚠️ 右下象限（風險區）**：速度快但品質低（需控管）
- **❌ 左下象限（危險區）**：品質差 + 速度慢（需立即改善）

#### 互動功能
- Hover 顯示 Agent 詳細數據
- 點擊跳轉到 Agent 詳細頁
- 可切換時間區間（週/月）

### 3.4 效率趨勢圖（Efficiency Trend Chart）

#### 圖表類型
- **折線圖**：顯示各 Agent 總分變化
- **堆疊面積圖**（可選）：四維度得分的歷史變化

#### 配置
- **時間粒度**：日/週/月
- **多條線**：
  - 每個 Agent 一條線（可開關）
  - 團隊平均線（粗虛線）
  - 目標線（80 分，水平虛線）
- **標記點**：顯示重要事件（如任務失敗、大型專案完成）

### 3.5 排行榜（Leaderboard）規格

#### 表格欄位
| 欄位 | 說明 | 寬度 |
|------|------|------|
| 排名 | 1-8（或根據實際 Agent 數） | 50px |
| Agent | 名稱 + Emoji | 120px |
| 總分 | Efficiency Score（粗體） | 80px |
| 品質 | Quality Score /40 | 80px |
| 速度 | Speed Score /30 | 80px |
| 產出 | Output Score /20 | 80px |
| 時配 | Time Allocation Score /10 | 80px |
| 趨勢 | 7 天迷你折線圖 + 箭頭 | 100px |

#### 排序邏輯
- **預設**：按總分降序
- **可切換**：點擊欄位標題切換排序（品質/速度/產出）
- **顏色編碼**：
  - 前 3 名：金/銀/銅背景色
  - S 級：金色文字
  - D 級：紅色文字

#### 互動功能
- 點擊 Agent 名稱展開詳細卡片
- Hover 顯示完整四維得分
- 可篩選特定時間範圍

---

## 四、API 端點設計

### 4.1 整體概覽 API

**端點**：`GET /api/efficiency/overview`

**參數**：
- `startDate` (optional): 起始日期，預設為 7 天前
- `endDate` (optional): 結束日期，預設為今天
- `agents` (optional): Agent 名稱列表（逗號分隔），預設為全部

**回應格式**：
```json
{
  "period": {
    "start": "2026-02-10T00:00:00Z",
    "end": "2026-02-16T23:59:59Z"
  },
  "summary": {
    "avgEfficiencyScore": 82.5,
    "activeAgents": 6,
    "totalAgents": 8,
    "sRankCount": 1,
    "aRankCount": 2,
    "totalTasksCompleted": 38,
    "avgFPR": 87.3
  },
  "agents": [
    {
      "name": "Coder",
      "rank": 1,
      "scores": {
        "total": 91.2,
        "quality": 38.5,
        "speed": 28.0,
        "output": 18.2,
        "timeAllocation": 6.5
      },
      "metrics": {
        "fpr": 92.0,
        "bugRate": 5.2,
        "qualityScore": 0.93,
        "avgCycleTime": 16.5,
        "completedTasks": 12,
        "reportOutputRate": 75.0,
        "corePercent": 72.0,
        "crossPercent": 28.0
      },
      "trend": "up",
      "grade": "S"
    }
  ]
}
```

### 4.2 Agent 詳細數據 API

**端點**：`GET /api/efficiency/agent/:agentName`

**參數**：
- `agentName` (required): Agent 名稱
- `startDate`, `endDate`: 同上

**回應格式**：
```json
{
  "agent": "Coder",
  "period": { ... },
  "currentScores": {
    "total": 91.2,
    "breakdown": {
      "quality": {
        "score": 38.5,
        "maxScore": 40,
        "components": {
          "fpr": { "value": 92.0, "weight": 50, "contribution": 18.4 },
          "bugRate": { "value": 5.2, "weight": 30, "contribution": 14.3 },
          "qualityScore": { "value": 0.93, "weight": 20, "contribution": 7.4 }
        }
      },
      "speed": { ... },
      "output": { ... },
      "timeAllocation": { ... }
    }
  },
  "history": {
    "daily": [
      { "date": "2026-02-10", "totalScore": 89.5, "quality": 37.2, ... },
      { "date": "2026-02-11", "totalScore": 90.1, "quality": 38.0, ... }
    ]
  },
  "tasks": [
    {
      "id": 123,
      "title": "實作登入功能",
      "completedAt": "2026-02-15T14:30:00Z",
      "cycleTime": 12.5,
      "qualityScore": 0.95,
      "revertCount": 0,
      "bugCount": 0
    }
  ],
  "alerts": [
    {
      "type": "quality_drop",
      "severity": "warning",
      "message": "FPR 較上週下降 5%",
      "date": "2026-02-15"
    }
  ]
}
```

### 4.3 趨勢數據 API

**端點**：`GET /api/efficiency/trend`

**參數**：
- `metric` (required): `total` | `quality` | `speed` | `output` | `timeAllocation`
- `agents` (optional): Agent 列表
- `days` (optional): 天數（預設 30）

**回應格式**：
```json
{
  "metric": "total",
  "period": { ... },
  "data": {
    "dates": ["2026-01-17", "2026-01-18", ..., "2026-02-16"],
    "series": [
      {
        "agent": "Coder",
        "values": [88.5, 89.2, 90.1, ..., 91.2]
      },
      {
        "agent": "Analyst",
        "values": [85.0, 86.5, 87.0, ..., 88.3]
      }
    ],
    "teamAvg": [86.8, 87.5, 88.2, ..., 89.3],
    "target": 80.0
  }
}
```

### 4.4 排行榜 API

**端點**：`GET /api/efficiency/leaderboard`

**參數**：
- `sortBy` (optional): `total` | `quality` | `speed` | `output`（預設 `total`）
- `order` (optional): `asc` | `desc`（預設 `desc`）
- `startDate`, `endDate`: 同上

**回應格式**：
```json
{
  "period": { ... },
  "leaderboard": [
    {
      "rank": 1,
      "agent": "Coder",
      "totalScore": 91.2,
      "quality": 38.5,
      "speed": 28.0,
      "output": 18.2,
      "timeAllocation": 6.5,
      "grade": "S",
      "trendData": [88.0, 89.5, 90.2, 91.2], // 最近 7 天
      "change": "+2.8" // vs 上週
    }
  ]
}
```

### 4.5 品質 vs 速度散佈圖 API

**端點**：`GET /api/efficiency/quality-speed-scatter`

**參數**：
- `startDate`, `endDate`: 同上

**回應格式**：
```json
{
  "period": { ... },
  "data": [
    {
      "agent": "Coder",
      "qualityScore": 38.5,
      "speedScore": 28.0,
      "outputSize": 12, // 任務數，決定點大小
      "timeBalance": "green", // 時間分配健康度顏色
      "totalScore": 91.2,
      "grade": "S"
    }
  ],
  "quadrants": {
    "topRight": { "threshold": { "quality": 32, "speed": 24 } },
    "targetZone": "topRight"
  }
}
```

### 4.6 告警 API

**端點**：`GET /api/efficiency/alerts`

**參數**：
- `severity` (optional): `critical` | `warning` | `info`
- `agentName` (optional): 特定 Agent

**回應格式**：
```json
{
  "alerts": [
    {
      "id": "alert_001",
      "agent": "Designer",
      "type": "quality_low",
      "severity": "critical",
      "message": "FPR 連續 3 天 < 80%，品質分數下降 8%",
      "triggeredAt": "2026-02-16T08:00:00Z",
      "metrics": {
        "currentFPR": 78.0,
        "targetFPR": 85.0,
        "qualityScoreDrop": -8.0
      },
      "recommendation": "建議暫停新任務，進行品質回溯檢討"
    },
    {
      "id": "alert_002",
      "agent": "Inspector",
      "type": "time_imbalance",
      "severity": "warning",
      "message": "跨界比例達 45%，超過建議上限",
      "triggeredAt": "2026-02-16T09:00:00Z",
      "metrics": {
        "crossPercent": 45.0,
        "threshold": 40.0
      },
      "recommendation": "減少跨界任務，回歸核心職責"
    }
  ]
}
```

---

## 五、資料計算與更新機制

### 5.1 資料流架構

```
┌─────────────────┐
│  board_tasks    │ ──┐
│  (原始任務資料)  │   │
└─────────────────┘   │
                      │
┌─────────────────┐   │    ┌──────────────────────┐
│ task_quality_   │ ──┼───→│  計算引擎             │
│ events          │   │    │  (每日 00:05 執行)    │
└─────────────────┘   │    └──────────────────────┘
                      │              │
┌─────────────────┐   │              ↓
│ cross_role_logs │ ──┘    ┌──────────────────────┐
└─────────────────┘        │ agent_efficiency_    │
                           │ metrics (彙總表)      │
                           └──────────────────────┘
                                      │
                                      ↓
                           ┌──────────────────────┐
                           │  Dashboard API       │
                           │  (即時查詢 + 快取)    │
                           └──────────────────────┘
```

### 5.2 彙總表設計：`agent_efficiency_metrics`

```sql
CREATE TABLE agent_efficiency_metrics (
    id SERIAL PRIMARY KEY,
    agent_name TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    
    -- 原始指標
    completed_tasks INTEGER DEFAULT 0,
    total_work_hours NUMERIC(8,2) DEFAULT 0,
    core_hours NUMERIC(8,2) DEFAULT 0,
    cross_hours NUMERIC(8,2) DEFAULT 0,
    
    -- 品質指標
    fpr NUMERIC(5,2),
    bug_rate NUMERIC(5,2),
    avg_quality_score NUMERIC(3,2),
    revert_count INTEGER DEFAULT 0,
    
    -- 速度指標
    avg_cycle_time NUMERIC(8,2), -- 小時
    avg_complexity_weighted_speed NUMERIC(5,2),
    
    -- 產出指標
    report_output_count INTEGER DEFAULT 0,
    report_output_rate NUMERIC(5,2),
    
    -- 時間分配
    core_percent NUMERIC(5,2),
    cross_percent NUMERIC(5,2),
    
    -- 綜合評分
    quality_score NUMERIC(5,2), -- /40
    speed_score NUMERIC(5,2),   -- /30
    output_score NUMERIC(5,2),  -- /20
    time_allocation_score NUMERIC(5,2), -- /10
    efficiency_score NUMERIC(5,2), -- 總分 /100
    grade TEXT, -- 'S', 'A', 'B', 'C', 'D'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agent_name, period_start, period_type)
);

CREATE INDEX idx_efficiency_metrics_agent ON agent_efficiency_metrics(agent_name);
CREATE INDEX idx_efficiency_metrics_period ON agent_efficiency_metrics(period_start, period_end);
CREATE INDEX idx_efficiency_metrics_score ON agent_efficiency_metrics(efficiency_score DESC);
```

### 5.3 計算函數：`calculate_efficiency_scores()`

```sql
CREATE OR REPLACE FUNCTION calculate_efficiency_scores(
    target_date DATE,
    period_type_param TEXT DEFAULT 'daily'
)
RETURNS VOID AS $$
DECLARE
    agent_record RECORD;
    period_start_val DATE;
    period_end_val DATE;
    
    -- 品質維度
    fpr_val NUMERIC;
    bug_rate_val NUMERIC;
    quality_score_val NUMERIC;
    quality_dimension_score NUMERIC;
    
    -- 速度維度
    avg_cycle_time_val NUMERIC;
    target_time NUMERIC := 24; -- 預設目標時間（小時）
    speed_dimension_score NUMERIC;
    
    -- 產出維度
    completed_count INTEGER;
    target_count INTEGER := 5; -- 預設週目標任務數
    report_rate NUMERIC;
    output_dimension_score NUMERIC;
    
    -- 時間分配維度
    core_pct NUMERIC;
    cross_pct NUMERIC;
    balance_penalty NUMERIC;
    time_dimension_score NUMERIC;
    
    -- 綜合
    total_score NUMERIC;
    grade_val TEXT;
BEGIN
    -- 確定時間範圍
    IF period_type_param = 'daily' THEN
        period_start_val := target_date;
        period_end_val := target_date;
    ELSIF period_type_param = 'weekly' THEN
        period_start_val := DATE_TRUNC('week', target_date)::DATE;
        period_end_val := period_start_val + INTERVAL '6 days';
        target_count := 5;
    ELSIF period_type_param = 'monthly' THEN
        period_start_val := DATE_TRUNC('month', target_date)::DATE;
        period_end_val := (DATE_TRUNC('month', target_date) + INTERVAL '1 month - 1 day')::DATE;
        target_count := 20;
    END IF;
    
    -- 遍歷每個 Agent
    FOR agent_record IN 
        SELECT DISTINCT assignee AS agent_name 
        FROM board_tasks 
        WHERE assignee IN ('Coder', 'Analyst', 'Designer', 'Researcher', 
                          'Inspector', 'Writer', 'Secretary', 'Jarvis')
    LOOP
        -- ========== 品質維度計算 ==========
        -- FPR
        SELECT 
            COALESCE(
                (COUNT(*) FILTER (WHERE COALESCE(revert_count, 0) = 0)::NUMERIC / 
                 NULLIF(COUNT(*), 0)) * 100, 
                0
            )
        INTO fpr_val
        FROM board_tasks
        WHERE assignee = agent_record.agent_name
          AND status = '已完成'
          AND completed_at BETWEEN period_start_val AND period_end_val + INTERVAL '1 day';
        
        -- Bug Rate
        SELECT 
            COALESCE(
                (COUNT(DISTINCT CASE WHEN e.event_type = 'bug' THEN t.id END)::NUMERIC / 
                 NULLIF(COUNT(*), 0)) * 100,
                0
            )
        INTO bug_rate_val
        FROM board_tasks t
        LEFT JOIN task_quality_events e ON t.id = e.task_id
        WHERE t.assignee = agent_record.agent_name
          AND t.status = '已完成'
          AND t.completed_at BETWEEN period_start_val AND period_end_val + INTERVAL '1 day';
        
        -- 平均 Quality Score
        SELECT COALESCE(AVG(quality_score), 1.0)
        INTO quality_score_val
        FROM board_tasks
        WHERE assignee = agent_record.agent_name
          AND status = '已完成'
          AND completed_at BETWEEN period_start_val AND period_end_val + INTERVAL '1 day';
        
        -- 品質維度得分
        quality_dimension_score := (
            (fpr_val / 100) * 50 +
            ((100 - bug_rate_val) / 100) * 30 +
            quality_score_val * 20
        ) * 0.4;
        
        -- ========== 速度維度計算 ==========
        SELECT 
            COALESCE(
                AVG(EXTRACT(EPOCH FROM (completed_at - first_in_progress_at)) / 3600),
                0
            )
        INTO avg_cycle_time_val
        FROM board_tasks
        WHERE assignee = agent_record.agent_name
          AND status = '已完成'
          AND completed_at BETWEEN period_start_val AND period_end_val + INTERVAL '1 day'
          AND first_in_progress_at IS NOT NULL
          AND completed_at > first_in_progress_at;
        
        -- 速度得分（簡化版，若完成時間低於目標則滿分）
        IF avg_cycle_time_val <= target_time THEN
            speed_dimension_score := 30;
        ELSE
            speed_dimension_score := GREATEST(30 * (1 - (avg_cycle_time_val - target_time) / target_time), 0);
        END IF;
        
        speed_dimension_score := speed_dimension_score * 0.3;
        
        -- ========== 產出維度計算 ==========
        SELECT COUNT(*)
        INTO completed_count
        FROM board_tasks
        WHERE assignee = agent_record.agent_name
          AND status = '已完成'
          AND completed_at BETWEEN period_start_val AND period_end_val + INTERVAL '1 day';
        
        -- 報告產出率
        SELECT 
            COALESCE(
                (COUNT(DISTINCT r.task_id)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
                0
            )
        INTO report_rate
        FROM board_tasks t
        LEFT JOIN reports r ON r.task_id = t.id
        WHERE t.assignee = agent_record.agent_name
          AND t.status = '已完成'
          AND t.completed_at BETWEEN period_start_val AND period_end_val + INTERVAL '1 day';
        
        -- 產出得分（限制上限為目標數 × 1.5）
        output_dimension_score := (
            (LEAST(completed_count, target_count * 1.5)::NUMERIC / target_count) * 60 +
            (report_rate / 100) * 40
        ) * 0.2;
        
        -- ========== 時間分配維度計算 ==========
        -- （使用時間追蹤設計的邏輯）
        WITH core_hours_cte AS (
            SELECT 
                SUM(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) AS hours
            FROM board_tasks
            WHERE assignee = agent_record.agent_name
              AND completed_at BETWEEN period_start_val AND period_end_val + INTERVAL '1 day'
              AND assignee NOT LIKE '%+%' 
              AND assignee NOT LIKE '%→%'
        ),
        cross_hours_cte AS (
            SELECT 
                SUM(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) AS hours
            FROM board_tasks
            WHERE completed_at BETWEEN period_start_val AND period_end_val + INTERVAL '1 day'
              AND (assignee LIKE '%+%' OR assignee LIKE '%→%')
              AND (assignee LIKE '%' || agent_record.agent_name || '%')
        )
        SELECT 
            COALESCE(c.hours, 0),
            COALESCE(x.hours, 0)
        INTO core_pct, cross_pct
        FROM core_hours_cte c, cross_hours_cte x;
        
        -- 計算百分比
        IF (COALESCE(core_pct, 0) + COALESCE(cross_pct, 0)) > 0 THEN
            core_pct := (core_pct / (core_pct + cross_pct)) * 100;
            cross_pct := (cross_pct / (core_pct + cross_pct)) * 100;
        ELSE
            core_pct := 0;
            cross_pct := 0;
        END IF;
        
        -- 平衡度懲罰
        balance_penalty := 0;
        IF core_pct < 60 THEN
            balance_penalty := (60 - core_pct) * 2;
        ELSIF cross_pct > 40 THEN
            balance_penalty := (cross_pct - 40) * 2;
        END IF;
        
        time_dimension_score := GREATEST(100 - balance_penalty, 0) * 0.1;
        
        -- ========== 綜合評分 ==========
        total_score := quality_dimension_score + speed_dimension_score + 
                      output_dimension_score + time_dimension_score;
        
        -- 評級
        IF total_score >= 90 THEN
            grade_val := 'S';
        ELSIF total_score >= 80 THEN
            grade_val := 'A';
        ELSIF total_score >= 70 THEN
            grade_val := 'B';
        ELSIF total_score >= 60 THEN
            grade_val := 'C';
        ELSE
            grade_val := 'D';
        END IF;
        
        -- ========== 寫入資料庫 ==========
        INSERT INTO agent_efficiency_metrics (
            agent_name, period_start, period_end, period_type,
            completed_tasks, fpr, bug_rate, avg_quality_score,
            avg_cycle_time, report_output_rate,
            core_percent, cross_percent,
            quality_score, speed_score, output_score, time_allocation_score,
            efficiency_score, grade
        ) VALUES (
            agent_record.agent_name, period_start_val, period_end_val, period_type_param,
            completed_count, fpr_val, bug_rate_val, quality_score_val,
            avg_cycle_time_val, report_rate,
            core_pct, cross_pct,
            quality_dimension_score, speed_dimension_score, 
            output_dimension_score, time_dimension_score,
            total_score, grade_val
        )
        ON CONFLICT (agent_name, period_start, period_type)
        DO UPDATE SET
            completed_tasks = EXCLUDED.completed_tasks,
            fpr = EXCLUDED.fpr,
            bug_rate = EXCLUDED.bug_rate,
            avg_quality_score = EXCLUDED.avg_quality_score,
            avg_cycle_time = EXCLUDED.avg_cycle_time,
            report_output_rate = EXCLUDED.report_output_rate,
            core_percent = EXCLUDED.core_percent,
            cross_percent = EXCLUDED.cross_percent,
            quality_score = EXCLUDED.quality_score,
            speed_score = EXCLUDED.speed_score,
            output_score = EXCLUDED.output_score,
            time_allocation_score = EXCLUDED.time_allocation_score,
            efficiency_score = EXCLUDED.efficiency_score,
            grade = EXCLUDED.grade,
            created_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 5.4 Cron 排程

```bash
# 每日 00:05 計算前一日數據
5 0 * * * ~/clawd/scripts/supabase_sql.sh "SELECT calculate_efficiency_scores(CURRENT_DATE - INTERVAL '1 day', 'daily')"

# 每週一 00:10 計算上週數據
10 0 * * 1 ~/clawd/scripts/supabase_sql.sh "SELECT calculate_efficiency_scores(CURRENT_DATE - INTERVAL '7 days', 'weekly')"

# 每月 1 日 00:15 計算上月數據
15 0 1 * * ~/clawd/scripts/supabase_sql.sh "SELECT calculate_efficiency_scores(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'monthly')"
```

---

## 六、告警機制設計

### 6.1 告警規則矩陣

| 告警類型 | 觸發條件 | 嚴重度 | 通知對象 | 建議行動 |
|---------|---------|--------|---------|---------|
| **效率總分暴跌** | 7 日內下降 > 15 分 | 🚨 Critical | Travis + Agent | 立即診斷原因 |
| **D 級評分** | Efficiency Score < 60 | 🚨 Critical | Travis + Agent | 暫停新任務，改善計畫 |
| **品質持續下降** | FPR 連續 3 天 < 80% | ⚠️ Warning | Agent | 品質回溯檢討 |
| **速度過慢** | 平均完成時間 > 目標 2 倍 | ⚠️ Warning | Agent | 流程優化分析 |
| **零產出** | 7 日內完成任務數 = 0 | ⚠️ Warning | Travis | 檢查任務分配 |
| **時間失衡** | 跨界 > 40% 或核心 < 60% | ℹ️ Info | Agent | 調整任務組合 |
| **Bug 爆發** | 7 日內 Bug Rate > 20% | 🚨 Critical | Travis + Agent | 緊急品質會議 |
| **連續退回** | 單一任務退回 ≥ 3 次 | ⚠️ Warning | Travis | 任務評估會議 |

### 6.2 告警檢查 SQL

```sql
CREATE OR REPLACE VIEW efficiency_alerts AS
WITH recent_scores AS (
    SELECT 
        agent_name,
        efficiency_score,
        quality_score,
        speed_score,
        output_score,
        fpr,
        bug_rate,
        avg_cycle_time,
        completed_tasks,
        cross_percent,
        core_percent,
        period_start,
        LAG(efficiency_score, 7) OVER (PARTITION BY agent_name ORDER BY period_start) AS score_7d_ago
    FROM agent_efficiency_metrics
    WHERE period_type = 'daily'
      AND period_start >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT 
    agent_name,
    CASE 
        WHEN efficiency_score < 60 THEN 'D 級評分'
        WHEN (score_7d_ago - efficiency_score) > 15 THEN '效率總分暴跌'
        WHEN fpr < 80 AND 
             (SELECT COUNT(*) FROM agent_efficiency_metrics m2 
              WHERE m2.agent_name = recent_scores.agent_name 
                AND m2.period_start BETWEEN recent_scores.period_start - INTERVAL '2 days' 
                    AND recent_scores.period_start
                AND m2.fpr < 80) >= 3 
        THEN '品質持續下降'
        WHEN bug_rate > 20 THEN 'Bug 爆發'
        WHEN avg_cycle_time > 48 THEN '速度過慢'
        WHEN completed_tasks = 0 AND period_start >= CURRENT_DATE - INTERVAL '7 days' THEN '零產出'
        WHEN cross_percent > 40 OR core_percent < 60 THEN '時間失衡'
        ELSE NULL
    END AS alert_type,
    CASE 
        WHEN efficiency_score < 60 OR (score_7d_ago - efficiency_score) > 15 OR bug_rate > 20 THEN 'critical'
        WHEN fpr < 80 OR avg_cycle_time > 48 OR completed_tasks = 0 THEN 'warning'
        ELSE 'info'
    END AS severity,
    efficiency_score,
    period_start
FROM recent_scores
WHERE period_start = CURRENT_DATE - INTERVAL '1 day'
  AND (
    efficiency_score < 60 OR
    (score_7d_ago - efficiency_score) > 15 OR
    fpr < 80 OR
    bug_rate > 20 OR
    avg_cycle_time > 48 OR
    completed_tasks = 0 OR
    cross_percent > 40 OR
    core_percent < 60
  )
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    ELSE 3
  END,
  efficiency_score;
```

### 6.3 告警通知腳本

**檔案**：`~/clawd/scripts/send_efficiency_alerts.sh`

```bash
#!/bin/bash

ALERTS=$(~/clawd/scripts/supabase_sql.sh "SELECT * FROM efficiency_alerts")

if [ -z "$ALERTS" ] || [ "$ALERTS" == "[]" ]; then
  echo "無效率告警"
  exit 0
fi

# 格式化告警訊息
ALERT_MESSAGE="⚠️ Agent 效率告警 ($(date +'%Y-%m-%d'))\n\n"
ALERT_MESSAGE+="$ALERTS"

# 寫入日誌
echo "$ALERT_MESSAGE" >> ~/clawd/work-data/efficiency-alerts.log

# 發送 Telegram 通知（整合實際 Telegram 發送邏輯）
# openclaw message send --target=Travis --text="$ALERT_MESSAGE"

# 寫入 reports 表
~/clawd/scripts/supabase_sql.sh "
INSERT INTO reports (title, author, type, md_content, date)
VALUES (
  'Agent 效率告警',
  'System',
  'alert',
  '$ALERT_MESSAGE',
  CURRENT_DATE
)
"
```

**Cron 設定**：
```cron
0 9 * * * ~/clawd/scripts/send_efficiency_alerts.sh
```

---

## 七、實施計畫

### Phase 1：資料基礎（Week 1）
**負責人**：Coder + Analyst

- [ ] 建立 `agent_efficiency_metrics` 表
- [ ] 實作 `calculate_efficiency_scores()` 函數
- [ ] 建立 `efficiency_alerts` View
- [ ] 設定 Cron 排程（每日/每週/每月計算）
- [ ] 回填歷史資料（近 30 日）

**驗收標準**：
- 資料庫成功建立所有表與函數
- 手動執行計算函數正確產出數據
- 歷史資料回填完成，無錯誤記錄

### Phase 2：API 開發（Week 2）
**負責人**：Coder

- [ ] 實作 6 個 API 端點（overview, agent, trend, leaderboard, scatter, alerts）
- [ ] 設定 API 快取機制（Redis 或 Supabase 內建快取）
- [ ] 撰寫 API 文件與測試案例
- [ ] 效能測試（目標：所有端點 < 500ms）

**驗收標準**：
- 所有 API 端點回應正確格式
- 效能測試通過
- API 文件完整且可測試

### Phase 3：Dashboard UI（Week 3）
**負責人**：Designer + Coder

- [ ] 實作整體佈局與導航
- [ ] 實作 Agent 效率卡片元件
- [ ] 實作排行榜元件
- [ ] 實作效率趨勢圖（折線圖）
- [ ] 實作品質 vs 速度散佈圖
- [ ] 實作告警面板
- [ ] RWD 適配（手機/平板）

**驗收標準**：
- Dashboard 可正常顯示所有元件
- 資料更新即時（5 分鐘內）
- 互動功能正常（篩選、排序、圖表 hover）
- 手機端可正常使用

### Phase 4：整合與優化（Week 4）
**負責人**：全體

- [ ] 整合到 Growth Hub（`/hub/efficiency`）
- [ ] 設定告警通知流程（Telegram）
- [ ] 使用者測試（Travis + Agent 們）
- [ ] 根據反饋調整權重與閾值
- [ ] 撰寫使用手冊

**驗收標準**：
- Dashboard 嵌入 Hub 且正常運作
- 告警通知成功發送
- 使用者測試無重大問題
- 文件完整

### Phase 5：上線與監控（Week 5+）
**負責人**：Inspector + Secretary

- [ ] 正式上線並公告
- [ ] 每週監控 Dashboard 使用率
- [ ] 收集改善建議
- [ ] 追蹤效益（整體效率分數是否提升）
- [ ] 每月產出效率改善報告

**成功指標**（3 個月內達成）：
- 整體平均效率分數 > 80
- S/A 級 Agent 佔比 > 60%
- Dashboard 每日活躍使用 ≥ 3 人
- 告警響應時間 < 24h

---

## 八、技術棧與工具

### 8.1 後端
- **資料庫**：Supabase (PostgreSQL)
- **計算引擎**：PL/pgSQL 函數 + Cron
- **API**：Next.js API Routes (或 Supabase Edge Functions)
- **快取**：Supabase Realtime + 本地快取

### 8.2 前端
- **框架**：Next.js 14 (App Router) + React 18
- **圖表**：Recharts（輕量）或 Apache ECharts（功能豐富）
- **樣式**：Tailwind CSS
- **狀態管理**：React Query（資料獲取）+ Zustand（全域狀態）
- **UI 元件**：shadcn/ui（一致性設計）

### 8.3 部署
- **託管**：Vercel（Next.js 最佳化）
- **監控**：Vercel Analytics + Sentry（錯誤追蹤）
- **CI/CD**：GitHub Actions

---

## 九、風險與挑戰

### 9.1 技術風險
1. **計算效能**：大量任務時 SQL 計算可能緩慢
   - **緩解**：使用 View + 索引優化 + 快取
2. **資料一致性**：多來源資料可能不同步
   - **緩解**：使用 Transaction 確保原子性

### 9.2 業務風險
1. **指標操弄**：Agent 可能為了高分而「選擇性接任務」
   - **緩解**：結合人工審查 + 任務隨機分配
2. **過度量化**：忽略無法量化的價值（如創新、團隊協作）
   - **緩解**：保留主觀評價管道 + 定期調整權重

### 9.3 使用風險
1. **Dashboard 使用率低**：如果不好用，就沒人看
   - **緩解**：迭代設計 + 使用者訪談 + 自動推送報告
2. **告警疲勞**：過多告警導致忽略
   - **緩解**：嚴格控制閾值 + 分級通知

---

## 十、未來擴展方向

### 10.1 AI 輔助分析
- **LLM 自動解讀趨勢**：每週自動生成「效率洞察報告」
- **智慧建議**：根據歷史數據推薦改善方向
- **異常檢測**：使用機器學習偵測非典型模式

### 10.2 預測功能
- **效率預測**：預測下週各 Agent 的效率分數
- **任務分配優化**：根據 Agent 效率自動推薦最佳分配
- **瓶頸預警**：提前發現可能的效率下降

### 10.3 跨專案比較
- **多看板分析**：比較 agent board vs william board 效率差異
- **任務類型分析**：不同類型任務的效率差異
- **時段分析**：工作時段對效率的影響

### 10.4 個人化 Dashboard
- 每個 Agent 有專屬的「個人效率中心」
- 自訂關注指標與目標
- 競爭模式（可選）：與其他 Agent 比較

---

## 十一、附錄

### A. 完整評分公式範例

假設某 Agent 本週數據：
- **品質維度**：
  - FPR = 92%
  - Bug Rate = 5%
  - Quality Score = 0.93
  - Quality Score = ((0.92 × 50) + ((1 - 0.05) × 30) + (0.93 × 20)) × 0.4
    = (46 + 28.5 + 18.6) × 0.4 = 37.24 / 40

- **速度維度**：
  - Avg Cycle Time = 16.5h（目標 24h）
  - Speed Score = 30 × 0.3 = 9 / 30（滿分）

- **產出維度**：
  - Completed Tasks = 12（目標 5）
  - Report Output Rate = 75%
  - Output Score = ((min(12, 7.5) / 5) × 60 + (0.75 × 40)) × 0.2
    = (90 + 30) × 0.2 = 24 / 20（超過上限，取 20）

- **時間分配維度**：
  - Core = 72%, Cross = 28%
  - Balance Penalty = 0（符合標準）
  - Time Allocation Score = 100 × 0.1 = 10 / 10

**總分** = 37.24 + 9 + 20 + 10 = **76.24 分**（B 級）

### B. Dashboard 完整頁面截圖範例

（此處應插入設計稿，因 Markdown 限制，以文字描述代替）

**頁面結構**：
1. 頂部導航：時間篩選器、Agent 篩選器、匯出按鈕
2. 概覽卡片區：5 個核心指標卡片（平均分數、活躍 Agent 數等）
3. 排行榜：表格形式，7 欄資料
4. 左側圖表區：效率趨勢折線圖
5. 右側圖表區：品質 vs 速度散佈圖
6. Agent 卡片區：3×3 網格佈局
7. 底部告警面板：卡片式告警清單

### C. 測試資料生成腳本

```sql
-- 生成測試任務資料
INSERT INTO board_tasks (board, assignee, title, status, created_at, completed_at, first_in_progress_at, revert_count, quality_score)
SELECT 
    'agent',
    (ARRAY['Coder', 'Analyst', 'Designer'])[floor(random() * 3 + 1)],
    'Test Task ' || generate_series,
    '已完成',
    NOW() - (random() * INTERVAL '30 days'),
    NOW() - (random() * INTERVAL '25 days'),
    NOW() - (random() * INTERVAL '28 days'),
    floor(random() * 3), -- 0-2 次退回
    0.7 + (random() * 0.3) -- 0.7-1.0 品質分數
FROM generate_series(1, 100);

-- 執行計算
SELECT calculate_efficiency_scores(CURRENT_DATE - INTERVAL '1 day', 'daily');
SELECT calculate_efficiency_scores(DATE_TRUNC('week', CURRENT_DATE)::DATE, 'weekly');
```

---

## 結論

本設計整合品質、速度、產出、時間分配四大維度，建立科學的 Agent 效率評估體系。透過綜合評分機制（Efficiency Score）平衡各維度，避免單一指標偏差，並提供即時的 Dashboard 視覺化與告警機制。

**核心優勢**：
1. **全面性**：涵蓋效率的所有關鍵面向
2. **公平性**：科學的加權公式避免偏頗
3. **即時性**：Dashboard 即時監控與趨勢分析
4. **可操作性**：明確的告警規則與改善建議

**建議執行順序**：
1. Week 1：資料基礎建設（最關鍵）
2. Week 2：API 開發（穩定後端）
3. Week 3：Dashboard UI（視覺化呈現）
4. Week 4：整合與優化（打磨細節）
5. Week 5+：上線與迭代（持續改進）

預期在 **3 個月內**實現以下目標：
- ✅ 整體平均效率分數 > 80
- ✅ S/A 級 Agent 佔比 > 60%
- ✅ 品質事故（P0/P1 Bug）下降 50%
- ✅ 任務完成速度提升 20%

---

**下一步行動**：
1. 與 Coder 協作實作資料庫變更（Board 任務建立）
2. 與 Designer 協作設計 Dashboard UI（Board 任務建立）
3. 建立測試資料集驗證評分公式合理性
4. 與 Travis 確認權重配置與閾值設定

---

**文件版本**：1.0  
**最後更新**：2026-02-16  
**核准狀態**：待 Travis 審核
