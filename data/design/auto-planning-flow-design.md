# 自動計劃分解機制設計報告

**作者**: Secretary  
**日期**: 2026-02-16  
**版本**: 1.0  
**類型**: Design

---

## 摘要

本報告設計一套自動任務分解機制（Auto Planning Flow），讓 William 提出複雜需求時系統能自動拆解為子任務並派發給合適的 Agent。解決目前 Travis 手動拆解任務的效率瓶頸，提升系統整體吞吐量。

**核心價值**:
- ⚡ **減少 Travis 手動介入時間 70%+**  
- 🎯 **提升任務拆解一致性與品質**  
- 🚀 **加速複雜專案啟動速度（小時級 → 分鐘級）**  
- 📊 **建立可追蹤的任務依賴圖**

---

## 一、背景分析

### 1.1 現況問題

從看板歷史資料（205 筆任務）觀察到：

1. **Travis 成為瓶頸**  
   - 複雜任務（如 #162、#163、#186）需 Travis 手動拆解成 5-10 個子任務
   - 任務量高峰期（如 2/15 單日派發 30+ 任務）Travis 需耗費大量時間規劃

2. **拆解模式有規律可循**  
   - 設計類任務 → Designer 設計 → Coder 實作 → Inspector 審查
   - 研究類任務 → Researcher 研究 → Writer 撰寫報告 → Inspector 審查
   - 跨領域任務固定指派組合（如 `Coder+Designer`、`Researcher+Coder`）

3. **依賴關係明確**  
   - Phase 1/2/3 序列式依賴（如 #187→#188）
   - 設計→實作→審查流水線

### 1.2 資料分析洞察

從 Supabase 歷史資料分析：

| Agent | 總任務數 | 完成率 | 常見組合 |
|-------|---------|--------|----------|
| Coder | 52 | 63% | Coder+Designer(5)、Coder+Analyst(3) |
| Secretary | 12 | 67% | 獨立作業為主 |
| Writer | 11 | 82% | Writer+Researcher(2) |
| Analyst | 11 | 73% | Analyst+Coder(4) |
| Designer | 9 | 56% | Designer+Coder(5) |
| Researcher | 8 | 88% | Researcher+Coder(3) |
| Inspector | 8 | 88% | Coder+Inspector(4) |

**關鍵發現**:
- 跨領域任務佔比約 25%（46/180 筆）
- 三階段任務（Phase 1/2/3）比例約 15%
- 明確 `→` 序列依賴符號已在使用（如 `Designer→Coder`）

---

## 二、任務分類體系

### 2.1 五大任務類型

基於歷史資料歸納出 5 種核心任務類型：

#### Type 1: Research（研究調查）
**特徵**: 需要資料收集、競品分析、技術評估  
**典型關鍵字**: 研究、評估、調查、分析、競品、技術選型  
**標準流程**: `Researcher → Writer (報告撰寫) → Inspector (審查)`  
**範例**: 
- #180 "Google Alerts 競品追蹤設定"
- #183 "多品牌 RAG Phase 1 — brand 標籤"

#### Type 2: Design（設計規劃）
**特徵**: 需要架構設計、UI/UX 規劃、規格制定  
**典型關鍵字**: 設計、規劃、架構、規範、spec、UI、主題  
**標準流程**: `Designer → Coder (實作) → Inspector (審查)`  
**範例**: 
- #21 "統一設計系統：Tailwind preset + 元件展示頁"
- #192 "部署前端 Design System 與 Design Tokens"

#### Type 3: Development（開發實作）
**特徵**: 純技術實作、功能開發、API 建立  
**典型關鍵字**: 實作、開發、部署、建立、API、功能、整合  
**標準流程**: `Coder → Inspector (審查)`  
**範例**: 
- #159 "Hub 報告匯出功能實作 — Export to Docs/PDF"
- #179 "Lighthouse CI + Screenshot Diff 部署"

#### Type 4: Operations（行政作業）
**特徵**: 文檔整理、郵件處理、客戶服務、追蹤管理  
**典型關鍵字**: 訂閱、設定、追蹤、管理、通知、郵件  
**標準流程**: `Secretary (獨立完成)`  
**範例**: 
- #181 "訂閱產業 Newsletter（4-5 個媒體）"
- #165 "審查排程機制 — 跨界任務同步預約 Coder review 時段"

#### Type 5: Analysis（數據分析）
**特徵**: SQL 查詢、數據處理、指標追蹤、報表製作  
**典型關鍵字**: 分析、統計、追蹤、指標、dashboard、報表  
**標準流程**: `Analyst → Coder (視覺化) → Inspector (審查)`  
**範例**: 
- #172 "閾值動態校準機制"
- #198 "建立品質指標追蹤 Dashboard"

