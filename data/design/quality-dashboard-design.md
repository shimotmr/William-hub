# 品質指標追蹤 Dashboard 設計

**設計者：** Analyst  
**日期：** 2026-02-16  
**版本：** 1.0  

---

## 一、Executive Summary

彈性專業制導入後，需要數據驅動的品質監控機制來確保 Agent 任務品質。本設計提出一套完整的品質指標追蹤方案，包含指標定義、資料收集架構、Dashboard 介面規格及趨勢分析機制。

### 核心價值
- **量化品質**：將主觀的「品質好壞」轉化為可測量的指標
- **早期預警**：透過趨勢分析及時發現品質下降信號
- **數據決策**：為彈性專業制的效益評估提供客觀依據

---

## 二、品質指標定義

### 2.1 核心品質指標（Core Quality Metrics）

#### **指標 1：First Pass Rate（一次通過率）**
- **定義**：任務首次提交即通過驗收的比例
- **計算公式**：
  ```
  FPR = (無需 revert 的已完成任務數) / (總已完成任務數) × 100%
  ```
- **資料來源**：`board_tasks` 表
- **判定邏輯**：
  - 檢查任務狀態變更歷史：`待執行 → 執行中 → 已完成`（無回退）
  - **需求**：新增 `board_task_history` 表記錄狀態變更（見 3.1）
- **目標值**：≥ 85%（行業標準）

#### **指標 2：Bug/Revert Rate（退回率）**
- **定義**：任務因品質問題被退回重做的比例
- **計算公式**：
  ```
  Revert Rate = (被退回任務數) / (總執行任務數) × 100%
  ```
- **資料來源**：`board_task_history`（狀態回退記錄）
- **判定邏輯**：
  - 狀態從「已完成」→「執行中」視為一次 revert
  - 狀態從「執行中」→「待執行」視為一次 rollback
- **目標值**：≤ 10%

#### **指標 3：驗收通過率**
- **定義**：任務滿足驗收標準（acceptance_criteria）的比例
- **計算公式**：
  ```
  Acceptance Rate = (驗收通過任務數) / (已完成任務數) × 100%
  ```
- **資料來源**：`board_tasks.result` + `acceptance_criteria`
- **判定邏輯**：
  - **自動判定**：result 包含「✅」或「驗收通過」關鍵字
  - **手動標記**：新增 `quality_score` 欄位（1-5 分）
- **目標值**：≥ 90%

#### **指標 4：平均完成時間（Cycle Time）**
- **定義**：任務從「執行中」到「已完成」的平均時長
- **計算公式**：
  ```
  Avg Cycle Time = Σ(completed_at - first_in_progress_time) / 任務數
  ```
- **資料來源**：`board_task_history`
- **細分維度**：
  - 按 priority（P0/P1/P2/P3）
  - 按 assignee 類型（單一角色 vs 跨界）
  - 按任務複雜度（L1/L2/L3）
- **目標值**：< 24 小時（L1）、< 72 小時（L2）

#### **指標 5：跨界任務品質 vs 專職任務品質**
- **定義**：比較「Coder+Designer」等跨界組合 vs 單一角色的品質差異
- **計算公式**：
  ```
  跨界任務 FPR vs 專職任務 FPR
  跨界任務平均完成時間 vs 專職任務平均完成時間
  ```
- **資料來源**：`board_tasks.assignee`（包含「+」的為跨界）
- **分析維度**：
  - FPR 對比
  - Cycle Time 對比
  - Revert Rate 對比
- **目標**：驗證跨界機制是否提升品質

---

### 2.2 次要品質指標（Secondary Metrics）

#### **指標 6：任務完成率**
- **定義**：`(已完成任務數) / (總任務數) × 100%`
- **用途**：評估整體交付效率

#### **指標 7：平均返工次數**
- **定義**：每個任務平均被 revert 的次數
- **計算**：`Σ(revert_count) / 總任務數`

#### **指標 8：報告產出品質**
- **定義**：已完成任務中有產出 `reports` 表記錄的比例
- **計算**：`(有 report 的任務數) / (已完成任務數) × 100%`

---

## 三、資料收集方案

### 3.1 新增資料表：`board_task_history`

為了追蹤任務狀態變更歷史（計算 FPR、Revert Rate），需新增：

```sql
CREATE TABLE board_task_history (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES board_tasks(id),
    old_status TEXT,
    new_status TEXT,
    changed_by TEXT,  -- agent 或 user 名稱
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,      -- 變更原因（選填）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_task_history_task_id ON board_task_history(task_id);
CREATE INDEX idx_task_history_changed_at ON board_task_history(changed_at);
```

