# Hub 報告匯出實作規格

> 實作規格日期：2026-02-16  
> 基於設計：Board #144 報告匯出設計  
> 目標：讓 Coder 可按步驟實作完整的 Doc/PDF 匯出功能

---

## 📋 總覽

本規格涵蓋：
1. **Markdown → Google Docs** 的完整轉換流程（含 AST 解析與 API 操作）
2. **Markdown → PDF** 生成（使用 `md-to-pdf`）
3. **Hub /reports 頁面** 的 UI 調整（新增匯出按鈕）
4. **API route** `/api/reports/export` 的實作
5. **錯誤處理、loading 狀態、UX 細節**

---

## 🛠️ 實作步驟

### Step 1：安裝依賴套件

```bash
cd ~/clawd/william-hub
npm install md-to-pdf googleapis unified remark-parse remark-gfm
```

**套件說明：**
- `md-to-pdf`：Markdown → PDF（基於 Puppeteer，中文支援完美）
- `googleapis`：Google Docs API client
- `unified`、`remark-parse`、`remark-gfm`：Markdown AST 解析

---

### Step 2：建立 Google Docs 轉換模組

#### 2.1 建立檔案 `lib/markdown-to-doc.ts`

```typescript
// ~/clawd/william-hub/lib/markdown-to-doc.ts

import { google } from 'googleapis';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Root, Heading, Paragraph, Text, Code, InlineCode, Strong, Emphasis, Table } from 'mdast';

/**
 * 將 Markdown 內容轉換為 Google Docs
 * @param markdown Markdown 原始內容
 * @param title 文件標題
 * @returns Google Docs URL
 */
export async function markdownToGoogleDoc(markdown: string, title: string): Promise<string> {
  // 1. 取得 Google API 認證
  const auth = await getGoogleAuth();
  const docs = google.docs({ version: 'v1', auth });

  // 2. 建立空白 Google Doc
  const { data: doc } = await docs.documents.create({
    requestBody: { title },
  });

  if (!doc.documentId) {
    throw new Error('Failed to create Google Doc');
  }

  // 3. 解析 Markdown → AST
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdown);

  // 4. 走訪 AST，生成 Google Docs API requests
  const requests = astToDocsRequests(tree as Root);

  // 5. 批次更新文件
  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: doc.documentId,
      requestBody: { requests },
    });
  }

  // 6. 回傳文件 URL
  return `https://docs.google.com/document/d/${doc.documentId}/edit`;
}

/**
 * 取得 Google API 認證
 * 策略：復用 gog CLI 的 OAuth token
 */
async function getGoogleAuth() {
  // gog CLI 將 token 存在 ~/.config/gog/
  // 可用 exec 執行 gog 指令來重用認證，或直接讀取 token
  
  // 方案 A：使用 Service Account（推薦用於自動化）
  // const auth = new google.auth.GoogleAuth({
  //   keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  //   scopes: ['https://www.googleapis.com/auth/documents'],
  // });
  
  // 方案 B：復用 gog token（需實作 token 讀取）
  // 暫時使用環境變數指定 Service Account
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '~/.config/gog/service-account.json',
    scopes: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive'],
  });

  return auth;
}

/**
 * 將 Markdown AST 轉換為 Google Docs batchUpdate requests
 */
function astToDocsRequests(tree: Root): any[] {
  const requests: any[] = [];
  let index = 1; // Google Docs 插入位置從 1 開始

  for (const node of tree.children) {
    const nodeRequests = nodeToRequests(node, index);
    requests.push(...nodeRequests);
    
    // 更新插入位置（估算插入的字元數）
    index += estimateLength(node);
  }

  return requests;
}

/**
 * 將單一 AST 節點轉換為 Google Docs requests
 */
function nodeToRequests(node: any, index: number): any[] {
  const requests: any[] = [];

  switch (node.type) {
    case 'heading':
      return headingToRequests(node as Heading, index);
    
    case 'paragraph':
      return paragraphToRequests(node as Paragraph, index);
    
    case 'code':
      return codeBlockToRequests(node as Code, index);
    
    case 'table':
      return tableToRequests(node as Table, index);
    
    default:
      // 其他節點類型（list、blockquote 等）可擴充
      return [];
  }
}

/**
 * 標題 → HEADING_1 ~ HEADING_6
 */