### 2.2 複合型任務識別

當任務包含多個類型關鍵字時，按優先級決定主類型：

**優先級排序**: Design > Development > Research > Analysis > Operations

**判定規則**:
```
IF 包含("設計"、"架構"、"規範") THEN Design
ELSE IF 包含("實作"、"開發"、"API") THEN Development
ELSE IF 包含("研究"、"評估"、"調查") THEN Research
ELSE IF 包含("分析"、"追蹤"、"指標") THEN Analysis
ELSE Operations
```

---

## 三、自動拆解規則

### 3.1 拆解粒度原則

**單一 Agent 理想粒度**:
- ⏱️ **時間範圍**: 0.5-3 天（4-24 工時）
- 📦 **交付物**: 單一可驗收產出（設計文件/程式碼/報告）
- 🎯 **職責範圍**: 單一技能域（不跨越核心職責邊界）

**過大信號**（需拆解）:
- 標題包含 "完整"、"全面"、"端到端"
- 描述超過 5 個驗收條件
- 涉及 3 個以上技能域

**過小信號**（可合併）:
- 預估時間 < 2 小時
- 可納入其他任務的前置步驟

### 3.2 標準拆解模板

#### 模板 A：三階段流水線（Design → Development → Review）

```markdown
## 原始任務
建立統一設計系統並部署到所有頁面

## 自動拆解
### Task 1: 設計階段
**Title**: 統一設計系統規範制定  
**Assignee**: Designer  
**Priority**: 🔴  
**Deliverable**: design-system-spec.md  
**Acceptance**: 包含色彩、字型、間距、元件規範

### Task 2: 開發階段
**Title**: 統一設計系統實作與部署  
**Assignee**: Coder  
**Priority**: 🔴  
**Dependencies**: Task 1  
**Deliverable**: Tailwind preset + Storybook  
**Acceptance**: 通過 Lighthouse CI 檢查

### Task 3: 審查階段
**Title**: 設計系統符合度審查  
**Assignee**: Inspector  
**Priority**: 🔴  
**Dependencies**: Task 2  
**Deliverable**: audit-report.md  
**Acceptance**: 符合度 ≥ 95%
```

#### 模板 B：並行任務組（Multi-Agent Parallel）

```markdown
## 原始任務
整合多個資料源到知識庫（Supabase + 紛享銷客 + 普渡學院）

## 自動拆解
### Task 1.1: Supabase 資料整合
**Assignee**: Coder  
**Priority**: 🔴  
**Dependencies**: None  
**Deliverable**: Supabase sync script

### Task 1.2: 紛享銷客 API 對接
**Assignee**: Coder+Researcher  
**Priority**: 🔴  
**Dependencies**: None  
**Deliverable**: Fxiaoke API wrapper

### Task 1.3: 普渡學院資料爬取
**Assignee**: Researcher  
**Priority**: 🟡  
**Dependencies**: None  
**Deliverable**: PUDU data crawler

### Task 2: 資料整合與測試
**Assignee**: Coder+Inspector  
**Priority**: 🔴  
**Dependencies**: Task 1.1, 1.2, 1.3  
**Deliverable**: Integration test report
```

#### 模板 C：Phase 序列（Research → Design → Implement）

```markdown
## 原始任務
導入 API contract testing 機制

## 自動拆解
### Phase 1: 技術評估
**Title**: API contract testing 技術選型研究  
**Assignee**: Researcher  
**Priority**: 🟡  
**Deliverable**: tech-evaluation-report.md  
**Acceptance**: 比較 ≥3 種工具並推薦方案

### Phase 2: 方案設計
**Title**: API contract testing 實作方案設計  
**Assignee**: Coder  
**Priority**: 🟡  
**Dependencies**: Phase 1  
**Deliverable**: implementation-spec.md  
**Acceptance**: 包含 workflow 設計與 CI 整合方案

### Phase 3: 實作與部署
**Title**: API contract testing 部署到 CI/CD  
**Assignee**: Coder  
**Priority**: 🟡  
**Dependencies**: Phase 2  
**Deliverable**: .github/workflows/contract-test.yml  
**Acceptance**: 所有 API routes 通過測試
```

### 3.3 依賴關係處理

**依賴類型**:

1. **序列依賴（Sequential）**: 必須等前置任務完成  
   表示法: `→` 或 `Dependencies: Task ID`  
   範例: `Designer → Coder → Inspector`

