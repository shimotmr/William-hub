// ============================================================
// Gamification Dashboard — Leaderboard, Achievements, XP, Heatmap
// ============================================================
'use client'

import {
  ArrowLeft, Trophy, Medal, Star, Flame, Target, Zap,
  Crown, Award, TrendingUp, BarChart3, Clock, Keyboard,
  RefreshCw, ChevronDown, Sparkles
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'

// ── Types ──
interface LevelInfo {
  level: number
  title: string
  icon: string
  xpRequired: number
  currentXP: number
  nextLevelXP: number
  progress: number
}

interface Achievement {
  id: string
  name: string
  desc: string
  icon: string
}

interface AgentEntry {
  rank: number
  name: string
  color: string
  emoji: string
  title: string
  prefix: string
  periodTasks: number
  totalTasks: number
  reports: number
  maxDailyTasks: number
  p0Completed: number
  xp: number
  level: LevelInfo
  achievements: Achievement[]
  achievementCount: number
}

interface GamificationData {
  period: string
  periodLabel: string
  summary: {
    totalAgents: number
    totalTasks: number
    totalReports: number
    totalAchievements: number
    possibleAchievements: number
  }
  leaderboard: AgentEntry[]
  achievementDefs: Achievement[]
  levels: Array<{ level: number; title: string; xpRequired: number; icon: string }>
}

interface HeatmapData {
  days: number
  totalEvents: number
  heatmap: {
    data: number[][]
    dayLabels: string[]
    maxValue: number
  }
  peakTime: { hour: number; day: string; dayIndex: number; label: string }
  featureUsage: Array<{ name: string; count: number; percentage: number }>
  dailyTrend: Array<{ date: string; label: string; count: number }>
  suggestions: Array<{ key: string; action: string; reason: string }>
  hourTotals: number[]
  dayTotals: number[]
}

// ── Helpers ──
function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

const RANK_STYLES = [
  { bg: 'from-yellow-500/20 to-amber-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: Crown },
  { bg: 'from-slate-300/15 to-gray-400/10', border: 'border-slate-400/30', text: 'text-slate-300', icon: Medal },
  { bg: 'from-amber-700/15 to-orange-600/10', border: 'border-amber-600/30', text: 'text-amber-500', icon: Award },
]

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'rgba(139,92,246,0.04)'
  const intensity = value / max
  if (intensity > 0.75) return 'rgba(139,92,246,0.7)'
  if (intensity > 0.5) return 'rgba(139,92,246,0.45)'
  if (intensity > 0.25) return 'rgba(139,92,246,0.25)'
  return 'rgba(139,92,246,0.1)'
}

const featureColors: Record<string, string> = {
  '任務管理': '#3b82f6',
  '報告產出': '#8b5cf6',
  '程式開發': '#10b981',
  '研究分析': '#f59e0b',
  '系統監控': '#06b6d4',
  '部署發佈': '#ef4444',
  '安全審查': '#ec4899',
  '交易系統': '#14b8a6',
}

// ============================================================
export default function GamificationPage() {
  const [data, setData] = useState<GamificationData | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week')
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements' | 'heatmap'>('leaderboard')

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const [gamRes, heatRes] = await Promise.all([
        fetch(`/api/gamification?period=${period}`),
        fetch('/api/analytics/heatmap?days=30'),
      ])
      const gamJson = await gamRes.json()
      const heatJson = await heatRes.json()
      if (gamJson.status === 'success') setData(gamJson.data)
      if (heatJson.status === 'success') setHeatmap(heatJson.data)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <div className="text-sm text-foreground-muted">載入遊戲化數據...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-0 left-1/4 w-[400px] h-[250px] bg-purple-500/[0.04] rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-blue-500/[0.03] rounded-full blur-[80px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <a href="/" className="text-foreground-muted text-sm hover:text-foreground transition mb-3 inline-flex items-center gap-1.5">
            <ArrowLeft size={14} />
            William Hub
          </a>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Trophy size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Agent 遊戲化中心</h1>
                <p className="text-xs text-foreground-muted mt-0.5">排行榜 · 成就 · 等級 · 行為分析</p>
              </div>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 rounded-lg border border-border text-foreground-muted hover:text-foreground hover:border-border-strong transition disabled:opacity-40"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        {data && (
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: '活躍 Agents', value: data.summary.totalAgents, icon: Zap, color: '#8b5cf6' },
              { label: `${data.periodLabel}任務`, value: data.summary.totalTasks, icon: Target, color: '#10b981' },
              { label: '累計報告', value: data.summary.totalReports, icon: BarChart3, color: '#3b82f6' },
              { label: '已解鎖成就', value: data.summary.totalAchievements, icon: Star, color: '#f59e0b' },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon size={14} style={{ color: card.color }} />
                  <span className="text-[11px] text-foreground-muted uppercase tracking-wider">{card.label}</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{formatNumber(card.value)}</div>
              </div>
            ))}
          </section>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 border-b border-border">
          {[
            { key: 'leaderboard' as const, label: '排行榜', icon: Trophy },
            { key: 'achievements' as const, label: '成就系統', icon: Star },
            { key: 'heatmap' as const, label: '行為分析', icon: Flame },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════ LEADERBOARD TAB ═══════════════ */}
        {activeTab === 'leaderboard' && data && (
          <section>
            {/* Period Selector */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
                <Crown size={14} className="text-yellow-400" />
                {data.periodLabel}排行榜
              </h2>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {([['week', '週'], ['month', '月'], ['quarter', '季']] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setPeriod(k)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      period === k
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-transparent text-foreground-muted hover:bg-accent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Top 3 Podium */}
            {data.leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[1, 0, 2].map((idx) => {
                  const agent = data.leaderboard[idx]
                  if (!agent) return null
                  const style = RANK_STYLES[idx]
                  const isCenter = idx === 0
                  return (
                    <div
                      key={agent.name}
                      className={`relative rounded-xl border p-4 sm:p-5 text-center bg-gradient-to-b ${style.bg} ${style.border} ${
                        isCenter ? 'sm:-mt-2 sm:pb-6' : ''
                      }`}
                    >
                      {/* Rank badge */}
                      <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${style.text}`}
                        style={{ background: 'hsl(var(--card))' , border: '2px solid currentColor' }}>
                        {agent.rank}
                      </div>

                      {/* Avatar */}
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden mx-auto mt-2 mb-3"
                        style={{ border: `3px solid ${agent.color}60` }}>
                        <Image
                          src={`/avatars/${agent.name.toLowerCase()}.png`}
                          alt={agent.name}
                          fill
                          className="object-cover scale-[1.35]"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>

                      <div className="font-bold text-sm text-foreground">{agent.name}</div>
                      <div className="text-[10px] text-foreground-muted mt-0.5">{agent.level.icon} Lv.{agent.level.level} {agent.level.title}</div>

                      <div className="mt-3 flex items-center justify-center gap-1.5">
                        <span className="text-xl font-bold" style={{ color: agent.color }}>{agent.periodTasks}</span>
                        <span className="text-[10px] text-foreground-subtle">任務</span>
                      </div>

                      <div className="mt-2 flex justify-center gap-1">
                        {agent.achievements.slice(0, 4).map(a => (
                          <span key={a.id} title={a.name} className="text-sm">{a.icon}</span>
                        ))}
                        {agent.achievementCount > 4 && (
                          <span className="text-[10px] text-foreground-subtle">+{agent.achievementCount - 4}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Full Rankings Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="divide-y divide-border">
                {data.leaderboard.map((agent) => (
                  <div key={agent.name}>
                    <button
                      onClick={() => setExpandedAgent(expandedAgent === agent.name ? null : agent.name)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                    >
                      {/* Rank */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        agent.rank <= 3 ? RANK_STYLES[agent.rank - 1]?.text || 'text-foreground-muted' : 'text-foreground-muted'
                      }`}
                        style={{ background: agent.rank <= 3 ? `${agent.color}15` : 'hsl(var(--accent))' }}
                      >
                        {agent.rank}
                      </div>

                      {/* Avatar */}
                      <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0"
                        style={{ border: `2px solid ${agent.color}50` }}>
                        <Image
                          src={`/avatars/${agent.name.toLowerCase()}.png`}
                          alt={agent.name}
                          fill
                          className="object-cover scale-[1.35]"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{agent.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-foreground-muted">
                            {agent.level.icon} Lv.{agent.level.level}
                          </span>
                        </div>
                        <div className="text-[11px] text-foreground-subtle">{agent.title}</div>
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-4 text-xs">
                        <div className="text-center">
                          <div className="font-bold text-foreground">{agent.periodTasks}</div>
                          <div className="text-[10px] text-foreground-subtle">{data.periodLabel}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-foreground">{agent.totalTasks}</div>
                          <div className="text-[10px] text-foreground-subtle">累計</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-foreground">{agent.reports}</div>
                          <div className="text-[10px] text-foreground-subtle">報告</div>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold" style={{ color: agent.color }}>{formatNumber(agent.xp)} XP</div>
                        <div className="text-[10px] text-foreground-subtle">{agent.achievementCount} 成就</div>
                      </div>

                      <ChevronDown size={14} className={`text-foreground-subtle transition-transform ${
                        expandedAgent === agent.name ? 'rotate-180' : ''
                      }`} />
                    </button>

                    {/* Expanded Detail */}
                    {expandedAgent === agent.name && (
                      <div className="px-4 pb-4 pt-0 border-t border-border bg-accent/30">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                          {/* XP & Level */}
                          <div>
                            <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">等級進度</div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{agent.level.icon}</span>
                              <div>
                                <div className="font-bold text-foreground">Lv.{agent.level.level} {agent.level.title}</div>
                                <div className="text-[11px] text-foreground-muted">{agent.xp} / {agent.level.nextLevelXP} XP</div>
                              </div>
                            </div>
                            <div className="h-2 bg-accent rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                  width: `${agent.level.progress}%`,
                                  background: `linear-gradient(90deg, ${agent.color}, ${agent.color}aa)`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Stats */}
                          <div>
                            <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">數據</div>
                            <div className="space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-foreground-muted">單日最高</span>
                                <span className="font-medium text-foreground">{agent.maxDailyTasks} 個任務</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground-muted">P0 完成</span>
                                <span className="font-medium text-foreground">{agent.p0Completed}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground-muted">報告產出</span>
                                <span className="font-medium text-foreground">{agent.reports}</span>
                              </div>
                            </div>
                          </div>

                          {/* Achievements */}
                          <div>
                            <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">成就 ({agent.achievementCount})</div>
                            <div className="flex flex-wrap gap-1.5">
                              {agent.achievements.map(a => (
                                <span
                                  key={a.id}
                                  title={`${a.name}: ${a.desc}`}
                                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-accent border border-border"
                                >
                                  <span>{a.icon}</span>
                                  <span className="text-foreground-muted">{a.name}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════ ACHIEVEMENTS TAB ═══════════════ */}
        {activeTab === 'achievements' && data && (
          <section>
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2 mb-5">
              <Sparkles size={14} className="text-yellow-400" />
              成就圖鑑
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.achievementDefs.map(achievement => {
                const unlockedBy = data.leaderboard.filter(a => a.achievements.some(aa => aa.id === achievement.id))
                const isUnlocked = unlockedBy.length > 0

                return (
                  <div
                    key={achievement.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isUnlocked
                        ? 'border-yellow-500/20 bg-yellow-500/[0.03]'
                        : 'border-border bg-card opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-3xl ${isUnlocked ? '' : 'grayscale'}`}>{achievement.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-foreground">{achievement.name}</div>
                        <div className="text-[11px] text-foreground-muted mt-0.5">{achievement.desc}</div>

                        {isUnlocked && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {unlockedBy.map(agent => (
                              <span key={agent.name} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{ background: `${agent.color}15`, color: agent.color }}>
                                {agent.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {!isUnlocked && (
                          <div className="mt-2 text-[10px] text-foreground-disabled">🔒 尚未解鎖</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Level System Reference */}
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-purple-400" />
                等級系統
              </h2>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
                  {data.levels.map(lvl => {
                    const agentsAtLevel = data.leaderboard.filter(a => a.level.level === lvl.level)
                    return (
                      <div key={lvl.level} className="bg-card p-4 text-center">
                        <div className="text-2xl mb-1">{lvl.icon}</div>
                        <div className="font-bold text-sm text-foreground">Lv.{lvl.level}</div>
                        <div className="text-xs text-foreground-muted">{lvl.title}</div>
                        <div className="text-[10px] text-foreground-subtle mt-1">
                          {lvl.xpRequired > 0 ? `${formatNumber(lvl.xpRequired)} XP` : '起始'}
                        </div>
                        {agentsAtLevel.length > 0 && (
                          <div className="mt-2 flex justify-center gap-1">
                            {agentsAtLevel.map(a => (
                              <div key={a.name} className="w-5 h-5 rounded-full overflow-hidden relative"
                                style={{ border: `1.5px solid ${a.color}` }}>
                                <Image
                                  src={`/avatars/${a.name.toLowerCase()}.png`}
                                  alt={a.name}
                                  fill
                                  className="object-cover scale-[1.35]"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════ HEATMAP TAB ═══════════════ */}
        {activeTab === 'heatmap' && heatmap && (
          <section>
            {/* Activity Heatmap */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2 mb-4">
                <Clock size={14} className="text-cyan-400" />
                活動時段熱點圖
              </h2>
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5 overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Hour labels */}
                  <div className="flex ml-8 mb-1">
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="flex-1 text-center text-[9px] text-foreground-disabled">
                        {h % 3 === 0 ? `${h}` : ''}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap grid */}
                  {heatmap.heatmap.data.map((row, dayIdx) => (
                    <div key={dayIdx} className="flex items-center gap-1 mb-1">
                      <span className="w-7 text-[11px] text-foreground-muted text-right shrink-0">
                        {heatmap.heatmap.dayLabels[dayIdx]}
                      </span>
                      <div className="flex-1 flex gap-px">
                        {row.map((value, hourIdx) => (
                          <div
                            key={hourIdx}
                            className="flex-1 aspect-square rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-primary/40"
                            style={{ background: getHeatColor(value, heatmap.heatmap.maxValue) }}
                            title={`週${heatmap.heatmap.dayLabels[dayIdx]} ${hourIdx}:00 — ${value} 個任務完成`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Legend */}
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <span className="text-[10px] text-foreground-subtle">少</span>
                    {[0.04, 0.1, 0.25, 0.45, 0.7].map((opacity, i) => (
                      <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(139,92,246,${opacity})` }} />
                    ))}
                    <span className="text-[10px] text-foreground-subtle">多</span>
                  </div>
                </div>

                {/* Peak info */}
                <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-4 text-sm">
                  <div>
                    <span className="text-foreground-muted">尖峰時段：</span>
                    <span className="font-bold text-foreground">{heatmap.peakTime.label}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">30 天完成：</span>
                    <span className="font-bold text-foreground">{heatmap.totalEvents} 個任務</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Trend */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-green-400" />
                每日完成趨勢
              </h2>
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <div className="flex items-end gap-1 h-32">
                  {heatmap.dailyTrend.map((day) => {
                    const maxCount = Math.max(...heatmap.dailyTrend.map(d => d.count), 1)
                    const height = (day.count / maxCount) * 100
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-foreground-subtle font-mono">{day.count || ''}</span>
                        <div
                          className="w-full rounded-t transition-all duration-500 hover:opacity-80"
                          style={{
                            height: `${Math.max(height, 2)}%`,
                            background: day.count > 0
                              ? `linear-gradient(180deg, rgba(139,92,246,0.7), rgba(139,92,246,0.3))`
                              : 'rgba(139,92,246,0.05)',
                          }}
                          title={`${day.date}: ${day.count} 個任務`}
                        />
                        <span className="text-[8px] text-foreground-disabled -rotate-45 origin-top-left">{day.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Feature Usage & Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Feature Usage */}
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2 mb-4">
                  <BarChart3 size={12} />
                  功能使用頻率
                </h3>
                <div className="space-y-3">
                  {heatmap.featureUsage.filter(f => f.count > 0).map(feature => (
                    <div key={feature.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground">{feature.name}</span>
                        <span className="text-foreground-muted">{feature.count} ({feature.percentage}%)</span>
                      </div>
                      <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${feature.percentage}%`,
                            background: featureColors[feature.name] || '#6b7280',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shortcut Suggestions */}
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Keyboard size={12} />
                  快捷鍵建議
                </h3>
                <div className="space-y-3">
                  {heatmap.suggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-accent/50 border border-border">
                      <kbd className="px-2 py-1 rounded text-xs font-mono bg-card border border-border text-foreground shrink-0">
                        {suggestion.key}
                      </kbd>
                      <div>
                        <div className="text-sm font-medium text-foreground">{suggestion.action}</div>
                        <div className="text-[11px] text-foreground-muted">{suggestion.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-[11px] text-foreground-subtle py-4">
          Agent Gamification Center v1.0 · Phase 5 進階功能
        </footer>
      </div>
    </main>
  )
}
