'use client'

import { TrendingUp, CheckCircle2, FileText, Zap, BadgeCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface DailyCount {
  date: string
  count: number
}

interface ReportTrendData {
  date: string
  research?: number
  review?: number
  design?: number
  analysis?: number
  report?: number
}

interface Capability {
  id: number
  title: string
  description: string | null
  category: string
  added_at: string
}

interface GrowthData {
  trend: DailyCount[]
  summary: {
    total: number
    avgPerDay: number
    cumulative: number[]
  }
  reportTrend: ReportTrendData[]
  capabilities: Capability[]
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

  const totalReports = data.reportTrend.reduce(
    (sum, day) => sum + (day.research || 0) + (day.review || 0) + (day.design || 0) + (day.analysis || 0) + (day.report || 0),
    0
  )

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-foreground">Growth Dashboard</h1>
          </div>
          <p className="text-foreground-muted">系統與團隊成長趨勢分析</p>
        </div>

        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Task Completion Trend Card */}
          <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">任務完成量趨勢</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">總完成數</div>
                <div className="text-xl font-bold text-foreground">{data.summary.total}</div>
              </div>
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">平均每日</div>
                <div className="text-xl font-bold text-foreground">{data.summary.avgPerDay}</div>
              </div>
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">期間</div>
                <div className="text-xl font-bold text-foreground">30 天</div>
              </div>
            </div>

            <div className="h-64">
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

          {/* Report Trend Card */}
          <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold">報告產出量趨勢</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">總報告數</div>
                <div className="text-xl font-bold text-foreground">{totalReports}</div>
              </div>
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">平均每日</div>
                <div className="text-xl font-bold text-foreground">{(totalReports / 30).toFixed(1)}</div>
              </div>
              <div className="bg-background-elevated rounded-lg p-4">
                <div className="text-xs text-foreground-muted mb-1">期間</div>
                <div className="text-xl font-bold text-foreground">30 天</div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.reportTrend}>
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
                  />
                  <Area 
                    type="monotone" 
                    dataKey="research" 
                    stackId="1"
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="review" 
                    stackId="1"
                    stroke="#06b6d4" 
                    fill="#06b6d4" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="design" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="analysis" 
                    stackId="1"
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="report" 
                    stackId="1"
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-foreground-muted">研究</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-foreground-muted">審查</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-foreground-muted">設計</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-foreground-muted">分析</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-foreground-muted">報告</span>
              </div>
            </div>
          </div>

          {/* System Capabilities Timeline Card */}
          <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold">系統能力擴展記錄</h2>
            </div>

            {data.capabilities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-foreground-muted">
                <Zap className="w-12 h-12 mb-2 opacity-50" />
                <p>尚無能力擴展記錄</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto pr-2">
                <div className="space-y-4">
                  {data.capabilities.map((cap) => (
                    <div key={cap.id} className="flex gap-3 group">
                      <div className="flex-shrink-0 pt-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      </div>
                      <div className="flex-1 pb-4 border-b border-border/50 last:border-0">
                        <div className="flex items-start gap-2 mb-1">
                          <BadgeCheck className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="font-medium text-foreground">{cap.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground-muted ml-6">
                          <span className="px-2 py-0.5 rounded-full bg-background-elevated">
                            {cap.category}
                          </span>
                          <span>
                            {new Date(cap.added_at).toLocaleDateString('zh-TW', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <a 
            href="/" 
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            返回首頁
          </a>
        </div>
      </div>
    </main>
  )
}