function headingToRequests(node: Heading, index: number): any[] {
  const text = extractText(node);
  const requests: any[] = [];

  // 插入文字
  requests.push({
    insertText: {
      location: { index },
      text: text + '\n',
    },
  });

  // 設定段落樣式
  const headingLevel = `HEADING_${node.depth}`;
  requests.push({
    updateParagraphStyle: {
      range: {
        startIndex: index,
        endIndex: index + text.length + 1,
      },
      paragraphStyle: {
        namedStyleType: headingLevel,
      },
      fields: 'namedStyleType',
    },
  });

  return requests;
}

/**
 * 段落 → 處理粗體、斜體、行內程式碼
 */
function paragraphToRequests(node: Paragraph, index: number): any[] {
  const requests: any[] = [];
  let currentIndex = index;

  for (const child of node.children) {
    if (child.type === 'text') {
      const text = (child as Text).value;
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text,
        },
      });
      currentIndex += text.length;
    } else if (child.type === 'strong') {
      // 粗體
      const text = extractText(child);
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text,
        },
      });
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + text.length,
          },
          textStyle: { bold: true },
          fields: 'bold',
        },
      });
      currentIndex += text.length;
    } else if (child.type === 'emphasis') {
      // 斜體
      const text = extractText(child);
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text,
        },
      });
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + text.length,
          },
          textStyle: { italic: true },
          fields: 'italic',
        },
      });
      currentIndex += text.length;
    } else if (child.type === 'inlineCode') {
      // 行內程式碼
      const text = (child as InlineCode).value;
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text,
        },
      });
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + text.length,
          },
          textStyle: {
            fontFamily: 'Courier New',
            fontSize: { magnitude: 9, unit: 'PT' },
            foregroundColor: {
              color: { rgbColor: { red: 0.4, green: 0.4, blue: 0.4 } },
            },
          },
          fields: 'fontFamily,fontSize,foregroundColor',
        },
      });
      currentIndex += text.length;
    }
  }

  // 段落結尾換行
  requests.push({
    insertText: {
      location: { index: currentIndex },
      text: '\n',
    },
  });

  return requests;
}

/**
 * 程式碼區塊 → Courier New + 背景色
 */
function codeBlockToRequests(node: Code, index: number): any[] {
  const text = node.value;
  const requests: any[] = [];

  // 插入程式碼
  requests.push({
    insertText: {
      location: { index },
      text: text + '\n\n',
    },
  });

  // 設定字型樣式
  requests.push({
    updateTextStyle: {
      range: {
        startIndex: index,
        endIndex: index + text.length,
      },
      textStyle: {
        fontFamily: 'Courier New',
        fontSize: { magnitude: 8, unit: 'PT' },
        foregroundColor: {
          color: { rgbColor: { red: 0.4, green: 0.4, blue: 0.4 } },
        },
      },
      fields: 'fontFamily,fontSize,foregroundColor',
    },
  });

  // 設定段落背景色
  requests.push({
    updateParagraphStyle: {
      range: {
        startIndex: index,
        endIndex: index + text.length,
      },
      paragraphStyle: {
        shading: {
          backgroundColor: {
            color: { rgbColor: { red: 0.96, green: 0.96, blue: 0.96 } },
          },
        },
      },
      fields: 'shading',
    },
  });

  return requests;
}

/**
 * 表格 → insertTable API
 */
function tableToRequests(node: Table, index: number): any[] {
  const requests: any[] = [];
  const rows = node.children.length;
  const cols = node.children[0]?.children.length || 0;

  // 1. 插入表格
  requests.push({
    insertTable: {
      location: { index },
      rows,
      columns: cols,
    },
  });

  // 2. 填入內容並設定樣式
  // （Google Docs API 的表格填入需計算每個 cell 的位置，這裡簡化）
  // 實際實作需走訪 node.children (TableRow[])，提取每個 cell 文字
  
  // 標題行（第一行）：深藍背景 + 白字粗體
  // TODO: 實作 cell 內容填入與樣式設定
  
  return requests;
}

/**
 * 從 AST 節點提取純文字
 */
function extractText(node: any): string {
  if (node.type === 'text') return node.value;
  if (node.children) {
    return node.children.map(extractText).join('');
  }
  return '';
}

/**
 * 估算節點插入後的字元數（用於計算下一個插入位置）
 */
