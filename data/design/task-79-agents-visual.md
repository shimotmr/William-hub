# Task #79 — /agents 頁面視覺審查報告

**審查日期**: 2026-02-15  
**審查對象**: William Hub `/agents` 頁面  
**線上 URL**: https://william-hub.vercel.app/agents  
**審查方式**: 代碼審查 + 設計系統對比

---

## 📊 審查總結

/agents 頁面整體視覺完成度：**85%**

**優點**：
- ✅ 完全使用 lucide-react SVG icons，無 emoji
- ✅ 色彩系統與 Hub 主頁一致（深色背景 + 主題色點綴）
- ✅ 卡片設計與主頁 apps 卡片風格統一
- ✅ 響應式設計考慮周全（grid 2/2/4 列布局）
- ✅ 動態狀態視覺層級清晰（online/working/offline）

**需改進**：
- ⚠️ Icon 映射邏輯不完整（使用 emoji 字段但實際用 iconMap）
- ⚠️ 部分間距和視覺層級可優化
- ⚠️ Loading 和空狀態缺少視覺豐富度
- ⚠️ 手機版卡片內容過於緊湊

---

## 🎨 1. 視覺層級檢查

### ✅ 良好設計

**Agent 卡片層級清晰**：
```tsx
Avatar (12px border ring) → Name (font-semibold text-sm) → 
Title/Role (text-[11px] text-gray-500) → 
Current Task (text-[11px] with status dot) → 
Last active time (text-[9px] text-gray-700)
```

**視覺權重分配正確**：
- Avatar 大（w-10 h-10 sm:w-12 sm:h-12）+ 彩色邊框 → 最吸睛
- Name 使用 font-semibold + text-gray-200 → 次要焦點
- 其他資訊遞減（text-[11px] → text-[9px]）

### ⚠️ 需改進

**問題 1**: Icon 使用邏輯混亂
```tsx
// agents/page.tsx L42
const iconMap: Record<string, any> = {
  Bot, ClipboardList, Search, Palette, PenTool, Microscope, Code2, TrendingUp,
}

// L46: 但實際使用時用 agent.emoji 當 key
function getIcon(emoji: string, size = 16) {
  const Icon = iconMap[emoji]
  return Icon ? <Icon size={size} /> : <Bot size={size} />
}
```

**建議修正**：
```tsx
// 應該用有意義的 key 映射
const iconMap: Record<string, any> = {
  'designer': Palette,
  'coder': Code2,
  'inspector': Microscope,
  'researcher': Search,
  'writer': PenTool,
  'secretary': ClipboardList,
  'analyst': TrendingUp,
  'travis': Bot,
}

// 改用 agent.id 或 agent.name.toLowerCase() 作為 key
function getIcon(role: string, size = 16) {
  const Icon = iconMap[role.toLowerCase()]
  return Icon ? <Icon size={size} /> : <Bot size={size} />
}
```

**問題 2**: 手機版卡片內文被 hidden
```tsx
// L159: Description 在手機版被隱藏
{agent.description && (
  <div className="text-[11px] text-gray-500 mb-2 line-clamp-1 hidden sm:block">
    {agent.description}
  </div>
)}
```

**建議**: 改為 `line-clamp-2` 並保留在手機版，或用 truncate 顯示一行。

---

## 🌈 2. 色彩搭配一致性檢查

### ✅ 與主頁風格一致

**背景系統**：
```tsx
// 主頁 (page.tsx)
bg-[linear-gradient(...)] + bg-blue-500/[0.04] blur

// /agents (agents/page.tsx)
bg-[#080a0f] 純色背景

// 其他區塊
bg-gray-900/30, bg-gray-900/40 等半透明
```

**主題色使用**：
- 主頁和 /agents 都使用動態 agent.color
- 統一用 `${color}50`, `${color}08`, `${color}30` 等透明度變體
- 一致的漸變邊框和陰影效果

### ⚠️ 需統一

**問題 3**: 背景風格不一致
- 主頁用「網格紋理 + 光暈」營造科技感
- /agents 用純色 `#080a0f`，顯得單調