2. **並行依賴（Parallel）**: 可同時進行，最後匯總  
   表示法: `+` 或 `Dependencies: [Task A, Task B]`  
   範例: `Coder+Designer` 各自完成後整合

3. **軟依賴（Soft）**: 可先開始，但需參考前置產出  
   表示法: `Reference: Task ID`  
   範例: Coder 可先建框架，但需參考 Designer 的規範文件

**依賴圖生成規則**:
```python
def build_dependency_graph(tasks):
    graph = {}
    for task in tasks:
        # 解析 Dependencies 欄位
        deps = parse_dependencies(task.description)
        graph[task.id] = {
            'blocking': deps['sequential'],  # 阻塞任務
            'waiting_for': deps['parallel'],  # 等待任務
            'references': deps['soft']        # 參考任務
        }
    return graph
```

---

## 四、自動指定 Assignee

### 4.1 Agent 能力矩陣

| Agent | 核心技能 | 次要技能 | 禁止跨界項目 |
|-------|---------|---------|-------------|
| **Coder** | 程式開發、API 實作、CI/CD | 資料庫設計、架構規劃 | UI 設計、內容撰寫 |
| **Designer** | UI/UX 設計、視覺規範 | 前端 HTML/CSS | 後端邏輯、資料庫 |
| **Researcher** | 技術研究、競品分析 | 資料爬取 | 程式實作、設計 |
| **Writer** | 文件撰寫、報告產出 | 內容編輯 | 程式開發、設計 |
| **Analyst** | SQL 分析、數據處理 | Dashboard 規劃 | UI 實作、內容撰寫 |
| **Secretary** | 郵件管理、行程安排 | 任務追蹤、客服 | 程式開發、設計 |
| **Inspector** | Code review、品質審查 | 測試規劃 | 開發實作 |

### 4.2 自動指派邏輯

#### 規則 1: 關鍵字匹配

```python
KEYWORD_MAPPING = {
    'Coder': ['實作', '開發', 'API', '部署', 'CI', '整合', '功能'],
    'Designer': ['設計', 'UI', '主題', '元件', '規範', 'Tailwind'],
    'Researcher': ['研究', '評估', '競品', '調查', '技術選型'],
    'Writer': ['撰寫', '報告', '文檔', '內容', 'Newsletter'],
    'Analyst': ['分析', '追蹤', '指標', 'SQL', 'Dashboard', '統計'],
    'Secretary': ['訂閱', '郵件', '行程', '會議', '通知', '客服'],
    'Inspector': ['審查', 'review', '檢查', '品質', '驗證']
}

def auto_assign(title, description):
    scores = {agent: 0 for agent in KEYWORD_MAPPING}
    text = title + ' ' + description
    
    for agent, keywords in KEYWORD_MAPPING.items():
        for keyword in keywords:
            if keyword in text:
                scores[agent] += 1
    
    # 返回得分最高的 Agent
    return max(scores, key=scores.get)
```

#### 規則 2: 組合任務判定

當任務需要多個技能域時：

```python
def assign_combo(scores):
    # 取得分前 2 名
    top2 = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:2]
    
    # 判定組合模式
    if top2[0][1] >= 3 and top2[1][1] >= 2:
        # 並行組合（各自負責一部分）
        return f"{top2[0][0]}+{top2[1][0]}"
    elif top2[0][1] >= 4 and top2[1][1] >= 1:
        # 序列組合（主 → 次）
        return f"{top2[0][0]}→{top2[1][0]}"
    else:
        # 單一 Agent
        return top2[0][0]
```

#### 規則 3: 負載平衡

```python
def assign_with_load_balancing(candidate_agents):
    # 查詢當前工作負載
    loads = query_current_loads(candidate_agents)
    
    # 如果候選 Agent 負載 > 5 件任務，分配給次要候選
    for agent in candidate_agents:
        if loads[agent] < 5:
            return agent
    
    # 全部滿載，返回負載最低的
    return min(loads, key=loads.get)
```

### 4.3 指派優先級

1. **專屬任務** → 直接指派核心 Agent（權重 100%）
2. **跨界任務** → 組合指派（權重 50% + 50%）
3. **負載平衡** → 分配給負載較低者（差異 > 3 件時觸發）
4. **審查任務** → 一律加上 `→ Inspector`

---

## 五、觸發與確認機制

### 5.1 觸發方式設計

#### 方案 A：指令觸發（推薦）

William 在 Telegram 或 LINE 下達指令：

