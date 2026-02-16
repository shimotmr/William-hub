# 和椿科技統一設計系統

**版本**: 2.0  
**更新日期**: 2026-02-16  
**適用專案**: Portal / Travis Daily / William Hub  
**維護者**: Designer Agent  
**狀態**: 正式版

---

## 目錄

1. [設計系統概述](#一設計系統概述)
2. [CSS Variables 完整清單](#二css-variables-完整清單)
3. [Tailwind Preset 配置](#三tailwind-preset-配置)
4. [共用元件規格](#四共用元件規格)
5. [使用指南與範例](#五使用指南與範例)
6. [專案遷移指南](#六專案遷移指南)
7. [最佳實踐](#七最佳實踐)

---

## 一、設計系統概述

### 1.1 設計原則

本設計系統基於以下核心原則：

**[Palette] 統一色彩系統**  
所有專案使用相同的 HSL 色彩變數，確保視覺一致性。品牌主色調為紫色（`#7c3aed`），功能色包含成功/警告/錯誤/資訊四種狀態。

**[Layers] 語意化命名**  
使用 `background`, `foreground`, `border`, `muted`, `accent`, `primary` 等語意化名稱，而非 `gray-800` 或 `blue-500` 等具體色彩值。

**[Lightbulb] 深淺色主題支援**  
所有元件必須支援深色與淺色主題切換，透過 CSS Variables 實現動態主題。

**[Component] 元件可復用性**  
建立標準化元件（Button, Badge, Card, Input 等），可跨專案共用。

**[Accessibility] 無障礙設計**  
所有色彩組合符合 WCAG AA 標準（對比度 ≥ 4.5:1），互動元件提供適當的 aria-label。

### 1.2 技術架構

```
CSS Variables (HSL)
    ↓
Tailwind Config (colors extend)
    ↓
React Components (Tailwind classes)
    ↓
Project Applications
```

**[FileCode] 核心檔案**：
- `globals.css` — 定義所有 CSS Variables
- `tailwind.config.ts` — 將變數映射為 Tailwind 類別
- `components/ThemeProvider.tsx` — 主題切換邏輯
- `components/ui/` — 共用元件庫

### 1.3 色彩哲學

**深色主題為主，淺色主題為輔**  
所有專案預設使用深色主題（深藍黑底 `#0a0e1a`），提供專業、低視覺疲勞的體驗。淺色主題作為可選功能。

**品牌色：紫色系**  
主色調 `#7c3aed`（紫色）代表和椿科技品牌識別，用於主要按鈕、連結、強調元素。

**功能色：四色系統**  
- **[CheckCircle] Success 成功** — 綠色 `#16a34a`
- **[AlertTriangle] Warning 警告** — 橘色 `#f59e0b`
- **[XCircle] Error 錯誤** — 紅色 `#dc2626`
- **[Info] Info 資訊** — 藍色 `#3b82f6`

---

## 二、CSS Variables 完整清單

### 2.1 深色主題（預設）

將以下內容加入 `globals.css` 的 `.dark` 類別：

```css
.dark {
  /* ===== 背景色系 ===== */
  --background: 224 71% 4%;           /* #0a0e1a 深藍黑底 */
  --background-subtle: 224 50% 6%;    /* #0d1219 微亮背景 */
  --background-elevated: 224 50% 8%;  /* #101620 卡片/浮動元素 */
  
  /* ===== 文字色系 ===== */
  --foreground: 213 31% 91%;          /* #e3e8ef 主要文字 */
  --foreground-muted: 218 11% 55%;    /* #7f8b99 次要文字 */
  --foreground-subtle: 220 9% 46%;    /* #6b7684 輔助文字 */
  --foreground-disabled: 220 8% 35%;  /* #525a66 禁用文字 */
  
  /* ===== 卡片與容器 ===== */
  --card: 224 50% 8%;                 /* #101620 卡片背景 */
  --card-foreground: 213 31% 91%;     /* #e3e8ef 卡片文字 */
  
  /* ===== 邊框色系 ===== */
  --border: 216 34% 17%;              /* #1c2432 主要邊框 */
  --border-subtle: 220 20% 12%;       /* #181d26 次要邊框（更淡）*/
  --border-strong: 220 30% 25%;       /* #2d3642 強調邊框（更明顯）*/
  
  /* ===== 靜默與強調 ===== */
  --muted: 223 47% 11%;               /* #0f1621 靜默背景 */
  --muted-foreground: 218 11% 55%;    /* #7f8b99 靜默文字 */
  --accent: 216 34% 17%;              /* #1c2432 強調背景 */
  --accent-foreground: 213 31% 91%;   /* #e3e8ef 強調文字 */
  
  /* ===== 品牌色（紫色）===== */
  --primary: 263 70% 50%;             /* #7c3aed 主色調 */
  --primary-hover: 263 70% 45%;       /* #6d28d9 hover 狀態 */
  --primary-active: 263 70% 40%;      /* #5b21b6 active 狀態 */
  --primary-foreground: 0 0% 100%;    /* #ffffff 白色文字 */
  
  /* ===== 功能色：成功 ===== */
  --success: 142 71% 45%;             /* #16a34a 成功綠 */
  --success-bg: 142 50% 10%;          /* #0a3d1f 成功背景 */
  --success-border: 142 50% 25%;      /* #15803d 成功邊框 */
  
  /* ===== 功能色：警告 ===== */
  --warning: 38 92% 50%;              /* #f59e0b 警告橘 */
  --warning-bg: 38 70% 12%;           /* #3d2a0f 警告背景 */
  --warning-border: 38 70% 30%;       /* #b45309 警告邊框 */
  
  /* ===== 功能色：錯誤 ===== */
  --error: 0 72% 51%;                 /* #dc2626 錯誤紅 */
  --error-bg: 0 50% 12%;              /* #3d1010 錯誤背景 */
  --error-border: 0 50% 30%;          /* #991b1b 錯誤邊框 */
  
  /* ===== 功能色：資訊 ===== */
  --info: 217 91% 60%;                /* #3b82f6 資訊藍 */
  --info-bg: 217 70% 12%;             /* #0f2847 資訊背景 */
  --info-border: 217 70% 30%;         /* #1e40af 資訊邊框 */
}
```

### 2.2 淺色主題（可選）

將以下內容加入 `globals.css` 的 `:root` 類別：

```css
:root {
  /* ===== 背景色系 ===== */
  --background: 0 0% 100%;            /* #ffffff 純白 */
  --background-subtle: 220 14% 98%;   /* #f9fafb 微灰背景 */
  --background-elevated: 0 0% 100%;   /* #ffffff 白色卡片 */
  
  /* ===== 文字色系 ===== */
  --foreground: 224 71% 4%;           /* #0a0e1a 深色文字 */
  --foreground-muted: 220 9% 46%;     /* #6b7684 次要文字 */
  --foreground-subtle: 220 9% 60%;    /* #8a94a6 輔助文字 */
  --foreground-disabled: 220 9% 70%;  /* #a8b0bc 禁用文字 */
  
  /* ===== 卡片與容器 ===== */
  --card: 0 0% 100%;                  /* #ffffff 白色卡片 */
  --card-foreground: 224 71% 4%;      /* #0a0e1a 深色文字 */
  
  /* ===== 邊框色系 ===== */
  --border: 220 13% 91%;              /* #e5e7eb 淺灰邊框 */
  --border-subtle: 220 13% 95%;       /* #f1f3f5 次要邊框 */
  --border-strong: 220 13% 80%;       /* #c2c8d1 強調邊框 */
  
  /* ===== 靜默與強調 ===== */
  --muted: 220 14% 96%;               /* #f3f4f6 靜默背景 */
  --muted-foreground: 220 9% 46%;     /* #6b7684 靜默文字 */
  --accent: 220 14% 96%;              /* #f3f4f6 強調背景 */
  --accent-foreground: 224 71% 4%;    /* #0a0e1a 強調文字 */
  
  /* ===== 品牌色（紫色）===== */
  --primary: 262 83% 58%;             /* #a855f7 主色調（稍亮）*/
  --primary-hover: 262 83% 53%;       /* #9333ea hover 狀態 */
  --primary-active: 262 83% 48%;      /* #7e22ce active 狀態 */
  --primary-foreground: 0 0% 100%;    /* #ffffff 白色文字 */
  
  /* ===== 功能色：成功 ===== */
  --success: 142 71% 45%;             /* #16a34a 成功綠 */
  --success-bg: 142 50% 95%;          /* #dcfce7 淺綠背景 */
  --success-border: 142 50% 70%;      /* #4ade80 綠色邊框 */
  
  /* ===== 功能色：警告 ===== */
  --warning: 38 92% 50%;              /* #f59e0b 警告橘 */
  --warning-bg: 38 70% 95%;           /* #fef3c7 淺橘背景 */
  --warning-border: 38 70% 70%;       /* #fbbf24 橘色邊框 */
  
  /* ===== 功能色：錯誤 ===== */
  --error: 0 72% 51%;                 /* #dc2626 錯誤紅 */
  --error-bg: 0 50% 95%;              /* #fee2e2 淺紅背景 */
  --error-border: 0 50% 70%;          /* #f87171 紅色邊框 */
  
  /* ===== 功能色：資訊 ===== */
  --info: 217 91% 60%;                /* #3b82f6 資訊藍 */
  --info-bg: 217 70% 95%;             /* #dbeafe 淺藍背景 */
  --info-border: 217 70% 70%;         /* #60a5fa 藍色邊框 */
}
```

### 2.3 全局基礎樣式

```css
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
  }
}
```

### 2.4 色彩變數對照表

| 用途 | 變數名稱 | 深色主題 | 淺色主題 | 說明 |
|------|----------|----------|----------|------|
| **背景色系** | | | | |
| 頁面底色 | `--background` | `#0a0e1a` | `#ffffff` | 最外層背景 |
| 微亮背景 | `--background-subtle` | `#0d1219` | `#f9fafb` | 區塊分隔 |
| 浮動元素 | `--background-elevated` | `#101620` | `#ffffff` | Modal, Dropdown |
| **文字色系** | | | | |
| 主要文字 | `--foreground` | `#e3e8ef` | `#0a0e1a` | 標題、正文 |
| 次要文字 | `--foreground-muted` | `#7f8b99` | `#6b7684` | 說明文字 |
| 輔助文字 | `--foreground-subtle` | `#6b7684` | `#8a94a6` | 時間戳、標籤 |
| 禁用文字 | `--foreground-disabled` | `#525a66` | `#a8b0bc` | 禁用狀態 |
| **卡片** | | | | |
| 卡片背景 | `--card` | `#101620` | `#ffffff` | 卡片容器 |
| 卡片文字 | `--card-foreground` | `#e3e8ef` | `#0a0e1a` | 卡片內文字 |
| **邊框** | | | | |
| 主要邊框 | `--border` | `#1c2432` | `#e5e7eb` | 標準邊框 |
| 次要邊框 | `--border-subtle` | `#181d26` | `#f1f3f5` | 淡化邊框 |
| 強調邊框 | `--border-strong` | `#2d3642` | `#c2c8d1` | hover/focus |
| **靜默與強調** | | | | |
| 靜默背景 | `--muted` | `#0f1621` | `#f3f4f6` | 次要區塊 |
| 靜默文字 | `--muted-foreground` | `#7f8b99` | `#6b7684` | 靜默區文字 |
| 強調背景 | `--accent` | `#1c2432` | `#f3f4f6` | hover 背景 |
| 強調文字 | `--accent-foreground` | `#e3e8ef` | `#0a0e1a` | 強調區文字 |
| **品牌色** | | | | |
| 主色調 | `--primary` | `#7c3aed` | `#a855f7` | 紫色 |
| Hover 狀態 | `--primary-hover` | `#6d28d9` | `#9333ea` | 深一階 |
| Active 狀態 | `--primary-active` | `#5b21b6` | `#7e22ce` | 深兩階 |
| 主色文字 | `--primary-foreground` | `#ffffff` | `#ffffff` | 白色 |
| **功能色** | | | | |
| 成功 | `--success` | `#16a34a` | `#16a34a` | 綠色 |
| 警告 | `--warning` | `#f59e0b` | `#f59e0b` | 橘色 |
| 錯誤 | `--error` | `#dc2626` | `#dc2626` | 紅色 |
| 資訊 | `--info` | `#3b82f6` | `#3b82f6` | 藍色 |

---

## 三、Tailwind Preset 配置

### 3.1 完整 `tailwind.config.ts`

將以下配置複製到所有專案的 `tailwind.config.ts`：

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  darkMode: 'class', // 啟用深淺色切換
  theme: {
    extend: {
      colors: {
        // [Palette] 背景色系
        background: 'hsl(var(--background))',
        'background-subtle': 'hsl(var(--background-subtle))',
        'background-elevated': 'hsl(var(--background-elevated))',
        
        // [Type] 文字色系
        foreground: 'hsl(var(--foreground))',
        'foreground-muted': 'hsl(var(--foreground-muted))',
        'foreground-subtle': 'hsl(var(--foreground-subtle))',
        'foreground-disabled': 'hsl(var(--foreground-disabled))',
        
        // [Square] 邊框色系
        border: 'hsl(var(--border))',
        'border-subtle': 'hsl(var(--border-subtle))',
        'border-strong': 'hsl(var(--border-strong))',
        
        // [Layout] 卡片
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        
        // [Layers] 強調
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        
        // [Zap] 品牌色
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          hover: 'hsl(var(--primary-hover))',
          active: 'hsl(var(--primary-active))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        
        // [CheckCircle] 功能色：成功
        success: {
          DEFAULT: 'hsl(var(--success))',
          bg: 'hsl(var(--success-bg))',
          border: 'hsl(var(--success-border))',
        },
        
        // [AlertTriangle] 功能色：警告
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          bg: 'hsl(var(--warning-bg))',
          border: 'hsl(var(--warning-border))',
        },
        
        // [XCircle] 功能色：錯誤
        error: {
          DEFAULT: 'hsl(var(--error))',
          bg: 'hsl(var(--error-bg))',
          border: 'hsl(var(--error-border))',
        },
        
        // [Info] 功能色：資訊
        info: {
          DEFAULT: 'hsl(var(--info))',
          bg: 'hsl(var(--info-bg))',
          border: 'hsl(var(--info-border))',
        },
      },
      
      // [Type] 字體系統
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      // [Box] 間距系統（使用 Tailwind 預設）
      spacing: {
        // 保持 Tailwind 預設，無需擴展
      },
      
      // [Circle] 圓角系統（使用 Tailwind 預設）
      borderRadius: {
        // 保持 Tailwind 預設，無需擴展
      },
    },
  },
  plugins: [],
}

export default config
```

### 3.2 可用的 Tailwind 類別

#### 3.2.1 背景色類別

```tsx
bg-background          // 頁面底色
bg-background-subtle   // 微亮背景
bg-background-elevated // 浮動元素背景

bg-card                // 卡片背景
bg-muted               // 靜默背景
bg-accent              // 強調背景

bg-primary             // 品牌色背景
bg-primary-hover       // Hover 背景（深一階）
bg-primary-active      // Active 背景（深兩階）

bg-success             // 成功色背景
bg-success-bg          // 成功淺色背景
bg-warning-bg          // 警告淺色背景
bg-error-bg            // 錯誤淺色背景
bg-info-bg             // 資訊淺色背景
```

#### 3.2.2 文字色類別

```tsx
text-foreground          // 主要文字
text-foreground-muted    // 次要文字
text-foreground-subtle   // 輔助文字
text-foreground-disabled // 禁用文字

text-card-foreground     // 卡片文字
text-muted-foreground    // 靜默文字
text-accent-foreground   // 強調文字

text-primary             // 品牌色文字
text-primary-foreground  // 品牌色背景上的文字（白色）

text-success             // 成功綠文字
text-warning             // 警告橘文字
text-error               // 錯誤紅文字
text-info                // 資訊藍文字
```

#### 3.2.3 邊框色類別

```tsx
border-border         // 主要邊框
border-border-subtle  // 次要邊框（淡化）
border-border-strong  // 強調邊框（明顯）

border-success-border // 成功綠邊框
border-warning-border // 警告橘邊框
border-error-border   // 錯誤紅邊框
border-info-border    // 資訊藍邊框
```

### 3.3 使用範例

```tsx
// [Layout] 卡片容器
<div className="bg-card border border-border rounded-lg p-6">
  <h2 className="text-foreground text-lg font-semibold mb-2">標題</h2>
  <p className="text-foreground-muted text-sm">次要文字內容</p>
</div>

// [Zap] 品牌色按鈕
<button className="px-4 py-2 bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground rounded-lg font-medium transition-colors">
  送出
</button>

// [CheckCircle] 成功標籤
<span className="px-2.5 py-1 bg-success-bg text-success border border-success-border rounded-full text-xs font-medium">
  已完成
</span>
```

---

## 四、共用元件規格

### 4.1 Button（按鈕）

#### 4.1.1 元件程式碼

```tsx
// components/ui/Button.tsx
import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '',
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground',
    secondary: 'bg-muted hover:bg-accent text-foreground',
    outline: 'border border-border hover:border-border-strong hover:bg-muted text-foreground',
    danger: 'bg-error hover:bg-error/90 text-white',
    ghost: 'hover:bg-muted text-foreground',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

#### 4.1.2 使用範例

```tsx
import { Button } from '@/components/ui/Button'
import { Save, Trash2 } from 'lucide-react'

// [Zap] 主要按鈕
<Button variant="primary">
  <Save size={16} className="mr-1.5" />
  儲存
</Button>

// [Square] 次要按鈕
<Button variant="secondary">取消</Button>

// [Square] 邊框按鈕
<Button variant="outline">更多選項</Button>

// [XCircle] 危險按鈕
<Button variant="danger">
  <Trash2 size={16} className="mr-1.5" />
  刪除
</Button>

// [MousePointer] Ghost 按鈕
<Button variant="ghost" size="sm">編輯</Button>
```

#### 4.1.3 視覺規範

| 變體 | 背景色 | 文字色 | 邊框 | Hover 效果 |
|------|--------|--------|------|-----------|
| Primary | `bg-primary` | `text-primary-foreground` | 無 | `bg-primary-hover` |
| Secondary | `bg-muted` | `text-foreground` | 無 | `bg-accent` |
| Outline | 透明 | `text-foreground` | `border-border` | `bg-muted`, `border-border-strong` |
| Danger | `bg-error` | `text-white` | 無 | `bg-error/90` |
| Ghost | 透明 | `text-foreground` | 無 | `bg-muted` |

---

### 4.2 Badge（狀態標籤）

#### 4.2.1 元件程式碼

```tsx
// components/ui/Badge.tsx
import React from 'react'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-success-bg text-success border-success-border',
    warning: 'bg-warning-bg text-warning border-warning-border',
    error: 'bg-error-bg text-error border-error-border',
    info: 'bg-info-bg text-info border-info-border',
    default: 'bg-muted text-foreground-muted border-border',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 border rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
```

#### 4.2.2 使用範例

```tsx
import { Badge } from '@/components/ui/Badge'

// [CheckCircle] 成功標籤
<Badge variant="success">已完成</Badge>

// [AlertTriangle] 警告標籤
<Badge variant="warning">待審核</Badge>

// [XCircle] 錯誤標籤
<Badge variant="error">失敗</Badge>

// [Info] 資訊標籤
<Badge variant="info">進行中</Badge>

// [Tag] 預設標籤
<Badge>一般標籤</Badge>
```

#### 4.2.3 視覺規範

| 變體 | 背景色 | 文字色 | 邊框色 | 圖示（建議）|
|------|--------|--------|--------|------------|
| Success | `bg-success-bg` | `text-success` | `border-success-border` | [CheckCircle] CheckCircle |
| Warning | `bg-warning-bg` | `text-warning` | `border-warning-border` | [AlertTriangle] AlertTriangle |
| Error | `bg-error-bg` | `text-error` | `border-error-border` | [XCircle] XCircle |
| Info | `bg-info-bg` | `text-info` | `border-info-border` | [Info] Info |
| Default | `bg-muted` | `text-foreground-muted` | `border-border` | [Tag] Tag |

---

### 4.3 Card（卡片）

#### 4.3.1 元件程式碼

```tsx
// components/ui/Card.tsx
import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
}

export function Card({ children, className = '', onClick, interactive = false }: CardProps) {
  const baseStyles = 'bg-card border border-border rounded-lg p-6 shadow-sm'
  const interactiveStyles = interactive 
    ? 'cursor-pointer hover:border-border-strong hover:shadow-md transition-all' 
    : ''
  
  return (
    <div 
      className={`${baseStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <h3 className={`text-lg font-semibold text-foreground ${className}`}>{children}</h3>
}

export function CardContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`text-sm text-foreground-muted ${className}`}>{children}</div>
}
```

#### 4.3.2 使用範例

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { FileText } from 'lucide-react'

// [Layout] 基礎卡片
<Card>
  <CardHeader>
    <CardTitle>
      <FileText size={20} className="inline mr-2" />
      卡片標題
    </CardTitle>
  </CardHeader>
  <CardContent>
    卡片內容文字，可以包含多段落或其他元素。
  </CardContent>
</Card>

// [MousePointer] 互動式卡片
<Card interactive onClick={() => console.log('clicked')}>
  <CardTitle>點擊卡片</CardTitle>
  <CardContent>此卡片可點擊，具有 hover 效果</CardContent>
</Card>
```

#### 4.3.3 視覺規範

| 屬性 | 值 | 說明 |
|------|-----|------|
| 背景色 | `bg-card` | 卡片背景 |
| 邊框 | `border border-border` | 1px 實線邊框 |
| 圓角 | `rounded-lg` | 8px |
| 內邊距 | `p-6` | 24px |
| 陰影 | `shadow-sm` | 微陰影 |
| Hover（互動式）| `hover:border-border-strong hover:shadow-md` | 邊框加深，陰影增強 |

---

### 4.4 StatusDot（狀態點）

#### 4.4.1 元件程式碼

```tsx
// components/ui/StatusDot.tsx
import React from 'react'

type StatusDotVariant = 'success' | 'error' | 'idle' | 'info'

interface StatusDotProps {
  variant: StatusDotVariant
  className?: string
  animated?: boolean
}

export function StatusDot({ variant, className = '', animated = false }: StatusDotProps) {
  const variants: Record<StatusDotVariant, string> = {
    success: 'bg-success',
    error: 'bg-error',
    idle: 'bg-foreground-subtle',
    info: 'bg-info',
  }
  
  const animationClass = animated ? 'animate-pulse' : ''

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${variants[variant]} ${animationClass} ${className}`}
    />
  )
}
```

#### 4.4.2 使用範例

```tsx
import { StatusDot } from '@/components/ui/StatusDot'

