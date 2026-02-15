'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

type AgentData = {
  name: string
  role: string
  total: number
  completed: number
  todayCompleted: number
  successRate: number
  currentTask: string | null
  isActive: boolean
}

type RecentTask = {
  id: number
  title: string
  completedAt: string
  assignee: string
}

type DashboardData = {
  statusCounts: Record<string, number>
  totalTasks: number
  weekCompleted: number
  completionRate: number
  agents: AgentData[]
  recentCompleted: RecentTask[]
}

const agentColors: Record<string, string> = {
  'Travis': '#ef4444',
  'Coder': '#3b82f6',
  'Designer': '#a855f7',
  'Inspector': '#f59e0b',
  'Researcher': '#10b981',
  'Writer': '#06b6d4',
  'Analyst': '#6366f1',
  'Secretary': '#ec4899',
}

const agentEmoji: Record<string, string> = {
  'Travis': '🎯',
  'Coder': '💻',
  'Designer': '🎨',
  'Inspector': '🔍',
  'Researcher': '📚',
  'Writer': '✍️',
  'Analyst': '📊',
  'Secretary': '📋',
}

function getAgentColor(name: string): string {
  return agentColors[name] || '#6b7280'
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return '剛剛'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`
  return `${Math.floor(diff / 86400)} 天前`
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

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/dashboard')
        .then(r => r.json())
        .then(d => { if (!d.error) setData(d) })
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const chartData = data ? {
    labels: ['待執行', '執行中', '已完成'],
    datasets: [{
      data: [
        data.statusCounts['待執行'] || 0,
        data.statusCounts['執行中'] || 0,
        data.statusCounts['已完成'] || 0,
      ],
      backgroundColor: ['#facc15', '#60a5fa', '#4ade80'],
      borderColor: ['#1e293b', '#1e293b', '#1e293b'],
      borderWidth: 3,
      hoverOffset: 8,
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
          color: '#e5e7eb',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 13 },
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
      },
    },
  }

  return (
    <main className="min-h-screen bg-[#0f172a] relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-500/[0.07] rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-purple-500/[0.05] rounded-full blur-[100px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Back to Hub
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Clawd Dashboard</h1>
                <p className="text-gray-500 text-sm">系統即時監控中心 · 自動更新</p>
              </div>
            </div>
            <div className="hidden sm:block text-right text-xs text-gray-600">
              每 30 秒自動重整
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-center text-gray-500 py-20">載入失敗</div>
        ) : (
          <>
            {/* KPI Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: '總任務數', value: data.totalTasks, color: '#60a5fa', icon: '📋' },
                { label: '執行中', value: data.statusCounts['執行中'] || 0, color: '#facc15', icon: '⚡' },
                { label: '本週完成', value: data.weekCompleted, color: '#4ade80', icon: '✅' },
                { label: '完成率', value: `${data.completionRate}%`, color: '#c084fc', icon: '📈' },
              ].map(item => (
                <div key={item.label} className="group rounded-xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-5 hover:border-slate-600/80 hover:bg-slate-800/60 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{item.label}</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight" style={{ color: item.color }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Agent Cards */}
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>👥</span> Agent 狀態總覽
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.agents.map(agent => {
                  const color = getAgentColor(agent.name)
                  const emoji = agentEmoji[agent.name] || '🤖'
                  return (
                    <div
                      key={agent.name}
                      className="group rounded-xl border p-5 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
                      style={{
                        borderColor: `${color}30`,
                        background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: `${color}18` }}>
                            {emoji}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-200 text-sm">{agent.name}</div>
                            <div className="text-[10px] text-gray-600">{agent.role}</div>
                          </div>
                        </div>
                        {/* Status light */}
                        <div className="relative">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: agent.isActive ? '#4ade80' : '#4b5563' }}
                          />
                          {agent.isActive && (
                            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping opacity-40" />
                          )}
                        </div>
                      </div>

                      {/* Current task */}
                      {agent.currentTask && (
                        <div className="mb-3 px-2.5 py-1.5 rounded-md bg-slate-800/60 border border-slate-700/40">
                          <div className="text-[10px] text-gray-500 mb-0.5">執行中</div>
                          <div className="text-xs text-gray-300 truncate">{agent.currentTask}</div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] text-gray-600 mb-0.5">今日完成</div>
                          <div className="text-xl font-bold" style={{ color }}>{agent.todayCompleted}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-600 mb-0.5">總完成</div>
                          <div className="text-xl font-bold text-gray-300">{agent.completed}</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${agent.successRate}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1 text-right">{agent.successRate}% 完成率</div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Chart + Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              {/* Doughnut Chart */}
              <div className="lg:col-span-2 rounded-xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>📊</span> 任務分布
                </h2>
                <div className="h-[260px] flex items-center justify-center">
                  {chartData && <Doughnut data={chartData} options={chartOptions} />}
                </div>
                {/* Inline stats */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/40">
                  {[
                    { label: '待執行', value: data.statusCounts['待執行'] || 0, color: '#facc15' },
                    { label: '執行中', value: data.statusCounts['執行中'] || 0, color: '#60a5fa' },
                    { label: '已完成', value: data.statusCounts['已完成'] || 0, color: '#4ade80' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="lg:col-span-3 rounded-xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>⏱️</span> 最近完成任務
                </h2>
                <div className="space-y-1">
                  {data.recentCompleted.length === 0 ? (
                    <div className="text-gray-600 text-sm py-8 text-center">暫無已完成任務</div>
                  ) : (
                    data.recentCompleted.map((task, i) => {
                      const color = getAgentColor(task.assignee)
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/30 transition-colors group"
                        >
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center self-stretch">
                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                            {i < data.recentCompleted.length - 1 && (
                              <div className="w-px flex-1 bg-slate-700/60 mt-1" />
                            )}
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                              #{task.id} {task.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color, background: `${color}15` }}>
                                {task.assignee}
                              </span>
                              <span className="text-[10px] text-gray-600">{timeAgo(task.completedAt)}</span>
                            </div>
                          </div>
                          {/* Check */}
                          <div className="text-green-500/60 text-xs flex-shrink-0">✓</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <footer className="mt-8 text-center text-gray-700 text-xs tracking-wide">
          William Hub — Clawd Dashboard · © 2026
        </footer>
      </div>
    </main>
  )
}
