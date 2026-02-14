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

const statusColors: Record<string, { bg: string; text: string }> = {
  '待執行': { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  '執行中': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  '✅完成': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  '⏸️等待': { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  '中期目標': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  '待需求觸發': { bg: 'bg-gray-600/20', text: 'text-gray-500' },
}

function TaskCard({ task }: { task: Task }) {
  const statusStyle = statusColors[task.status] || statusColors['待執行']
  
  return (
    <div className="group rounded-lg border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm p-4 hover:border-gray-700/80 transition-all">
      {/* Priority + Status */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{task.priority}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
          {task.status}
        </span>
      </div>
      
      {/* Title */}
      <h3 className="text-sm font-medium text-gray-200 mb-2 leading-snug">
        {task.title}
      </h3>
      
      {/* Assignee */}
      <div className="text-xs text-gray-500">
        👤 {task.assignee}
      </div>
    </div>
  )
}

function BoardColumn({ title, icon, tasks }: { title: string; icon: string; tasks: Task[] }) {
  return (
    <div className="flex-1 min-w-0">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800/60">
        <span className="text-lg">{icon}</span>
        <h2 className="text-base font-semibold text-gray-200">{title}</h2>
        <span className="ml-auto text-xs text-gray-600">{tasks.length}</span>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white hover:scale-105 transition-transform"
              >
                W
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Task Board</h1>
                <p className="text-gray-500 text-sm">任務看板</p>
              </div>
            </div>
            <Link 
              href="/" 
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
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
            <BoardColumn title="Agent 看板" icon="🤖" tasks={agentTasks} />
            <BoardColumn title="William 看板" icon="👤" tasks={williamTasks} />
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