```
/plan <任務描述>

範例:
/plan 建立統一設計系統並部署到所有頁面，包含 Tailwind preset、元件庫、Storybook
```

**系統行為**:
1. 解析任務描述
2. 自動分類任務類型
3. 生成拆解方案（含 assignee、dependencies）
4. 推送預覽給 William 確認
5. 確認後批量寫入 board_tasks

#### 方案 B：郵件觸發

William 寄信到特定信箱（如 `plan@aurotek.com`），主旨為任務描述。

**系統行為**:
1. Secretary 監聽郵件
2. 解析郵件內容
3. 生成拆解方案
4. 回信給 William 確認
5. 確認後執行

#### 方案 C：看板觸發

在看板新增任務時，標記 `auto_plan: true`，系統自動拆解。

### 5.2 確認流程

**兩階段確認**:

#### Stage 1: 預覽拆解結果

系統推送給 William：

```markdown
📋 **自動拆解預覽**

原始任務: 建立統一設計系統並部署到所有頁面
類型: Design → Development → Review
預估總時長: 2-3 週

### 子任務清單:
1. 統一設計系統規範制定
   - Assignee: Designer
   - Priority: 🔴
   - Duration: 3-5 天
   - Dependencies: None

2. 統一設計系統實作與部署
   - Assignee: Coder
   - Priority: 🔴
   - Duration: 5-7 天
   - Dependencies: Task 1

3. 設計系統符合度審查
   - Assignee: Inspector
   - Priority: 🔴
   - Duration: 1-2 天
   - Dependencies: Task 2

✅ 確認派發  ❌ 取消  ✏️ 手動調整
```

#### Stage 2: 批量寫入看板

William 點擊 ✅ 後：

```sql
-- 批量插入子任務
INSERT INTO board_tasks (board, title, assignee, priority, status, description, parent_task_id)
VALUES 
  ('agent', '統一設計系統規範制定', 'Designer', '🔴', '待執行', '...', 186),
  ('agent', '統一設計系統實作與部署', 'Coder', '🔴', '待執行', '...', 186),
  ('agent', '設計系統符合度審查', 'Inspector', '🔴', '待執行', '...', 186);

-- 更新父任務狀態
UPDATE board_tasks 
SET status = '已拆解', 
    result = '已自動拆解為 3 個子任務'
WHERE id = 186;
```

### 5.3 異常處理

| 異常情況 | 處理方式 |
|---------|---------|
| 無法識別任務類型 | 標記為 `待人工確認`，通知 Travis |
| 依賴關係循環 | 警告並建議調整順序 |
| Agent 負載過高 | 建議延後派發或調整優先級 |
| 拆解粒度過細 | 提示合併建議 |
| 拆解粒度過粗 | 提示進一步拆解建議 |

---

## 六、技術實作方案

### 6.1 系統架構

```
┌─────────────┐
│   William   │
│  (Telegram) │
└──────┬──────┘
       │ /plan 指令
       ▼
┌─────────────────┐
│  Planning Flow  │  ← 新增模組
│    Orchestrator │
└────────┬────────┘
         │
    ┌────┴────┐
    │ 1. 解析 │ ← LLM 任務分類
    └────┬────┘
         │
    ┌────┴─────┐
    │ 2. 拆解  │ ← 套用模板
    └────┬─────┘
         │
    ┌────┴──────┐
    │ 3. 指派   │ ← 能力矩陣匹配
    └────┬──────┘
         │
    ┌────┴───────┐
    │ 4. 依賴圖  │ ← 建立 DAG
    └────┬───────┘
         │
    ┌────┴────────┐
    │ 5. 確認預覽 │ → 推送 Telegram
    └────┬────────┘
         │ William 確認
    ┌────┴─────┐
    │ 6. 寫入  │ → Supabase board_tasks
    └──────────┘
```

### 6.2 資料結構設計

#### 新增欄位: board_tasks 表

```sql
ALTER TABLE board_tasks ADD COLUMN IF NOT EXISTS parent_task_id INTEGER;
ALTER TABLE board_tasks ADD COLUMN IF NOT EXISTS task_type TEXT;
ALTER TABLE board_tasks ADD COLUMN IF NOT EXISTS dependencies JSONB;
ALTER TABLE board_tasks ADD COLUMN IF NOT EXISTS auto_planned BOOLEAN DEFAULT FALSE;

-- 依賴關係範例
-- dependencies: {
--   "blocking": [123, 124],      -- 必須等待的任務
--   "parallel": [125],            -- 並行任務
--   "references": [126]           -- 參考任務
-- }
```

