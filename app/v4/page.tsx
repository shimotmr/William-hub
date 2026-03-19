'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Task {
  id: number
  title: string
  status: string
  assignee: string
  updated_at: string
}

export default function V4SystemPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/board/tasks?status=completed&limit=20')
      .then(res => res.json())
      .then(data => {
        setTasks(data.tasks || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">V4 系統中心</h1>
          <p className="text-foreground-muted">Travis V4 系統資訊總覽</p>
        </div>

        {/* V4 導航連結 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Link href="/v4" className="p-4 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition">
            <div className="font-medium">V4系統中心</div>
            <div className="text-xs text-blue-400">本頁</div>
          </Link>
          <Link href="/v4/architecture" className="p-4 rounded-lg bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition">
            <div className="font-medium">V4架構圖</div>
            <div className="text-xs text-purple-400">系統架構</div>
          </Link>
          <Link href="/v4/refactor" className="p-4 rounded-lg bg-yellow-500/20 border border-yellow-500/30 hover:bg-yellow-500/30 transition">
            <div className="font-medium">V4架構重整</div>
            <div className="text-xs text-yellow-400">重構計畫</div>
          </Link>
          <Link href="/v4/v41" className="p-4 rounded-lg bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 transition">
            <div className="font-medium">V4.1架構圖</div>
            <div className="text-xs text-green-400">v4.1 版本</div>
          </Link>
          <Link href="/v4/v42" className="p-4 rounded-lg bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/30 transition">
            <div className="font-medium">V4.2架構圖</div>
            <div className="text-xs text-orange-400">v4.2 Pipeline</div>
          </Link>
          <Link href="/v4/v43" className="p-4 rounded-lg bg-pink-500/20 border border-pink-500/30 hover:bg-pink-500/30 transition">
            <div className="font-medium">V4.3架構圖</div>
            <div className="text-xs text-pink-400">v4.3 升級</div>
          </Link>
        </div>

        {/* 最近完成任務 */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">最近完成任務</h2>
          {loading ? (
            <div className="animate-pulse">載入中...</div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 10).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-background-elevated rounded-lg">
                  <div>
                    <span className="font-mono text-sm text-foreground-muted">#{task.id}</span>
                    <span className="ml-2">{task.title}</span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                    {task.assignee}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
