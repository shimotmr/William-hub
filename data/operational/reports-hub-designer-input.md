# William Hub 報告管理中心 UI 設計方案

## 1. Layout 佈局設計

**桌面版（≥1024px）：** 左側 `320px` 固定寬度列表 + 右側彈性內容區，比例約 `1:3`。左側可摺疊（toggle button），摺疊後僅顯示 icon strip。

**平板版（768-1023px）：** 左側縮減至 `280px`，右側內容區自適應。

**手機版（<768px）：** 採用 **抽屜式**設計：
- 預設顯示右側渲染內容（全螢幕）
- 左上角 hamburger menu 開啟報告列表抽屜（從左滑入，覆蓋 80% 螢幕寬度）
- 點選報告後自動收起抽屜，顯示內容

---

## 2. Tab 設計：Filter Chips 優於傳統 Tab

**建議採用 Chip-based Filter：**
```
[ All ] [ MD ] [ Doc ] [ PDF ]
```

**視覺規格（深色主題）：**
- **未選中：** `bg: rgba(255,255,255,0.08)` / `border: 1px solid rgba(255,255,255,0.12)` / `color: #A0A0A0`
- **選中：** `bg: #3B82F6` / `border: none` / `color: white` / `shadow: 0 0 8px rgba(59,130,246,0.4)`
- **Hover：** `bg: rgba(255,255,255,0.12)` / 200ms transition

**為何不用傳統 Tab？**
- Chips 支援多選（未來可能需要「同時顯示 Doc + PDF」）
- 視覺更輕盈，與深色主題搭配更好
- 行動端點擊區域更大

---

## 3. 報告卡片信息架構

每張卡片（`h: 96px`，可點擊整張卡片）：

```
┌─────────────────────────────────────┐
│ 📄 產品分析報告 Q4 2025      [MD]   │ ← 標題 + Type Badge
│ William Chen · 2025/02/14 18:30     │ ← 作者 + 時間戳
│ ● 已產出 Doc、PDF                    │ ← 產出狀態（綠點+文字）
└─────────────────────────────────────┘
```

**視覺元素：**
- **標題：** `font-size: 15px` / `font-weight: 600` / `color: #E5E5E5` / 單行截斷
- **Type Badge：** 右上角圓角 chip，`MD` 藍色 / `Doc` 綠色 / `PDF` 紅色
- **作者+時間：** `font-size: 13px` / `color: #909090` / icon+文字組合
- **狀態指示器：**
  - 未產出：灰色圓點 `#4A4A4A`
  - 已產出：綠色圓點 `#10B981` + 文字「已產出 Doc、PDF」
  - 產出中：黃色旋轉 spinner + 文字「產出中...」

**選中效果：** `border-left: 3px solid #3B82F6` / `bg: rgba(59,130,246,0.08)`

---

## 4. 產出按鈕狀態設計

位置：右上角渲染區，兩個獨立按鈕並排。

### 狀態 A：可產出（初始）
```
[ 產出 Doc ]  [ 產出 PDF ]
```
- `bg: transparent` / `border: 1px solid rgba(255,255,255,0.2)`
- `color: #E5E5E5` / `hover: bg rgba(59,130,246,0.12)`
- Icon: 下載圖示 `↓`

### 狀態 B：產出中（看板任務進行）
```
[ ⟳ 產出中... ]
```
- `bg: rgba(251,191,36,0.15)` / `border: 1px solid #FBBF24`
- `color: #FBBF24` / 旋轉 spinner icon
- **不可點擊**（cursor: not-allowed / opacity: 0.7）

### 狀態 C：已產出（完成）
```
[ ✓ 查看 Doc ↗ ]
```
- `bg: rgba(16,185,129,0.15)` / `border: 1px solid #10B981`
- `color: #10B981` / hover 下劃線
- Icon: 勾選 + 外部連結圖示
- **可點擊**（開新分頁至 Doc/PDF 連結）