#### 新增表: planning_history

```sql
CREATE TABLE planning_history (
  id SERIAL PRIMARY KEY,
  original_request TEXT NOT NULL,
  requester TEXT DEFAULT 'William',
  task_type TEXT,
  sub_tasks JSONB,
  confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- 記錄每次自動拆解的歷史，用於學習優化
```

### 6.3 核心模組實作

#### Module 1: TaskClassifier（任務分類器）

```python
# ~/clawd/agents/secretary/task_classifier.py

from anthropic import Anthropic
import json

class TaskClassifier:
    def __init__(self):
        self.client = Anthropic()
        
    def classify(self, title: str, description: str) -> dict:
        """
        使用 Claude 分類任務
        
        Returns:
            {
                'type': 'Research' | 'Design' | 'Development' | 'Operations' | 'Analysis',
                'complexity': 'Low' | 'Medium' | 'High',
                'estimated_days': 1-10,
                'requires_split': True | False
            }
        """
        prompt = f"""
        分析以下任務並分類：
        
        標題: {title}
        描述: {description}
        
        請返回 JSON 格式:
        {{
            "type": "Research|Design|Development|Operations|Analysis",
            "complexity": "Low|Medium|High",
            "estimated_days": 數字,
            "requires_split": true|false,
            "reasoning": "判斷理由"
        }}
        """
        
        response = self.client.messages.create(
            model="claude-sonnet-4",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return json.loads(response.content[0].text)
```

#### Module 2: TaskSplitter（任務拆解器）

```python
# ~/clawd/agents/secretary/task_splitter.py

class TaskSplitter:
    TEMPLATES = {
        'Research': ['Research Phase', 'Report Writing', 'Review'],
        'Design': ['Design Spec', 'Implementation', 'Review'],
        'Development': ['Implementation', 'Testing', 'Review'],
        'Analysis': ['Data Collection', 'Analysis', 'Visualization', 'Review']
    }
    
    def split(self, task_type: str, original_task: dict) -> list:
        """
        根據任務類型套用拆解模板
        
        Returns:
            [
                {
                    'title': str,
                    'assignee': str,
                    'priority': str,
                    'dependencies': [],
                    'estimated_days': int,
                    'description': str
                }
            ]
        """
        template = self.TEMPLATES.get(task_type, ['Implementation', 'Review'])
        sub_tasks = []
        
        for i, phase in enumerate(template):
            sub_tasks.append({
                'title': f"{original_task['title']} - {phase}",
                'assignee': self._assign_agent(task_type, phase),
                'priority': original_task.get('priority', '🟡'),
                'dependencies': [i-1] if i > 0 else [],
                'estimated_days': self._estimate_duration(phase),
                'description': f"{phase} for {original_task['title']}"
            })
        
        return sub_tasks
    
    def _assign_agent(self, task_type: str, phase: str) -> str:
        # 參考 4.2 自動指派邏輯
        mapping = {
            'Research Phase': 'Researcher',
            'Report Writing': 'Writer',
            'Design Spec': 'Designer',
            'Implementation': 'Coder',
            'Testing': 'Inspector',
            'Review': 'Inspector',
            'Analysis': 'Analyst',
            'Visualization': 'Analyst+Coder'
        }
        return mapping.get(phase, 'Coder')
```

#### Module 3: DependencyResolver（依賴解析器）

```python
# ~/clawd/agents/secretary/dependency_resolver.py

class DependencyResolver:
    def build_dag(self, tasks: list) -> dict:
        """
        建立任務依賴有向無環圖（DAG）
        
        Returns:
            {
                'nodes': [...],
                'edges': [...],
                'execution_order': [...]
            }
        """
        graph = {}
        for i, task in enumerate(tasks):
            graph[i] = {
                'task': task,
                'dependencies': task.get('dependencies', []),
                'level': 0
            }
        
        # 拓撲排序計算執行順序
        execution_order = self._topological_sort(graph)
        
        return {
            'nodes': tasks,
            'edges': [(dep, i) for i, node in graph.items() for dep in node['dependencies']],
            'execution_order': execution_order,
            'has_cycle': self._detect_cycle(graph)
        }
    
    def _topological_sort(self, graph: dict) -> list:
        # Kahn's algorithm 實作
        in_degree = {node: len(data['dependencies']) for node, data in graph.items()}
        queue = [node for node, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            node = queue.pop(0)
            result.append(node)
            
            for next_node in graph:
                if node in graph[next_node]['dependencies']:
                    in_degree[next_node] -= 1
                    if in_degree[next_node] == 0:
                        queue.append(next_node)
        
        return result
    
    def _detect_cycle(self, graph: dict) -> bool:
        # DFS 檢測循環依賴
        visited = set()
        rec_stack = set()
        
        def dfs(node):
            visited.add(node)
            rec_stack.add(node)
            
            for dep in graph[node]['dependencies']:
                if dep not in visited:
                    if dfs(dep):
                        return True
                elif dep in rec_stack:
                    return True
            
            rec_stack.remove(node)
            return False
        
        for node in graph:
            if node not in visited:
                if dfs(node):
                    return True
        
        return False
```

