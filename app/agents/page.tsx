// ============================================================
// Agent Control Center — Isometric Office + Galgame Dialog
// ============================================================
'use client'

import { useState } from 'react'

// --- Agent Data ---
interface Agent {
  name: string
  prefix: string
  role: string
  model: string
  status: 'online' | 'offline'
  color: string
  skills: string[]
  currentTask: string
  desk: string // desk area label
  quotes: string[] // personality lines for Galgame dialog
}

const agents: Agent[] = [
  {
    name: 'Jarvis',
    prefix: 'J:',
    role: '總指揮、調度、審核、驗收',
    model: 'Opus',
    status: 'online',
    color: '#3b82f6',
    skills: ['全局調度', '任務分配', '品質驗收', '記憶管理'],
    currentTask: '系統監控 + 任務調度',
    desk: '指揮中心',
    quotes: [
      '所有 Agent 狀態正常，系統運行中。',
      '今天的任務清單已更新，準備好了嗎？',
      '有什麼需要我調度的，說一聲。',
    ],
  },
  {
    name: 'Inspector',
    prefix: 'I:',
    role: '巡檢、程式審查、測試、品質把關',
    model: 'Sonnet',
    status: 'online',
    color: '#22c55e',
    skills: ['程式碼 Review', '功能測試', '安全掃描', '效能檢查'],
    currentTask: '待命中',
    desk: '品管室',
    quotes: [
      '程式碼品質就是產品品質。',
      '每一行 code 都要經得起 review。',
      '最近的 commit 都通過檢查了。',
    ],
  },
  {
    name: 'Secretary',
    prefix: 'S:',
    role: '郵件、行事曆、簽核通知',
    model: 'Sonnet',
    status: 'online',
    color: '#f59e0b',
    skills: ['Zimbra 郵件', 'Google Calendar', 'EasyFlow 簽核', '會議排程'],
    currentTask: '待命中',
    desk: '前台',
    quotes: [
      '目前沒有待簽核的文件。',
      '下週行程已經整理好了。',
      '有新郵件進來我會第一時間通知。',
    ],
  },
  {
    name: 'Writer',
    prefix: 'W:',
    role: '報告撰寫、文件產出',
    model: 'Opus',
    status: 'online',
    color: '#8b5cf6',
    skills: ['Google Docs', 'SVG 圖表', '研究報告', 'Travis Daily 發布'],
    currentTask: '待命中',
    desk: '文案區',
    quotes: [
      '好的報告需要好的資料，Researcher 辛苦了。',
      '表格呈現數據，圖片呈現邏輯。',
      '下一篇研究報告主題是什麼？',
    ],
  },
  {
    name: 'Researcher',
    prefix: 'R:',
    role: '資料蒐集、深度研究',
    model: 'Sonnet',
    status: 'online',
    color: '#06b6d4',
    skills: ['Web 搜尋', '深度研究', '競品分析', '技術調查'],
    currentTask: '待命中',
    desk: '資料室',
    quotes: [
      '資料越深入，結論越有價值。',
      '普渡知識庫已經建好索引了。',
      '需要研究什麼題目？我隨時可以開工。',
    ],
  },
  {
    name: 'Coder',
    prefix: 'C:',
    role: '程式開發、Portal / Hub / 腳本',
    model: 'Opus',
    status: 'online',
    color: '#ef4444',
    skills: ['Next.js', 'TypeScript', 'Python', 'Supabase', 'Vercel'],
    currentTask: 'Portal 業績圖表修正',
    desk: '工程區',
    quotes: [
      '寫 code 不難，寫好 code 才難。',
      'Portal 的新功能快好了。',
      'TypeScript 是我的母語。',
    ],
  },
  {
    name: 'Designer',
    prefix: 'D:',
    role: '美學設計、UX/UI、風格規範',
    model: 'Sonnet',
    status: 'online',
    color: '#ec4899',
    skills: ['UI/UX 設計', 'CSS 風格', '色彩學', '資料視覺化', '圖片生成'],
    currentTask: 'Agent 展示頁設計中',
    desk: '設計區',
    quotes: [
      '美學不是裝飾，是溝通。',
      'Emoji？拜託，我們用 SVG。',
      '每個像素都有它存在的理由。',
    ],
  },
  {
    name: 'Trader',
    prefix: 'T:',
    role: '行情監控、交易策略',
    model: 'Sonnet',
    status: 'offline',
    color: '#64748b',
    skills: ['Yahoo Finance', '台股監控', '策略回測', 'AI 選股'],
    currentTask: '尚未上線',
    desk: '交易室',
    quotes: [
      '市場永遠是對的。',
      '等接上即時行情就能開工了。',
      '紀律是交易的第一法則。',
    ],
  },
]

const workflows = [
  {
    name: '開發流程',
    flow: ['Designer', 'Coder', 'Inspector', 'Jarvis'],
    desc: '設計 → 實作 → 審查 → 驗收',
    color: '#3b82f6',
  },
  {
    name: '報告流程',
    flow: ['Researcher', 'Writer', 'Designer', 'Jarvis'],
    desc: '研究 → 撰寫 → 美化 → 驗收',
    color: '#8b5cf6',
  },
  {
    name: '簽核流程',
    flow: ['Secretary', 'Jarvis', 'William'],
    desc: '偵測 → 摘要 → 人工確認',
    color: '#f59e0b',
  },
]

