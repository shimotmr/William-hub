# Reports Hub — Writer 角度評估與建議

## 1. 報告資料源：GitHub markdown 為主，Supabase 為輔

建議以 GitHub repo `shimotmr/travis-daily` 的 `content/reports/` 為**單一真實來源（SSOT）**。理由：markdown 本身就是 Writer 的原生產出格式，版本控管自然內建。Supabase 只存 metadata 索引（標題、日期、狀態、doc/pdf 連結），不存報告本體。`~/clawd/work-data/` 作為草稿區，完稿後統一推到 GitHub。Google Drive 上的舊報告可一次性遷移或建立連結對照表。

## 2. 報告格式：YAML front matter 標準化

Writer 產出時強制使用以下 front matter：

```yaml
---
title: "報告標題"
date: 2026-02-15
author: "Jarvis Research Lab"
type: research | analysis | business  # 報告類型
tags: [AI, market]
status: draft | published
doc_url: ""   # 產出後回填
pdf_url: ""   # 產出後回填
---
```

Hub 前端解析 front matter 即可建立列表、篩選、狀態顯示，無需額外 API。

## 3. Doc/PDF 產出流程

- **md → Google Doc**：`gog drive upload --convert --mime text/plain` 上傳後取得 doc URL。但為保留格式（表格、SVG），更好的方式是用現有的 Google Docs API 腳本（`~/clawd/skills/research-report/`）直接建立帶格式的文件。
- **md → PDF**：推薦 `pandoc` + `weasyprint` 或 `wkhtmltopdf`。指令：`pandoc report.md -o report.pdf --pdf-engine=weasyprint --css=report-style.css`。統一樣式表確保品牌一致。
- 產出完成後，Writer 更新 front matter 的 `doc_url` / `pdf_url`，push 回 GitHub，Hub 自動反映狀態。

## 4. 元資料管理

**混合方案**：front matter 存基本 metadata，Supabase `reports` 表存動態狀態（任務 ID、產出時間、操作者）。Hub 啟動時從 GitHub 同步 front matter 到 Supabase，之後雙向更新。這樣前端查詢快，又不脫離 markdown 本體。

## 總結建議

此構想完全可行且對 Writer 工作流無破壞性。關鍵是統一 front matter 規範，Writer 只需多寫幾行 YAML。建議先用純 GitHub 讀取做 MVP，Supabase 索引作為 Phase 2 優化。