#### 觸發器：自動記錄狀態變更
```sql
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO board_task_history (task_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.assignee);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_status_change_trigger
AFTER UPDATE ON board_tasks
FOR EACH ROW
EXECUTE FUNCTION log_task_status_change();
```

---

### 3.2 擴充現有表結構

#### 3.2.1 `board_tasks` 新增欄位
```sql
ALTER TABLE board_tasks ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5);
ALTER TABLE board_tasks ADD COLUMN IF NOT EXISTS revert_count INTEGER DEFAULT 0;
ALTER TABLE board_tasks ADD COLUMN IF NOT EXISTS first_in_progress_at TIMESTAMP WITH TIME ZONE;
```

- **`quality_score`**：驗收品質評分（1-5 分）
- **`revert_count`**：被退回次數
- **`first_in_progress_at`**：首次進入「執行中」的時間（計算 Cycle Time）

#### 3.2.2 `agent_kpi` 擴充品質維度
```sql
ALTER TABLE agent_kpi ADD COLUMN IF NOT EXISTS first_pass_rate DECIMAL(5,2);
ALTER TABLE agent_kpi ADD COLUMN IF NOT EXISTS revert_rate DECIMAL(5,2);
ALTER TABLE agent_kpi ADD COLUMN IF NOT EXISTS avg_quality_score DECIMAL(3,2);
```

---

### 3.3 資料計算邏輯

#### 3.3.1 每日品質計算（Scheduled Job）
建議建立每日執行的 SQL 函數，計算前一日的品質指標並寫入 `agent_kpi`：

```sql
CREATE OR REPLACE FUNCTION calculate_daily_quality_metrics(target_date DATE)
RETURNS VOID AS $$
DECLARE
    agent_record RECORD;
BEGIN
    FOR agent_record IN 
        SELECT DISTINCT assignee FROM board_tasks WHERE assignee IS NOT NULL
    LOOP
        -- 計算 FPR
        WITH task_stats AS (
            SELECT 
                COUNT(*) as total_completed,
                COUNT(*) FILTER (WHERE revert_count = 0) as first_pass_count
            FROM board_tasks
            WHERE assignee = agent_record.assignee
              AND DATE(completed_at) = target_date
              AND status = '已完成'
        )
        UPDATE agent_kpi SET
            first_pass_rate = (first_pass_count::DECIMAL / NULLIF(total_completed, 0)) * 100,
            updated_at = NOW()
        FROM task_stats
        WHERE agent_name = agent_record.assignee
          AND date = target_date;
        
        -- 類似邏輯計算 revert_rate, avg_quality_score...
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

#### 3.3.2 即時查詢 View
建立 View 提供即時品質統計：

```sql
CREATE OR REPLACE VIEW quality_metrics_view AS
SELECT 
    assignee,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = '已完成') as completed_tasks,
    COUNT(*) FILTER (WHERE status = '已完成' AND revert_count = 0) as first_pass_tasks,
    ROUND(
        (COUNT(*) FILTER (WHERE status = '已完成' AND revert_count = 0)::DECIMAL 
         / NULLIF(COUNT(*) FILTER (WHERE status = '已完成'), 0)) * 100, 
        2
    ) as first_pass_rate,
    ROUND(AVG(quality_score), 2) as avg_quality_score,
    ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - first_in_progress_at)) / 3600), 2) as avg_cycle_time_hours
