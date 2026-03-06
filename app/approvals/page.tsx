'use client'

import { ArrowLeft, Shield, CheckCircle, XCircle, Clock, History, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

type Task = {
  id: number
  title: string
  priority: string
  status: string
  assignee: string | null
  approval_status: string | null
  approval_required: boolean | null
  plan: string | null
  created_at: string
  description: string | null
  approved_by?: string | null
  approved_at?: string | null
  result?: string | null
}

type Tab = 'pending' | 'history'

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  P0: { bg: 'bg-error-bg', text: 'text-error', border: 'border-error-border' },
  P1: { bg: 'bg-warning-bg', text: 'text-warning', border: 'border-warning-border' },
  P2: { bg: 'bg-info-bg', text: 'text-info', border: 'border-info-border' },
  P3: { bg: 'bg-muted', text: 'text-foreground-muted', border: 'border-border' },
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const [pending, setPending] = useState<Task[]>([])
  const [history, setHistory] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [pRes, hRes] = await Promise.all([
        fetch('/api/approvals?view=pending'),
        fetch('/api/approvals?view=history'),
      ])
      const pData = await pRes.json()
      const hData = await hRes.json()
      setPending(Array.isArray(pData) ? pData : [])
      setHistory(Array.isArray(hData) ? hData : [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleAction(id: number, action: 'approve' | 'reject') {
    setActionLoading(id)
    try {
      const body: any = { id, action }
      if (action === 'reject' && rejectReason) body.reason = rejectReason

      await fetch('/api/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      setRejectReason('')
      setExpandedId(null)
      await fetchData()
    } catch { /* ignore */ }
    setActionLoading(null)
  }

  const tabItems: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'pending', label: '待審批', icon: <Clock size={16} />, count: pending.length },
    { key: 'history', label: '審批歷史', icon: <History size={16} />, count: history.length },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-foreground-muted hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <Shield size={24} className="text-primary" />
            <h1 className="text-2xl font-bold">權限與審批管理</h1>
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border border-border rounded-xl p-4 bg-card">
            <div className="text-foreground-muted text-xs mb-1">待審批</div>
            <div className="text-2xl font-bold text-warning">{pending.length}</div>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <div className="text-foreground-muted text-xs mb-1">已核准</div>
            <div className="text-2xl font-bold text-success">
              {history.filter(t => t.approval_status === '已核准').length}
            </div>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <div className="text-foreground-muted text-xs mb-1">已拒絕</div>
            <div className="text-2xl font-bold text-error">
              {history.filter(t => t.approval_status === '已拒絕').length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6 w-fit">
          {tabItems.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors ${
                tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground-muted'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-foreground-muted">載入中...</div>
        ) : tab === 'pending' ? (
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div className="text-center py-12 text-foreground-muted border border-border rounded-xl">
                <CheckCircle size={40} className="mx-auto mb-3 text-success opacity-50" />
                <p>沒有待審批的任務</p>
              </div>
            ) : (
              pending.map(task => {
                const pc = priorityColors[task.priority] || priorityColors.P3
                const isExpanded = expandedId === task.id

                return (
                  <div key={task.id} className={`border rounded-xl overflow-hidden transition-all ${pc.border}`}>
                    {/* Header */}
                    <div
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 ${pc.bg}`}
                      onClick={() => setExpandedId(isExpanded ? null : task.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${pc.text} ${pc.bg} border ${pc.border}`}>
                          {task.priority}
                        </span>
                        <span className="font-medium truncate">#{task.id} {task.title}</span>
                        {task.assignee && (
                          <span className="text-xs text-foreground-muted shrink-0">→ {task.assignee}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground-muted">
                          {new Date(task.created_at).toLocaleDateString('zh-TW')}
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="p-4 border-t border-border space-y-4">
                        {task.description && (
                          <div>
                            <div className="text-xs text-foreground-muted mb-1">描述</div>
                            <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                          </div>
                        )}
                        {task.plan && (
                          <div>
                            <div className="text-xs text-foreground-muted mb-1">執行計畫</div>
                            <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg font-mono">{task.plan}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => handleAction(task.id, 'approve')}
                            disabled={actionLoading === task.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-success/10 text-success border border-success/30 rounded-lg hover:bg-success/20 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            <CheckCircle size={16} />
                            批准
                          </button>

                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              placeholder="拒絕原因（選填）"
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              className="flex-1 text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-error/50"
                            />
                            <button
                              onClick={() => handleAction(task.id, 'reject')}
                              disabled={actionLoading === task.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-error/10 text-error border border-error/30 rounded-lg hover:bg-error/20 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              <XCircle size={16} />
                              拒絕
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        ) : (
          /* History */
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-foreground-muted text-left">
                  <th className="px-4 py-2.5 font-medium">ID</th>
                  <th className="px-4 py-2.5 font-medium">優先級</th>
                  <th className="px-4 py-2.5 font-medium">標題</th>
                  <th className="px-4 py-2.5 font-medium">指派</th>
                  <th className="px-4 py-2.5 font-medium">審批結果</th>
                  <th className="px-4 py-2.5 font-medium">審批人</th>
                  <th className="px-4 py-2.5 font-medium">審批時間</th>
                </tr>
              </thead>
              <tbody>
                {history.map(task => (
                  <tr key={task.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-foreground-muted">#{task.id}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        (priorityColors[task.priority] || priorityColors.P3).text
                      } ${(priorityColors[task.priority] || priorityColors.P3).bg}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium">{task.title}</td>
                    <td className="px-4 py-2.5 text-foreground-muted">{task.assignee || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        task.approval_status === '已核准' ? 'bg-success-bg text-success' :
                        task.approval_status === '已拒絕' ? 'bg-error-bg text-error' :
                        'bg-info-bg text-info'
                      }`}>
                        {task.approval_status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted text-xs">{task.approved_by || '—'}</td>
                    <td className="px-4 py-2.5 text-foreground-muted text-xs">
                      {task.approved_at ? new Date(task.approved_at).toLocaleString('zh-TW') : '—'}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-foreground-muted">暫無審批記錄</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
