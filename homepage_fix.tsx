// 修復首頁任務統計問題的快速方案
'use client'

import { useState, useEffect } from 'react'

export default function TaskStatsSection() {
  const [tasks, setTasks] = useState<Array<any>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTasks = async () => {
      try {
        console.log('🔍 正在載入任務資料...')
        
        const [activeResponse, doneResponse] = await Promise.all([
          fetch('/api/board?category=active'),
          fetch('/api/board?category=done')
        ])
        
        const [activeData, doneData] = await Promise.all([
          activeResponse.json(),
          doneResponse.json()
        ])
        
        console.log(`✅ 活動任務: ${activeData.length} 個`)
        console.log(`✅ 已完成任務: ${doneData.length} 個`)
        
        const allTasks = []
        
        // 添加活動任務
        if (Array.isArray(activeData)) {
          allTasks.push(...activeData)
        }
        
        // 添加最近完成的任務
        if (Array.isArray(doneData)) {
          const threeDaysAgo = new Date()
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
          
          const recentlyCompleted = doneData.filter(task => 
            task.completed_at && new Date(task.completed_at) > threeDaysAgo
          )
          allTasks.push(...recentlyCompleted.slice(0, 3))
        }
        
        setTasks(allTasks.slice(0, 8))
        setIsLoading(false)
        
      } catch (error) {
        console.error('❌ 載入任務失敗:', error)
        setIsLoading(false)
      }
    }
    
    loadTasks()
  }, [])

  if (isLoading) {
    return (
      <section className="mb-8 rounded-xl border border-border bg-card backdrop-blur-sm">
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">Tasks</h2>
            <span className="text-xs text-foreground-subtle">載入中...</span>
          </div>
          <div className="space-y-2.5">
            <div className="animate-pulse bg-foreground/10 h-8 rounded"></div>
            <div className="animate-pulse bg-foreground/10 h-8 rounded"></div>
          </div>
        </div>
      </section>
    )
  }

  const doneTasks = tasks.filter(t => t.status === '已完成')
  
  return (
    <section className="mb-8 rounded-xl border border-border bg-card backdrop-blur-sm">
      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">Tasks</h2>
          <span className="text-xs text-foreground-subtle">
            {doneTasks.length}/{tasks.length} done
          </span>
        </div>
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 text-sm">
              <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                task.status === '已完成' ? 'bg-emerald-400' : 'bg-blue-400'
              }`} />
              <div className="flex-1 min-w-0">
                <span className={task.status === '已完成' ? 'line-through text-foreground-muted' : 'text-foreground'}>
                  <span className="text-foreground-subtle font-mono text-xs mr-1.5">#{task.id}</span>
                  {task.title}
                </span>
                <div className="text-xs text-foreground-subtle mt-0.5">
                  {task.assignee}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}