function estimateLength(node: any): number {
  const text = extractText(node);
  return text.length + 1; // +1 for newline
}
```

#### 2.2 實作注意事項

**表格轉換的完整實作：**
- Google Docs 的 `insertTable` API 會建立空白表格
- 需額外用 `insertText` 填入每個 cell 的內容
- 標題行需設定背景色（`updateTableCellStyle`）
- 建議參考 [Google Docs API 表格範例](https://developers.google.com/docs/api/how-tos/tables)

**認證方式：**
- 建議使用 **Service Account**（適合自動化）
- 將 Service Account JSON 放在 `~/.config/gog/service-account.json`
- 或使用環境變數 `GOOGLE_SERVICE_ACCOUNT_KEY` 指定路徑

---

### Step 3：建立 PDF 轉換模組

#### 3.1 建立檔案 `lib/markdown-to-pdf.ts`

```typescript
// ~/clawd/william-hub/lib/markdown-to-pdf.ts

import { mdToPdf } from 'md-to-pdf';
import type { PdfOptions } from 'md-to-pdf';

/**
 * 將 Markdown 內容轉換為 PDF Buffer
 * @param markdown Markdown 原始內容
 * @param theme 主題（'light' | 'dark'）
 * @returns PDF Buffer
 */
export async function markdownToPdf(
  markdown: string,
  theme: 'light' | 'dark' = 'light'
): Promise<Buffer> {
  const css = theme === 'dark' ? darkThemeCSS : lightThemeCSS;

  const result = await mdToPdf(
    { content: markdown },
    {
      css,
      pdf_options: {
        format: 'A4',
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm',
        },
        printBackground: true, // 必須開啟，才能顯示表格背景色
      } as PdfOptions,
    }
  );

  if (!result?.content) {
    throw new Error('PDF generation failed');
  }

  return result.content;
}

/**
 * 淺色主題 CSS
 */
const lightThemeCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap');

  body {
    font-family: "Noto Sans TC", -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    background: #ffffff;
    padding: 20px;
  }

  h1 {
    font-size: 24pt;
    font-weight: 700;
    color: #1F4E79;
    margin-top: 24px;
    margin-bottom: 12px;
    border-bottom: 2px solid #1F4E79;
    padding-bottom: 8px;
  }

  h2 {
    font-size: 18pt;
    font-weight: 700;
    color: #1F4E79;
    margin-top: 20px;
    margin-bottom: 10px;
  }

  h3 {
    font-size: 14pt;
    font-weight: 700;
    color: #2E5C8A;
    margin-top: 16px;
    margin-bottom: 8px;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    font-size: 10pt;
  }

  th, td {
    border: 1px solid #d0d0d0;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: #1F4E79;
    color: white;
    font-weight: 700;
  }

  tr:nth-child(even) {
    background: #f0f4f8;
  }

  code {
    font-family: "Courier New", monospace;
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 9pt;
    color: #666;
  }

  pre {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 6px;
    border-left: 4px solid #1F4E79;
    overflow-x: auto;
    margin: 16px 0;
  }

  pre code {
    background: none;
    padding: 0;
    color: #333;
  }

  blockquote {
    border-left: 4px solid #1F4E79;
    padding-left: 16px;
    margin: 16px 0;
    color: #555;
    font-style: italic;
  }

  ul, ol {
    margin: 12px 0;
    padding-left: 24px;
  }

  li {
    margin: 6px 0;
  }

  a {
    color: #1F4E79;
    text-decoration: underline;
  }

  img {
    max-width: 100%;
    height: auto;
    margin: 16px 0;
  }
