// ============================================================
// William Hub — Professional Dashboard v2
// ============================================================
'use client'

import { useState, useEffect } from 'react'

const agentsList = [
  { name: 'Travis', status: 'ok' as const },
  { name: 'Inspector', status: 'ok' as const },
  { name: 'Secretary', status: 'ok' as const },
  { name: 'Writer', status: 'ok' as const },
  { name: 'Researcher', status: 'ok' as const },
  { name: 'Coder', status: 'ok' as const },
  { name: 'Designer', status: 'ok' as const },
  { name: 'Analyst', status: 'idle' as const },
]

const tasks = [
  { id: 1, agent: 'Coder', task: '普渡知識庫 markdown 清洗 + qmd 索引', status: 'done' as const },
  { id: 2, agent: 'Designer', task: 'Agent 辦公室展示頁 — 等距視角 + Galgame 對話', status: 'planned' as const },
  { id: 3, agent: 'Coder', task: 'Portal 業績圖表 75% 標籤修正', status: 'in-progress' as const },
  { id: 4, agent: 'Inspector', task: '知識庫清洗品質驗證（抽樣 20 篇）', status: 'planned' as const },
  { id: 5, agent: 'Coder', task: 'Trade 頁面 Phase 2 — 接真實報價 API', status: 'planned' as const },
  { id: 6, agent: 'Researcher', task: '普渡雲端文件中心 + 學習中心爬取', status: 'planned' as const },
  { id: 7, agent: 'Coder', task: 'EasyFlow 下次簽核實戰測試', status: 'planned' as const },
  { id: 8, agent: 'Designer', task: 'William Hub + Portal 統一設計規範', status: 'planned' as const },
]

const taskStatusColors = {
  'done': { dot: 'bg-emerald-400', text: 'text-emerald-400', label: '完成' },
  'in-progress': { dot: 'bg-amber-400', text: 'text-amber-400', label: '進行中' },
  'planned': { dot: 'bg-gray-500', text: 'text-gray-500', label: '待排' },
}

const apps = [
  {
    name: 'Aurotek Portal',
    desc: '通路營業管理系統',
    url: 'https://aurotek-sales-portal.vercel.app',
    tag: '公司',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  {
    name: 'Travis Daily',
    desc: 'AI 動態 / 研究報告 / 技術筆記',
    url: 'https://travis-daily.vercel.app',
    tag: '專欄',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.25)',
  },
  {
    name: 'Task Board',
    desc: 'Agent + William 任務看板',
    url: '/board',
    tag: 'LIVE',
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  {
    name: 'Trading System',
    desc: '程式交易 / 策略回測 / 即時監控',
    url: '/trade',
    tag: 'LIVE',
    accent: '#10b981',
    accentBg: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  {
    name: 'Travis',
    desc: 'AI 多 Agent 控制台',
    url: '/agents',
    tag: 'LIVE',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.08)',
    borderColor: 'rgba(168,85,247,0.25)',
    disabled: true,
  },
]

// --- SVG Icons (stroke-based, unified style) ---
function IconAurotek({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="11" rx="1" />
      <path d="M7 10V6a5 5 0 0 1 10 0v4" />
      <line x1="3" y1="14" x2="21" y2="14" />
      <line x1="8" y1="14" x2="8" y2="21" />
      <line x1="16" y1="14" x2="16" y2="21" />
      <line x1="12" y1="14" x2="12" y2="21" />
    </svg>
  )
}

function IconTravisDaily({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7" y1="7" x2="17" y2="7" />
      <line x1="7" y1="11" x2="13" y2="11" />
      <line x1="7" y1="15" x2="11" y2="15" />
      <line x1="14" y1="13" x2="17" y2="13" />
      <line x1="14" y1="16" x2="17" y2="16" />
    </svg>
  )
}

function IconTrading({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="17 7 21 7 21 11" />
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="7" y1="21" x2="7" y2="17" />
      <line x1="11" y1="21" x2="11" y2="14" />
      <line x1="15" y1="21" x2="15" y2="16" />
    </svg>
  )
}

function IconTravis({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

function IconBoard({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
      <line x1="5" y1="6" x2="9" y2="6" />
      <line x1="5" y1="8" x2="7" y2="8" />
      <line x1="15" y1="6" x2="19" y2="6" />
      <line x1="15" y1="8" x2="17" y2="8" />
    </svg>
  )
}

const iconMap: Record<string, React.FC<{ color: string }>> = {
  'Aurotek Portal': IconAurotek,
  'Travis Daily': IconTravisDaily,
  'Task Board': IconBoard,
  'Trading System': IconTrading,
  'Travis': IconTravis,
}

// --- Helpers ---
function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function getDateStr(): string {
  const d = new Date()
  const tw = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  return `${days[tw.getUTCDay()]}, ${months[tw.getUTCMonth()]} ${tw.getUTCDate()}, ${tw.getUTCFullYear()}`
}

function StatusDot({ status }: { status: 'ok' | 'fail' | 'idle' }) {
  const colors = { ok: '#10b981', fail: '#ef4444', idle: '#6b7280' }
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ backgroundColor: colors[status] }}
    />
  )
}

