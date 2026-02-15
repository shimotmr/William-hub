'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

type Task = {
  id: number
  board: 'agent' | 'william'
  priority: string
  title: string
  description: string | null
  result: string | null
  assignee: string
  status: string
  created_at: string
  updated_at: string
  completed_at: string | null
  acceptance_criteria: string | null
}

// SVG Icon Components
function IconRobot({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="12" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <circle cx="15" cy="10" r="1.5" />
      <line x1="9" y1="16" x2="9" y2="20" />
      <line x1="15" y1="16" x2="15" y2="20" />
      <line x1="6" y1="20" x2="18" y2="20" />
      <line x1="12" y1="4" x2="12" y2="1" />
      <circle cx="12" cy="1" r="0.5" fill={color} />
    </svg>
  )
}

function IconUser({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconHistory({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconCheck({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconFlag({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function IconCircle({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function IconSquare({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )
}

const priorityMap: Record<string, { icon: (c: string) => React.ReactNode; color: string; label: string }> = {
  '🔴': { icon: (c) => <IconFlag color={c} />, color: '#ef4444', label: '緊急' },
  '🟡': { icon: (c) => <IconCircle color={c} />, color: '#f59e0b', label: '短期' },
  '🔵': { icon: (c) => <IconCircle color={c} />, color: '#3b82f6', label: '中期' },
  '⚪': { icon: (c) => <IconSquare color={c} />, color: '#6b7280', label: '長期' },
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  '待執行': { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af', dot: '#6b7280' },
  '執行中': { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', dot: '#3b82f6' },
  '已完成': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', dot: '#10b981' },
  '完成': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', dot: '#10b981' },
  '✅完成': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', dot: '#10b981' },
  '等待': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', dot: '#f59e0b' },
  '⏸️等待': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', dot: '#f59e0b' },
  '中期目標': { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', dot: '#a855f7' },
  '待需求觸發': { bg: 'rgba(75, 85, 99, 0.15)', text: '#9ca3af', dot: '#6b7280' },
  '待規劃': { bg: 'rgba(75, 85, 99, 0.15)', text: '#9ca3af', dot: '#6b7280' },
  '長期目標': { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', dot: '#a855f7' },
}

function formatDate(d: string) {
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function TaskCard({ task, isHistory }: { task: Task; isHistory?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const statusStyle = statusColors[task.status] || statusColors['待執行']
  const p = priorityMap[task.priority] || priorityMap['⚪']
  const hasDesc = !!task.description?.trim()
  const hasResult = !!task.result?.trim()
  const hasCriteria = !!task.acceptance_criteria?.trim()
  const expandable = hasDesc || hasResult || hasCriteria
  const isStale = task.status === '待執行' && (Date.now() - new Date(task.created_at).getTime()) > 7 * 86400000

  return (
    <div
      className={`group rounded-xl border p-4 transition-all duration-200 ${isHistory ? 'opacity-70' : ''} ${expandable ? 'cursor-pointer' : ''}`}
      style={{
        borderColor: isStale ? 'rgba(239, 68, 68, 0.45)' : expanded ? 'rgba(55, 65, 81, 0.7)' : 'rgba(31, 41, 55, 0.5)',
        background: isStale ? 'rgba(239, 68, 68, 0.06)' : expanded ? 'rgba(17, 24, 39, 0.5)' : 'rgba(17, 24, 39, 0.3)',
      }}
      onClick={() => expandable && setExpanded(!expanded)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(55, 65, 81, 0.6)'
        e.currentTarget.style.backgroundColor = 'rgba(17, 24, 39, 0.4)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        if (!expanded) {
          e.currentTarget.style.borderColor = 'rgba(31, 41, 55, 0.5)'
          e.currentTarget.style.backgroundColor = 'rgba(17, 24, 39, 0.3)'
        }
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {p.icon(p.color)}
          <span className="text-[10px] font-medium" style={{ color: p.color }}>{p.label}</span>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{ background: statusStyle.bg, color: statusStyle.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
          <span>{task.status}</span>
        </div>
      </div>

      <div className="flex items-start gap-1.5 mb-2">
        {expandable && (
          <span className="mt-0.5 flex-shrink-0 text-gray-600">
            <IconChevron open={expanded} />
          </span>
        )}
        <h3
          className={`text-sm font-medium leading-snug ${isHistory ? 'line-through text-gray-500' : 'text-gray-200'}`}
          title={hasDesc ? task.description! : undefined}
        >
          <span className="text-gray-600 font-mono text-xs mr-1.5">#{task.id}</span>
          {task.title}
        </h3>
      </div>

      {/* Expandable description + result */}
      {expandable && expanded && (
        <div className="mb-3 ml-5 pl-3 border-l-2 border-gray-700/50 space-y-2">
          {hasDesc && (
            <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          )}
          {hasCriteria && (
            <div className="pt-1.5 border-t border-gray-700/30">
              <span className="text-[10px] font-medium text-cyan-500/70 uppercase tracking-wider">驗收標準</span>
              <ul className="mt-1.5 space-y-1">
                {task.acceptance_criteria!.split('\n').filter(l => l.trim()).map((line, i) => {
                  const text = line.replace(/^[-*•]\s*/, '').replace(/^\[[ x]?\]\s*/i, '')
                  const checked = /^\[x\]/i.test(line.trim())
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center ${checked ? 'border-emerald-500/50 bg-emerald-500/20' : 'border-gray-600'}`}>
                        {checked && <IconCheck color="#34d399" />}
                      </span>
                      <span className={checked ? 'line-through text-gray-500' : ''}>{text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {hasResult && (
            <div className="pt-1.5 border-t border-gray-700/30">
              <span className="text-[10px] font-medium text-emerald-500/70 uppercase tracking-wider">完成回報</span>
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap mt-1">
                {task.result}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{task.assignee}</span>
          {isStale && <AlertTriangle size={12} className="text-red-400 ml-1" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600">{formatDate(task.created_at)}</span>
          {isHistory && task.completed_at && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-500/70">
              <IconCheck color="#10b981" />
              <span>{formatDate(task.completed_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BoardColumn({
  title,
  icon,
  tasks,
  accentColor,
  isHistory,
}: {
  title: string
  icon: React.ReactNode
  tasks: Task[]
  accentColor: string
  isHistory?: boolean
}) {
  return (
    <div
      className="flex-1 min-w-0 rounded-xl border p-4 sm:p-5"
      style={{
        borderColor: `${accentColor}33`,
        background: `${accentColor}0D`,
      }}
    >
      <div
        className="flex items-center gap-2 mb-4 pb-3 border-b"
        style={{ borderColor: `${accentColor}33` }}
      >
        <div className="flex-shrink-0">{icon}</div>
        <h2 className="text-base font-semibold text-gray-200">{title}</h2>
        <span className="ml-auto text-xs text-gray-600 font-medium">{tasks.length}</span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-8">
            {isHistory ? '尚無已完成任務' : '無任務'}
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} isHistory={isHistory} />)
        )}
      </div>
    </div>
  )
}

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [historyTasks, setHistoryTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'history'>('active')

  useEffect(() => {
    Promise.all([
      fetch('/api/board').then((r) => r.json()),
      fetch('/api/board?history=true').then((r) => r.json()),
    ])
      .then(([active, history]) => {
        if (Array.isArray(active)) setTasks(active)
        if (Array.isArray(history)) setHistoryTasks(history)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const agentTasks = tasks.filter((t) => t.board === 'agent')
  const williamTasks = tasks.filter((t) => t.board === 'william')

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 py-12 sm:py-20">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white hover:scale-105 transition-transform"
              >
                W
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Task Board</h1>
                <p className="text-gray-500 text-xs sm:text-sm">任務看板</p>
              </div>
            </div>
            <Link href="/" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">
              ← Back to Hub
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-900/50 rounded-lg w-fit border border-gray-800/50">
            <button
              onClick={() => setTab('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                tab === 'active'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              進行中 ({tasks.length})
            </button>
            <button
              onClick={() => setTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                tab === 'history'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              歷史 ({historyTasks.length})
            </button>
          </div>
        </header>

        {/* Board */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : tab === 'active' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BoardColumn
              title="Agent 看板"
              icon={<IconRobot color="#3b82f6" />}
              tasks={agentTasks}
              accentColor="#3b82f6"
            />
            <BoardColumn
              title="William 看板"
              icon={<IconUser color="#f59e0b" />}
              tasks={williamTasks}
              accentColor="#f59e0b"
            />
          </div>
        ) : (
          <BoardColumn
            title="已完成任務"
            icon={<IconHistory color="#10b981" />}
            tasks={historyTasks}
            accentColor="#10b981"
            isHistory
          />
        )}

        {/* Footer */}
        <footer className="mt-14 text-center text-gray-700 text-xs tracking-wide">
          William Hub v2 — Board
        </footer>
      </div>
    </main>
  )
}