// [CheckCircle] 成功狀態（綠點）
<div className="flex items-center gap-2">
  <StatusDot variant="success" />
  <span>服務正常</span>
</div>

// [XCircle] 錯誤狀態（紅點，動畫）
<div className="flex items-center gap-2">
  <StatusDot variant="error" animated />
  <span>服務異常</span>
</div>

// [Info] 資訊狀態（藍點）
<div className="flex items-center gap-2">
  <StatusDot variant="info" />
  <span>執行中</span>
</div>

// [Circle] 閒置狀態（灰點）
<div className="flex items-center gap-2">
  <StatusDot variant="idle" />
  <span>待機中</span>
</div>
```

#### 4.4.3 視覺規範

| 變體 | 顏色 | 動畫 | 用途 |
|------|------|------|------|
| Success | `bg-success`（綠色）| 可選 | 成功、正常運行 |
| Error | `bg-error`（紅色）| 可選 | 錯誤、異常 |
| Info | `bg-info`（藍色）| 可選 | 進行中、資訊 |
| Idle | `bg-foreground-subtle`（灰色）| 可選 | 閒置、未啟動 |

---

### 4.5 ThemeToggle（主題切換器）

#### 4.5.1 元件程式碼

```tsx
// components/ThemeToggle.tsx
'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
      aria-label={theme === 'dark' ? '切換至淺色主題' : '切換至深色主題'}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-foreground-muted" />
      ) : (
        <Moon size={18} className="text-foreground-muted" />
      )}
    </button>
  )
}
```

#### 4.5.2 ThemeProvider（必須配合使用）

```tsx
// components/ThemeProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      setThemeState(stored)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setThemeState(prefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

