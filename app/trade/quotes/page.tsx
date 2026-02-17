'use client'

import { Search, Filter, Star } from 'lucide-react'
import { useState } from 'react'

import { PercentageBadge } from '@/components/trading/PercentageBadge'
import { StockPrice } from '@/components/trading/StockPrice'

/**
 * 即時報價頁面
 */
export default function QuotesPage() {
  const [searchTerm, setSearchTerm] = useState('')

  // Mock 股票報價資料
  const stocks = [
    { symbol: '2330', name: '台積電', price: 598.00, change: 12.00, changePercent: 2.04, volume: 45230000 },
    { symbol: '2317', name: '鴻海', price: 108.50, change: -1.50, changePercent: -1.36, volume: 23450000 },
    { symbol: '2454', name: '聯發科', price: 1025.00, change: 25.00, changePercent: 2.50, volume: 8900000 },
    { symbol: '6505', name: '台塑化', price: 89.20, change: -0.80, changePercent: -0.89, volume: 12300000 },
    { symbol: '2412', name: '中華電', price: 123.50, change: 0.50, changePercent: 0.41, volume: 5600000 },
    { symbol: '2881', name: '富邦金', price: 78.30, change: -2.10, changePercent: -2.61, volume: 18700000 },
    { symbol: '2303', name: '聯電', price: 48.45, change: 1.25, changePercent: 2.65, volume: 34500000 },
    { symbol: '2002', name: '中鋼', price: 28.90, change: -0.30, changePercent: -1.03, volume: 45600000 },
  ]

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.includes(searchTerm) || 
    stock.name.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">即時報價</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-colors">
            <Filter size={16} />
            篩選
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors">
            <Star size={16} />
            自選股
          </button>
        </div>
      </div>

      {/* 搜尋欄 */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="搜尋股票代碼或名稱..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 股票清單表格 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">股票</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">現價</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">漲跌</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">漲跌幅</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">成交量</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => (
                <tr key={stock.symbol} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-bold text-slate-100">{stock.symbol}</div>
                      <div className="text-sm text-slate-400">{stock.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <StockPrice 
                      price={stock.price}
                      change={stock.change}
                      showChange={false}
                      size="md"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <StockPrice 
                      price={Math.abs(stock.change)}
                      change={stock.change}
                      showChange={false}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <PercentageBadge value={stock.changePercent} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-slate-300">
                      {(stock.volume / 1000000).toFixed(1)}M
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors">
                        買
                      </button>
                      <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors">
                        賣
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStocks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">找不到符合條件的股票</p>
        </div>
      )}
    </div>
  )
}