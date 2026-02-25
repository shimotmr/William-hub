# William Hub Agent 監控儀表板

## 任務概述
為 William Hub 新增 /dashboard 頁面，即時顯示所有 Agent 狀態。

## 完成功能

### 1. Agent 狀態面板
- 顯示所有 Agent（執行中/閒置）
- 每個 Agent 卡片顯示今日完成數、總完成數、完成率
- 執行中任務顯示黃色脈衝指示器

### 2. 當前任務進度
- 顯示所有執行中任務（status='執行中'）
- 每個任務卡片顯示：任務標題、負責人、更新时间
- 黃色邊框樣式區分執行中任務

### 3. Token 消耗趨勢圖
- 近 7 天 Token 消耗折線圖
- 雙 Y 軸：左側為 Token 數量，右側為 Cost
- 紫色線表示 Token，綠色線表示 Cost

### 4. 最近完成任務列表
- 顯示最近 10 個已完成任務
- 顯示任務編號、標題、負責人、完成時間

## 技術規格
- Next.js App Router
- Supabase JS Client
- Chart.js (Recharts 相關組件已存在)
- 30 秒自動刷新
- 深色主題

## API 端點
`/api/dashboard` 返回：
- `statusCounts`: 任務狀態統計
- `agents`: Agent 統計數據
- `runningTasks`: 執行中任務列表
- `tokenTrend`: 近 7 天 Token 趨勢
- `recentCompleted`: 最近完成任務

## 部署
代碼已推送到 github.com/shimotmr/William-hub