#### Module 4: PlanningOrchestrator（編排器）

```python
# ~/clawd/agents/secretary/planning_orchestrator.py

from .task_classifier import TaskClassifier
from .task_splitter import TaskSplitter
from .dependency_resolver import DependencyResolver

class PlanningOrchestrator:
    def __init__(self):
        self.classifier = TaskClassifier()
        self.splitter = TaskSplitter()
        self.resolver = DependencyResolver()
    
    async def process_request(self, title: str, description: str) -> dict:
        """
        處理自動拆解請求
        
        Returns:
            {
                'original': {...},
                'classification': {...},
                'sub_tasks': [...],
                'dependency_graph': {...},
                'preview_message': str
            }
        """
        # 1. 分類任務
        classification = self.classifier.classify(title, description)
        
        # 2. 判斷是否需要拆解
        if not classification['requires_split']:
            return {'message': '此任務無需拆解，可直接指派'}
        
        # 3. 拆解任務
        original_task = {'title': title, 'description': description}
        sub_tasks = self.splitter.split(classification['type'], original_task)
        
        # 4. 建立依賴圖
        dag = self.resolver.build_dag(sub_tasks)
        
        # 5. 檢查異常
        if dag['has_cycle']:
            return {'error': '偵測到循環依賴，請手動調整'}
        
        # 6. 生成預覽訊息
        preview = self._generate_preview(classification, sub_tasks, dag)
        
        return {
            'original': original_task,
            'classification': classification,
            'sub_tasks': sub_tasks,
            'dependency_graph': dag,
            'preview_message': preview
        }
    
    def _generate_preview(self, classification, sub_tasks, dag) -> str:
        """生成 Telegram 預覽訊息"""
        msg = f"📋 **自動拆解預覽**\n\n"
        msg += f"類型: {classification['type']}\n"
        msg += f"複雜度: {classification['complexity']}\n"
        msg += f"預估總時長: {classification['estimated_days']} 天\n\n"
        msg += f"### 子任務清單 ({len(sub_tasks)} 個):\n"
        
        for i, task in enumerate(sub_tasks):
            deps = ', '.join([f"Task {d+1}" for d in task['dependencies']]) if task['dependencies'] else 'None'
            msg += f"\n{i+1}. **{task['title']}**\n"
            msg += f"   - Assignee: {task['assignee']}\n"
            msg += f"   - Priority: {task['priority']}\n"
            msg += f"   - Duration: {task['estimated_days']} 天\n"
            msg += f"   - Dependencies: {deps}\n"
        
        msg += f"\n✅ 確認派發  ❌ 取消  ✏️ 手動調整"
        return msg
```

### 6.4 Telegram 指令整合

