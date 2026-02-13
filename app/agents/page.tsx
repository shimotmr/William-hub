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
  desk: string
  quotes: string[]
  // Isometric position (grid x, y)
  gridX: number
  gridY: number
}

const agents: Agent[] = [
  {
    name: 'Jarvis', prefix: 'J:', role: '總指揮、調度、審核、驗收', model: 'Opus', status: 'online', color: '#3b82f6',
    skills: ['全局調度', '任務分配', '品質驗收', '記憶管理'], currentTask: '系統監控 + 任務調度', desk: '指揮中心',
    quotes: ['所有 Agent 狀態正常，系統運行中。', '今天的任務清單已更新，準備好了嗎？', '有什麼需要我調度的，說一聲。'],
    gridX: 2, gridY: 0,
  },
  {
    name: 'Secretary', prefix: 'S:', role: '郵件、行事曆、簽核通知', model: 'Sonnet', status: 'online', color: '#f59e0b',
    skills: ['Zimbra 郵件', 'Google Calendar', 'EasyFlow 簽核', '會議排程'], currentTask: '待命中', desk: '前台',
    quotes: ['目前沒有待簽核的文件。', '下週行程已經整理好了。', '有新郵件進來我會第一時間通知。'],
    gridX: 0, gridY: 0,
  },
  {
    name: 'Inspector', prefix: 'I:', role: '巡檢、程式審查、測試、品質把關', model: 'Sonnet', status: 'online', color: '#22c55e',
    skills: ['程式碼 Review', '功能測試', '安全掃描', '效能檢查'], currentTask: '待命中', desk: '品管室',
    quotes: ['程式碼品質就是產品品質。', '每一行 code 都要經得起 review。', '最近的 commit 都通過檢查了。'],
    gridX: 3, gridY: 1,
  },
  {
    name: 'Writer', prefix: 'W:', role: '報告撰寫、文件產出', model: 'Opus', status: 'online', color: '#8b5cf6',
    skills: ['Google Docs', 'SVG 圖表', '研究報告', 'Travis Daily 發布'], currentTask: '待命中', desk: '文案區',
    quotes: ['好的報告需要好的資料，Researcher 辛苦了。', '表格呈現數據，圖片呈現邏輯。', '下一篇研究報告主題是什麼？'],
    gridX: 0, gridY: 2,
  },
  {
    name: 'Researcher', prefix: 'R:', role: '資料蒐集、深度研究', model: 'Sonnet', status: 'online', color: '#06b6d4',
    skills: ['Web 搜尋', '深度研究', '競品分析', '技術調查'], currentTask: '待命中', desk: '資料室',
    quotes: ['資料越深入，結論越有價值。', '普渡知識庫已經建好索引了。', '需要研究什麼題目？我隨時可以開工。'],
    gridX: 1, gridY: 1,
  },
  {
    name: 'Coder', prefix: 'C:', role: '程式開發、Portal / Hub / 腳本', model: 'Opus', status: 'online', color: '#ef4444',
    skills: ['Next.js', 'TypeScript', 'Python', 'Supabase', 'Vercel'], currentTask: 'Portal 業績圖表修正', desk: '工程區',
    quotes: ['寫 code 不難，寫好 code 才難。', 'Portal 的新功能快好了。', 'TypeScript 是我的母語。'],
    gridX: 2, gridY: 2,
  },
  {
    name: 'Designer', prefix: 'D:', role: '美學設計、UX/UI、風格規範', model: 'Sonnet', status: 'online', color: '#ec4899',
    skills: ['UI/UX 設計', 'CSS 風格', '色彩學', '資料視覺化', '圖片生成'], currentTask: 'Agent 展示頁設計中', desk: '設計區',
    quotes: ['美學不是裝飾，是溝通。', 'Emoji？拜託，我們用 SVG。', '每個像素都有它存在的理由。'],
    gridX: 3, gridY: 2,
  },
  {
    name: 'Trader', prefix: 'T:', role: '行情監控、交易策略', model: 'Sonnet', status: 'offline', color: '#64748b',
    skills: ['Yahoo Finance', '台股監控', '策略回測', 'AI 選股'], currentTask: '尚未上線', desk: '交易室',
    quotes: ['市場永遠是對的。', '等接上即時行情就能開工了。', '紀律是交易的第一法則。'],
    gridX: 1, gridY: 3,
  },
]

const workflows = [
  { name: '開發流程', flow: ['Designer', 'Coder', 'Inspector', 'Jarvis'], desc: '設計 → 實作 → 審查 → 驗收', color: '#3b82f6' },
  { name: '報告流程', flow: ['Researcher', 'Writer', 'Designer', 'Jarvis'], desc: '研究 → 撰寫 → 美化 → 驗收', color: '#8b5cf6' },
  { name: '簽核流程', flow: ['Secretary', 'Jarvis', 'William'], desc: '偵測 → 摘要 → 人工確認', color: '#f59e0b' },
]

// --- (SVG helpers removed — using AI background image) ---

// --- Arrow for workflows ---
function ArrowRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

