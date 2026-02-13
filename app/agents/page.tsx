// ============================================================
// Agent Control Center — Card Grid (Practical Dashboard)
// ============================================================
'use client'

import { useState } from 'react'
import Image from 'next/image'

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
}

const agents: Agent[] = [
  {
    name: 'Jarvis', prefix: 'J:', role: '總指揮、調度、審核、驗收', model: 'Opus',
    status: 'online', color: '#3b82f6',
    skills: ['全局調度', '任務分配', '品質驗收', '記憶管理'],
    currentTask: '系統監控 + 任務調度', desk: '指揮中心',
    quotes: ['所有 Agent 狀態正常，系統運行中。', '今天的任務清單已更新，準備好了嗎？', '有什麼需要我調度的，說一聲。'],
  },
  {
    name: 'Secretary', prefix: 'S:', role: '郵件、行事曆、簽核通知', model: 'Sonnet',
    status: 'online', color: '#f59e0b',
    skills: ['Zimbra 郵件', 'Google Calendar', 'EasyFlow 簽核', '會議排程'],
    currentTask: '待命中', desk: '前台',
    quotes: ['目前沒有待簽核的文件。', '下週行程已經整理好了。', '有新郵件進來我會第一時間通知。'],
  },
  {
    name: 'Inspector', prefix: 'I:', role: '巡檢、程式審查、測試、品質把關', model: 'Sonnet',
    status: 'online', color: '#22c55e',
    skills: ['程式碼 Review', '功能測試', '安全掃描', '效能檢查'],
    currentTask: '待命中', desk: '品管室',
    quotes: ['程式碼品質就是產品品質。', '每一行 code 都要經得起 review。', '最近的 commit 都通過檢查了。'],
  },
  {
    name: 'Designer', prefix: 'D:', role: '美學設計、UX/UI、風格規範', model: 'Sonnet',
    status: 'online', color: '#ec4899',
    skills: ['UI/UX 設計', 'CSS 風格', '色彩學', '資料視覺化', '圖片生成'],
    currentTask: 'Agent 展示頁設計中', desk: '設計區',
    quotes: ['美學不是裝飾，是溝通。', 'Emoji？拜託，我們用 SVG。', '每個像素都有它存在的理由。'],
  },
  {
    name: 'Writer', prefix: 'W:', role: '報告撰寫、文件產出', model: 'Opus',
    status: 'online', color: '#8b5cf6',
    skills: ['Google Docs', 'SVG 圖表', '研究報告', 'Travis Daily 發布'],
    currentTask: '待命中', desk: '文案區',
    quotes: ['好的報告需要好的資料，Researcher 辛苦了。', '表格呈現數據，圖片呈現邏輯。', '下一篇研究報告主題是什麼？'],
  },
  {
    name: 'Researcher', prefix: 'R:', role: '資料蒐集、深度研究', model: 'Sonnet',
    status: 'online', color: '#06b6d4',
    skills: ['Web 搜尋', '深度研究', '競品分析', '技術調查'],
    currentTask: '待命中', desk: '資料室',
    quotes: ['資料越深入，結論越有價值。', '普渡知識庫已經建好索引了。', '需要研究什麼題目？我隨時可以開工。'],
  },
  {
    name: 'Coder', prefix: 'C:', role: '程式開發、Portal / Hub / 腳本', model: 'Opus',
    status: 'online', color: '#ef4444',
    skills: ['Next.js', 'TypeScript', 'Python', 'Supabase', 'Vercel'],
    currentTask: 'Portal 業績圖表修正', desk: '工程區',
    quotes: ['寫 code 不難，寫好 code 才難。', 'Portal 的新功能快好了。', 'TypeScript 是我的母語。'],
  },
  {
    name: 'Trader', prefix: 'T:', role: '行情監控、交易策略', model: 'Sonnet',
    status: 'offline', color: '#eab308',
    skills: ['Yahoo Finance', '台股監控', '策略回測', 'AI 選股'],
    currentTask: '尚未上線', desk: '交易室',
    quotes: ['市場永遠是對的。', '等接上即時行情就能開工了。', '紀律是交易的第一法則。'],
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
  const [quoteIdx, setQuoteIdx] = useState(0)

  function handleSelect(agent: Agent) {
    if (selected?.name === agent.name) {
      setQuoteIdx((i) => (i + 1) % agent.quotes.length)
    } else {
      setSelected(agent)
      setQuoteIdx(0)
    }
  }

  return (
    <main className="min-h-screen bg-[#080a0f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <a href="/" className="text-gray-500 text-sm hover:text-gray-300 transition mb-3 inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            William Hub
          </a>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-100">Agent Control Center</h1>
                <p className="text-xs text-gray-500 mt-0.5">8 Agents · 3 Workflows</p>
              </div>
            </div>
            <a href="/agents/showcase" className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-lg border border-gray-800/50 hover:border-gray-700/50">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1.5 -mt-0.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Showcase
            </a>
          </div>
        </header>

        {/* Agent Cards Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {agents.map((agent) => {
              const isOff = agent.status === 'offline'
              const isSel = selected?.name === agent.name

              return (
                <button
                  key={agent.name}
                  onClick={() => handleSelect(agent)}
                  className={`relative text-left rounded-xl border p-4 transition-all duration-200 group
                    ${isSel ? 'ring-1' : 'hover:border-gray-700/60'}
                    ${isOff ? 'opacity-50' : ''}`}
                  style={{
                    borderColor: isSel ? `${agent.color}50` : 'rgba(31,41,55,0.4)',
                    background: isSel ? `${agent.color}08` : 'rgba(17,24,39,0.3)',
                    ringColor: isSel ? `${agent.color}30` : undefined,
                  }}
                >
                  {/* Top: Avatar + Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0"
                      style={{ border: `2px solid ${agent.color}50` }}>
                      <Image
                        src={`/avatars/${agent.name.toLowerCase()}.png`}
                        alt={agent.name}
                        fill
                        className="object-cover scale-[1.35]"
                      />
                      {/* Status dot */}
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111827] z-10 
                        ${isOff ? 'bg-gray-600' : 'bg-emerald-400'}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-200 flex items-center gap-1.5">
                        {agent.name}
                        <span className="text-[10px] font-mono text-gray-500">{agent.prefix}</span>
                      </div>
                      <div className="text-[11px] text-gray-500">{agent.model}</div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="text-xs text-gray-400 mb-2 line-clamp-1">{agent.role}</div>

                  {/* Current Task */}
                  <div className="text-[11px] text-gray-600 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOff ? 'bg-gray-700' : 'bg-emerald-500/60'}`} />
                    <span className="truncate">{agent.currentTask}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Detail Panel */}
        {selected && (
          <section className="mb-8 rounded-xl border p-5 transition-all"
            style={{ borderColor: `${selected.color}25`, background: 'rgba(17,24,39,0.4)' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden"
                  style={{ border: `2px solid ${selected.color}40` }}>
                  <Image
                    src={`/avatars/${selected.name.toLowerCase()}.png`}
                    alt={selected.name}
                    fill
                    className="object-cover scale-[1.35]"
                  />
                </div>
                <div>
                  <div className="font-semibold text-gray-200 flex items-center gap-2">
                    {selected.name}
                    <span className="text-xs font-mono text-gray-500">{selected.prefix}</span>
                    <span className="text-xs text-gray-600">· {selected.desk}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{selected.role}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-300 transition p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selected.skills.map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ borderColor: `${selected.color}25`, color: `${selected.color}aa` }}>{s}</span>
              ))}
            </div>

            {/* Quote (Galgame style) */}
            <div
              className="rounded-lg p-3 cursor-pointer transition-colors hover:bg-white/[0.02]"
              style={{ background: `${selected.color}06`, border: `1px solid ${selected.color}15` }}
              onClick={() => handleSelect(selected)}
            >
              <div className="text-sm text-gray-300 leading-relaxed">
                「{selected.quotes[quoteIdx]}」
              </div>
              <div className="text-[10px] text-gray-600 mt-2 flex items-center gap-2">
                點擊切換台詞
                <span className="flex gap-1">
                  {selected.quotes.map((_, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === quoteIdx ? 'bg-gray-400' : 'bg-gray-700'}`} />
                  ))}
                </span>
              </div>
            </div>

            {/* Status bar */}
            <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${selected.status === 'online' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
              <span className="text-gray-500">{selected.model}</span>
              <span className="text-gray-700">·</span>
              <span className="text-gray-400">{selected.currentTask}</span>
            </div>
          </section>
        )}

        {/* Workflows */}
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
        <footer className="text-center text-[11px] text-gray-700">
          Travis Control Center v5 · Card Dashboard
        </footer>
      </div>
    </main>
  )
}