FROM board_tasks
WHERE assignee IS NOT NULL
GROUP BY assignee;
```

---

## 四、Dashboard 頁面規格

### 4.1 整體架構

#### 技術選型
- **前端框架**：Next.js 14 (App Router) + React
- **圖表庫**：Recharts 或 Apache ECharts
- **資料獲取**：Supabase Client + Server Components
- **樣式**：Tailwind CSS（與現有 Hub 統一）
- **部署**：可嵌入 Hub 作為獨立頁面（`/hub/quality-dashboard`）

---

### 4.2 頁面佈局（Layout）

```
┌─────────────────────────────────────────────────────────────┐
│  Quality Dashboard                      🔄 Last Update: ... │
├─────────────────────────────────────────────────────────────┤
│  [時間篩選器]  [Agent 篩選器]  [任務類型篩選器]             │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  FPR         │  Revert Rate │  Acceptance  │  Avg Cycle    │
│  87.5%       │  8.2%        │  92.3%       │  18.5h        │
│  ↑ +2.3%     │  ↓ -1.1%     │  ↑ +0.5%     │  ↓ -3.2h      │
├──────────────┴──────────────┴──────────────┴───────────────┤
│  📊 First Pass Rate Trend (Last 30 Days)                    │
│  [折線圖：顯示整體及各 Agent FPR 趨勢]                      │
├─────────────────────────────────────────────────────────────┤
│  📊 跨界任務 vs 專職任務品質對比                            │
│  [並排長條圖：FPR / Cycle Time / Revert Rate]              │
├──────────────────────────┬──────────────────────────────────┤
│  🏆 Agent 排行榜         │  ⚠️ 品質預警                     │
│  (按 FPR 排序)           │  - Coder: FPR 連續 3 天 < 80%    │
│  1. Designer (95.2%)     │  - Writer: Revert Rate 突增 15%  │
│  2. Analyst (91.8%)      │                                  │
│  ...                     │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

---

### 4.3 互動元件規格

#### 4.3.1 時間篩選器
- **選項**：今日 / 近 7 日 / 近 30 日 / 自訂範圍
- **預設**：近 7 日

#### 4.3.2 Agent 篩選器
- **選項**：全部 / 單一 Agent / 跨界組合
- **多選支援**：可同時選擇多個 Agent 比較

#### 4.3.3 任務類型篩選器
- **選項**：全部 / L1 / L2 / L3 / 跨界任務
- **Board 篩選**：可選擇特定 board

---

### 4.4 儀表板卡片（Metric Cards）

#### 設計規範
- **尺寸**：每個卡片 240px × 160px
- **內容**：
  - 大標題（指標值，32px bold）
  - 小標題（指標名稱）
  - 趨勢指示器（↑ 綠色 / ↓ 紅色 / ↓ 綠色［Revert Rate］）
  - 環比變化（vs 前期）
- **配色**：
  - FPR ≥ 85%：綠色（`text-green-600`）
  - FPR 70-85%：黃色（`text-yellow-600`）
  - FPR < 70%：紅色（`text-red-600`）

#### 範例程式碼
```tsx
<MetricCard
  title="First Pass Rate"
  value="87.5%"
  trend="up"
  change="+2.3%"
  status="success"  // success | warning | danger
/>
```

---

### 4.5 圖表規格

#### 4.5.1 FPR 趨勢折線圖
- **X 軸**：日期
- **Y 軸**：FPR (%)
- **多條線**：
  - 整體平均（粗線）
  - 各 Agent（細線，可開關）
- **目標線**：85% 虛線
- **互動**：hover 顯示詳細數值

#### 4.5.2 跨界 vs 專職對比圖
- **類型**：Grouped Bar Chart
- **X 軸**：指標名稱（FPR / Cycle Time / Revert Rate）
- **Y 軸**：數值
- **分組**：跨界任務（藍色）vs 專職任務（橙色）
- **數據標籤**：顯示在長條上方

#### 4.5.3 Agent 排行榜
- **格式**：表格 + 迷你長條圖
- **欄位**：排名 / Agent / FPR / 已完成任務數 / 趨勢
- **排序**：預設按 FPR 降序

---

### 4.6 品質預警模組

#### 預警規則
1. **FPR 連續 3 天 < 80%**：黃色警告
2. **FPR 單日 < 70%**：紅色警告
3. **Revert Rate 單日 > 15%**：橙色警告
4. **Cycle Time 超過基準 50%**：黃色警告

#### 顯示方式
- 卡片式警告清單
- 顏色編碼（紅/黃/橙）
- 點擊可展開詳細數據

---

### 4.7 資料更新機制

#### 選項 1：即時查詢（推薦初期）
- 使用 Supabase Realtime 訂閱 `board_tasks` 變更
- 前端自動重新計算指標
- **優點**：實作簡單、即時性強
- **缺點**：大量任務時效能壓力

#### 選項 2：快取 + 定時更新
- 每 5 分鐘執行 `calculate_daily_quality_metrics()`
- 前端從 `agent_kpi` + `quality_metrics_view` 讀取
- **優點**：效能穩定
- **缺點**：有延遲（最多 5 分鐘）

#### 混合方案（推薦）
- 歷史數據從 `agent_kpi` 讀取（快）
- 今日數據從 `quality_metrics_view` 即時查詢（新）

---

## 五、品質趨勢分析

### 5.1 分析維度