// --- Arrow Icon ---
function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

// ============================================================
// Page Component
// ============================================================
export default function Home() {
  const agents = agentsList
  const [tokens, setTokens] = useState({ today: 0, week: 0, month: 0, total: 0 })

  useEffect(() => {
    fetch('/api/token-stats')
      .then(r => r.json())
      .then(d => { if (d && !d.error) setTokens(d) })
      .catch(() => {})
  }, [])

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-5 py-12 sm:py-20">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white">
              W
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">William Hub</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">Command Center</p>
        </header>

        {/* Strategic Panel */}
        <section className="mb-8 rounded-xl border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm">
          <div className="px-5 py-4 sm:px-6 sm:py-5">
            {/* Top row: date + agents */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div className="text-sm text-gray-400 font-medium tracking-wide">
                {getDateStr()}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {agents.map((a) => (
                  <div key={a.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <StatusDot status={a.status} />
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Token stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Today', value: tokens.today },
                { label: 'This Week', value: tokens.week },
                { label: 'This Month', value: tokens.month },
                { label: 'Total', value: tokens.total },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-200 tabular-nums">
                    {formatNumber(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tasks */}
        <section className="mb-8 rounded-xl border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm">
          <div className="px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Tasks</h2>
              <span className="text-xs text-gray-600">{tasks.filter(t => t.status === 'done').length}/{tasks.length} done</span>
            </div>
            <div className="space-y-2.5">
              {tasks.map((t) => {
                const s = taskStatusColors[t.status]
                return (
                  <div key={t.id} className={`flex items-start gap-3 text-sm ${t.status === 'done' ? 'opacity-50' : ''}`}>
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <span className={`${t.status === 'done' ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                        {t.task}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 shrink-0">{t.agent}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* App Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {apps.map((app) => {
            const Icon = iconMap[app.name]
            const inner = (
              <div
                className={`group relative rounded-xl border p-5 sm:p-6 transition-all duration-200 ${
                  app.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer hover:translate-y-[-2px] hover:shadow-lg'
                }`}
                style={{
                  borderColor: app.borderColor,
                  background: app.accentBg,
                }}
              >
                {/* Tag */}
                <span
                  className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full border"
                  style={{
                    borderColor: app.disabled ? 'rgba(107,114,128,0.3)' : app.borderColor,
                    color: app.disabled ? '#6b7280' : app.accent,
                  }}
                >
                  {app.tag}
                </span>

                {/* Icon */}
                <div className="mb-3">
                  {Icon && <Icon color={app.accent} />}
                </div>

                {/* Text */}
                <h2 className="text-base font-semibold text-gray-100 mb-1">{app.name}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{app.desc}</p>

                {/* Arrow */}
                {!app.disabled && (
                  <div className="absolute bottom-5 right-5 text-gray-600 group-hover:text-gray-300 transition-colors">
                    <ArrowRight />
                  </div>
                )}
              </div>
            )

            if (app.disabled) return <div key={app.name}>{inner}</div>
            return (
              <a key={app.name} href={app.url} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            )
          })}
        </section>

        {/* Footer */}
        <footer className="mt-14 text-center text-gray-700 text-xs tracking-wide">
          William Hub v2
        </footer>
      </div>
    </main>
  )
}
