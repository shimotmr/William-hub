'use client'

import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'

import { PercentageBadge } from '@/components/trading/PercentageBadge'
import { StockPrice } from '@/components/trading/StockPrice'

interface Position {
  symbol: string
  name: string
  quantity: number
  avgCost: number
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  dayChange: number
  dayChangePct: number
}

/**
 * 持倉管理頁面
 */
export default function PositionsPage() {
  // Mock 持倉資料
  const positions: Position[] = [
    {
      symbol: '2330',
      name: '台積電',
      quantity: 2000,
      avgCost: 580.50,
      currentPrice: 598.00,
      marketValue: 1196000,
      unrealizedPnl: 35000,
      unrealizedPnlPct: 3.01,
      dayChange: 12.00,
      dayChangePct: 2.04
    },
    {
      symbol: '2317',
      name: '鴻海',
      quantity: 3000,
      avgCost: 112.30,
      currentPrice: 108.50,
      marketValue: 325500,
      unrealizedPnl: -11400,
      unrealizedPnlPct: -3.38,
      dayChange: -1.50,
      dayChangePct: -1.36
    },
    {
      symbol: '2454',
      name: '聯發科',
      quantity: 500,
      avgCost: 980.00,
      currentPrice: 1025.00,
      marketValue: 512500,
      unrealizedPnl: 22500,
      unrealizedPnlPct: 4.59,
      dayChange: 25.00,
      dayChangePct: 2.50
    },
    {
      symbol: '2412',
      name: '中華電',
      quantity: 5000,
      avgCost: 125.00,
      currentPrice: 123.50,
      marketValue: 617500,
      unrealizedPnl: -7500,
      unrealizedPnlPct: -1.20,
      dayChange: 0.50,
      dayChangePct: 0.41
    },
    {
      symbol: '2881',
      name: '富邦金',
      quantity: 4000,
      avgCost: 82.15,
      currentPrice: 78.30,
      marketValue: 313200,
      unrealizedPnl: -15400,
      unrealizedPnlPct: -4.69,
      dayChange: -2.10,
      dayChangePct: -2.61
    }
  ]

  // 計算總計
  const totalMarketValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0)
  const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0)
  const totalCost = positions.reduce((sum, pos) => sum + (pos.avgCost * pos.quantity), 0)
  const totalUnrealizedPnlPct = (totalUnrealizedPnl / totalCost) * 100

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">持倉管理</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-colors">
            <BarChart3 size={16} />
            分析
          </button>
        </div>
      </div>

      {/* 總計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-blue-400" size={20} />
            <h3 className="text-sm font-medium text-slate-400">總市值</h3>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {totalMarketValue.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            {totalUnrealizedPnl >= 0 ? (
              <TrendingUp className="text-red-400" size={20} />
            ) : (
              <TrendingDown className="text-green-400" size={20} />
            )}
            <h3 className="text-sm font-medium text-slate-400">未實現損益</h3>
          </div>
          <div className="space-y-1">
            <StockPrice 
              price={Math.abs(totalUnrealizedPnl)} 
              change={totalUnrealizedPnl}
              showChange={false}
              size="lg"
            />
            <PercentageBadge value={totalUnrealizedPnlPct} size="sm" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="text-purple-400" size={20} />
            <h3 className="text-sm font-medium text-slate-400">持股檔數</h3>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {positions.length} 檔
          </div>
        </div>
      </div>

      {/* 持倉清單 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">股票</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">持股數量</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">平均成本</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">現價</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">市值</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">未實現損益</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">今日損益</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.symbol} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-bold text-slate-100">{position.symbol}</div>
                      <div className="text-sm text-slate-400">{position.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-slate-300">
                      {position.quantity.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-slate-400">
                      {position.avgCost.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <StockPrice 
                      price={position.currentPrice}
                      change={position.dayChange}
                      showChange={false}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono font-bold text-slate-100">
                      {position.marketValue.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="space-y-1">
                      <StockPrice 
                        price={Math.abs(position.unrealizedPnl)}
                        change={position.unrealizedPnl}
                        showChange={false}
                        size="sm"
                      />
                      <PercentageBadge value={position.unrealizedPnlPct} size="sm" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="space-y-1">
                      <StockPrice 
                        price={Math.abs(position.dayChange * position.quantity)}
                        change={position.dayChange * position.quantity}
                        showChange={false}
                        size="sm"
                      />
                      <PercentageBadge value={position.dayChangePct} size="sm" />
                    </div>
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

      {positions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">目前沒有持倉</p>
        </div>
      )}
    </div>
  )
}