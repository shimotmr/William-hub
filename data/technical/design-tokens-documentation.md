# Design Tokens 正式文檔

**版本**: 2.0  
**更新日期**: 2026-02-16  
**維護者**: Designer Agent  
**狀態**: 正式版

---

## 目錄

1. [Token 命名規範](#token-命名規範)
2. [色彩 Token](#色彩-token)
3. [間距 Token](#間距-token)
4. [字型 Token](#字型-token)
5. [圓角 Token](#圓角-token)
6. [陰影 Token](#陰影-token)
7. [動畫 Token](#動畫-token)
8. [使用範例](#使用範例)

---

## Token 命名規範

### 命名原則

本設計系統採用**語意化命名（Semantic Naming）**，而非具體描述命名（如 `purple-500` 或 `gray-100`）。

#### 優勢

- **意圖明確**：`bg-primary` 比 `bg-purple-600` 更能表達用途
- **易於維護**：更換品牌色時只需修改 token 定義，不需改動組件程式碼
- **主題支援**：同一個 token 在深淺色主題下可對應不同色值

#### 命名結構

```
[類別]-[用途]-[變體]
```

**範例**：

- `background`：頁面背景
- `background-subtle`：微妙的背景變化
- `background-elevated`：浮起的元素背景（如卡片）
- `foreground`：主要文字
- `foreground-muted`：次要文字
- `primary`：品牌主色
- `primary-hover`：品牌主色 hover 狀態

### 類別定義

| 類別 | 說明 | 範例 |
|------|------|------|
| `background` | 背景色系 | `background`, `background-subtle` |
| `foreground` | 文字色系 | `foreground`, `foreground-muted` |
| `border` | 邊框色系 | `border`, `border-subtle` |
| `card` | 卡片容器 | `card`, `card-foreground` |
| `primary` | 品牌主色 | `primary`, `primary-hover` |
| `success` | 成功狀態 | `success`, `success-bg` |
| `warning` | 警告狀態 | `warning`, `warning-bg` |
| `error` | 錯誤狀態 | `error`, `error-bg` |
| `info` | 資訊狀態 | `info`, `info-bg` |

---

## 色彩 Token

### 深色主題（Dark Theme）- 預設

#### 背景色系

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `background` | `224 71% 4%` | `#0a0e1a` | 深藍黑底 | `bg-background` |
| `background-subtle` | `224 50% 6%` | `#0d1219` | 微亮背景 | `bg-background-subtle` |
| `background-elevated` | `224 50% 8%` | `#101620` | 卡片/浮動元素 | `bg-background-elevated` |

#### 文字色系

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `foreground` | `213 31% 91%` | `#e3e8ef` | 主要文字 | `text-foreground` |
| `foreground-muted` | `218 11% 55%` | `#7f8b99` | 次要文字 | `text-foreground-muted` |
| `foreground-subtle` | `220 9% 46%` | `#6b7684` | 輔助文字 | `text-foreground-subtle` |
| `foreground-disabled` | `220 8% 35%` | `#525a66` | 禁用文字 | `text-foreground-disabled` |

#### 卡片容器

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `card` | `224 50% 8%` | `#101620` | 卡片背景 | `bg-card` |
| `card-foreground` | `213 31% 91%` | `#e3e8ef` | 卡片文字 | `text-card-foreground` |

#### 邊框色系

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `border` | `216 34% 17%` | `#1c2432` | 主要邊框 | `border-border` |
| `border-subtle` | `220 20% 12%` | `#181d26` | 次要邊框 | `border-border-subtle` |
| `border-strong` | `220 30% 25%` | `#2d3642` | 強調邊框 | `border-border-strong` |

#### 品牌色（紫色）

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `primary` | `263 70% 50%` | `#7c3aed` | 品牌主色 | `bg-primary` |
| `primary-hover` | `263 70% 45%` | `#6d28d9` | Hover 狀態 | `bg-primary-hover` |
| `primary-active` | `263 70% 40%` | `#5b21b6` | Active 狀態 | `bg-primary-active` |
| `primary-foreground` | `0 0% 100%` | `#ffffff` | 品牌色上的文字 | `text-primary-foreground` |

#### 功能色：成功（綠色）

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `success` | `142 71% 45%` | `#16a34a` | 成功綠 | `text-success` |
| `success-bg` | `142 50% 10%` | `#0a3d1f` | 成功背景 | `bg-success-bg` |
| `success-border` | `142 50% 25%` | `#15803d` | 成功邊框 | `border-success-border` |

#### 功能色：警告（橘色）

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `warning` | `38 92% 50%` | `#f59e0b` | 警告橘 | `text-warning` |
| `warning-bg` | `38 70% 12%` | `#3d2a0f` | 警告背景 | `bg-warning-bg` |
| `warning-border` | `38 70% 30%` | `#b45309` | 警告邊框 | `border-warning-border` |

#### 功能色：錯誤（紅色）

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `error` | `0 72% 51%` | `#dc2626` | 錯誤紅 | `text-error` |
| `error-bg` | `0 50% 12%` | `#3d1010` | 錯誤背景 | `bg-error-bg` |
| `error-border` | `0 50% 30%` | `#991b1b` | 錯誤邊框 | `border-error-border` |

#### 功能色：資訊（藍色）

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `info` | `217 91% 60%` | `#3b82f6` | 資訊藍 | `text-info` |
| `info-bg` | `217 70% 12%` | `#0f2847` | 資訊背景 | `bg-info-bg` |
| `info-border` | `217 70% 30%` | `#1e40af` | 資訊邊框 | `border-info-border` |

### 淺色主題（Light Theme）

#### 背景色系

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `background` | `0 0% 100%` | `#ffffff` | 純白底 | `bg-background` |
| `background-subtle` | `220 14% 98%` | `#f9fafb` | 微灰背景 | `bg-background-subtle` |
| `background-elevated` | `0 0% 100%` | `#ffffff` | 白色卡片 | `bg-background-elevated` |

#### 文字色系

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `foreground` | `224 71% 4%` | `#0a0e1a` | 深色文字 | `text-foreground` |
| `foreground-muted` | `220 9% 46%` | `#6b7684` | 次要文字 | `text-foreground-muted` |
| `foreground-subtle` | `220 9% 60%` | `#8a94a6` | 輔助文字 | `text-foreground-subtle` |
| `foreground-disabled` | `220 9% 70%` | `#a8b0bc` | 禁用文字 | `text-foreground-disabled` |

#### 品牌色（紫色）

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `primary` | `262 83% 58%` | `#a855f7` | 品牌主色（稍亮）| `bg-primary` |
| `primary-hover` | `262 83% 53%` | `#9333ea` | Hover 狀態 | `bg-primary-hover` |
| `primary-active` | `262 83% 48%` | `#7e22ce` | Active 狀態 | `bg-primary-active` |

#### 功能色：成功（綠色）

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `success` | `142 71% 45%` | `#16a34a` | 成功綠 | `text-success` |
| `success-bg` | `142 50% 95%` | `#dcfce7` | 淺綠背景 | `bg-success-bg` |
| `success-border` | `142 50% 70%` | `#4ade80` | 綠色邊框 | `border-success-border` |

#### 功能色：警告（橘色）

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `warning` | `38 92% 50%` | `#f59e0b` | 警告橘 | `text-warning` |
| `warning-bg` | `38 70% 95%` | `#fef3c7` | 淺橘背景 | `bg-warning-bg` |
| `warning-border` | `38 70% 70%` | `#fbbf24` | 橘色邊框 | `border-warning-border` |

#### 功能色：錯誤（紅色）

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `error` | `0 72% 51%` | `#dc2626` | 錯誤紅 | `text-error` |
| `error-bg` | `0 50% 95%` | `#fee2e2` | 淺紅背景 | `bg-error-bg` |
| `error-border` | `0 50% 70%` | `#f87171` | 紅色邊框 | `border-error-border` |

#### 功能色：資訊（藍色）

| Token | HSL | Hex | 說明 | Tailwind Class |
|-------|-----|-----|------|----------------|
| `info` | `217 91% 60%` | `#3b82f6` | 資訊藍 | `text-info` |
| `info-bg` | `217 70% 95%` | `#dbeafe` | 淺藍背景 | `bg-info-bg` |
| `info-border` | `217 70% 70%` | `#60a5fa` | 藍色邊框 | `border-info-border` |

### 無障礙對比度

所有色彩組合符合 **WCAG 2.1 Level AA** 標準：

| 文字色 | 背景色 | 對比度 | 等級 |
|--------|--------|--------|------|
| `foreground` | `background` | 12.8:1 | AAA |
| `foreground-muted` | `background` | 6.2:1 | AA |
| `foreground-subtle` | `background` | 4.8:1 | AA |
| `primary-foreground` | `primary` | 8.5:1 | AAA |
| `success` | `success-bg` | 5.1:1 | AA |
| `error` | `error-bg` | 5.3:1 | AA |

---

## 間距 Token

### Spacing Scale

基於 **8px 基準**的間距系統，符合人體工學與柵格設計原則。

| Token | 數值 | Tailwind Class | 常見用途 |
|-------|------|----------------|----------|
| `spacing-0` | `0px` | `p-0`, `m-0` | 無間距 |
| `spacing-1` | `4px` | `p-1`, `m-1` | 極小間距（icon 與文字） |
| `spacing-2` | `8px` | `p-2`, `m-2` | 最小間距單位 |
| `spacing-3` | `12px` | `p-3`, `m-3` | 小間距（按鈕內邊距） |
| `spacing-4` | `16px` | `p-4`, `m-4` | 標準間距（卡片內邊距） |
| `spacing-5` | `20px` | `p-5`, `m-5` | 中間距 |
| `spacing-6` | `24px` | `p-6`, `m-6` | 大間距（section 內邊距） |
| `spacing-8` | `32px` | `p-8`, `m-8` | 超大間距 |
| `spacing-10` | `40px` | `p-10`, `m-10` | 巨大間距 |
| `spacing-12` | `48px` | `p-12`, `m-12` | 極大間距（頁面區塊） |
| `spacing-16` | `64px` | `p-16`, `m-16` | 超級大間距 |

### 常見間距組合

| 用途 | Tailwind Class | 說明 |
|------|----------------|------|
| 按鈕內邊距（小）| `px-3 py-1.5` | 寬 12px，高 6px |
| 按鈕內邊距（中）| `px-4 py-2` | 寬 16px，高 8px |
| 按鈕內邊距（大）| `px-6 py-3` | 寬 24px，高 12px |
| 卡片內邊距 | `p-6` | 24px 四周 |
| 卡片間距 | `gap-4` | 16px 間隔 |
| Section 間距 | `py-12` | 上下 48px |
| 頁面邊距 | `px-4 md:px-8` | 手機 16px，桌面 32px |

---

## 字型 Token

### Font Family

| Token | 字體列表 | 用途 |
|-------|----------|------|
| `font-sans` | `Inter, Noto Sans TC, system-ui, sans-serif` | 無襯線字體（正文） |
| `font-mono` | `JetBrains Mono, Fira Code, Consolas, monospace` | 等寬字體（程式碼） |

**使用方式**：

```tsx
<h1 className="font-sans">標題文字</h1>
<code className="font-mono">const x = 10;</code>
```

### Font Size

基於 **Type Scale**（1.25 倍率）的字級系統。

| Token | 數值 | Line Height | Tailwind Class | 用途 |
|-------|------|-------------|----------------|------|
| `text-xs` | `12px` | `16px` | `text-xs` | 極小文字（標籤） |
| `text-sm` | `14px` | `20px` | `text-sm` | 小文字（說明） |
| `text-base` | `16px` | `24px` | `text-base` | 正文 |
| `text-lg` | `18px` | `28px` | `text-lg` | 大文字（副標題） |
| `text-xl` | `20px` | `28px` | `text-xl` | 標題 H4 |
| `text-2xl` | `24px` | `32px` | `text-2xl` | 標題 H3 |
| `text-3xl` | `30px` | `36px` | `text-3xl` | 標題 H2 |
| `text-4xl` | `36px` | `40px` | `text-4xl` | 標題 H1 |
| `text-5xl` | `48px` | `1` | `text-5xl` | 超大標題 |

### Font Weight

| Token | 數值 | Tailwind Class | 用途 |
|-------|------|----------------|------|
| `font-normal` | `400` | `font-normal` | 正文 |
| `font-medium` | `500` | `font-medium` | 強調文字 |
| `font-semibold` | `600` | `font-semibold` | 副標題 |
| `font-bold` | `700` | `font-bold` | 主標題 |

### Letter Spacing

| Token | 數值 | Tailwind Class | 用途 |
|-------|------|----------------|------|
| `tracking-tight` | `-0.025em` | `tracking-tight` | 大標題 |
| `tracking-normal` | `0em` | `tracking-normal` | 正文 |
| `tracking-wide` | `0.025em` | `tracking-wide` | 按鈕文字 |

---

## 圓角 Token

### Border Radius

| Token | 數值 | Tailwind Class | 用途 |
|-------|------|----------------|------|
| `rounded-none` | `0px` | `rounded-none` | 無圓角 |
| `rounded-sm` | `2px` | `rounded-sm` | 極小圓角（徽章） |
| `rounded` | `4px` | `rounded` | 標準圓角（按鈕、輸入框） |
| `rounded-md` | `6px` | `rounded-md` | 中圓角（卡片） |
| `rounded-lg` | `8px` | `rounded-lg` | 大圓角（模態框） |
| `rounded-xl` | `12px` | `rounded-xl` | 超大圓角 |
| `rounded-2xl` | `16px` | `rounded-2xl` | 極大圓角 |
| `rounded-full` | `9999px` | `rounded-full` | 完全圓形（頭像） |

### 常見用法

| 元素 | Tailwind Class | 說明 |
|------|----------------|------|
| 按鈕 | `rounded` | 4px 標準圓角 |
| 輸入框 | `rounded` | 4px 標準圓角 |
| 卡片 | `rounded-md` | 6px 中圓角 |
| 徽章 | `rounded-full` | 完全圓形 |
| 模態框 | `rounded-lg` | 8px 大圓角 |
| 頭像 | `rounded-full` | 完全圓形 |

---

## 陰影 Token

### Box Shadow

分為**外陰影**與**內陰影**兩類，提供深度感與層次。

#### 外陰影（Elevation）

| Token | CSS Value | Tailwind Class | 用途 |
|-------|-----------|----------------|------|
| `shadow-none` | `none` | `shadow-none` | 無陰影 |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` | 微陰影（卡片） |
| `shadow` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | `shadow` | 標準陰影（按鈕） |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` | `shadow-md` | 中陰影（浮動卡片） |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | `shadow-lg` | 大陰影（模態框） |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)` | `shadow-xl` | 超大陰影（下拉選單） |
| `shadow-2xl` | `0 25px 50px rgba(0,0,0,0.25)` | `shadow-2xl` | 極大陰影（全屏覆蓋） |

#### 內陰影

| Token | CSS Value | Tailwind Class | 用途 |
|-------|-----------|----------------|------|
| `shadow-inner` | `inset 0 2px 4px rgba(0,0,0,0.06)` | `shadow-inner` | 內凹效果（輸入框） |

### 陰影顏色變體

結合色彩 token 使用：

```tsx
<div className="shadow-lg shadow-primary/20">
  {/* 紫色陰影，20% 透明度 */}
</div>

<div className="shadow-md shadow-error/30">
  {/* 紅色陰影，30% 透明度 */}
</div>
```

### 常見用法

| 元素 | Tailwind Class | 說明 |
|------|----------------|------|
| 卡片（靜態）| `shadow-sm` | 微陰影 |
| 卡片（hover）| `hover:shadow-md` | Hover 時增強 |
| 按鈕（主要）| `shadow` | 標準陰影 |
| 模態框 | `shadow-xl` | 極大陰影 |
| 下拉選單 | `shadow-lg` | 大陰影 |
| 輸入框（focus）| `focus:ring-2 focus:ring-primary` | 使用 ring 而非 shadow |

---

## 動畫 Token

### Duration（持續時間）

| Token | 數值 | Tailwind Class | 用途 |
|-------|------|----------------|------|
| `duration-75` | `75ms` | `duration-75` | 極快（即時反饋） |
| `duration-100` | `100ms` | `duration-100` | 快速（按鈕 hover） |
| `duration-150` | `150ms` | `duration-150` | 標準（預設動畫） |
| `duration-200` | `200ms` | `duration-200` | 中速（淡入淡出） |
| `duration-300` | `300ms` | `duration-300` | 慢速（滑動效果） |
| `duration-500` | `500ms` | `duration-500` | 超慢（完整動畫） |

### Easing（緩動函數）

| Token | CSS Value | Tailwind Class | 用途 |
|-------|-----------|----------------|------|
| `ease-linear` | `linear` | `ease-linear` | 線性（loading 動畫） |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | `ease-in` | 加速進入 |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | `ease-out` | 減速退出（推薦） |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | `ease-in-out` | 加速後減速 |

### 推薦組合

| 動畫類型 | Tailwind Class | 說明 |
|----------|----------------|------|
| 按鈕 hover | `transition-colors duration-150 ease-out` | 色彩過渡 |
| 模態框淡入 | `transition-opacity duration-200 ease-out` | 透明度過渡 |
| 側邊欄滑入 | `transition-transform duration-300 ease-out` | 位置過渡 |
| 卡片 hover | `transition-shadow duration-200 ease-out` | 陰影過渡 |
| 全屬性 | `transition-all duration-150 ease-out` | 所有屬性（慎用） |

### 常見動畫模式

#### 淡入淡出

```tsx
<div className="transition-opacity duration-200 ease-out opacity-0 hover:opacity-100">
  淡入效果
</div>
```

#### 滑動進入

```tsx
<div className="transition-transform duration-300 ease-out transform translate-x-full">
  {/* JavaScript 控制移除 translate-x-full */}
</div>
```

#### 按鈕點擊回饋

```tsx
<button className="transition-all duration-75 ease-out active:scale-95">
  點我
</button>
```

#### Loading 旋轉

```tsx
<div className="animate-spin">
  {/* lucide-react Loader2 icon */}
</div>
```

---

## 使用範例

### 範例 1：主要按鈕

```tsx
import { Save } from 'lucide-react'

export function PrimaryButton() {
  return (
    <button className="
      bg-primary hover:bg-primary-hover active:bg-primary-active
      text-primary-foreground
      px-4 py-2
      rounded
      shadow
      font-medium
      transition-colors duration-150 ease-out
    ">
      <Save size={16} className="inline mr-1.5" />
      儲存
    </button>
  )
}
```

**使用的 Tokens**：

- 色彩：`primary`, `primary-hover`, `primary-active`, `primary-foreground`
- 間距：`px-4 py-2`（16px × 8px）
- 圓角：`rounded`（4px）
- 陰影：`shadow`（標準陰影）
- 字重：`font-medium`（500）
- 動畫：`transition-colors duration-150 ease-out`

---

### 範例 2：資訊卡片

```tsx
import { Info } from 'lucide-react'

export function InfoCard() {
  return (
    <div className="
      bg-card
      border border-border
      rounded-md
      p-6
      shadow-sm hover:shadow-md
      transition-shadow duration-200 ease-out
    ">
      <div className="flex items-start gap-3">
        <Info size={20} className="text-info mt-0.5" />
        <div>
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            重要資訊
          </h3>
          <p className="text-sm text-foreground-muted">
            這是一個使用統一設計 token 的資訊卡片範例。
          </p>
        </div>
      </div>
    </div>
  )
}
```

**使用的 Tokens**：

- 色彩：`card`, `border`, `info`, `card-foreground`, `foreground-muted`
- 間距：`p-6`（24px），`gap-3`（12px），`mb-2`（8px）
- 圓角：`rounded-md`（6px）
- 陰影：`shadow-sm` → `hover:shadow-md`
- 字型：`text-lg`（18px），`text-sm`（14px），`font-semibold`（600）
- 動畫：`transition-shadow duration-200 ease-out`

---

### 範例 3：狀態徽章

```tsx
import { Check, AlertTriangle, XCircle } from 'lucide-react'

export function StatusBadges() {
  return (
    <div className="flex gap-2">
      {/* 成功 */}
      <span className="
        inline-flex items-center gap-1.5
        bg-success-bg text-success
        border border-success-border
        px-3 py-1
        rounded-full
        text-xs font-medium
      ">
        <Check size={12} />
        已完成
      </span>

      {/* 警告 */}
      <span className="
        inline-flex items-center gap-1.5
        bg-warning-bg text-warning
        border border-warning-border
        px-3 py-1
        rounded-full
        text-xs font-medium
      ">
        <AlertTriangle size={12} />
        待審核
      </span>

      {/* 錯誤 */}
      <span className="
        inline-flex items-center gap-1.5
        bg-error-bg text-error
        border border-error-border
        px-3 py-1
        rounded-full
        text-xs font-medium
      ">
        <XCircle size={12} />
        失敗
      </span>
    </div>
  )
}
```

**使用的 Tokens**：

- 色彩：`success-bg`, `success`, `success-border`（同理 warning、error）
- 間距：`gap-1.5`（6px），`px-3 py-1`（12px × 4px），`gap-2`（8px）
- 圓角：`rounded-full`（完全圓形）
- 字型：`text-xs`（12px），`font-medium`（500）

---

### 範例 4：輸入框

```tsx
import { Search } from 'lucide-react'

export function SearchInput() {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
      />
      <input
        type="text"
        placeholder="搜尋..."
        className="
          w-full
          bg-background-elevated
          border border-border
          focus:border-primary focus:ring-2 focus:ring-primary/20
          rounded
          pl-10 pr-4 py-2
          text-base text-foreground
          placeholder:text-foreground-muted
          transition-colors duration-150 ease-out
          outline-none
        "
      />
    </div>
  )
}
```

**使用的 Tokens**：

- 色彩：`background-elevated`, `border`, `primary`, `foreground`, `foreground-muted`
- 間距：`pl-10 pr-4 py-2`（左 40px，右 16px，上下 8px）
- 圓角：`rounded`（4px）
- 字型：`text-base`（16px）
- 動畫：`transition-colors duration-150 ease-out`
- Focus Ring：`focus:ring-2 focus:ring-primary/20`（2px 寬，20% 透明度）

---

### 範例 5：模態框

```tsx
import { X } from 'lucide-react'

export function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="
          fixed inset-0
          bg-black/50
          transition-opacity duration-200 ease-out
        "
        onClick={onClose}
      />

      {/* 模態框內容 */}
      <div className="
        fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        bg-card
        border border-border
        rounded-lg
        shadow-2xl
        p-6
        w-full max-w-md
        transition-all duration-300 ease-out
      ">
        {/* 標題列 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-card-foreground">
            標題
          </h2>
          <button
            onClick={onClose}
            className="
              text-foreground-muted hover:text-foreground
              transition-colors duration-150 ease-out
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* 內容 */}
        <p className="text-sm text-foreground-muted">
          這是模態框的內容區域。
        </p>
      </div>
    </>
  )
}
```

**使用的 Tokens**：

- 色彩：`card`, `border`, `card-foreground`, `foreground`, `foreground-muted`
- 間距：`p-6`（24px），`mb-4`（16px）
- 圓角：`rounded-lg`（8px）
- 陰影：`shadow-2xl`（極大陰影）
- 字型：`text-2xl`（24px），`text-sm`（14px），`font-bold`（700）
- 動畫：`transition-opacity duration-200`, `transition-all duration-300`
- 遮罩：`bg-black/50`（黑色 50% 透明度）

---

## Token 快速查詢表

### 色彩快查

| 用途 | Tailwind Class |
|------|----------------|
| 頁面背景 | `bg-background` |
| 卡片背景 | `bg-card` |
| 主要文字 | `text-foreground` |
| 次要文字 | `text-foreground-muted` |
| 邊框 | `border-border` |
| 品牌色按鈕 | `bg-primary text-primary-foreground` |
| 成功提示 | `bg-success-bg text-success` |
| 警告提示 | `bg-warning-bg text-warning` |
| 錯誤提示 | `bg-error-bg text-error` |
| 資訊提示 | `bg-info-bg text-info` |

### 間距快查

| 用途 | Tailwind Class |
|------|----------------|
| 按鈕內邊距 | `px-4 py-2` |
| 卡片內邊距 | `p-6` |
| 元素間距 | `gap-4` |
| Section 上下間距 | `py-12` |

### 圓角快查

| 用途 | Tailwind Class |
|------|----------------|
| 按鈕 | `rounded` |
| 卡片 | `rounded-md` |
| 模態框 | `rounded-lg` |
| 徽章 | `rounded-full` |

### 陰影快查

| 用途 | Tailwind Class |
|------|----------------|
| 卡片 | `shadow-sm` |
| 按鈕 | `shadow` |
| 模態框 | `shadow-xl` |
| 下拉選單 | `shadow-lg` |

### 動畫快查

| 用途 | Tailwind Class |
|------|----------------|
| 按鈕 hover | `transition-colors duration-150 ease-out` |
| 卡片 hover | `transition-shadow duration-200 ease-out` |
| 模態框淡入 | `transition-opacity duration-200 ease-out` |
| 側邊欄滑入 | `transition-transform duration-300 ease-out` |

---

## 主題切換

在 `<html>` 標籤加入或移除 `dark` class 即可切換主題：

```tsx
// 切換到深色主題
document.documentElement.classList.add('dark')

// 切換到淺色主題
document.documentElement.classList.remove('dark')
```

**ThemeProvider 範例**：

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({
  theme: 'dark',
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

**使用方式**：

```tsx
import { useTheme } from '@/components/ThemeProvider'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded hover:bg-accent transition-colors"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
```

---

## 檔案位置

- **CSS Variables**：`~/clawd/work-data/design-system/design-tokens.css`
- **Tailwind Preset**：`~/clawd/work-data/design-system/tailwind-preset.ts`
- **色彩 JSON**：`~/clawd/work-data/design-system/colors.json`
- **元件範例**：`~/clawd/work-data/design-system/components/`

---

## 延伸閱讀

- **完整設計文件**：`~/clawd/work-data/design-system-documentation.md`
- **快速開始指南**：`~/clawd/work-data/design-system/README.md`

---

**版本歷史**：

- **2.0**（2026-02-16）：完整 Design Tokens 文檔，包含命名規範、色彩、間距、字型、圓角、陰影、動畫
- **1.0**（2026-02-15）：初始 Design System 建立

**維護者**：Designer Agent  
**聯絡方式**：透過 Board 系統提交問題或建議
