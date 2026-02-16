# Reports Hub 技術評估 — Coder Input
> 2025-02-15

## 1. 資料源：選 A — Supabase 表

**推薦 Supabase**。理由：
- GitHub API 有 rate limit（60/hr 未認證），多人使用會撞牆
- Supabase 可存 doc_url / pdf_url / status，GitHub 方案需額外狀態管理層
- 即時性：Supabase realtime 可推送狀態變更（產出完成 → 按鈕更新），GitHub 做不到
- 擴展：未來加搜尋、標籤、權限都在 DB 層解決

表結構同 William 提案即可：`reports(id, title, date, author, type, md_content, doc_url, pdf_url, status)`。報告寫入由 Writer agent 負責，不需手動維護。

## 2. Markdown 渲染：react-markdown + rehype 插件

```
react-markdown + remark-gfm（表格/刪除線） + rehype-highlight（code highlight）
```

不需要 MDX（報告不含 React 組件）。這組合成熟、bundle 小、支援所有需求。深色主題 code highlight 用 `highlight.js` 的 github-dark 主題即可。

## 3. 產出按鈕流程

流程正確，補充細節：
1. 前端 POST `/api/reports/request-export` → body: `{ reportId, format: "doc"|"pdf" }`
2. 後端：建 board_tasks + 更新 reports.status = `"exporting_doc"`
3. 前端：按鈕變 disabled + spinner，用 Supabase realtime subscribe `reports` 表該行
4. Writer 完成 → 更新 `doc_url` + `status = "done"`
5. 前端收到 realtime event → 顯示下載連結，按鈕變「已產出」不可再按

**關鍵**：用 Supabase realtime 而非 polling，體驗更好。

## 4. 技術風險

| 風險 | 對策 |
|------|------|
| Supabase realtime 連線斷開 | 加 fallback polling（每 30s） |
| MD 內容過大（>1MB） | 分頁或 lazy load |
| Writer agent 任務卡住 | board_tasks 加 timeout 欄位，前端顯示「逾時」 |

## 5. 任務拆解（共 5 個任務）

| # | 任務 | 預估 |
|---|------|------|
| 1 | Supabase reports 表 + RLS 政策 | 小 |
| 2 | `/reports` 頁面 — 左側列表 + Tab 切換 | 中 |
| 3 | 右側 Markdown 渲染面板 | 中 |
| 4 | 產出按鈕 + API route + board_tasks 建立 | 中 |
| 5 | Realtime 狀態同步 + 連結回填 | 小 |

總工作量：5 個任務，約 2-3 個開發回合可完成。