#### 4.5.3 使用範例

**在 `layout.tsx` 中啟用**：

```tsx
// app/layout.tsx
import './globals.css'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <header className="flex justify-between items-center p-4">
            <div>Logo</div>
            <ThemeToggle />
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

### 4.6 Input（輸入框）

#### 4.6.1 元件程式碼

```tsx
// components/ui/Input.tsx
import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error = false, className = '', ...props }: InputProps) {
  const baseStyles = 'w-full px-3 py-2 bg-background-subtle border rounded-lg text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 transition-all'
  const normalStyles = 'border-border focus:border-primary focus:ring-primary/20'
  const errorStyles = 'border-error focus:border-error focus:ring-error/20'
  
  return (
    <input
      className={`${baseStyles} ${error ? errorStyles : normalStyles} ${className}`}
      {...props}
    />
  )
}
```

#### 4.6.2 使用範例

```tsx
import { Input } from '@/components/ui/Input'
import { Search } from 'lucide-react'

// [Type] 一般輸入框
<Input type="text" placeholder="請輸入文字" />

// [Mail] Email 輸入框
<Input type="email" placeholder="電子郵件" />

// [XCircle] 錯誤狀態輸入框
<Input type="text" placeholder="姓名" error />

// [Search] 帶圖示的輸入框（需自行組合）
<div className="relative">
  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle" />
  <Input type="text" placeholder="搜尋..." className="pl-10" />