// --- SVG Icons ---
function IconJarvis({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v2" /><path d="M12 19v2" />
      <path d="M3 12h2" /><path d="M19 12h2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9v6" /><path d="M9 12h6" />
    </svg>
  )
}
function IconInspector({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}
function IconSecretary({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
      <path d="M8 18h.01" /><path d="M12 18h.01" />
    </svg>
  )
}
function IconWriter({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      <path d="M15 5l4 4" />
    </svg>
  )
}
function IconResearcher({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <circle cx="11" cy="11" r="3" />
    </svg>
  )
}
function IconCoder({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  )
}
function IconDesigner({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12c0-4 4.5-8 10-8 2 0 3.5.5 4 1.5.5 1-.5 2.5-2 3-1.5.5-2 2-1 3s2.5 1 4 .5c1.5-.5 3 .5 3 2.5 0 4-4 8-10 8a10 10 0 0 1-8-10.5z" />
      <circle cx="7.5" cy="11.5" r="1" fill={color} /><circle cx="12" cy="8" r="1" fill={color} /><circle cx="10" cy="15" r="1" fill={color} />
    </svg>
  )
}
function IconTrader({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="16" x2="6" y2="8" /><line x1="6" y1="6" x2="6" y2="4" /><line x1="6" y1="20" x2="6" y2="18" />
      <rect x="4" y="8" width="4" height="8" rx="0.5" />
      <line x1="12" y1="14" x2="12" y2="6" /><line x1="12" y1="4" x2="12" y2="3" /><line x1="12" y1="18" x2="12" y2="16" />
      <rect x="10" y="6" width="4" height="8" rx="0.5" />
      <line x1="18" y1="17" x2="18" y2="9" /><line x1="18" y1="7" x2="18" y2="5" /><line x1="18" y1="21" x2="18" y2="19" />
      <rect x="16" y="9" width="4" height="8" rx="0.5" />
    </svg>
  )
}

const agentIcons: Record<string, React.FC<{ color: string; size?: number }>> = {
  Jarvis: IconJarvis, Inspector: IconInspector, Secretary: IconSecretary,
  Writer: IconWriter, Researcher: IconResearcher, Coder: IconCoder,
  Designer: IconDesigner, Trader: IconTrader,
}

// --- Isometric Office Layout (CSS grid positions) ---
// 4x2 grid, each cell is a "desk area"
const deskPositions: Record<string, { row: number; col: number }> = {
  Jarvis:     { row: 0, col: 1 },  // center-left (command)
  Inspector:  { row: 0, col: 2 },  // center-right
  Secretary:  { row: 0, col: 0 },  // front desk
  Writer:     { row: 1, col: 0 },  // back left
  Researcher: { row: 1, col: 1 },  // back center-left
  Coder:      { row: 1, col: 2 },  // back center-right
  Designer:   { row: 0, col: 3 },  // front right
  Trader:     { row: 1, col: 3 },  // back right
}

// --- Arrow for workflows ---
function ArrowRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

// ============================================================
// Page Component
// ============================================================
export default function AgentsPage() {
  const [selected, setSelected] = useState<Agent | null>(null)
  const [quoteIndex, setQuoteIndex] = useState(0)

  function handleAgentClick(agent: Agent) {
    if (selected?.name === agent.name) {
      // Cycle quote
      setQuoteIndex((prev) => (prev + 1) % agent.quotes.length)
    } else {
      setSelected(agent)
      setQuoteIndex(0)
    }
  }

  function handleClose() {
    setSelected(null)
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0c10]">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <header className="mb-8">
          <a href="/" className="text-gray-500 text-sm hover:text-gray-300 transition mb-3 inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            William Hub
          </a>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                <circle cx="8" cy="10" r="1.5" /><circle cx="16" cy="10" r="1.5" />
                <line x1="9.5" y1="10" x2="14.5" y2="10" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-100">Agent Control Center</h1>
              <p className="text-xs text-gray-500 mt-0.5">8 Agents · 3 Workflows · 1 Commander</p>
            </div>
          </div>
        </header>

        {/* === ISOMETRIC OFFICE === */}
        <section className="mb-10">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Office</h2>

          {/* Desktop: isometric grid / Mobile: 2-col grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {agents.map((agent) => {
              const pos = deskPositions[agent.name]
              const isSelected = selected?.name === agent.name
              const Icon = agentIcons[agent.name]
              const isOffline = agent.status === 'offline'

              return (
                <button
                  key={agent.name}
                  onClick={() => handleAgentClick(agent)}
                  className={`group relative rounded-xl border p-4 text-left transition-all duration-200 
                    ${isOffline ? 'opacity-35' : 'hover:translate-y-[-2px] hover:shadow-lg'}
                    ${isSelected
                      ? 'ring-1 border-opacity-80 shadow-lg'
                      : 'border-gray-800/50 bg-gray-900/30 hover:bg-gray-900/50'
                    }`}
                  style={{
                    order: pos.row * 4 + pos.col,
                    borderColor: isSelected ? agent.color : undefined,
                    boxShadow: isSelected ? `0 0 20px ${agent.color}15` : undefined,
                    background: isSelected ? `${agent.color}08` : undefined,
                  }}
                >
                  {/* Status dot */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-gray-600' : 'bg-emerald-400'}`} />
                  </div>

                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
                    style={{
                      background: `${agent.color}12`,
                      border: `1px solid ${agent.color}25`,
                    }}
                  >
                    {Icon && <Icon color={agent.color} size={24} />}
                  </div>

                  {/* Name + role */}
                  <div className="font-semibold text-sm text-gray-200 mb-0.5 flex items-center gap-2">
                    {agent.name}
                    <span className="text-[10px] font-mono text-gray-600 font-normal">{agent.model}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 leading-snug mb-2">{agent.desk}</div>

                  {/* Current task */}
                  <div className="text-[10px] text-gray-600 truncate">
                    {agent.currentTask}
                  </div>

                  {/* Isometric desk decoration line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl opacity-40 transition-opacity group-hover:opacity-70"
                    style={{ background: agent.color }}
                  />
                </button>
              )
            })}
          </div>
        </section>

        {/* === WORKFLOWS === */}
        <section className="mb-10">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Workflows</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {workflows.map((w) => (
              <div key={w.name} className="rounded-xl border border-gray-800/50 bg-gray-900/30 p-4">
                <div className="text-sm font-semibold mb-3" style={{ color: w.color }}>{w.name}</div>
                <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-400 mb-2">
                  {w.flow.map((name, i) => {
                    const agent = agents.find(a => a.name === name)
                    return (
                      <span key={name} className="flex items-center gap-1.5">
                        <span
                          className="px-2 py-0.5 rounded border text-[11px]"
                          style={{
                            borderColor: agent ? `${agent.color}30` : 'rgba(107,114,128,0.3)',
                            color: agent ? agent.color : '#9ca3af',
                          }}
                        >
                          {name}
                        </span>
                        {i < w.flow.length - 1 && (
                          <span className="text-gray-700"><ArrowRight /></span>
                        )}
                      </span>
                    )
                  })}
                </div>
                <div className="text-[11px] text-gray-600">{w.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* === AGENT DETAIL (expandable, replaces old skill list) === */}
        {selected && (
          <section className="mb-10 rounded-xl border bg-gray-900/50 p-5 transition-all" style={{ borderColor: `${selected.color}30` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${selected.color}15`, border: `1px solid ${selected.color}30` }}
                >
                  {agentIcons[selected.name]?.({ color: selected.color })}
                </div>
                <div>
                  <div className="font-semibold text-gray-200">{selected.name} <span className="text-xs font-mono text-gray-500">{selected.prefix}</span></div>
                  <div className="text-xs text-gray-500">{selected.role}</div>
                </div>
              </div>
              <button onClick={handleClose} className="text-gray-600 hover:text-gray-300 transition p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selected.skills.map((s) => (
                <span
                  key={s}
                  className="text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ borderColor: `${selected.color}30`, color: `${selected.color}cc` }}
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="text-xs text-gray-500 mb-1">
              <span className="text-gray-600">Status:</span>{' '}
              <span className={selected.status === 'online' ? 'text-emerald-400' : 'text-gray-600'}>{selected.status}</span>
              <span className="mx-2 text-gray-700">|</span>
              <span className="text-gray-600">Task:</span>{' '}
              <span className="text-gray-400">{selected.currentTask}</span>
            </div>
          </section>
        )}

        {/* === GALGAME DIALOG === */}
        {selected && (
          <div
            className="fixed bottom-0 left-0 right-0 z-50 transition-all"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 60%, transparent)' }}
          >
            <div className="max-w-3xl mx-auto px-5 pb-6 pt-10">
              <div
                className="rounded-xl border p-4 sm:p-5 backdrop-blur-sm cursor-pointer"
                style={{
                  borderColor: `${selected.color}30`,
                  background: `rgba(10,12,16,0.9)`,
                }}
                onClick={() => handleAgentClick(selected)}
              >
                <div className="flex items-start gap-3">
                  {/* Character icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${selected.color}15`, border: `1px solid ${selected.color}30` }}
                  >
                    {agentIcons[selected.name]?.({ color: selected.color, size: 26 })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold mb-1.5" style={{ color: selected.color }}>
                      {selected.name}
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed">
                      {selected.quotes[quoteIndex]}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-2 flex items-center gap-2">
                      <span>點擊切換對話</span>
                      <span className="text-gray-700">·</span>
                      <span>{quoteIndex + 1}/{selected.quotes.length}</span>
                    </div>
                  </div>
                  {/* Close */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClose() }}
                    className="text-gray-600 hover:text-gray-300 transition shrink-0 mt-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 text-center text-[11px] text-gray-700">
          Travis Control Center v2
        </footer>
      </div>
    </main>
  )
}