#### 5.1.1 時間趨勢分析
- **日趨勢**：每日 FPR、Revert Rate 變化
- **週趨勢**：週平均品質指標
- **月趨勢**：長期品質走向

#### 5.1.2 Agent 比較分析
- **橫向對比**：同時期不同 Agent 的品質表現
- **縱向追蹤**：單一 Agent 的成長曲線

#### 5.1.3 任務類型分析
- **複雜度影響**：L1 vs L2 vs L3 品質差異
- **跨界效益**：跨界任務是否真的提升品質？

---

### 5.2 統計分析方法

#### 5.2.1 移動平均（Moving Average）
- **7 日移動平均**：平滑短期波動，看清趨勢
- **公式**：`MA7 = Σ(前 7 日 FPR) / 7`

#### 5.2.2 環比 / 同比分析
- **環比**：vs 前一週期（日/週/月）
- **同比**：vs 去年同期（若有歷史數據）

#### 5.2.3 相關性分析
- **Cycle Time vs FPR**：完成時間是否影響品質？
- **任務量 vs FPR**：工作負載是否影響品質？

---

### 5.3 預測模型（進階功能）

#### 5.3.1 品質預測
- 使用線性回歸預測未來 7 日 FPR
- 基於歷史趨勢 + 任務量

#### 5.3.2 異常檢測
- 使用 Z-Score 偵測異常品質波動
- 自動標記「異常日」

---

## 六、實作計劃

### 6.1 Phase 1：資料基礎建設（Week 1）
- [ ] 建立 `board_task_history` 表 + 觸發器
- [ ] 擴充 `board_tasks` 和 `agent_kpi` 欄位
- [ ] 建立 `quality_metrics_view`
- [ ] 實作 `calculate_daily_quality_metrics()` 函數
- [ ] 設定 Cron 排程（每日 00:05 執行）

### 6.2 Phase 2：Dashboard 開發（Week 2）
- [ ] 建立 `/hub/quality-dashboard` 頁面
- [ ] 實作時間/Agent/類型篩選器
- [ ] 實作 4 個核心指標卡片
- [ ] 實作 FPR 趨勢折線圖
- [ ] 實作跨界 vs 專職對比圖

### 6.3 Phase 3：進階功能（Week 3）
- [ ] Agent 排行榜
- [ ] 品質預警模組
- [ ] 移動平均趨勢線
- [ ] 匯出 PDF 報告功能

### 6.4 Phase 4：驗證與優化（Week 4）
- [ ] 回填歷史資料（過去 30 日）
- [ ] 效能測試與優化
- [ ] 使用者訪談（Travis、Agent 們）
- [ ] 根據反饋調整指標權重

---

## 七、成功指標（KPI for Dashboard）

### 7.1 使用率指標
- **每日活躍使用者**：≥ 3 人（Travis + 至少 2 個 Agent）
- **平均停留時間**：≥ 2 分鐘

### 7.2 效益指標
- **整體 FPR 提升**：從基準值提升 5% 以上（3 個月內）
- **Revert Rate 下降**：減少 3% 以上
- **品質預警響應時間**：發現問題後 24 小時內改善

---

## 八、風險與挑戰

### 8.1 技術風險
- **歷史資料缺失**：`board_tasks` 無狀態變更歷史
  - **緩解**：觸發器啟用後開始記錄，前 30 日用估算方式回填
- **效能瓶頸**：大量任務時查詢速度慢
  - **緩解**：使用 View + 快取機制

### 8.2 業務風險
- **指標誤導**：過度追求 FPR 可能導致「做簡單任務」
  - **緩解**：加入「任務複雜度」維度平衡
- **人為操弄**：Agent 故意不退回品質不佳的任務
  - **緩解**：結合 `quality_score` 人工評分

---

## 九、後續延伸

### 9.1 第二期功能
- **Client 滿意度整合**：結合 Travis 的反饋評分
- **AI 輔助分析**：LLM 自動解讀品質趨勢並提出建議
- **跨專案對比**：不同 board 的品質差異

### 9.2 自動化改進
- **自動化測試**：為 Coder 任務自動執行測試（提升 FPR）
- **智慧派工**：根據 Agent 歷史品質自動分配任務

---

## 附錄

### A. SQL Schema 完整版

