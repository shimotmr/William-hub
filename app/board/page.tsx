'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Task = {
  id: number
  board: 'agent' | 'william'
  priority: string
  title: string
  assignee: string
  status: string
  created_at: string
  updated_at: string
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

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  '待執行': { 
    bg: 'rgba(107, 114, 128, 0.15)', 
    text: '#9ca3af', 
    dot: '#6b7280' 
  },
  '執行中': { 
    bg: 'rgba(59, 130, 246, 0.15)', 
    text: '#60a5fa', 
    dot: '#3b82f6' 
  },
  '完成': { 
    bg: 'rgba(16, 185, 129, 0.15)', 
    text: '#34d399', 
    dot: '#10b981' 
  },
  '✅完成': { 
    bg: 'rgba(16, 185, 129, 0.15)', 
    text: '#34d399', 
    dot: '#10b981' 
  },
  '等待': { 
    bg: 'rgba(245, 158, 11, 0.15)', 
    text: '#fbbf24', 
    dot: '#f59e0b' 
  },
  '⏸️等待': { 
    bg: 'rgba(245, 158, 11, 0.15)', 
    text: '#fbbf24', 
    dot: '#f59e0b' 
  },
  '中期目標': { 
    bg: 'rgba(168, 85, 247, 0.15)', 
    text: '#c084fc', 
    dot: '#a855f7' 
  },
  '待需求觸發': { 
    bg: 'rgba(75, 85, 99, 0.15)', 
    text: '#9ca3af', 
    dot: '#6b7280' 
  },
}

function TaskCard({ task }: { task: Task }) {
  const statusStyle = statusColors[task.status] || statusColors['待執行']
  
  // 優先級 icon 對應
  const getPriorityIcon = () => {
    const priority = task.priority.toLowerCase()
    if (priority.includes('high') || task.priority === '🔥') {
      return <IconFlag color="#ef4444" />
    } else if (priority.includes('medium') || task.priority === '⚡') {
      return <IconCircle color="#f59e0b" />
    } else {
      return <IconSquare color="#6b7280" />
    }
  }
  
  return (
    <div 
      className="group rounded-xl border bg-gray-900/30 backdrop-blur-sm p-4 transition-all duration-200"
      style={{
        borderColor: 'rgba(31, 41, 55, 0.5)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(55, 65, 81, 0.6)'
        e.currentTarget.style.backgroundColor = 'rgba(17, 24, 39, 0.4)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(31, 41, 55, 0.5)'
        e.currentTarget.style.backgroundColor = 'rgba(17, 24, 39, 0.3)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Priority + Status */}
      <div className="flex items-center justify-between mb-2">
        {/* Priority Icon */}
        <div className="flex items-center gap-1">
          {getPriorityIcon()}
        </div>
        
        {/* Status Badge */}
        <div 
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{ 
            background: statusStyle.bg, 
            color: statusStyle.text 
          }}
        >
          <span 
            className="w-1.5 h-1.5 rounded-full" 
            style={{ background: statusStyle.dot }}
          />
          <span>{task.status}</span>
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-sm font-medium text-gray-200 mb-2 leading-snug line-clamp-2 sm:line-clamp-1">
        {task.title}
      </h3>
      
      {/* Assignee */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>{task.assignee}</span>
      </div>
    </div>
  )
}

function BoardColumn({ 
  title, 
  icon, 
  tasks, 
  accentColor 
}: { 
  title: string
  icon: React.ReactNode
  tasks: Task[]
  accentColor: string
}) {
  return (
    <div 
      className="flex-1 min-w-0 rounded-xl border p-4 sm:p-5"
      style={{
        borderColor: `${accentColor}33`,
        background: `${accentColor}0D`,
      }}
    >
      {/* Column Header */}
      <div 
        className="flex items-center gap-2 mb-4 pb-3 border-b"
        style={{ borderColor: `${accentColor}33` }}
      >
        <div className="flex-shrink-0">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-gray-200">{title}</h2>
        <span className="ml-auto text-xs text-gray-600 font-medium">{tasks.length}</span>
      </div>
      
      {/* Tasks */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-8">
            無任務
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/board')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTasks(data)
        }
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
            <Link 
              href="/" 
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Back to Hub
            </Link>
          </div>
        </header>

        {/* Board */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">
            Loading...
          </div>
        ) : (
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
        )}

        {/* Footer */}
        <footer className="mt-14 text-center text-gray-700 text-xs tracking-wide">
          William Hub v2 — Board
        </footer>
      </div>
    </main>
  )
}