**建議**：在 /agents 也加入微妙的背景紋理：
```tsx
<main className="min-h-screen bg-[#080a0f] relative">
  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-500/[0.02] rounded-full blur-[120px]" />
  <div className="relative z-10">
    {/* 原有內容 */}
  </div>
</main>
```

---

## 📐 3. 間距與字體大小協調性

### ✅ 良好設計

**間距系統統一**：
- 主頁和 /agents 都用 `px-4 sm:px-6 py-8 sm:py-12` 作為容器間距
- 卡片內距統一 `p-3 sm:p-4` 或 `p-4 sm:p-5`
- gap 使用一致（`gap-3`, `gap-1.5`, `gap-2.5`）

**字體大小層級**：
```
h1: text-xl sm:text-2xl (主頁和 /agents 一致)
h2: text-sm (section headers)
body: text-sm
caption: text-xs, text-[11px], text-[10px], text-[9px]
```

### ⚠️ 需優化

**問題 4**: 手機版卡片過於緊湊
```tsx
// L116: 手機版 gap-3 + p-3 導致資訊擁擠
<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
  <button className="... p-3 sm:p-4 ...">
```

**建議**：
- 手機版改用 `gap-4`，讓卡片之間有更多呼吸空間
- 或考慮手機版改為 1 列顯示（`grid-cols-1 sm:grid-cols-2`），每張卡片更大更易讀

**問題 5**: Detail Panel 的頭像尺寸跳躍太大
```tsx
// 卡片內: w-10 h-10 sm:w-12 sm:h-12 (40px → 48px)
// Detail Panel: w-14 h-14 sm:w-16 sm:h-16 (56px → 64px)
```
從 48px 跳到 64px 差距較大，建議 Detail Panel 桌面版改為 `sm:w-14 sm:h-14` (56px)，視覺過渡更平滑。

---

## 📱 4. 手機版排版檢查

### ✅ 響應式設計良好

**Grid 斷點**：
```tsx
grid-cols-2 sm:grid-cols-2 lg:grid-cols-4
// 手機 2 列、平板 2 列、桌面 4 列
```

**Header 資訊摺疊**：
```tsx
<div className="flex items-center gap-3 mt-0.5">
  <span className="text-xs text-gray-500 flex items-center gap-1">
    <Users size={10} />
    {agents.length} Agents
  </span>
  {/* 統計資訊橫排，手機版自動換行 */}
</div>
```

### ⚠️ 需優化

**問題 6**: Workflows 卡片在手機版箭頭會換行
```tsx
// L285: flow name 長度不一，小螢幕會擠壓
<div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-400 mb-2">
  {w.flow.map((name, i) => (
    <span key={name} className="flex items-center gap-1.5">
      <span className="px-2 py-0.5 rounded border text-[11px]">
        {name}
      </span>
      {i < w.flow.length - 1 && <ArrowRight />}
    </span>
  ))}
</div>
```

**建議**：改用垂直排列在手機版
```tsx
<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1.5 text-xs text-gray-400 mb-2">
  {w.flow.map((name, i) => (
    <React.Fragment key={name}>
      <span className="px-2 py-0.5 rounded border text-[11px] self-start">
        {name}
      </span>
      {i < w.flow.length - 1 && (
        <ArrowRight className="hidden sm:inline" />
      )}
    </React.Fragment>
  ))}
</div>
```

---

## 💫 5. 空狀態 / Loading 狀態視覺處理

### ✅ 有 Loading 處理
```tsx
{loading && (
  <div className="flex items-center justify-center py-20">
    <Loader2 size={24} className="animate-spin text-gray-500" />
  </div>
)}
```

### ⚠️ 需改進

**問題 7**: Loading 過於簡單，缺少品牌感
**建議**：加入文字提示和品牌色
```tsx
{loading && (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <Loader2 size={28} className="animate-spin text-blue-500" />
    <div className="text-sm text-gray-500">Loading agents...</div>
  </div>
)}
```

