// ============================================================
// /api/gamification — Agent Leaderboard, Achievements, XP System
// ============================================================
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function supabaseQuery(table: string, params: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`)
  return res.json()
}

// XP calculation rules
const XP_RULES = {
  task_completed: 10,
  task_p0: 50,
  task_p1: 30,
  task_p2: 15,
  task_p3: 10,
  report_created: 20,
  zero_error_day: 5,
}

// Level thresholds
const LEVELS = [
  { level: 1, title: '新手', xpRequired: 0, icon: '🌱' },
  { level: 2, title: '助手', xpRequired: 100, icon: '⚡' },
  { level: 3, title: '執行者', xpRequired: 300, icon: '🔧' },
  { level: 4, title: '專家', xpRequired: 600, icon: '🎯' },
  { level: 5, title: '大師', xpRequired: 1000, icon: '🏆' },
  { level: 6, title: '傳奇', xpRequired: 2000, icon: '👑' },
  { level: 7, title: '神話', xpRequired: 5000, icon: '🌟' },
  { level: 8, title: '超越', xpRequired: 10000, icon: '💎' },
]

function getLevel(xp: number) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl
    else break
  }
  const nextLevel = LEVELS.find(l => l.level === current.level + 1)
  return {
    ...current,
    currentXP: xp,
    nextLevelXP: nextLevel?.xpRequired || current.xpRequired,
    progress: nextLevel
      ? Math.min(100, ((xp - current.xpRequired) / (nextLevel.xpRequired - current.xpRequired)) * 100)
      : 100,
  }
}

// Achievement definitions
const ACHIEVEMENT_DEFS = [
  { id: 'first_task', name: '初試啼聲', desc: '完成第一個任務', icon: '🎉', check: (s: AgentStats) => s.tasksCompleted >= 1 },
  { id: 'task_10', name: '穩定輸出', desc: '累計完成 10 個任務', icon: '📋', check: (s: AgentStats) => s.tasksCompleted >= 10 },
  { id: 'task_50', name: '半百戰士', desc: '累計完成 50 個任務', icon: '⚔️', check: (s: AgentStats) => s.tasksCompleted >= 50 },
  { id: 'task_100', name: '百戰英豪', desc: '累計完成 100 個任務', icon: '🏅', check: (s: AgentStats) => s.tasksCompleted >= 100 },
  { id: 'task_250', name: '鋼鐵意志', desc: '累計完成 250 個任務', icon: '🛡️', check: (s: AgentStats) => s.tasksCompleted >= 250 },
  { id: 'report_1', name: '首份報告', desc: '產出第一份報告', icon: '📄', check: (s: AgentStats) => s.reportsCreated >= 1 },
  { id: 'report_10', name: '報告達人', desc: '累計產出 10 份報告', icon: '📊', check: (s: AgentStats) => s.reportsCreated >= 10 },
  { id: 'report_50', name: '文筆如刀', desc: '累計產出 50 份報告', icon: '✍️', check: (s: AgentStats) => s.reportsCreated >= 50 },
  { id: 'day_10_tasks', name: '單日爆發', desc: '單日完成 10+ 個任務', icon: '🔥', check: (s: AgentStats) => s.maxDailyTasks >= 10 },
  { id: 'p0_hero', name: 'P0 英雄', desc: '完成一個 P0 緊急任務', icon: '🚨', check: (s: AgentStats) => s.p0Completed >= 1 },
  { id: 'weekly_top', name: '週冠王', desc: '成為週排行榜第一名', icon: '👑', check: (s: AgentStats) => s.weeklyRank === 1 },
]

interface AgentStats {
  tasksCompleted: number
  reportsCreated: number
  maxDailyTasks: number
  p0Completed: number
  weeklyRank: number
  weekTasks: number
  monthTasks: number
}

// Canonical agent names (merge case-insensitive duplicates)
function canonicalAgent(name: string): string {
  const lower = name.toLowerCase()
  const map: Record<string, string> = {
    'travis': 'Travis', 'blake': 'Blake', 'rex': 'Rex',
    'coder': 'Blake', 'designer': 'Designer', 'inspector': 'Inspector',
    'secretary': 'Secretary', 'researcher': 'Rex', 'writer': 'Rex',
    'oscar': 'Oscar', 'warren': 'Warren', 'griffin': 'Griffin',
  }
  return map[lower] || name
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'week' // week | month | quarter
    const section = searchParams.get('section') || 'all' // all | leaderboard | achievements | xp

    // Fetch completed tasks and reports in parallel
    const [allTasks, allReports, agents] = await Promise.all([
      supabaseQuery('board_tasks', "status=in.(已完成,已關閉)&select=id,assignee,priority,completed_at,created_at&order=completed_at.desc"),
      supabaseQuery('reports', "select=id,author,created_at&order=created_at.desc"),
      supabaseQuery('agents', "select=id,name,color,emoji,title,prefix&order=created_at.asc"),
    ])

    // Build agent stats
    const now = new Date()
    const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90
    const periodStart = new Date(now.getTime() - periodDays * 86400000)

    const agentMap = new Map<string, {
      id: string
      name: string
      color: string
      emoji: string
      title: string
      prefix: string
      stats: AgentStats
      dailyTasks: Map<string, number>
    }>()

    // Initialize from agents table
    for (const agent of agents) {
      const name = agent.name
      agentMap.set(name, {
        id: agent.id,
        name,
        color: agent.color || '#6b7280',
        emoji: agent.emoji || 'Bot',
        title: agent.title || agent.id,
        prefix: agent.prefix || '',
        stats: { tasksCompleted: 0, reportsCreated: 0, maxDailyTasks: 0, p0Completed: 0, weeklyRank: 0, weekTasks: 0, monthTasks: 0 },
        dailyTasks: new Map(),
      })
    }

    // Process tasks
    for (const task of allTasks) {
      const canonical = canonicalAgent(task.assignee || '未分配')
      if (canonical === '待分配' || canonical === '未分配') continue

      let entry = agentMap.get(canonical)
      if (!entry) {
        entry = {
          id: canonical.toLowerCase(),
          name: canonical,
          color: '#6b7280',
          emoji: 'Bot',
          title: canonical,
          prefix: '',
          stats: { tasksCompleted: 0, reportsCreated: 0, maxDailyTasks: 0, p0Completed: 0, weeklyRank: 0, weekTasks: 0, monthTasks: 0 },
          dailyTasks: new Map(),
        }
        agentMap.set(canonical, entry)
      }

      entry.stats.tasksCompleted++
      if (task.priority === 'P0') entry.stats.p0Completed++

      const completedAt = task.completed_at ? new Date(task.completed_at) : null
      if (completedAt) {
        const dayKey = completedAt.toISOString().slice(0, 10)
        entry.dailyTasks.set(dayKey, (entry.dailyTasks.get(dayKey) || 0) + 1)

        const weekAgo = new Date(now.getTime() - 7 * 86400000)
        const monthAgo = new Date(now.getTime() - 30 * 86400000)
        if (completedAt >= weekAgo) entry.stats.weekTasks++
        if (completedAt >= monthAgo) entry.stats.monthTasks++
      }
    }

    // Calculate max daily tasks
    agentMap.forEach((entry) => {
      let maxDaily = 0
      entry.dailyTasks.forEach((count) => {
        if (count > maxDaily) maxDaily = count
      })
      entry.stats.maxDailyTasks = maxDaily
    })

    // Process reports
    for (const report of allReports) {
      const canonical = canonicalAgent(report.author || 'unknown')
      const entry = agentMap.get(canonical)
      if (entry) {
        entry.stats.reportsCreated++
      }
    }

    // Build leaderboard (sorted by period tasks)
    const mapValues: Array<{ id: string; name: string; color: string; emoji: string; title: string; prefix: string; stats: AgentStats; dailyTasks: Map<string, number> }> = []
    agentMap.forEach((v) => mapValues.push(v))
    const leaderboard = mapValues
      .map(entry => {
        const periodTasks = period === 'week' ? entry.stats.weekTasks
          : period === 'month' ? entry.stats.monthTasks
          : entry.stats.tasksCompleted

        // Calculate XP
        const xp =
          entry.stats.tasksCompleted * XP_RULES.task_completed +
          entry.stats.p0Completed * (XP_RULES.task_p0 - XP_RULES.task_completed) +
          entry.stats.reportsCreated * XP_RULES.report_created

        return {
          ...entry,
          periodTasks,
          xp,
          level: getLevel(xp),
        }
      })
      .filter(e => e.stats.tasksCompleted > 0)
      .sort((a, b) => b.periodTasks - a.periodTasks)

    // Set weekly rank
    const weekSorted = [...leaderboard].sort((a, b) => b.stats.weekTasks - a.stats.weekTasks)
    weekSorted.forEach((entry, i) => {
      entry.stats.weeklyRank = i + 1
    })

    // Calculate achievements for each agent
    const agentsWithAchievements = leaderboard.map((entry, index) => {
      const achievements = ACHIEVEMENT_DEFS
        .filter(a => a.check(entry.stats))
        .map(a => ({ id: a.id, name: a.name, desc: a.desc, icon: a.icon }))

      return {
        rank: index + 1,
        name: entry.name,
        color: entry.color,
        emoji: entry.emoji,
        title: entry.title,
        prefix: entry.prefix,
        periodTasks: entry.periodTasks,
        totalTasks: entry.stats.tasksCompleted,
        reports: entry.stats.reportsCreated,
        maxDailyTasks: entry.stats.maxDailyTasks,
        p0Completed: entry.stats.p0Completed,
        xp: entry.xp,
        level: entry.level,
        achievements,
        achievementCount: achievements.length,
      }
    })

    // Summary stats
    const totalTasks = leaderboard.reduce((s, e) => s + e.periodTasks, 0)
    const totalReports = leaderboard.reduce((s, e) => s + e.stats.reportsCreated, 0)
    const totalAchievements = agentsWithAchievements.reduce((s, e) => s + e.achievementCount, 0)

    return NextResponse.json({
      status: 'success',
      data: {
        period,
        periodLabel: period === 'week' ? '本週' : period === 'month' ? '本月' : '本季',
        summary: {
          totalAgents: agentsWithAchievements.length,
          totalTasks,
          totalReports,
          totalAchievements,
          possibleAchievements: ACHIEVEMENT_DEFS.length,
        },
        leaderboard: agentsWithAchievements,
        achievementDefs: ACHIEVEMENT_DEFS.map(a => ({
          id: a.id, name: a.name, desc: a.desc, icon: a.icon,
        })),
        levels: LEVELS,
      },
    })
  } catch (error) {
    console.error('[gamification] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