**細節：** 按鈕從「產出中」→「已產出」時，加入 **scale bounce 動畫**（300ms ease-out），吸引注意。

---

## 5. Markdown 渲染排版建議

右側內容區採用 **寬鬆閱讀佈局**：

### 整體容器
- `max-width: 800px` / `margin: 0 auto` / `padding: 48px 32px`
- `line-height: 1.75` / `font-size: 16px` / `color: #D4D4D4`

### 標題層級
- **H1:** `32px` / `font-weight: 700` / `margin-bottom: 24px` / `border-bottom: 2px solid rgba(255,255,255,0.1)` / `padding-bottom: 12px`
- **H2:** `24px` / `font-weight: 600` / `margin-top: 36px` / `margin-bottom: 16px`
- **H3:** `20px` / `font-weight: 600` / `margin-top: 24px` / `color: #A0A0A0`

### 表格
- `border-collapse: collapse` / `width: 100%`
- Header: `bg: rgba(59,130,246,0.1)` / `font-weight: 600` / `text-align: left`
- Rows: `border-bottom: 1px solid rgba(255,255,255,0.08)` / hover `bg: rgba(255,255,255,0.05)`
- Cell padding: `12px 16px`

### Code Block
```
bg: #1E1E1E / border-left: 3px solid #3B82F6
padding: 16px / border-radius: 6px
font-family: 'Fira Code', monospace / font-size: 14px
```
- 支援 syntax highlighting（使用 Prism.js 或 highlight.js，Dracula 配色）
- 右上角「複製」按鈕（hover 顯示）

### 行內元素
- **連結：** `color: #60A5FA` / `hover: underline` / `transition: 200ms`
- **引用塊：** `border-left: 4px solid #6366F1` / `bg: rgba(99,102,241,0.08)` / `padding: 12px 20px` / `font-style: italic`
- **清單：** `li` 間距 `margin-bottom: 8px`，bullet 使用 `#3B82F6` 顏色

---

## Layout 草圖描述

```
┌────────────────────────────────────────────────────────────┐
│  William Hub - 報告管理中心                       [User]   │
├──────────────┬─────────────────────────────────────────────┤
│              │  [ ⚡ 產出 Doc ]  [ ⚡ 產出 PDF ]           │
│ [All] [MD]   │  ─────────────────────────────────────────  │
│ [Doc] [PDF]  │                                             │
│ ─────────    │   # 產品分析報告 Q4 2025                   │
│              │                                             │
│ 📄 產品分析  │   ## 執行摘要                               │
│   Q4 2025    │   本季產品線營收成長...                     │
│ William ·2/14│                                             │
│ ● 已產出 Doc │   | 指標   | Q3    | Q4    | 成長率 |      │
│ ─────────    │   |--------|-------|-------|--------|      │
│              │   | 營收   | 120M  | 145M  | +20.8% |      │
│ 📄 市場調研  │                                             │
│   初步報告   │   ## 產品線分析                             │
│ Amber · 2/12 │   ### 旗艦產品                              │
│ ○ 未產出     │   ...                                       │
│              │                                             │
│              │                                             │
│   320px      │              Flexible (彈性寬度)             │
└──────────────┴─────────────────────────────────────────────┘
     ↑                              ↑
  列表側邊欄                    內容渲染區
  (可摺疊)                   (max-width: 800px)
```

---

## 補充建議

1. **空狀態設計：** 初次進入無報告時，顯示插圖 + 「尚無報告，開始建立第一份吧！」+ CTA 按鈕
2. **載入動畫：** 切換報告時，右側內容區顯示骨架屏（skeleton）而非 spinner，保持版面穩定
3. **快捷鍵：** `↑/↓` 導航報告列表 / `Cmd+K` 開啟搜尋（未來擴充）
4. **產出通知：** 當看板任務完成時，右下角顯示 toast 通知「Doc 已產出完成 ✓」

**總字數：** ~480 字（含標點）