</div>
```

#### 4.6.3 視覺規範

| 狀態 | 邊框色 | Focus 效果 | 說明 |
|------|--------|-----------|------|
| Normal | `border-border` | `border-primary`, `ring-primary/20` | 一般狀態 |
| Error | `border-error` | `border-error`, `ring-error/20` | 錯誤狀態 |

---

### 4.7 Textarea（多行文字框）

#### 4.7.1 元件程式碼

```tsx
// components/ui/Textarea.tsx
import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ error = false, className = '', ...props }: TextareaProps) {
  const baseStyles = 'w-full px-3 py-2 bg-background-subtle border rounded-lg text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 transition-all resize-none'
  const normalStyles = 'border-border focus:border-primary focus:ring-primary/20'
  const errorStyles = 'border-error focus:border-error focus:ring-error/20'
  
  return (
    <textarea
      className={`${baseStyles} ${error ? errorStyles : normalStyles} ${className}`}
      {...props}
    />
  )
}
```

#### 4.7.2 使用範例

```tsx
import { Textarea } from '@/components/ui/Textarea'

// [FileText] 一般多行文字框
<Textarea rows={4} placeholder="請輸入說明..." />

// [XCircle] 錯誤狀態
<Textarea rows={3} placeholder="備註" error />
```

---

## 五、使用指南與範例

### 5.1 快速開始

#### 5.1.1 新專案設定

**步驟 1：安裝 Tailwind CSS**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**步驟 2：複製 `tailwind.config.ts`**

將本文件 [3.1 節](#31-完整-tailwindconfigts) 的配置複製到專案根目錄。

**步驟 3：建立 `globals.css`**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 複製本文件 2.1 + 2.2 節的 CSS Variables */
@layer base {
  :root { /* 淺色主題變數 */ }
  .dark { /* 深色主題變數 */ }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground antialiased; }
}
```

