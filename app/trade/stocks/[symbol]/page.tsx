'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

import { StockInfoTabs } from '@/components/trading/StockInfoTabs'

// 常用股票名稱
const STOCK_NAMES: Record<string, string> = {
  '2330': '台積電', '2317': '鴻海', '2454': '聯發科', '2881': '富邦金',
  '2412': '中華電', '2303': '聯電', '2002': '中鋼', '6505': '台塑化',
  '2886': '兆豐金', '2603': '長榮', '2882': '國泰金', '2891': '中信金',
  '2357': '華碩', '3034': '聯詠', '2308': '台達電', '2382': '廣達',
  '6215': '和椿',
}

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params)
  const name = STOCK_NAMES[symbol] || ''

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/trade/quotes"
            className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={18} className="text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">
              {symbol} {name && <span className="text-zinc-400">{name}</span>}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <StockInfoTabs symbol={symbol} />
      </div>
    </div>
  )
}