**問題 8**: 缺少空狀態處理（API 失敗時）
**建議**：
```tsx
{!loading && agents.length === 0 && (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-16 h-16 rounded-2xl bg-gray-800/30 flex items-center justify-center">
      <Bot size={32} className="text-gray-600" />
    </div>
    <div className="text-center">
      <div className="text-sm font-medium text-gray-400 mb-1">No agents found</div>
      <div className="text-xs text-gray-600">Check your API connection</div>
    </div>
  </div>
)}
```

---

## ✨ 6. Icon 使用檢查

### ✅ 完全使用 lucide-react

**已使用的 icons**：
```tsx
import {
  Bot, ClipboardList, Search, Palette, PenTool, Microscope,
  Code2, TrendingUp, ChevronRight, Monitor, ArrowLeft,
  Zap, Activity, Users, Loader2
} from 'lucide-react'
```

**無任何 emoji**：
- ✅ 所有視覺元素都是 SVG
- ✅ 風格統一、可定制顏色和大小
- ✅ 與主頁 icon 風格一致（stroke-based, 1.5-2 strokeWidth）

### ⚠️ 需修正

**問題 9**: Agent 資料結構仍保留 emoji 字段
```tsx
interface Agent {
  ...
  emoji: string  // ← 這個應該改為 icon 或 iconKey
}

// L262: 但調用時用這個字段
<span style={{ color: selected.color }}>{getIcon(selected.emoji, 14)}</span>
```

**建議**：
1. DB schema 和 API 把 `emoji` 欄位改名為 `icon_key`
2. 值改為有意義的 key（如 `'palette'`, `'code'`, `'search'` 等）
3. iconMap 的 key 也相應改為這些值

---

## 📋 7. 與其他頁面對比

### 與主頁 (page.tsx) 對比

| 項目 | 主頁 | /agents | 一致性 |
|------|------|---------|--------|
| 背景 | 網格紋理 + 光暈 | 純色 | ⚠️ 需統一 |
| 卡片風格 | 半透明 + 邊框 + hover | 半透明 + 動態邊框 + ring | ✅ 一致 |
| 字體層級 | text-xl/sm/xs | text-xl/sm/xs | ✅ 一致 |
| Icon 風格 | 自定義 SVG stroke | lucide-react stroke | ✅ 一致 |
| 間距系統 | px-5 py-12 | px-4 py-8 | ⚠️ 微差 |
| 色彩系統 | 主題色 + 透明度 | 動態色 + 透明度 | ✅ 一致 |

### 與 Board (board/page.tsx) 對比

| 項目 | Board | /agents | 一致性 |
|------|-------|---------|--------|
| Icon 風格 | 自定義 SVG | lucide-react | ✅ 統一為 SVG |
| 狀態點 | w-2 h-2 rounded-full | w-1.5/2/2.5 h-1.5/2/2.5 | ✅ 一致 |
| 卡片邊框 | rgba(31,41,55,0.6) | rgba(31,41,55,0.4) + 動態色 | ⚠️ 微差 |
| 優先級/狀態色 | 定義完整的色彩映射 | 動態 agent.color | ✅ 都有色彩系統 |

---

## 🎯 修正建議清單（優先級排序）

### 🔴 高優先級（影響功能或品牌一致性）

1. **修正 Icon 映射邏輯**
   - 檔案：`app/agents/page.tsx` L42-47
   - 改用 `agent.id` 或有意義的 key，而非 emoji
   - DB/API 也要同步修改 schema

2. **統一背景風格**
   - 檔案：`app/agents/page.tsx` L93
   - 加入網格紋理和光暈效果，與主頁一致

3. **改進空狀態處理**
   - 檔案：`app/agents/page.tsx` 新增條件渲染
   - 當 `agents.length === 0` 時顯示有品牌感的空狀態

### 🟡 中優先級（提升體驗）

4. **優化手機版間距**
   - 檔案：`app/agents/page.tsx` L116
   - `gap-3` → `gap-4` 或改為 `grid-cols-1 sm:grid-cols-2`