`;

/**
 * 深色主題 CSS
 */
const darkThemeCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap');

  body {
    font-family: "Noto Sans TC", -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #e0e0e0;
    background: #1a1a2e;
    padding: 20px;
  }

  h1 {
    font-size: 24pt;
    font-weight: 700;
    color: #60a5fa;
    margin-top: 24px;
    margin-bottom: 12px;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 8px;
  }

  h2 {
    font-size: 18pt;
    font-weight: 700;
    color: #60a5fa;
    margin-top: 20px;
    margin-bottom: 10px;
  }

  h3 {
    font-size: 14pt;
    font-weight: 700;
    color: #93c5fd;
    margin-top: 16px;
    margin-bottom: 8px;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    font-size: 10pt;
  }

  th, td {
    border: 1px solid #3a3a4a;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: #16213e;
    color: #e0e0e0;
    font-weight: 700;
  }

  tr:nth-child(even) {
    background: #0f1419;
  }

  code {
    font-family: "Courier New", monospace;
    background: #0f3460;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 9pt;
    color: #93c5fd;
  }

  pre {
    background: #0f3460;
    padding: 16px;
    border-radius: 6px;
    border-left: 4px solid #3b82f6;
    overflow-x: auto;
    margin: 16px 0;
  }

  pre code {
    background: none;
    padding: 0;
    color: #e0e0e0;
  }

  blockquote {
    border-left: 4px solid #3b82f6;
    padding-left: 16px;
    margin: 16px 0;
    color: #a0a0a0;
    font-style: italic;
  }

  ul, ol {
    margin: 12px 0;
    padding-left: 24px;
  }

  li {
    margin: 6px 0;
  }

  a {
    color: #60a5fa;
    text-decoration: underline;
  }

  img {
    max-width: 100%;
    height: auto;
    margin: 16px 0;
  }
`;
```

---

### Step 4：建立 API Route

#### 4.1 建立檔案 `app/api/reports/export/route.ts`

```typescript
// ~/clawd/william-hub/app/api/reports/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { markdownToGoogleDoc } from '@/lib/markdown-to-doc';
import { markdownToPdf } from '@/lib/markdown-to-pdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, format } = body;

    // 驗證參數
    if (!id || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: id, format', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    if (!['doc', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be "doc" or "pdf"', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // 1. 從 Supabase 讀取報告
    const { data: report, error: dbError } = await supabase
      .from('reports')
      .select('id, title, md_content')
      .eq('id', id)
      .single();

    if (dbError || !report) {
      return NextResponse.json(
        { error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const markdown = report.md_content;
    if (!markdown) {
      return NextResponse.json(
        { error: 'Report has no content', code: 'NO_CONTENT' },
        { status: 400 }
      );
    }

    // 2. 依格式匯出
    if (format === 'doc') {
      // 更新狀態為「匯出中」
      await supabase
        .from('reports')
        .update({ export_status: 'exporting' })
        .eq('id', id);

      try {
        const docUrl = await markdownToGoogleDoc(markdown, report.title);

        // 儲存 Google Doc URL
        await supabase
          .from('reports')
          .update({
            doc_url: docUrl,
            export_status: 'exported',
          })
          .eq('id', id);

        return NextResponse.json({ url: docUrl, format: 'doc' });
      } catch (error) {
        // 匯出失敗，恢復狀態
        await supabase
          .from('reports')
          .update({ export_status: null })
          .eq('id', id);

        throw error;
      }
    }

    if (format === 'pdf') {
      const pdfBuffer = await markdownToPdf(markdown, 'light');

      // 生成檔名
      const filename = `${report.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.pdf`;

      // 回傳 PDF（直接下載）
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Unknown error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[Export Error]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Export failed',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
```

---

### Step 5：修改前端 UI

#### 5.1 在 `app/reports/page.tsx` 中新增 Google Doc 匯出按鈕

**位置：** 現有的 `ExportDownloadButton` 元件旁邊

**修改步驟：**

1. 找到 `ExportDownloadButton` 元件定義（約在第 32 行）
2. 在該元件下方新增 `ExportToDocButton` 元件：

```typescript
// 新增：Google Doc 匯出按鈕
function ExportToDocButton({ reportId }: { reportId: number }) {
  const [loading, setLoading] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, format: 'doc' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        alert(err.error || 'Google Doc 匯出失敗');
        return;
      }

      const data = await res.json();
      setDocUrl(data.url);
    } catch {
      alert('Google Doc 匯出失敗');
    } finally {
      setLoading(false);
    }
  };

  if (docUrl) {
    return (
      <a
        href={docUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
      >
        <FileText size={14} />
        ✅ 已匯出 Doc
      </a>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#e5e5e5',
      }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
      {loading ? '匯出中...' : '📄 Export to Doc'}
    </button>
  );
}
```

3. 在 `content` 區域（Header 的 `<div className="flex gap-2 shrink-0">`）中加入新按鈕：

**原本：**
```tsx
<div className="flex gap-2 shrink-0">
  <ExportDownloadButton label="Export PDF" icon={FileDown} format="pdf" reportId={selectedReport.id} />
  <ExportDownloadButton label="Export Markdown" icon={FileText} format="markdown" reportId={selectedReport.id} />
</div>
```

**修改為：**
```tsx
<div className="flex gap-2 shrink-0">
  <ExportToDocButton reportId={selectedReport.id} />
  <ExportDownloadButton label="Export PDF" icon={FileDown} format="pdf" reportId={selectedReport.id} />
  <ExportDownloadButton label="Export Markdown" icon={FileText} format="markdown" reportId={selectedReport.id} />
</div>
```

---

### Step 6：資料庫欄位調整（若尚未完成）

確認 `reports` 表包含以下欄位：

```sql
-- 確認欄位存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' 
  AND column_name IN ('doc_url', 'pdf_url', 'export_status');
```

若缺少欄位，執行：

```sql
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS doc_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS export_status TEXT;
```

---

### Step 7：環境變數設定

在 `~/clawd/william-hub/.env.local` 新增：

```bash
# Google Service Account JSON 檔案路徑
GOOGLE_SERVICE_ACCOUNT_KEY=/Users/travis/.config/gog/service-account.json

# Supabase（如果尚未設定）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

### Step 8：測試流程

#### 8.1 測試 PDF 匯出

```bash
cd ~/clawd/william-hub
npm run dev
```

1. 開啟 `http://localhost:3000/reports`
2. 點擊任一報告
3. 點擊 **Export PDF** 按鈕
4. 確認 PDF 下載成功，內容格式正確（表格、程式碼、中文顯示正常）

#### 8.2 測試 Google Doc 匯出

1. 點擊 **📄 Export to Doc** 按鈕
2. 等待「匯出中...」狀態
3. 完成後按鈕變為 **✅ 已匯出 Doc**
4. 點擊按鈕，開啟 Google Docs
5. 檢查內容：
   - 標題層級正確
   - 表格有背景色
   - 程式碼區塊格式正確（Courier New、灰色）

---

## 🚨 錯誤處理與 UX 細節

### 錯誤場景

| 錯誤類型 | HTTP 狀態 | 前端處理 |
|---------|----------|---------|
| 報告不存在 | 404 | alert 錯誤訊息 |
| 報告無內容 | 400 | alert「報告內容為空」 |
| Google API 認證失敗 | 500 | alert「Google 認證失敗，請聯絡管理員」 |
| PDF 生成失敗 | 500 | alert「PDF 生成失敗」 |
| 網路逾時 | 504 | alert「匯出逾時，請稍後再試」 |

### Loading 狀態

- **Doc 匯出：** 按鈕顯示 spinner + 「匯出中...」
- **PDF 匯出：** 按鈕顯示 spinner + 「生成中...」
- **匯出期間：** 所有按鈕 `disabled`，避免重複點擊

### 成功狀態

- **Doc：** 按鈕變為綠色 ✅ + 可點擊開啟連結
- **PDF：** 瀏覽器自動下載，按鈕恢復原狀

---

## 📦 完整檔案清單

實作完成後，應有以下檔案：

```
~/clawd/william-hub/
├── lib/
│   ├── markdown-to-doc.ts       # Markdown → Google Docs
│   └── markdown-to-pdf.ts       # Markdown → PDF
├── app/
│   ├── api/
│   │   └── reports/
│   │       └── export/
│   │           └── route.ts     # POST /api/reports/export
│   └── reports/
│       └── page.tsx             # 前端頁面（已修改）
├── .env.local                   # 環境變數
└── package.json                 # 新增依賴套件
```

---

## ✅ 驗收標準

- [ ] 安裝所有依賴套件成功
- [ ] API route `/api/reports/export` 可正常回應
- [ ] PDF 匯出：下載的 PDF 格式正確，中文顯示正常
- [ ] Google Doc 匯出：成功建立文件，標題、表格、程式碼格式正確
- [ ] 前端按鈕：loading 狀態正常，成功後顯示連結或下載
- [ ] 錯誤處理：API 失敗時有 alert 提示

---

## 🔧 進階擴充（可選）

1. **快取 Google Doc URL**  
   若報告已匯出過，直接從 `doc_url` 欄位讀取，不重複建立文件

2. **PDF 主題切換**  
   前端增加「淺色/深色」主題選項，傳給 API

3. **表格完整轉換**  
   `markdown-to-doc.ts` 中的 `tableToRequests` 完整實作 cell 填入與樣式

4. **支援圖片**  
   Markdown 中的圖片上傳到 Google Drive，再用 `insertInlineImage` 插入

5. **批次匯出**  
   增加「匯出所有報告為 ZIP」功能

---

**實作完成後，請回報：**
- 所有驗收項目是否通過
- 遇到的問題與解決方式
- 實際產出的範例 Google Doc 連結

**祝實作順利！**
