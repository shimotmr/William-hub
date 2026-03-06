'use client'

import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Clock, AlertTriangle, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'

type Schedule = {
  id: string
  name: string
  schedule_expr: string | null
  schedule_tz: string | null
  agent_id: string | null
  enabled: boolean
  last_status: string | null
  last_run_at: string | null
  next_run_at: string | null
  updated_at: string | null
}

type ViewMode = 'month' | 'week' | 'day'

// Parse cron expression to human-readable
function parseCron(expr: string): string {
  if (!expr) return '未設定'
  const parts = expr.split(' ')
  if (parts.length < 5) return expr

  const [min, hour, dom, mon, dow] = parts
  const dowNames = ['日', '一', '二', '三', '四', '五', '六']
  
  let desc = ''
  if (dow !== '*') {
    const days = dow.split(',').map(d => {
      if (d.includes('-')) {
        const [s, e] = d.split('-').map(Number)
        return `週${dowNames[s]}~${dowNames[e]}`
      }
      return `週${dowNames[Number(d)] || d}`
    })
    desc += days.join(', ')
  } else if (dom !== '*') {
    desc += `每月 ${dom} 日`
  } else {
    desc += '每天'
  }

  if (hour !== '*') desc += ` ${hour}:${min.padStart(2, '0')}`
  return desc
}