5. **修正 Description 在手機版的顯示**
   - 檔案：`app/agents/page.tsx` L159
   - `hidden sm:block` → `line-clamp-2` 或 `truncate`

6. **優化 Workflows 手機版排版**
   - 檔案：`app/agents/page.tsx` L285
   - 改為垂直堆疊 + 隱藏箭頭

### 🟢 低優先級（細節打磨）

7. **統一容器間距**
   - 主頁用 `px-5 py-12`，/agents 用 `px-4 py-8`
   - 建議統一為 `px-4 sm:px-6 py-8 sm:py-12`

8. **優化 Loading 視覺**
   - 加入文字提示和品牌色
   - 考慮骨架屏（skeleton）替代純 spinner

9. **調整 Detail Panel 頭像尺寸**
   - `sm:w-16 sm:h-16` → `sm:w-14 sm:h-14`
   - 讓尺寸跳躍更平滑

---

## 🎨 設計系統總結

### 已建立的設計語言

**色彩系統**：
- 背景：`#080a0f`, `bg-gray-900/30-40`
- 文字：`text-gray-100` (標題), `text-gray-300-500` (內文), `text-gray-600-700` (次要)
- 主題色：動態 agent.color + 透明度變體（08, 15, 25, 30, 50）
- 狀態色：emerald-400 (online), blue-400 (working), gray-600 (offline)

**間距系統**：
- 容器：`px-4 sm:px-6`, `py-8 sm:py-12`
- 卡片：`p-3 sm:p-4` 或 `p-4 sm:p-5`
- 元素間距：`gap-1.5` (緊密), `gap-3` (標準), `gap-4` (寬鬆)

**字體層級**：
- H1: `text-xl sm:text-2xl font-bold/semibold`
- H2: `text-sm font-medium uppercase tracking-wider`
- Body: `text-sm`
- Caption: `text-xs`, `text-[11px]`, `text-[10px]`, `text-[9px]`

**圓角系統**：
- 卡片：`rounded-xl` (12px)
- 頭像：`rounded-full` 或 `rounded-xl`
- 標籤：`rounded-full` (pill)

---

## 📸 建議補充的視覺測試

因無法訪問線上版本截圖，建議開發者自行確認：

1. **瀏覽器兼容性**
   - [ ] Safari (iOS/macOS)
   - [ ] Chrome (Android/Desktop)
   - [ ] Firefox

2. **螢幕尺寸測試**
   - [ ] iPhone SE (375px)
   - [ ] iPad (768px)
   - [ ] Desktop 1920px
   - [ ] Ultra-wide 2560px

3. **暗色模式（如適用）**
   - [ ] 系統暗色模式切換
   - [ ] 顏色對比度檢查

4. **動畫與互動**
   - [ ] Hover 效果流暢度
   - [ ] 點擊 Agent 卡片切換順暢
   - [ ] Loading → 內容切換無閃爍

5. **性能**
   - [ ] 頭像圖片加載（Next.js Image 優化）
   - [ ] 大量 Agent 時的渲染性能（>20 個）

---

## ✅ 總體評價

**/agents 頁面視覺設計品質：85/100**

**已達成**：
- Icon 全面使用 SVG（lucide-react）✅
- 色彩系統與 Hub 一致 ✅
- 卡片設計風格統一 ✅
- 響應式布局良好 ✅
- 狀態層級清晰 ✅

**待完善**：
- Icon 映射邏輯需修正 ⚠️
- 背景風格需統一 ⚠️
- 手機版排版細節 ⚠️
- 空狀態/Loading 視覺 ⚠️

**結論**：
整體設計已達到專業水準，核心視覺語言統一。建議優先處理高優先級問題（Icon 邏輯、背景統一），其餘問題可在迭代中逐步優化。

---

**審查完成時間**: 2026-02-15 18:53 GMT+8  
**審查者**: Designer Agent  
**下一步**: 將高優先級建議提交給 Coder 實作
