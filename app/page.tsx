const apps = [
  {
    name: 'Aurotek Portal',
    desc: '通路營業管理系統',
    url: 'https://aurotek-sales-portal.vercel.app',
    icon: '🏢',
    color: 'from-red-500/20 to-red-900/20',
    border: 'border-red-500/30',
    glow: 'hover:shadow-red-500/20',
    tag: '公司',
  },
  {
    name: 'Travis Daily',
    desc: 'AI 動態 · 研究報告 · 技術筆記',
    url: 'https://travis-daily.vercel.app',
    icon: '📰',
    color: 'from-blue-500/20 to-blue-900/20',
    border: 'border-blue-500/30',
    glow: 'hover:shadow-blue-500/20',
    tag: '專欄',
  },
  {
    name: 'Trading System',
    desc: '程式交易 · 策略回測 · 即時監控',
    url: '#',
    icon: '📈',
    color: 'from-emerald-500/20 to-emerald-900/20',
    border: 'border-emerald-500/30',
    glow: 'hover:shadow-emerald-500/20',
    tag: '開發中',
    disabled: true,
  },
  {
    name: 'Jarvis',
    desc: 'AI 助理控制台',
    url: '#',
    icon: '🤖',
    color: 'from-purple-500/20 to-purple-900/20',
    border: 'border-purple-500/30',
    glow: 'hover:shadow-purple-500/20',
    tag: '開發中',
    disabled: true,
  },
]

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg font-bold">
              W
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              William Hub
            </h1>
          </div>
          <p className="text-gray-500 text-sm sm:text-base">
            個人工作站 · 所有系統的入口
          </p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {apps.map((app) => {
            const Card = (
              <div
                key={app.name}
                className={`group relative rounded-2xl border ${app.border} bg-gradient-to-br ${app.color} 
                  p-5 sm:p-6 transition-all duration-300 
                  ${app.disabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer hover:scale-[1.02] hover:shadow-xl ${app.glow}`}`}
              >
                {/* Tag */}
                <div className="absolute top-4 right-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    app.disabled 
                      ? 'border-gray-700 text-gray-600' 
                      : 'border-gray-600 text-gray-400'
                  }`}>
                    {app.tag}
                  </span>
                </div>

                {/* Icon */}
                <div className="text-3xl mb-3">{app.icon}</div>

                {/* Info */}
                <h2 className="text-lg font-semibold text-gray-100 mb-1">{app.name}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{app.desc}</p>

                {/* Arrow */}
                {!app.disabled && (
                  <div className="absolute bottom-5 right-5 text-gray-600 group-hover:text-gray-300 transition-colors text-lg">
                    →
                  </div>
                )}
              </div>
            )

            if (app.disabled) return <div key={app.name}>{Card}</div>
            return (
              <a key={app.name} href={app.url} target="_blank" rel="noopener noreferrer">
                {Card}
              </a>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-700 text-xs">
          Built with ☕ and 🤖
        </div>
      </div>
    </main>
  )
}