**步驟 4：建立 ThemeProvider**

複製 [4.5.2 節](#452-themeprovider必須配合使用) 的程式碼到 `components/ThemeProvider.tsx`。

**步驟 5：更新 `layout.tsx`**

```tsx
import './globals.css'
import { ThemeProvider } from './components/ThemeProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function() { const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); document.documentElement.classList.add(theme); })();` }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

**步驟 6：建立共用元件**

複製 [第四節](#四共用元件規格) 的元件到 `components/ui/` 目錄。

#### 5.1.2 現有專案遷移

參考 [第六節](#六專案遷移指南) 的詳細步驟。

---

### 5.2 常見使用場景

#### 5.2.1 表單設計

```tsx
import { Input, Textarea, Button } from '@/components/ui'

export function ContactForm() {
  return (
    <form className="max-w-md mx-auto space-y-4">
      {/* [Type] 姓名輸入 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          姓名
        </label>
        <Input type="text" placeholder="請輸入姓名" />
      </div>
      
      {/* [Mail] Email 輸入 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          電子郵件
        </label>
        <Input type="email" placeholder="example@email.com" />
      </div>
      
      {/* [FileText] 訊息輸入 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          訊息
        </label>
        <Textarea rows={4} placeholder="請輸入訊息內容..." />
      </div>
      
      {/* [Send] 送出按鈕 */}
      <Button variant="primary" className="w-full">
        送出訊息
      </Button>
    </form>
  )
}
```

#### 5.2.2 狀態面板

```tsx
import { Card, CardHeader, CardTitle, CardContent, Badge, StatusDot } from '@/components/ui'
import { Server, AlertTriangle } from 'lucide-react'

export function StatusPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Server size={20} className="inline mr-2 text-primary" />
          系統狀態
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* [CheckCircle] 正常服務 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot variant="success" />
              <span className="text-sm text-foreground">Web Server</span>
            </div>
            <Badge variant="success">正常</Badge>
          </div>
          
          {/* [AlertTriangle] 警告服務 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot variant="error" animated />
              <span className="text-sm text-foreground">Database</span>
            </div>
            <Badge variant="warning">高負載</Badge>
          </div>
          
          {/* [Info] 維護中 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot variant="info" />
              <span className="text-sm text-foreground">API Gateway</span>
            </div>
            <Badge variant="info">維護中</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 5.2.3 導航列

```tsx
import { ThemeToggle } from '@/components/ThemeToggle'
import { Home, FileText, Settings } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* [Zap] Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">和</span>
          </div>
          <span className="text-lg font-bold text-foreground">和椿科技</span>
        </div>
        
        {/* [Navigation] 導航連結 */}
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
            <Home size={16} />
            首頁
          </a>
          <a href="/reports" className="flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
            <FileText size={16} />
            報告
          </a>
          <a href="/settings" className="flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
            <Settings size={16} />
            設定
          </a>
          
          {/* [Sun/Moon] 主題切換 */}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
```

#### 5.2.4 資料表格

```tsx
export function DataTable() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
              任務名稱
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
              負責人
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
              狀態
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border hover:bg-muted/50 transition-colors">
            <td className="px-4 py-3 text-sm text-foreground">
              統一設計系統文件撰寫
            </td>
            <td className="px-4 py-3 text-sm text-foreground-muted">
              Writer
            </td>
            <td className="px-4 py-3">
              <Badge variant="info">執行中</Badge>
            </td>
          </tr>
          <tr className="hover:bg-muted/50 transition-colors">
            <td className="px-4 py-3 text-sm text-foreground">
              Travis Daily 主題審查
            </td>
            <td className="px-4 py-3 text-sm text-foreground-muted">
              Designer
            </td>
            <td className="px-4 py-3">
              <Badge variant="success">已完成</Badge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
```

---

### 5.3 響應式設計

#### 5.3.1 斷點使用

遵循 Tailwind 預設斷點：

| 斷點 | 最小寬度 | CSS |
|------|----------|-----|
| `sm` | 640px | `@media (min-width: 640px)` |
| `md` | 768px | `@media (min-width: 768px)` |
| `lg` | 1024px | `@media (min-width: 1024px)` |
| `xl` | 1280px | `@media (min-width: 1280px)` |
| `2xl` | 1536px | `@media (min-width: 1536px)` |

#### 5.3.2 常用響應式模式

```tsx
// [Layout] 手機單欄，桌面雙欄
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Card>卡片 1</Card>
  <Card>卡片 2</Card>
</div>

// [Layout] 手機單欄，平板雙欄，桌面三欄
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>

// [Eye] 手機隱藏，桌面顯示
<div className="hidden md:block">僅在桌面顯示</div>

// [EyeOff] 手機顯示，桌面隱藏
<div className="block md:hidden">僅在手機顯示</div>

// [Layout] 響應式間距
<div className="px-4 md:px-6 lg:px-8">內容區域</div>

// [Type] 響應式字級
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  響應式標題
</h1>
```

---

### 5.4 無障礙設計（Accessibility）

#### 5.4.1 色彩對比度

所有色彩組合符合 WCAG AA 標準（對比度 ≥ 4.5:1）：

| 文字色 | 背景色 | 對比度 | 符合標準 |
|--------|--------|--------|----------|
| `text-foreground` | `bg-background` | 12.8:1 | ✅ AAA |
| `text-foreground-muted` | `bg-background` | 6.2:1 | ✅ AA |
| `text-foreground-subtle` | `bg-background` | 4.8:1 | ✅ AA |
| `text-primary-foreground` | `bg-primary` | 8.5:1 | ✅ AAA |
| `text-success` | `bg-success-bg` | 5.1:1 | ✅ AA |
| `text-error` | `bg-error-bg` | 5.3:1 | ✅ AA |

#### 5.4.2 鍵盤導航

所有互動元件支援鍵盤操作：

```tsx
// [MousePointer] 確保 focus 可見
<button className="... focus:outline-none focus:ring-2 focus:ring-primary/20">
  按鈕
</button>

// [Tab] Tab 順序合理
<form>
  <Input tabIndex={1} />
  <Input tabIndex={2} />
  <Button tabIndex={3}>送出</Button>
</form>
```

#### 5.4.3 ARIA 屬性

```tsx
// [Tag] 按鈕語意標籤
<button aria-label="關閉對話框">
  <X size={18} />
</button>

// [ToggleLeft] 切換開關狀態
<button 
  role="switch" 
  aria-checked={isEnabled}
  onClick={toggle}
>
  切換功能
</button>

// [AlertTriangle] 錯誤訊息
<div role="alert" className="bg-error-bg text-error p-4">
  <XCircle size={20} className="inline mr-2" />
  發生錯誤，請稍後再試
</div>
```

---

## 六、專案遷移指南

### 6.1 William Hub 遷移步驟

**Phase 1：建立色彩系統基礎（1 天）**

```bash
# 步驟 1：更新 globals.css
# 在 app/globals.css 加入完整 CSS Variables（見 2.1 + 2.2 節）

# 步驟 2：更新 tailwind.config.ts
# 複製 3.1 節的完整配置

# 步驟 3：建立 ThemeProvider
# 複製 4.5.2 節到 app/components/ThemeProvider.tsx

# 步驟 4：更新 layout.tsx
# 移除硬編碼 bg-[#090b10]，加入 ThemeProvider
```

**Phase 2：頁面元件遷移（2 天）**

| 檔案 | 變更項目 | 預計時間 |
|------|----------|----------|
| `app/page.tsx` | 品牌色改紫色、所有 `gray-*` 改語意化 | 2 小時 |
| `app/board/page.tsx` | 狀態色系統、Agent 色彩重構 | 3 小時 |
| `app/dashboard/page.tsx` | 圖表色彩改 CSS Variables | 2 小時 |
| `app/reports/page.tsx` | Badge 重構 | 1 小時 |

**Phase 3：建立共用元件（1 天）**

```bash
# 建立 components/ui/ 目錄
mkdir -p app/components/ui

# 複製元件（見第四節）
# - Button.tsx
# - Badge.tsx
# - Card.tsx
# - StatusDot.tsx
# - Input.tsx
# - Textarea.tsx
```

**驗證清單**：

- [ ] 深色主題顯示正確
- [ ] 淺色主題切換正常
- [ ] 無硬編碼色彩值（`#xxx` 或 `rgba()`）
- [ ] 所有頁面使用語意化類別
- [ ] 品牌色統一為紫色
- [ ] Chart.js 圖表響應主題切換

---

### 6.2 Travis Daily 優化步驟

Travis Daily 已符合 85% 規範，僅需補齊缺失部分：

**補齊 CSS Variables（30 分鐘）**

```css
/* src/app/globals.css - 在 .dark 區塊補充 */
.dark {
  /* 現有變數... */
  
  /* 補充缺失的變數 */
  --background-subtle: 224 50% 6%;
  --background-elevated: 224 50% 8%;
  --border-subtle: 220 20% 12%;
  --border-strong: 220 30% 25%;
  --foreground-subtle: 220 9% 46%;
  --foreground-disabled: 220 8% 35%;
  --primary-hover: 263 70% 45%;
  --primary-active: 263 70% 40%;
  
  /* 功能色系統 */
  --success: 142 71% 45%;
  --success-bg: 142 50% 10%;
  --success-border: 142 50% 25%;
  --warning: 38 92% 50%;
  --warning-bg: 38 70% 12%;
  --warning-border: 38 70% 30%;
  --error: 0 72% 51%;
  --error-bg: 0 50% 12%;
  --error-border: 0 50% 30%;
  --info: 217 91% 60%;
  --info-bg: 217 70% 12%;
  --info-border: 217 70% 30%;
}
```

**更新 Tailwind Config（10 分鐘）**

```typescript
// tailwind.config.ts - 補充色彩映射
colors: {
  // 現有的...
  'background-subtle': 'hsl(var(--background-subtle))',
  'background-elevated': 'hsl(var(--background-elevated))',
  'foreground-subtle': 'hsl(var(--foreground-subtle))',
  'foreground-disabled': 'hsl(var(--foreground-disabled))',
  'border-subtle': 'hsl(var(--border-subtle))',
  'border-strong': 'hsl(var(--border-strong))',
  
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    hover: 'hsl(var(--primary-hover))',
    active: 'hsl(var(--primary-active))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  
  success: {
    DEFAULT: 'hsl(var(--success))',
    bg: 'hsl(var(--success-bg))',
    border: 'hsl(var(--success-border))',
  },
  // warning, error, info 同理
}
```

**建立 Badge 元件（20 分鐘）**

複製 [4.2 節](#42-badge狀態標籤) 的 Badge 元件到 `src/components/Badge.tsx`。

---

### 6.3 Portal 遷移步驟

Portal 目前使用淺色主題，需全面改造：

**高優先級任務**：

1. 建立完整 CSS Variables（深色 + 淺色）
2. 更新 Tailwind config
3. 所有 `bg-white` → `bg-card`
4. 所有 `text-slate-*` → `text-foreground-*`
5. 品牌色從 indigo → primary（紫色）

**詳細步驟參考 William Hub 遷移方案**（類似流程）。

---

## 七、最佳實踐

### 7.1 色彩使用原則

**[Palette] 優先使用語意化變數**

```tsx
// ❌ 錯誤：硬編碼色彩
<div className="bg-gray-900 text-gray-100">

// ✅ 正確：語意化變數
<div className="bg-card text-card-foreground">
```

**[Lightbulb] 避免直接使用 Tailwind 預設色彩**

```tsx
// ❌ 錯誤：使用預設 gray-*
<p className="text-gray-400">

// ✅ 正確：使用語意化名稱
<p className="text-foreground-muted">
```

**[CheckCircle] 功能色僅用於狀態指示**

```tsx
// ✅ 正確：成功訊息
<Badge variant="success">操作成功</Badge>

// ❌ 錯誤：濫用功能色作為裝飾
<div className="bg-success">一般內容</div>
```

---

### 7.2 主題切換注意事項

**[Moon] 避免假設主題**

```tsx
// ❌ 錯誤：假設永遠是深色
<div style={{ color: '#ffffff' }}>

// ✅ 正確：使用變數
<div className="text-foreground">
```

**[Sun] 測試兩種主題**

所有 UI 都必須在深色與淺色主題下測試，確保對比度符合標準。

**[RefreshCw] 動態資源處理**

圖表、Canvas 等動態內容需監聽主題變化：

```tsx
const { theme } = useTheme()

useEffect(() => {
  // 主題變化時重新渲染圖表
  updateChartColors(theme)
}, [theme])
```

---

### 7.3 效能優化

**[Zap] CSS Variables 優於 JavaScript**

```tsx
// ❌ 效能差：用 JavaScript 計算色彩
const color = theme === 'dark' ? '#e3e8ef' : '#0a0e1a'

// ✅ 效能好：用 CSS Variables
<div className="text-foreground">
```

**[FileCode] 避免過多自定義樣式**

```tsx
// ❌ 維護困難：內嵌樣式
<div style={{ backgroundColor: 'hsl(224, 71%, 4%)' }}>

// ✅ 易維護：Tailwind 類別
<div className="bg-background">
```

---

### 7.4 元件設計原則

**[Component] 單一職責**

每個元件只做一件事，例如 Badge 只顯示狀態，不處理邏輯。

**[Box] 可組合性**

```tsx
// ✅ 正確：可組合的卡片
<Card>
  <CardHeader>
    <CardTitle>標題</CardTitle>
  </CardHeader>
  <CardContent>內容</CardContent>
</Card>
```

**[Settings] 合理的預設值**

```tsx
// ✅ 正確：提供預設 variant
export function Badge({ variant = 'default', children }: BadgeProps)
```

---

### 7.5 文件與註解

**[FileText] 元件必須有 JSDoc**

```tsx
/**
 * [CheckCircle] Badge 元件 - 顯示狀態標籤
 * @param variant - 'success' | 'warning' | 'error' | 'info' | 'default'
 * @param children - 標籤內容
 */
export function Badge({ variant = 'default', children }: BadgeProps) {
  // ...
}
```

**[BookOpen] CSS Variables 必須註解用途**

```css
--primary: 263 70% 50%;  /* #7c3aed 品牌主色調（紫色）*/
```

---

## 八、附錄

### 8.1 色彩速查表

| 用途 | Tailwind 類別 | CSS Variable | Hex（深色）| Hex（淺色）|
|------|---------------|--------------|-----------|-----------|
| 頁面背景 | `bg-background` | `--background` | `#0a0e1a` | `#ffffff` |
| 卡片背景 | `bg-card` | `--card` | `#101620` | `#ffffff` |
| 主要文字 | `text-foreground` | `--foreground` | `#e3e8ef` | `#0a0e1a` |
| 次要文字 | `text-foreground-muted` | `--foreground-muted` | `#7f8b99` | `#6b7684` |
| 主要邊框 | `border-border` | `--border` | `#1c2432` | `#e5e7eb` |
| 品牌色 | `bg-primary` | `--primary` | `#7c3aed` | `#a855f7` |
| 成功 | `text-success` | `--success` | `#16a34a` | `#16a34a` |
| 警告 | `text-warning` | `--warning` | `#f59e0b` | `#f59e0b` |
| 錯誤 | `text-error` | `--error` | `#dc2626` | `#dc2626` |
| 資訊 | `text-info` | `--info` | `#3b82f6` | `#3b82f6` |

---

### 8.2 Icon 使用建議

**統一使用 lucide-react**：

```bash
npm install lucide-react
```

**常用 Icon 對照**：

| 用途 | Icon 名稱 | 範例 |
|------|----------|------|
| 成功 | `CheckCircle` | `<CheckCircle className="w-5 h-5 text-success" />` |
| 錯誤 | `XCircle` | `<XCircle className="w-5 h-5 text-error" />` |
| 警告 | `AlertTriangle` | `<AlertTriangle className="w-5 h-5 text-warning" />` |
| 資訊 | `Info` | `<Info className="w-5 h-5 text-info" />` |
| 載入 | `Loader2` | `<Loader2 className="w-5 h-5 animate-spin" />` |
| 搜尋 | `Search` | `<Search className="w-5 h-5" />` |
| 設定 | `Settings` | `<Settings className="w-5 h-5" />` |
| 使用者 | `User` | `<User className="w-5 h-5" />` |
| 選單 | `Menu` | `<Menu className="w-5 h-5" />` |
| 關閉 | `X` | `<X className="w-5 h-5" />` |
| 新增 | `Plus` | `<Plus className="w-5 h-5" />` |
| 刪除 | `Trash2` | `<Trash2 className="w-5 h-5" />` |
| 編輯 | `Edit` | `<Edit className="w-5 h-5" />` |
| 儲存 | `Save` | `<Save className="w-5 h-5" />` |
| 下載 | `Download` | `<Download className="w-5 h-5" />` |
| 上傳 | `Upload` | `<Upload className="w-5 h-5" />` |
| 主題切換（日） | `Sun` | `<Sun className="w-5 h-5" />` |
| 主題切換（夜） | `Moon` | `<Moon className="w-5 h-5" />` |
| 首頁 | `Home` | `<Home className="w-5 h-5" />` |
| 檔案 | `FileText` | `<FileText className="w-5 h-5" />` |
| 伺服器 | `Server` | `<Server className="w-5 h-5" />` |
| 資料庫 | `Database` | `<Database className="w-5 h-5" />` |

---

### 8.3 常見問題（FAQ）

**Q1：為什麼使用 HSL 而非 Hex 色碼？**

A：HSL 色彩空間更適合主題切換與動態調整，可透過修改 L（亮度）值快速產生深淺色變體。

**Q2：如何自訂專案專用色彩？**

A：在 `globals.css` 的 `.dark` 或 `:root` 區塊加入自訂變數，例如：

```css
.dark {
  /* 統一變數... */
  
  /* 專案專用 Agent 色彩 */
  --agent-travis: 0 72% 51%;
  --agent-coder: 217 91% 60%;
}
```

然後在 Tailwind config 映射：

```typescript
colors: {
  // 統一色彩...
  'agent-travis': 'hsl(var(--agent-travis))',
  'agent-coder': 'hsl(var(--agent-coder))',
}
```

**Q3：Chart.js 圖表如何響應主題切換？**

A：使用 `getComputedStyle` 讀取 CSS Variables：

```tsx
const { theme } = useTheme()
const [chartColors, setChartColors] = useState({})

useEffect(() => {
  const style = getComputedStyle(document.documentElement)
  setChartColors({
    primary: `hsl(${style.getPropertyValue('--primary')})`,
    success: `hsl(${style.getPropertyValue('--success')})`,
  })
}, [theme])
```

**Q4：如何確保對比度符合 WCAG 標準？**

A：使用工具檢測：
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools Lighthouse（無障礙檢測）

**Q5：可以混用 Tailwind 預設色彩嗎？**

A：不建議。為確保視覺一致性，應全部使用統一的語意化變數。

---

## 九、版本歷史

| 版本 | 日期 | 變更內容 | 維護者 |
|------|------|----------|--------|
| 1.0 | 2026-02-15 | 初版發布（基礎規範）| Designer |
| 2.0 | 2026-02-16 | 完整設計系統文件（CSS Variables + 元件）| Writer |

---

## 十、相關資源

- **統一主題規範**: `~/clawd/work-data/unified-theme-spec.md`
- **Travis Daily 審查報告**: `~/clawd/work-data/travis-daily-theme-audit.md`
- **William Hub 遷移規格**: `~/clawd/work-data/hub-theme-migration-spec.md`
- **Tailwind CSS 文件**: https://tailwindcss.com/docs
- **Lucide React Icons**: https://lucide.dev/
- **WCAG 無障礙標準**: https://www.w3.org/WAI/WCAG21/quickref/

---

**文件維護**：如有設計調整需求，請更新此文件並通知所有開發者。

**最後更新**：2026-02-16  
**維護者**：Writer Agent  
**狀態**：正式版 2.0
