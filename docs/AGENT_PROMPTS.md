# Agent 提示詞管理系統

## 概述

William Hub 整合的 Agent 系統提示詞管理平台，提供：
- 📋 資料庫儲存（Supabase）
- 🔄 自動同步（檔案系統 → DB）
- 🌐 網頁展示（動態讀取）
- 📝 版本追蹤

## 架構

```
檔案系統 (.openclaw/workspace-secretary/prompts/)
    ↓ [自動同步]
Supabase (agent_prompts 表)
    ↓ [API]
網頁介面 (/prompts)
```

## 組件

### 1. 資料庫表結構

```sql
CREATE TABLE agent_prompts (
  id BIGSERIAL PRIMARY KEY,
  agent_name TEXT UNIQUE,       -- secretary, travis, coder, etc.
  display_name TEXT,            -- Secretary, Travis, Coder, etc.
  content TEXT,                 -- 完整 markdown 內容
  version TEXT DEFAULT '1.0.0',
  emoji TEXT DEFAULT '🤖',
  description TEXT,
  file_path TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. API 端點

- `GET /api/agent-prompts` - 列出所有 agent
- `GET /api/agent-prompts?name=secretary` - 查詢特定 agent
- `POST /api/agent-prompts` - 新增/更新單個 agent
- `PUT /api/agent-prompts` - 批量同步
- `DELETE /api/agent-prompts?name=coder` - 刪除 agent

### 3. 同步腳本

```bash
# 手動同步
bash ~/clawd/scripts/sync_agent_prompts.sh

# 自動監控（背景運行）
bash ~/clawd/scripts/watch_prompts_sync.sh
```

### 4. 網頁介面

訪問：http://localhost:3000/prompts

功能：
- 列出所有 agent（含 emoji、版本、描述）
- 點擊查看完整提示詞內容
- 一鍵同步檔案系統

## 工作流程

### 修改提示詞

1. 編輯檔案：
   ```bash
   vim ~/.openclaw/workspace-secretary/prompts/Coder/agent_system_prompt.md
   ```

2. 手動同步：
   ```bash
   bash ~/clawd/scripts/sync_agent_prompts.sh
   ```

3. 或啟用自動同步：
   ```bash
   # 背景運行（需要 fswatch）
   bash ~/clawd/scripts/watch_prompts_sync.sh &
   ```

4. 刷新網頁查看變更

### 新增 Agent

1. 建立目錄和檔案：
   ```bash
   mkdir -p ~/.openclaw/workspace-secretary/prompts/NewAgent
   vim ~/.openclaw/workspace-secretary/prompts/NewAgent/agent_system_prompt.md
   ```

2. 在檔案內加入 metadata（可選）：
   ```markdown
   # NewAgent 系統提示詞
   
   version: 1.0.0
   
   ## 角色定義
   ...
   ```

3. 執行同步：
   ```bash
   bash ~/clawd/scripts/sync_agent_prompts.sh
   ```

## Agent Metadata

### 已配置的 Agents

| Agent | Emoji | 描述 |
|-------|-------|------|
| Secretary | 📋 | 行政管理與任務協調專家 |
| Travis | 🤖 | 主控 Agent，負責整體調度與決策 |
| Inspector | 🔍 | 代碼與流程品質檢查員 |
| Researcher | 🔬 | 市場與技術研究分析師 |
| Writer | ✍️ | 內容創作與文案撰寫專家 |
| Analyst | 📊 | 數據分析與趨勢洞察專家 |
| Coder | 💻 | 程式開發與技術實作專家 |
| Designer | 🎨 | 介面設計與視覺美化專家 |

### 自訂 Metadata

修改同步腳本 `~/clawd/scripts/sync_agent_prompts.sh`：

```bash
declare -A AGENT_EMOJI=(
  ["newagent"]="🆕"
)

declare -A AGENT_DESC=(
  ["newagent"]="新 Agent 的描述"
)
```

## 技術棧

- **資料庫**: Supabase PostgreSQL
- **API**: Next.js App Router API Routes
- **前端**: React + Tailwind CSS
- **同步**: Bash + curl + jq
- **監控**: fswatch (macOS)

## 維護

### 重建索引

```bash
~/clawd/scripts/supabase_sql.sh "REINDEX TABLE agent_prompts"
```

### 檢查同步狀態

```bash
~/clawd/scripts/supabase_sql.sh "SELECT agent_name, version, last_synced_at FROM agent_prompts ORDER BY updated_at DESC"
```

### 備份

```bash
~/clawd/scripts/supabase_sql.sh "COPY agent_prompts TO '/tmp/agent_prompts_backup.csv' CSV HEADER"
```

---

**建立時間**: 2026-02-22  
**最後更新**: 2026-02-22