```python
# ~/clawd/agents/secretary/telegram_commands.py

from openclaw import message

class TelegramPlanningCommands:
    def __init__(self, orchestrator):
        self.orchestrator = orchestrator
        self.pending_plans = {}  # 儲存待確認的計劃
    
    async def handle_plan_command(self, message_text: str, user_id: str):
        """
        處理 /plan 指令
        
        範例:
        /plan 建立統一設計系統並部署到所有頁面
        """
        # 解析任務描述（移除 /plan 前綴）
        task_description = message_text.replace('/plan', '').strip()
        
        if not task_description:
            return await self._send_help()
        
        # 執行自動拆解
        result = await self.orchestrator.process_request(
            title=task_description[:100],  # 前 100 字作為標題
            description=task_description
        )
        
        if 'error' in result:
            return await self._send_error(result['error'])
        
        # 儲存待確認計劃
        plan_id = f"plan_{int(time.time())}"
        self.pending_plans[plan_id] = result
        
        # 推送預覽
        await self._send_preview(result['preview_message'], plan_id)
    
    async def handle_confirmation(self, plan_id: str, action: str):
        """
        處理確認/取消/調整動作
        """
        if plan_id not in self.pending_plans:
            return await self._send_error('找不到此計劃')
        
        plan = self.pending_plans[plan_id]
        
        if action == 'confirm':
            # 寫入看板
            await self._commit_to_board(plan)
            del self.pending_plans[plan_id]
            return await self._send_success(len(plan['sub_tasks']))
        
        elif action == 'cancel':
            del self.pending_plans[plan_id]
            return await self._send_cancelled()
        
        elif action == 'adjust':
            # 進入手動調整模式
            return await self._send_adjust_ui(plan)
    
    async def _commit_to_board(self, plan: dict):
        """批量寫入 board_tasks"""
        import subprocess
        
        # 先插入父任務
        parent_sql = f"""
        INSERT INTO board_tasks (board, title, status, description, auto_planned)
        VALUES ('agent', '{plan['original']['title']}', '已拆解', 
                '{plan['original']['description']}', TRUE)
        RETURNING id;
        """
        parent_id = subprocess.check_output([
            os.path.expanduser('~/clawd/scripts/supabase_sql.sh'),
            parent_sql
        ])
        
        # 插入子任務
        for task in plan['sub_tasks']:
            deps_json = json.dumps({'blocking': task['dependencies']})
            sql = f"""
            INSERT INTO board_tasks 
            (board, title, assignee, priority, status, description, 
             parent_task_id, dependencies, auto_planned)
            VALUES 
            ('agent', '{task['title']}', '{task['assignee']}', '{task['priority']}',
             '待執行', '{task['description']}', {parent_id}, '{deps_json}', TRUE);
            """
            subprocess.run([
                os.path.expanduser('~/clawd/scripts/supabase_sql.sh'),
                sql
            ])
```

### 6.5 部署方案

**Phase 1: 核心功能（Week 1-2）**
- [ ] TaskClassifier 實作
- [ ] TaskSplitter 實作
- [ ] 基本 Telegram 指令整合
- [ ] 手動測試驗證

**Phase 2: 依賴管理（Week 3）**
- [ ] DependencyResolver 實作
- [ ] 循環依賴偵測
- [ ] 執行順序計算

**Phase 3: 確認機制（Week 4）**
- [ ] Telegram 互動 UI（按鈕確認）
- [ ] 預覽訊息格式化
- [ ] 批量寫入看板

**Phase 4: 優化學習（Week 5-6）**
- [ ] planning_history 表建立
- [ ] 拆解品質追蹤
- [ ] 基於歷史優化模板

---

## 七、風險與對策

### 7.1 主要風險

| 風險 | 影響 | 機率 | 對策 |
|-----|------|------|------|
| LLM 分類錯誤 | 中 | 中 | 提供手動調整選項 + 歷史學習優化 |
| 拆解粒度不當 | 中 | 中 | 人工確認階段調整 + 建立拆解指南 |
| 依賴關係複雜 | 高 | 低 | 限制最大依賴深度（≤3 層）|
| Agent 負載失衡 | 中 | 中 | 負載平衡演算法 + 即時負載監控 |
| 系統複雜度增加 | 低 | 高 | 模組化設計 + 充分測試 |

### 7.2 降級方案

當自動拆解失敗或品質不佳時：

1. **自動降級** → 標記為 `待人工確認`，通知 Travis
2. **部分自動化** → 僅自動分類，拆解由 Travis 手動完成
3. **完全手動** → 保留原有手動流程作為備用

---

## 八、成效評估

### 8.1 量化指標

| 指標 | 現況基準 | 目標 | 測量方式 |
|-----|---------|------|---------|
| Travis 手動拆解時間 | ~2 小時/任務 | < 15 分鐘/任務 | 時間追蹤 |
| 任務啟動速度 | 半天-1 天 | < 1 小時 | created_at 時間差 |
| 拆解一致性 | 人工評分 60% | > 85% | 專家評審 |
| 自動化成功率 | N/A | > 80% | confirmed / total |

### 8.2 質化指標

- ✅ **降低認知負荷**: Travis 不需每次思考如何拆解
- ✅ **知識固化**: 拆解經驗沉澱為系統能力
- ✅ **可審計性**: 所有拆解歷史可追溯
- ✅ **持續優化**: 基於歷史資料改進模板

---

## 九、實施建議

### 9.1 啟動策略

**Week 1: 試點測試**
- 選擇 5 個典型任務手動測試
- 驗證分類準確度
- 調整拆解模板

**Week 2-3: 小規模部署**
- 啟用 Telegram /plan 指令
- 僅 William 可用
- 每次都需人工確認

