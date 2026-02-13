// ============================================================
// Agent Control Center — AI Art Isometric Office + Portraits
// ============================================================
'use client'

import { useState } from 'react'
import Image from 'next/image'

// --- Agent Data ---
interface Agent {
  name: string
  prefix: string
  role: string
  model: string
  status: 'online' | 'offline'
  color: string
  ringColor: string
  skills: string[]
  currentTask: string
  desk: string
  quotes: string[]
  // Position on office background (%)
  top: string
  left: string
}

const agents: Agent[] = [
  {
    name: 'Jarvis', prefix: 'J:', role: '總指揮、調度、審核、驗收', model: 'Opus',
    status: 'online', color: '#3b82f6', ringColor: '#3b82f6',
    skills: ['全局調度', '任務分配', '品質驗收', '記憶管理'],
    currentTask: '系統監控 + 任務調度', desk: '指揮中心',
    quotes: ['所有 Agent 狀態正常，系統運行中。', '今天的任務清單已更新，準備好了嗎？', '有什麼需要我調度的，說一聲。'],
    top: '22%', left: '22%',
  },
  {
    name: 'Secretary', prefix: 'S:', role: '郵件、行事曆、簽核通知', model: 'Sonnet',
    status: 'online', color: '#f59e0b', ringColor: '#f59e0b',
    skills: ['Zimbra 郵件', 'Google Calendar', 'EasyFlow 簽核', '會議排程'],
    currentTask: '待命中', desk: '前台',
    quotes: ['目前沒有待簽核的文件。', '下週行程已經整理好了。', '有新郵件進來我會第一時間通知。'],
    top: '22%', left: '42%',
  },
  {
    name: 'Inspector', prefix: 'I:', role: '巡檢、程式審查、測試、品質把關', model: 'Sonnet',
    status: 'online', color: '#22c55e', ringColor: '#22c55e',
    skills: ['程式碼 Review', '功能測試', '安全掃描', '效能檢查'],
    currentTask: '待命中', desk: '品管室',
    quotes: ['程式碼品質就是產品品質。', '每一行 code 都要經得起 review。', '最近的 commit 都通過檢查了。'],
    top: '22%', left: '62%',
  },
  {
    name: 'Designer', prefix: 'D:', role: '美學設計、UX/UI、風格規範', model: 'Sonnet',
    status: 'online', color: '#ec4899', ringColor: '#ec4899',
    skills: ['UI/UX 設計', 'CSS 風格', '色彩學', '資料視覺化', '圖片生成'],
    currentTask: 'Agent 展示頁設計中', desk: '設計區',
    quotes: ['美學不是裝飾，是溝通。', 'Emoji？拜託，我們用 SVG。', '每個像素都有它存在的理由。'],
    top: '22%', left: '82%',
  },
  {
    name: 'Writer', prefix: 'W:', role: '報告撰寫、文件產出', model: 'Opus',
    status: 'online', color: '#8b5cf6', ringColor: '#8b5cf6',
    skills: ['Google Docs', 'SVG 圖表', '研究報告', 'Travis Daily 發布'],
    currentTask: '待命中', desk: '文案區',
    quotes: ['好的報告需要好的資料，Researcher 辛苦了。', '表格呈現數據，圖片呈現邏輯。', '下一篇研究報告主題是什麼？'],
    top: '50%', left: '22%',
  },
  {
    name: 'Researcher', prefix: 'R:', role: '資料蒐集、深度研究', model: 'Sonnet',
    status: 'online', color: '#06b6d4', ringColor: '#06b6d4',
    skills: ['Web 搜尋', '深度研究', '競品分析', '技術調查'],
    currentTask: '待命中', desk: '資料室',
    quotes: ['資料越深入，結論越有價值。', '普渡知識庫已經建好索引了。', '需要研究什麼題目？我隨時可以開工。'],
    top: '50%', left: '42%',
  },
  {
    name: 'Coder', prefix: 'C:', role: '程式開發、Portal / Hub / 腳本', model: 'Opus',
    status: 'online', color: '#ef4444', ringColor: '#ef4444',
    skills: ['Next.js', 'TypeScript', 'Python', 'Supabase', 'Vercel'],
    currentTask: 'Portal 業績圖表修正', desk: '工程區',
    quotes: ['寫 code 不難，寫好 code 才難。', 'Portal 的新功能快好了。', 'TypeScript 是我的母語。'],
    top: '50%', left: '62%',
  },
  {
    name: 'Trader', prefix: 'T:', role: '行情監控、交易策略', model: 'Sonnet',
    status: 'offline', color: '#eab308', ringColor: '#eab308',
    skills: ['Yahoo Finance', '台股監控', '策略回測', 'AI 選股'],
    currentTask: '尚未上線', desk: '交易室',
    quotes: ['市場永遠是對的。', '等接上即時行情就能開工了。', '紀律是交易的第一法則。'],
    top: '50%', left: '82%',
  },
]

const workflows = [
  { name: '開發流程', flow: ['Designer', 'Coder', 'Inspector', 'Jarvis'], desc: '設計 → 實作 → 審查 → 驗收', color: '#3b82f6' },
  { name: '報告流程', flow: ['Researcher', 'Writer', 'Designer', 'Jarvis'], desc: '研究 → 撰寫 → 美化 → 驗收', color: '#8b5cf6' },
  { name: '簽核流程', flow: ['Secretary', 'Jarvis', 'William'], desc: '偵測 → 摘要 → 人工確認', color: '#f59e0b' },
]

function ArrowRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

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

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#080a0f]">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-500/[0.03] rounded-full blur-[200px]" />

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
              <p className="text-xs text-gray-500 mt-0.5">8 Agents · 3 Workflows · AI-Powered Office</p>
            </div>
          </div>
        </header>

        {/* === ISOMETRIC OFFICE === */}
        <section className="mb-8">
          <div className="rounded-2xl border border-gray-800/40 overflow-hidden relative"
            style={{ background: '#080a0f' }}>
            {/* Office background image */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <Image
                src="/agents-office.png"
                alt="Isometric AI Office"
                fill
                className="object-contain"
                priority
              />

              {/* Agent avatar hotspots */}
              {agents.map((agent) => {
                const isOff = agent.status === 'offline'
                const isSel = selected?.name === agent.name

                return (
                  <button
                    key={agent.name}
                    onClick={() => handleClick(agent)}
                    className={`absolute transition-all duration-300 group z-10 ${isOff ? 'opacity-50' : ''}`}
                    style={{
                      top: agent.top,
                      left: agent.left,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* Neon ring + portrait */}
                    <div
                      className={`relative rounded-full transition-all duration-300 ${isSel ? 'scale-125' : 'group-hover:scale-110'}`}
                      style={{ width: 'clamp(48px, 8vw, 80px)', height: 'clamp(48px, 8vw, 80px)' }}
                    >
                      {/* Glow ring */}
                      <div
                        className="absolute inset-[-3px] rounded-full transition-opacity duration-300"
                        style={{
                          background: `conic-gradient(from 0deg, ${agent.ringColor}, ${agent.ringColor}88, ${agent.ringColor})`,
                          opacity: isSel ? 1 : 0.6,
                          filter: isSel ? `drop-shadow(0 0 12px ${agent.ringColor}80)` : `drop-shadow(0 0 6px ${agent.ringColor}40)`,
                        }}
                      />
                      {/* Inner dark border */}
                      <div className="absolute inset-[1px] rounded-full bg-[#0a0c12]" />
                      {/* Portrait image */}
                      <div className="absolute inset-[3px] rounded-full overflow-hidden">
                        <Image
                          src={`/avatars/${agent.name.toLowerCase()}.png`}
                          alt={agent.name}
                          fill
                          className="object-cover scale-[1.35]"
                        />
                      </div>
                      {/* Status dot */}
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0c12] z-20 ${isOff ? 'bg-gray-600' : 'bg-emerald-400'}`}
                        style={!isOff ? { boxShadow: '0 0 6px #22c55e80' } : {}}
                      />
                    </div>
                    {/* Name label below avatar */}
                    <div
                      className="mt-1 text-center text-[10px] sm:text-xs font-bold tracking-wide uppercase"
                      style={{
                        color: isSel ? agent.color : `${agent.color}99`,
                        textShadow: `0 0 8px ${agent.color}40`,
                      }}
                    >
                      {agent.name}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* === GALGAME DIALOG === */}
        {selected && (
          <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div
              className="rounded-xl border p-4 sm:p-5 backdrop-blur-sm"
              style={{ borderColor: `${selected.color}30`, background: 'rgba(8,10,15,0.9)' }}
            >
              <div className="flex items-start gap-4">
                {/* Character avatar in dialog */}
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 relative"
                  style={{ border: `2px solid ${selected.color}40` }}
                >
                  <Image
                    src={`/avatars/${selected.name.toLowerCase()}.png`}
                    alt={selected.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold mb-1 flex items-center gap-2">
                    <span style={{ color: selected.color }}>{selected.name}</span>
                    <span className="text-gray-600 font-normal font-mono">{selected.prefix}</span>
                    <span className="text-gray-700">·</span>
                    <span className="text-gray-600 font-normal">{selected.desk}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">{selected.role}</div>
                  <div
                    className="text-sm sm:text-base text-gray-200 leading-relaxed min-h-[2.5em] cursor-pointer"
                    onClick={() => handleClick(selected)}
                  >
                    「{selected.quotes[quoteIndex]}」
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {selected.skills.map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border"
                          style={{ borderColor: `${selected.color}25`, color: `${selected.color}aa` }}>{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-600 shrink-0 ml-4">
                      <span className="flex gap-1">
                        {selected.quotes.map((_, i) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === quoteIndex ? 'bg-gray-400' : 'bg-gray-700'}`} />
                        ))}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); setSelected(null) }} className="text-gray-600 hover:text-gray-300 transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Task bar */}
              <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${selected.status === 'online' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                <span className="text-gray-500">{selected.model}</span>
                <span className="text-gray-700">·</span>
                <span className="text-gray-400">{selected.currentTask}</span>
              </div>
            </div>
          </section>
        )}

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
                        <span className="px-2 py-0.5 rounded border text-[11px]"
                          style={{
                            borderColor: agent ? `${agent.color}30` : 'rgba(107,114,128,0.3)',
                            color: agent ? agent.color : '#9ca3af',
                          }}>{name}</span>
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

        {/* Footer */}
        <footer className="mt-8 text-center text-[11px] text-gray-700">
          Travis Control Center v4 · AI-Powered Office
        </footer>
      </div>
    </main>
  )
}