// Get next N occurrences of a cron schedule
function getCronOccurrences(expr: string, start: Date, end: Date): Date[] {
  if (!expr) return []
  const parts = expr.split(' ')
  if (parts.length < 5) return []

  const [minExpr, hourExpr, domExpr, monExpr, dowExpr] = parts
  const results: Date[] = []

  const parseField = (field: string, max: number): number[] => {
    if (field === '*') return Array.from({ length: max + 1 }, (_, i) => i)
    const vals: number[] = []
    for (const part of field.split(',')) {
      if (part.includes('-')) {
        const [s, e] = part.split('-').map(Number)
        for (let i = s; i <= e; i++) vals.push(i)
      } else if (part.includes('/')) {
        const [base, step] = part.split('/')
        const start = base === '*' ? 0 : Number(base)
        for (let i = start; i <= max; i += Number(step)) vals.push(i)
      } else {
        vals.push(Number(part))
      }
    }
    return vals
  }

  const minutes = parseField(minExpr, 59)
  const hours = parseField(hourExpr, 23)
  const doms = domExpr === '*' ? null : parseField(domExpr, 31)
  const dows = dowExpr === '*' ? null : parseField(dowExpr, 6)

  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)

  while (cursor <= end && results.length < 500) {
    const dayOfWeek = cursor.getDay()
    const dayOfMonth = cursor.getDate()

    const matchDow = dows === null || dows.includes(dayOfWeek)
    const matchDom = doms === null || doms.includes(dayOfMonth)

    if (matchDow && matchDom) {
      for (const h of hours) {
        for (const m of minutes) {
          const d = new Date(cursor)
          d.setHours(h, m, 0, 0)
          if (d >= start && d <= end) results.push(d)
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return results
}

// Detect conflicts (two schedules running at the same minute)
function detectConflicts(schedules: Schedule[], start: Date, end: Date): Map<string, Schedule[]> {
  const timeMap = new Map<string, Schedule[]>()

  for (const s of schedules) {
    if (!s.enabled || !s.schedule_expr) continue
    const occurrences = getCronOccurrences(s.schedule_expr, start, end)
    for (const occ of occurrences) {
      const key = occ.toISOString().slice(0, 16) // minute precision
      if (!timeMap.has(key)) timeMap.set(key, [])
      timeMap.get(key)!.push(s)
    }
  }

  // Only return entries with conflicts (2+)
  const conflicts = new Map<string, Schedule[]>()
  timeMap.forEach((scheds, key) => {
    if (scheds.length > 1) conflicts.set(key, scheds)
  })
  return conflicts
}

const agentColors: Record<string, string> = {
  travis: '#3b82f6',
  blake: '#f59e0b',
  rex: '#8b5cf6',
  oscar: '#10b981',
  warren: '#ef4444',
  griffin: '#06b6d4',
  secretary: '#ec4899',
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dragItem, setDragItem] = useState<Schedule | null>(null)

  useEffect(() => { fetchSchedules() }, [])

  async function fetchSchedules() {
    setLoading(true)
    try {
      const res = await fetch('/api/schedules')
      const data = await res.json()
      setSchedules(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function toggleSchedule(id: string, enabled: boolean) {
    await fetch('/api/schedules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled: !enabled }),
    })
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, enabled: !enabled } : s))
  }

  // Navigation
  function navigate(dir: number) {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir)
    else d.setDate(d.getDate() + dir)
    setCurrentDate(d)
  }

  // Compute date range for current view
  const { rangeStart, rangeEnd, days } = useMemo(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (view === 'month') {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
    } else if (view === 'week') {
      const dow = start.getDay()
      start.setDate(start.getDate() - dow)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    }

    const days: Date[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      days.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }

    return { rangeStart: start, rangeEnd: end, days }
  }, [currentDate, view])

  // Compute schedule occurrences per day
  const daySchedules = useMemo(() => {
    const result = new Map<string, { schedule: Schedule; time: Date }[]>()

    for (const s of schedules) {
      if (!s.schedule_expr) continue
      const occs = getCronOccurrences(s.schedule_expr, rangeStart, rangeEnd)
      for (const occ of occs) {
        const key = occ.toISOString().slice(0, 10)
        if (!result.has(key)) result.set(key, [])
        result.get(key)!.push({ schedule: s, time: occ })
      }
    }

    // Sort each day by time
    result.forEach(items => items.sort((a, b) => a.time.getTime() - b.time.getTime()))
    return result
  }, [schedules, rangeStart, rangeEnd])

  // Conflicts
  const conflicts = useMemo(
    () => detectConflicts(schedules, rangeStart, rangeEnd),
    [schedules, rangeStart, rangeEnd]
  )

  const titleMap: Record<ViewMode, string> = {
    month: currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' }),
    week: `${rangeStart.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} — ${rangeEnd.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}`,
    day: currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
  }

  const today = new Date().toISOString().slice(0, 10)
  const dowLabels = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <main className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-foreground-muted hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <Calendar size={24} className="text-primary" />
            <h1 className="text-2xl font-bold">排程矩陣管理</h1>
          </div>
          <button onClick={fetchSchedules} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Conflict Alert */}
        {conflicts.size > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-warning-bg border border-warning-border flex items-start gap-2">
            <AlertTriangle size={18} className="text-warning mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">偵測到 {conflicts.size} 個時間衝突</p>
              <div className="text-xs text-foreground-muted mt-1 space-y-1">
                {Array.from(conflicts.entries()).slice(0, 3).map(([time, scheds]) => (
                  <p key={time}>
                    {new Date(time + ':00Z').toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}：
                    {scheds.map(s => s.name).join(' & ')}
                  </p>
                ))}
                {conflicts.size > 3 && <p>...及其他 {conflicts.size - 3} 個衝突</p>}
              </div>
            </div>
          </div>
        )}

        {/* View Selector & Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(['month', 'week', 'day'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  view === v ? 'bg-background text-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                {v === 'month' ? '月' : v === 'week' ? '週' : '日'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-muted"><ChevronLeft size={18} /></button>
            <span className="text-sm font-medium min-w-[180px] text-center">{titleMap[view]}</span>
            <button onClick={() => navigate(1)} className="p-1.5 rounded hover:bg-muted"><ChevronRight size={18} /></button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-2 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted"
            >
              今天
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {view !== 'day' ? (
          <div className="border border-border rounded-xl overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-muted/50">
              {dowLabels.map(d => (
                <div key={d} className="text-center text-xs font-medium text-foreground-muted py-2 border-b border-border">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className={`grid grid-cols-7 ${view === 'month' ? 'auto-rows-[120px]' : 'auto-rows-[200px]'}`}>
              {/* Pad start for month view */}
              {view === 'month' && Array.from({ length: days[0]?.getDay() || 0 }).map((_, i) => (
                <div key={`pad-${i}`} className="border-b border-r border-border bg-muted/20" />
              ))}

              {days.map(day => {
                const key = day.toISOString().slice(0, 10)
                const items = daySchedules.get(key) || []
                const isToday = key === today

                return (
                  <div
                    key={key}
                    className={`border-b border-r border-border p-1.5 overflow-hidden hover:bg-muted/30 transition-colors ${
                      isToday ? 'bg-primary/5' : ''
                    }`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => {
                      if (dragItem) {
                        // Visual feedback only for now
                        setDragItem(null)
                      }
                    }}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground-muted'}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {items.slice(0, view === 'month' ? 3 : 10).map((item, i) => {
                        const color = agentColors[item.schedule.agent_id || ''] || '#6b7280'
                        const conflictKey = item.time.toISOString().slice(0, 16)
                        const hasConflict = conflicts.has(conflictKey)

                        return (
                          <div
                            key={`${item.schedule.id}-${i}`}
                            draggable
                            onDragStart={() => setDragItem(item.schedule)}
                            className={`text-[10px] leading-tight px-1.5 py-0.5 rounded cursor-grab active:cursor-grabbing truncate ${
                              item.schedule.enabled ? '' : 'opacity-40 line-through'
                            } ${hasConflict ? 'ring-1 ring-warning' : ''}`}
                            style={{
                              backgroundColor: `${color}20`,
                              borderLeft: `2px solid ${color}`,
                              color,
                            }}
                            title={`${item.schedule.name} (${item.schedule.agent_id}) — ${item.time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}${hasConflict ? ' ⚠️ 衝突' : ''}`}
                          >
                            <span className="font-medium">{item.time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</span>
                            {' '}{item.schedule.name}
                          </div>
                        )
                      })}
                      {items.length > (view === 'month' ? 3 : 10) && (
                        <div className="text-[10px] text-foreground-muted pl-1">+{items.length - (view === 'month' ? 3 : 10)} 更多</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Day view: timeline */
          <div className="border border-border rounded-xl overflow-hidden">
            {Array.from({ length: 24 }).map((_, hour) => {
              const key = currentDate.toISOString().slice(0, 10)
              const items = (daySchedules.get(key) || []).filter(
                item => item.time.getHours() === hour
              )

              return (
                <div key={hour} className="flex border-b border-border last:border-b-0 min-h-[48px]">
                  <div className="w-16 shrink-0 text-xs text-foreground-muted py-2 px-3 border-r border-border bg-muted/30 text-right">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 p-1 flex flex-wrap gap-1">
                    {items.map((item, i) => {
                      const color = agentColors[item.schedule.agent_id || ''] || '#6b7280'
                      return (
                        <div
                          key={`${item.schedule.id}-${i}`}
                          className={`text-xs px-2 py-1 rounded ${item.schedule.enabled ? '' : 'opacity-40'}`}
                          style={{
                            backgroundColor: `${color}20`,
                            borderLeft: `2px solid ${color}`,
                            color,
                          }}
                        >
                          <span className="font-medium">{item.time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</span>
                          {' '}{item.schedule.name}
                          <span className="ml-1 opacity-60">({item.schedule.agent_id})</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Schedule List */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock size={18} />
            所有排程 ({schedules.length})
          </h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-foreground-muted text-left">
                  <th className="px-4 py-2.5 font-medium">啟用</th>
                  <th className="px-4 py-2.5 font-medium">名稱</th>
                  <th className="px-4 py-2.5 font-medium">Agent</th>
                  <th className="px-4 py-2.5 font-medium">排程</th>
                  <th className="px-4 py-2.5 font-medium">說明</th>
                  <th className="px-4 py-2.5 font-medium">最後執行</th>
                  <th className="px-4 py-2.5 font-medium">狀態</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(s => (
                  <tr key={s.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2">
                      <button onClick={() => toggleSchedule(s.id, s.enabled)} className="text-foreground-muted hover:text-foreground">
                        {s.enabled ? <ToggleRight size={22} className="text-success" /> : <ToggleLeft size={22} />}
                      </button>
                    </td>
                    <td className="px-4 py-2 font-medium">{s.name}</td>
                    <td className="px-4 py-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${agentColors[s.agent_id || ''] || '#6b7280'}20`,
                          color: agentColors[s.agent_id || ''] || '#6b7280',
                        }}
                      >
                        {s.agent_id || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-foreground-muted">{s.schedule_expr}</td>
                    <td className="px-4 py-2 text-foreground-muted">{parseCron(s.schedule_expr || '')}</td>
                    <td className="px-4 py-2 text-xs text-foreground-muted">
                      {s.last_run_at ? new Date(s.last_run_at).toLocaleString('zh-TW') : '—'}
                    </td>
                    <td className="px-4 py-2">
                      {s.last_status ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          s.last_status === 'ok' ? 'bg-success-bg text-success' :
                          s.last_status === 'error' ? 'bg-error-bg text-error' :
                          'bg-muted text-foreground-muted'
                        }`}>{s.last_status}</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