```sql
-- 1. 建立 board_task_history 表
CREATE TABLE IF NOT EXISTS board_task_history (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES board_tasks(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    changed_by TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_history_task_id ON board_task_history(task_id);
CREATE INDEX idx_task_history_changed_at ON board_task_history(changed_at);

-- 2. 建立觸發器
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO board_task_history (task_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.assignee);
        
        -- 更新 revert_count
        IF NEW.status IN ('待執行', '執行中') AND OLD.status = '已完成' THEN
            UPDATE board_tasks SET revert_count = COALESCE(revert_count, 0) + 1 WHERE id = NEW.id;
        END IF;
        
        -- 記錄首次進入執行中
        IF NEW.status = '執行中' AND OLD.status != '執行中' AND NEW.first_in_progress_at IS NULL THEN
            UPDATE board_tasks SET first_in_progress_at = NOW() WHERE id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_status_change_trigger
AFTER UPDATE ON board_tasks
FOR EACH ROW
EXECUTE FUNCTION log_task_status_change();

-- 3. 擴充 board_tasks
ALTER TABLE board_tasks 
ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS revert_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_in_progress_at TIMESTAMP WITH TIME ZONE;

-- 4. 擴充 agent_kpi
ALTER TABLE agent_kpi 
ADD COLUMN IF NOT EXISTS first_pass_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS revert_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS avg_quality_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS avg_cycle_time_hours DECIMAL(8,2);

-- 5. 建立 quality_metrics_view
CREATE OR REPLACE VIEW quality_metrics_view AS
SELECT 
    assignee,
    DATE(completed_at) as date,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = '已完成') as completed_tasks,
    COUNT(*) FILTER (WHERE status = '已完成' AND COALESCE(revert_count, 0) = 0) as first_pass_tasks,
    ROUND(
        (COUNT(*) FILTER (WHERE status = '已完成' AND COALESCE(revert_count, 0) = 0)::DECIMAL 
         / NULLIF(COUNT(*) FILTER (WHERE status = '已完成'), 0)) * 100, 
        2
    ) as first_pass_rate,
    ROUND(
        (COUNT(*) FILTER (WHERE revert_count > 0)::DECIMAL 
         / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as revert_rate,
    ROUND(AVG(quality_score), 2) as avg_quality_score,
    ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - first_in_progress_at)) / 3600), 2) as avg_cycle_time_hours
FROM board_tasks
WHERE assignee IS NOT NULL AND completed_at IS NOT NULL
GROUP BY assignee, DATE(completed_at);
```

### B. API 端點規格

```typescript
// GET /api/quality/overview?startDate=2026-01-01&endDate=2026-02-16&agent=Coder
interface QualityOverview {
  fpr: number;
  revertRate: number;
  acceptanceRate: number;
  avgCycleTime: number;
  trend: {
    fpr: number;      // vs 前期變化百分比
    revertRate: number;
  };
}

// GET /api/quality/trend?days=30&agent=all
interface QualityTrend {
  dates: string[];
  datasets: {
    label: string;  // 'Overall' | 'Coder' | 'Designer'...
    data: number[]; // FPR 數值
  }[];
}

// GET /api/quality/cross-role-comparison
interface CrossRoleComparison {
  crossRole: {
    fpr: number;
    cycleTime: number;
    revertRate: number;
  };
  singleRole: {
    fpr: number;
    cycleTime: number;
    revertRate: number;
  };
}

// GET /api/quality/alerts
interface QualityAlert {
  agent: string;
  type: 'fpr_low' | 'revert_high' | 'cycle_time_high';
  severity: 'warning' | 'danger';
  message: string;
  triggeredAt: string;
}[]
```

### C. 參考資料

1. **DORA Metrics**：DevOps 界的品質四大指標（Deployment Frequency, Lead Time, MTTR, Change Failure Rate）
2. **Agile Metrics**：Sprint Velocity, Escaped Defects, Cycle Time
3. **Six Sigma**：DPMO（Defects Per Million Opportunities）

---

## 結論

本設計提供了一套完整的品質指標追蹤方案，從資料收集、指標計算到視覺化呈現皆有明確規範。透過 Dashboard 的即時監控與趨勢分析，可以：

1. **量化品質**：將主觀評價轉為客觀數據
2. **及早預警**：發現品質下降信號
3. **驗證假設**：證明彈性專業制是否有效
4. **持續改進**：數據驅動的品質提升循環

建議先完成 Phase 1 & 2（資料基礎 + 核心 Dashboard），快速上線後根據實際使用回饋迭代優化。

---

**下一步行動**：
1. 與 Coder 協作實作資料表變更（Board #199）
2. 與 Designer 協作設計 Dashboard UI（Board #200）
3. 建立測試資料集驗證指標計算邏輯
