'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

type DashboardData = {
  statusCounts: Record<string, number>
  totalTasks: number
  weekCompleted: number
  agents: Array<{
    name: string
    total: number
    completed: number
    todayCompleted: number
    successRate: number
  }>
  agentSource: string
}

// Lucide-style icons
function LayoutDashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const agentColors: Record<string, string> = {
  'Coder': '#3b82f6',
  'Designer': '#a855f7',
  'Inspector': '#f59e0b',
  'Researcher': '#10b981',
  'Secretary': '#ec4899',
  'Writer': '#06b6d4',
  'Analyst': '#6366f1',
  'Travis': '#ef4444',
  'William': '#f97316',
}

function getAgentColor(name: string): string {
  return agentColors[name] || '#6b7280'
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const chartData = data ? {
    labels: ['待執行', '執行中', '已完成'],
    datasets: [{
      data: [
        data.statusCounts['待執行'] || 0,
        data.statusCounts['執行中'] || 0,
        data.statusCounts['已完成'] || 0,
      ],
      backgroundColor: ['#6b7280', '#f59e0b', '#10b981'],
      borderColor: ['#374151', '#92400e', '#065f46'],
      borderWidth: 2,
      hoverOffset: 6,
    }],
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 10,
      },
    },
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 py-10 sm:py-16">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
            <ArrowLeftIcon /> Back to Hub
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <LayoutDashboardIcon />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-gray-500 text-sm">任務統計 & Agent 狀態總覽</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-center text-gray-500 py-20">載入失敗</div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: '總任務數', value: data.totalTasks, color: '#3b82f6' },
                { label: '待執行', value: data.statusCounts['待執行'] || 0, color: '#6b7280' },
                { label: '執行中', value: data.statusCounts['執行中'] || 0, color: '#f59e0b' },
                { label: '本週完成', value: data.weekCompleted, color: '#10b981' },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm p-4 sm:p-5">
                  <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-2xl sm:text-3xl font-bold tabular-nums" style={{ color: item.color }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart + Agent grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              {/* Doughnut */}
              <div className="lg:col-span-2 rounded-xl border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm p-5 sm:p-6">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">任務分布</h2>
                <div className="h-[240px] flex items-center justify-center">
                  {chartData && <Doughnut data={chartData} options={chartOptions} />}
                </div>
              </div>

              {/* Agent cards */}
              <div className="lg:col-span-3 rounded-xl border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Agent 狀態</h2>
                  <span className="text-[10px] text-gray-600 px-2 py-0.5 rounded-full border border-gray-800">
                    {data.agentSource === 'agent_kpi' ? 'KPI 表' : 'Board 統計'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.agents.map(agent => {
                    const color = getAgentColor(agent.name)
                    return (
                      <div
                        key={agent.name}
                        className="rounded-lg border p-4 transition-all hover:translate-y-[-1px]"
                        style={{
                          borderColor: `${color}33`,
                          background: `${color}0a`,
                        }}
                      >
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                            <span style={{ color }}><UserIcon /></span>
                          </div>
                          <span className="font-medium text-gray-200 text-sm">{agent.name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-[10px] text-gray-600 mb-0.5">總任務</div>
                            <div className="text-sm font-semibold text-gray-300">{agent.total}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-600 mb-0.5">今日完成</div>
                            <div className="text-sm font-semibold" style={{ color }}>{agent.todayCompleted}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-600 mb-0.5">成功率</div>
                            <div className="text-sm font-semibold text-gray-300">{agent.successRate}%</div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${agent.successRate}%`, background: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        <footer className="mt-10 text-center text-gray-700 text-xs tracking-wide">
          William Hub — Dashboard
        </footer>
      </div>
    </main>
  )
}