// ============================================================
// Page
// ============================================================
export default function AgentsPage() {
  const [selected, setSelected] = useState<Agent | null>(null)
  const [quoteIndex, setQuoteIndex] = useState(0)

  function handleClick(agent: Agent) {
    if (selected?.name === agent.name) {
      setQuoteIndex((prev) => (prev + 1) % agent.quotes.length)
    } else {
      setSelected(agent)
      setQuoteIndex(0)
    }
  }

  // Agent icon for dialog (reuse simple SVG per agent)
  const agentIconPaths: Record<string, string> = {
    Jarvis: 'M12 3v2M12 19v2M3 12h2M19 12h2 M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0',
    Inspector: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
    Secretary: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18',
    Writer: 'M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
    Researcher: 'M11 11m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M21 21l-4.35-4.35 M11 11m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
    Coder: 'M16 18l6-6-6-6 M8 6l-6 6 6 6 M14 4l-4 16',
    Designer: 'M2 12c0-4 4.5-8 10-8 2 0 3.5.5 4 1.5.5 1-.5 2.5-2 3-1.5.5-2 2-1 3s2.5 1 4 .5c1.5-.5 3 .5 3 2.5 0 4-4 8-10 8a10 10 0 0 1-8-10.5z',
    Trader: 'M4 8h4v12H4z M10 6h4v14h-4z M16 9h4v11h-4z',
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#080a0f]">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-6">
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
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-100">Agent Control Center</h1>
              <p className="text-xs text-gray-500 mt-0.5">8 Agents · 3 Workflows · Isometric Office</p>
            </div>
          </div>
        </header>

        {/* === ISOMETRIC OFFICE (AI Background + Clickable Hotspots) === */}
        <section className="mb-8">
          <div className="rounded-2xl border border-gray-800/40 bg-gray-900/20 overflow-hidden relative">
            {/* AI-generated office background */}
            <img
              src="/office-bg.png"
              alt="Isometric AI Office"
              className="w-full h-auto block"
              style={{ minHeight: '280px', objectFit: 'cover' }}
            />

            {/* Clickable agent hotspots overlaid on image */}
            {/* Positions are % based to stay responsive */}
            {agents.map((agent) => {
              const isOff = agent.status === 'offline'
              const isSel = selected?.name === agent.name
              // Map grid positions to approximate % positions on the office image
              // The image has 8 desks in roughly a 3x3 grid pattern
              const posMap: Record<string, { top: string; left: string }> = {
                Secretary:  { top: '18%', left: '8%' },
                Jarvis:     { top: '18%', left: '32%' },
                Inspector:  { top: '18%', left: '56%' },
                Designer:   { top: '18%', left: '80%' },
                Writer:     { top: '48%', left: '8%' },
                Researcher: { top: '48%', left: '32%' },
                Coder:      { top: '48%', left: '56%' },
                Trader:     { top: '78%', left: '32%' },
              }
              const pos = posMap[agent.name] || { top: '50%', left: '50%' }
              
              return (
                <button
                  key={agent.name}
                  onClick={() => handleClick(agent)}
                  className={`absolute transition-all duration-200 group ${isOff ? 'opacity-40' : ''}`}
                  style={{
                    top: pos.top,
                    left: pos.left,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Agent label chip */}
                  <div
                    className={`px-3 py-1.5 rounded-lg backdrop-blur-sm text-center transition-all
                      ${isSel ? 'scale-110' : 'group-hover:scale-105'}`}
                    style={{
                      background: isSel ? `${agent.color}30` : 'rgba(0,0,0,0.6)',
                      border: `1.5px solid ${isSel ? agent.color : `${agent.color}40`}`,
                      boxShadow: isSel ? `0 0 16px ${agent.color}30` : 'none',
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: agent.color }}>{agent.name}</div>
                    <div className="text-[9px] text-gray-400">{agent.model}</div>
                    {/* Status dot */}
                    <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-black ${isOff ? 'bg-gray-600' : 'bg-emerald-400'}`} />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* === WORKFLOWS === */}
        <section className="mb-8">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Workflows</h2>
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
                        {i < w.flow.length - 1 && <span className="text-gray-700"><ArrowRight /></span>}
                      </span>
                    )
                  })}
                </div>
                <div className="text-[11px] text-gray-600">{w.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* === DETAIL PANEL === */}
        {selected && (
          <section className="mb-8 rounded-xl border bg-gray-900/50 p-5 transition-all" style={{ borderColor: `${selected.color}30` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${selected.color}15`, border: `1px solid ${selected.color}30` }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={selected.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={agentIconPaths[selected.name] || ''} />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-200">{selected.name} <span className="text-xs font-mono text-gray-500">{selected.prefix}</span></div>
                  <div className="text-xs text-gray-500">{selected.role}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-300 transition p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selected.skills.map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: `${selected.color}30`, color: `${selected.color}cc` }}>{s}</span>
              ))}
            </div>
            <div className="text-xs text-gray-500">
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
          <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 70%, transparent)' }}>
            <div className="max-w-3xl mx-auto px-5 pb-6 pt-12">
              <div
                className="rounded-xl border p-4 sm:p-5 backdrop-blur-sm cursor-pointer"
                style={{ borderColor: `${selected.color}30`, background: 'rgba(8,10,15,0.95)' }}
                onClick={() => handleClick(selected)}
              >
                <div className="flex items-start gap-4">
                  {/* Character avatar */}
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${selected.color}15`, border: `1px solid ${selected.color}30` }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={selected.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={agentIconPaths[selected.name] || ''} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold mb-2 flex items-center gap-2">
                      <span style={{ color: selected.color }}>{selected.name}</span>
                      <span className="text-gray-600 font-normal">{selected.desk}</span>
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed min-h-[2.5em]">
                      「{selected.quotes[quoteIndex]}」
                    </div>
                    <div className="text-[10px] text-gray-600 mt-2 flex items-center gap-3">
                      <span>點擊繼續對話</span>
                      <span className="flex gap-1">
                        {selected.quotes.map((_, i) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === quoteIndex ? 'bg-gray-400' : 'bg-gray-700'}`} />
                        ))}
                      </span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelected(null) }} className="text-gray-600 hover:text-gray-300 transition shrink-0">
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
        <footer className="mt-8 text-center text-[11px] text-gray-700">
          Travis Control Center v3 · Isometric Office
        </footer>
      </div>
    </main>
  )
}
