/**
 * 和椿科技統一設計系統 - Tailwind Preset
 * 版本: 2.0
 * 更新日期: 2026-02-16
 * 
 * 使用方式：
 * 1. 複製此檔案到專案根目錄
 * 2. 在 tailwind.config.ts 中 import 並使用：
 *    import preset from './tailwind-preset'
 *    export default {
 *      presets: [preset],
 *      content: ['./app/**\/*.{ts,tsx}'],
 *      ...
 *    }
 */

import type { Config } from 'tailwindcss'

const preset: Partial<Config> = {
  darkMode: 'class', // 啟用深淺色切換
  
  theme: {
    extend: {
      colors: {
        /* ===== 背景色系 ===== */
        background: 'hsl(var(--background))',
        'background-subtle': 'hsl(var(--background-subtle))',
        'background-elevated': 'hsl(var(--background-elevated))',
        
        /* ===== 文字色系 ===== */
        foreground: 'hsl(var(--foreground))',
        'foreground-muted': 'hsl(var(--foreground-muted))',
        'foreground-subtle': 'hsl(var(--foreground-subtle))',
        'foreground-disabled': 'hsl(var(--foreground-disabled))',
        
        /* ===== 邊框色系 ===== */
        border: 'hsl(var(--border))',
        'border-subtle': 'hsl(var(--border-subtle))',
        'border-strong': 'hsl(var(--border-strong))',
        
        /* ===== 卡片 ===== */
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        
        /* ===== 強調 ===== */
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        
        /* ===== 品牌色 ===== */
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          hover: 'hsl(var(--primary-hover))',
          active: 'hsl(var(--primary-active))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        
        /* ===== 功能色：成功 ===== */
        success: {
          DEFAULT: 'hsl(var(--success))',
          bg: 'hsl(var(--success-bg))',
          border: 'hsl(var(--success-border))',
        },
        
        /* ===== 功能色：警告 ===== */
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          bg: 'hsl(var(--warning-bg))',
          border: 'hsl(var(--warning-border))',
        },
        
        /* ===== 功能色：錯誤 ===== */
        error: {
          DEFAULT: 'hsl(var(--error))',
          bg: 'hsl(var(--error-bg))',
          border: 'hsl(var(--error-border))',
        },
        
        /* ===== 功能色：資訊 ===== */
        info: {
          DEFAULT: 'hsl(var(--info))',
          bg: 'hsl(var(--info-bg))',
          border: 'hsl(var(--info-border))',
        },
      },
      
      /* ===== 字體系統 ===== */
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans TC',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
          'monospace',
        ],
      },
    },
  },
}

export default preset
