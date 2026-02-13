// ============================================================
// Agent Control Center — /agents
// ============================================================

const agents = [
  {
    name: 'Jarvis',
    prefix: 'J:',
    role: '總指揮、調度、審核、驗收',
    model: 'Opus',
    status: 'online' as const,
    color: '#3b82f6',
    skills: ['全局調度', '任務分配', '品質驗收', '記憶管理'],
    currentTask: '系統監控 + 任務調度',
  },
  {
    name: 'Inspector',
    prefix: 'I:',
    role: '巡檢、程式審查、測試、品質把關',
    model: 'Sonnet',
    status: 'online' as const,
    color: '#22c55e',
    skills: ['程式碼 Review', '功能測試', '安全掃描', '效能檢查'],
    currentTask: '待命中',
  },
  {
    name: 'Secretary',
    prefix: 'S:',
    role: '郵件、行事曆、簽核通知',
    model: 'Sonnet',
    status: 'online' as const,
    color: '#f59e0b',
    skills: ['Zimbra 郵件', 'Google Calendar', 'EasyFlow 簽核', '會議排程'],
    currentTask: '待命中',
  },
  {
    name: 'Writer',
    prefix: 'W:',
    role: '報告撰寫、文件產出',
    model: 'Opus',
    status: 'online' as const,
    color: '#8b5cf6',
    skills: ['Google Docs', 'SVG 圖表', '研究報告', 'Travis Daily 發布'],
    currentTask: '待命中',
  },
  {
    name: 'Researcher',
    prefix: 'R:',
    role: '資料蒐集、深度研究',
    model: 'Sonnet',
    status: 'online' as const,
    color: '#06b6d4',
    skills: ['Web 搜尋', '深度研究', '競品分析', '技術調查'],
    currentTask: '待命中',
  },
  {
    name: 'Coder',
    prefix: 'C:',
    role: '程式開發、Portal / Hub / 腳本',
    model: 'Opus',
    status: 'online' as const,
    color: '#ef4444',
    skills: ['Next.js', 'TypeScript', 'Python', 'Supabase', 'Vercel'],
    currentTask: 'Portal 業績圖表修正',
  },
  {
    name: 'Designer',
    prefix: 'D:',
    role: '美學設計、UX/UI、風格規範',
    model: 'Sonnet',
    status: 'online' as const,
    color: '#ec4899',
    skills: ['UI/UX 設計', 'CSS 風格', '色彩學', '資料視覺化', '圖片生成'],
    currentTask: 'Agent 辦公室展示頁設計',
  },
  {
    name: 'Trader',
    prefix: 'T:',
    role: '行情監控、交易策略',
    model: 'Sonnet',
    status: 'offline' as const,
    color: '#64748b',
    skills: ['Yahoo Finance', '台股監控', '策略回測', 'AI 選股'],
    currentTask: '尚未上線',
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

// --- Agent SVG Icons (stroke-based, unified 24x24 viewBox) ---
function IconJarvis({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v2" /><path d="M12 19v2" />
      <path d="M3 12h2" /><path d="M19 12h2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9v6" /><path d="M9 12h6" />
    </svg>
  )
}

function IconInspector({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function IconSecretary({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
      <path d="M8 18h.01" /><path d="M12 18h.01" />
    </svg>
  )
}

function IconWriter({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      <path d="M15 5l4 4" />
    </svg>
  )
}

function IconResearcher({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <circle cx="11" cy="11" r="3" />
    </svg>
  )
}

function IconCoder({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  )
}

function IconDesigner({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12c0-4 4.5-8 10-8 2 0 3.5.5 4 1.5.5 1-.5 2.5-2 3-1.5.5-2 2-1 3s2.5 1 4 .5c1.5-.5 3 .5 3 2.5 0 4-4 8-10 8a10 10 0 0 1-8-10.5z" />
      <circle cx="7.5" cy="11.5" r="1" fill={color} />
      <circle cx="12" cy="8" r="1" fill={color} />
      <circle cx="10" cy="15" r="1" fill={color} />
    </svg>
  )
}

function IconTrader({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="16" x2="6" y2="8" /><line x1="6" y1="6" x2="6" y2="4" />
      <line x1="6" y1="20" x2="6" y2="18" />
      <rect x="4" y="8" width="4" height="8" rx="0.5" />
      <line x1="12" y1="14" x2="12" y2="6" /><line x1="12" y1="4" x2="12" y2="3" />
      <line x1="12" y1="18" x2="12" y2="16" />
      <rect x="10" y="6" width="4" height="8" rx="0.5" />
      <line x1="18" y1="17" x2="18" y2="9" /><line x1="18" y1="7" x2="18" y2="5" />
      <line x1="18" y1="21" x2="18" y2="19" />
      <rect x="16" y="9" width="4" height="8" rx="0.5" />
    </svg>
  )
}

function IconControlCenter({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <circle cx="8" cy="10" r="2" />
      <circle cx="16" cy="10" r="2" />
      <path d="M8 8v0" /><path d="M16 8v0" />
      <line x1="10" y1="10" x2="14" y2="10" />
    </svg>
  )
}

const agentIconMap: Record<string, React.FC<{ color: string }>> = {
  Jarvis: IconJarvis,
  Inspector: IconInspector,
  Secretary: IconSecretary,
  Writer: IconWriter,
  Researcher: IconResearcher,
  Coder: IconCoder,
  Designer: IconDesigner,
  Trader: IconTrader,
}

export default function AgentsPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-10">
          <a href="/" className="text-gray-500 text-sm hover:text-gray-300 transition mb-3 inline-block">← William Hub</a>
          <div className="flex items-center gap-3">
            <IconControlCenter color="#3b82f6" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agent Control Center</h1>
          </div>
          <p className="text-gray-500 mt-1">8 Agents · 3 Workflows · 1 Commander</p>
        </header>

        {/* Workflows */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Workflows</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {workflows.map((w) => (
              <div key={w.name} className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                <div className="text-sm font-semibold mb-2" style={{ color: w.color }}>{w.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                  {w.flow.map((agent, i) => (
                    <span key={agent} className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300">{agent}</span>
                      {i < w.flow.length - 1 && <span className="text-gray-600">→</span>}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-600">{w.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Agent Grid */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Agents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agents.map((a) => (
              <div
                key={a.name}
                className={`rounded-xl border bg-gray-900/40 p-5 transition-all ${
                  a.status === 'offline' ? 'opacity-40 border-gray-800/40' : 'border-gray-800/60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${a.color}15`, border: `1px solid ${a.color}30` }}
                    >
                      {agentIconMap[a.name]?.({ color: a.color })}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-200 flex items-center gap-2">
                        {a.name}
                        <span className="text-xs font-mono text-gray-500">{a.prefix}</span>
                      </div>
                      <div className="text-xs text-gray-500">{a.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${a.status === 'online' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-mono">
                      {a.model}
                    </span>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {a.skills.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{ borderColor: `${a.color}30`, color: `${a.color}cc` }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Current Task */}
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="text-gray-600">Task:</span>
                  <span className={a.currentTask === '待命中' || a.currentTask === '尚未上線' ? 'text-gray-600' : 'text-gray-300'}>
                    {a.currentTask}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-12 text-center text-xs text-gray-700">
          Travis Control Center v1
        </footer>
      </div>
    </main>
  )
}
