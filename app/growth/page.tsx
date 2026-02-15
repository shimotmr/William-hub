'use client'

import { TrendingUp, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface DailyCount {
  date: string
  count: number
}

interface GrowthData {
  trend: DailyCount[]
  summary: {
    total: number
    avgPerDay: number
    cumulative: number[]
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function GrowthPage() {
  const [data, setData] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/growth')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching growth data:', err)
        setError('載入失敗')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-2" />
            <div className="h-4 bg-muted rounded w-64 mb-8" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center h-96 text-foreground-muted">
            <TrendingUp className="w-12 h-12 mb-2" />
            <p>{error || '無法載入資料'}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-foreground">Growth Dashboard</h1>
          </div>
          <p className="text-foreground-muted">系統與團隊成長趨勢分析</p>
        </div>

        {/* Task Completion Trend Card */}
        <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6 mb-6">
          {/* Card Header */}
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold">任務完成量趨勢</h2>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-background-elevated rounded-lg p-4">
              <div className="text-sm text-foreground-muted mb-1">總完成數</div>
              <div className="text-2xl font-bold text-foreground">{data.summary.total}</div>
            </div>
            <div className="bg-background-elevated rounded-lg p-4">
              <div className="text-sm text-foreground-muted mb-1">平均每日</div>
              <div className="text-2xl font-bold text-foreground">{data.summary.avgPerDay}</div>
            </div>
            <div className="bg-background-elevated rounded-lg p-4">
              <div className="text-sm text-foreground-muted mb-1">期間</div>
              <div className="text-2xl font-bold text-foreground">30 天</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                  labelFormatter={(label) => `日期: ${label}`}
                  formatter={(value: number | undefined) => value !== undefined ? [`${value} 個`, '完成數'] : ['', '']}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <a 
            href="/" 
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← 返回首頁
          </a>
        </div>
      </div>
    </main>
  )
}