**Week 4-6: 全面推廣**
- 開放給所有管理者
- 建立拆解品質追蹤
- 持續優化模板

### 9.2 訓練計劃

**對象**: William、Travis、Agent Team  
**內容**:
1. /plan 指令使用教學
2. 任務描述最佳實踐
3. 確認階段檢查重點
4. 異常處理流程

### 9.3 維護計劃

**每週**:
- 檢視 planning_history 表
- 分析拒絕/調整案例
- 優化分類關鍵字

**每月**:
- 評估自動化成功率
- 更新拆解模板
- 調整 Agent 能力矩陣

---

## 十、未來擴展

### 10.1 Phase 2 功能

- **智慧預估** → 基於歷史資料預測任務時長
- **風險預警** → 識別高風險任務並提前警告
- **自動排程** → 根據 Agent 行事曆自動安排時程
- **並行優化** → 自動識別可並行任務並優化執行順序

### 10.2 長期願景

建立完整的 **Agent Workflow Automation Platform**:

```
William 需求 
   ↓
Auto Planning Flow (自動拆解)
   ↓
Auto Assignment (自動指派)
   ↓
Auto Scheduling (自動排程)
   ↓
Auto Execution (自動執行)
   ↓
Auto Review (自動審查)
   ↓
Auto Deployment (自動部署)
```

---

## 十一、總結

本設計報告提出一套完整的自動計劃分解機制，核心價值在於：

1. **解放 Travis 時間** — 從手動拆解中釋放出來，專注於策略決策
2. **提升一致性** — 標準化拆解流程，降低人為差異
3. **加速專案啟動** — 複雜任務從「小時級」拆解縮短到「分鐘級」
4. **知識固化** — 拆解經驗沉澱為可學習的系統能力

**建議優先級**: 🔴 高優先  
**預估工時**: 4-6 週（含測試與優化）  
**投資回報**: 預期可節省 Travis 70%+ 任務規劃時間

---

## 附錄

### A. 拆解範例

#### 範例 1: 簡單任務（無需拆解）

**原始任務**: 訂閱產業 Newsletter  
**分類**: Operations  
**判定**: 無需拆解，直接指派 Secretary

#### 範例 2: 中等任務（三階段拆解）

**原始任務**: 建立 API contract testing 機制  
**分類**: Development  
**拆解結果**:
1. API contract testing 技術選型研究（Researcher, 2 天）
2. 實作方案設計（Coder, 3 天）
3. 部署到 CI/CD（Coder, 2 天）
4. 品質審查（Inspector, 1 天）

#### 範例 3: 複雜任務（並行 + 序列）

**原始任務**: 整合多資料源到知識庫  
**分類**: Development + Research  
**拆解結果**:
```
Phase 1 (並行):
├─ Task 1.1: Supabase 資料整合（Coder, 3 天）
├─ Task 1.2: 紛享銷客 API 對接（Coder+Researcher, 5 天）
└─ Task 1.3: 普渡學院資料爬取（Researcher, 3 天）

Phase 2 (序列):
└─ Task 2: 資料整合與測試（Coder+Inspector, 4 天, depends on 1.1-1.3）
```

### B. Telegram 指令參考

```
/plan <任務描述>
  自動拆解任務並生成預覽

/plan_status
  查看待確認的拆解計劃

/plan_history
  查看歷史拆解記錄

/plan_help
  顯示使用說明
```

### C. SQL Schema

```sql
-- board_tasks 新增欄位
ALTER TABLE board_tasks ADD COLUMN IF NOT EXISTS parent_task_id INTEGER;
ALTER TABLE board_tasks ADD COLUMN IF NOT EXISTS task_type TEXT;
ALTER TABLE board_tasks ADD COLUMN IF NOT EXISTS dependencies JSONB;
ALTER TABLE board_tasks ADD COLUMN IF NOT EXISTS auto_planned BOOLEAN DEFAULT FALSE;

-- planning_history 表
CREATE TABLE IF NOT EXISTS planning_history (
  id SERIAL PRIMARY KEY,
  original_request TEXT NOT NULL,
  requester TEXT DEFAULT 'William',
  task_type TEXT,
  sub_tasks JSONB,
  confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  confirmation_action TEXT  -- 'confirmed' | 'cancelled' | 'adjusted'
);

-- 索引
CREATE INDEX idx_board_tasks_parent ON board_tasks(parent_task_id);
CREATE INDEX idx_board_tasks_auto_planned ON board_tasks(auto_planned);
CREATE INDEX idx_planning_history_requester ON planning_history(requester);
```

---

**報告結束**
