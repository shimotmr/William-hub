import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch all board_tasks
    const allTasksRes = await fetch(`${SUPABASE_URL}/rest/v1/board_tasks?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })

    if (!allTasksRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const allTasks = await allTasksRes.json()

    // Status distribution
    const statusCounts: Record<string, number> = { '待執行': 0, '執行中': 0, '已完成': 0 }
    for (const t of allTasks) {
      const s = t.status || '待執行'
      if (s in statusCounts) statusCounts[s]++
      else statusCounts['待執行']++
    }

    // This week completed
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekCompleted = allTasks.filter((t: any) =>
      t.status === '已完成' && t.completed_at && new Date(t.completed_at) >= weekStart
    ).length

    // Today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Agent stats from board_tasks (fallback approach)
    const agentMap: Record<string, { total: number; completed: number; todayCompleted: number }> = {}
    for (const t of allTasks) {
      const agent = t.assignee || 'Unknown'
      if (!agentMap[agent]) agentMap[agent] = { total: 0, completed: 0, todayCompleted: 0 }
      agentMap[agent].total++
      if (t.status === '已完成') {
        agentMap[agent].completed++
        if (t.completed_at && new Date(t.completed_at) >= todayStart) {
          agentMap[agent].todayCompleted++
        }
      }
    }

    const agents = Object.entries(agentMap).map(([name, stats]) => ({
      name,
      total: stats.total,
      completed: stats.completed,
      todayCompleted: stats.todayCompleted,
      successRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total)

    // Try agent_kpi table (optional)
    let agentKpi: any[] = []
    try {
      const kpiRes = await fetch(`${SUPABASE_URL}/rest/v1/agent_kpi?select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      })
      if (kpiRes.ok) {
        agentKpi = await kpiRes.json()
      }
    } catch {}

    return NextResponse.json({
      statusCounts,
      totalTasks: allTasks.length,
      weekCompleted,
      agents: agentKpi.length > 0 ? agentKpi : agents,
      agentSource: agentKpi.length > 0 ? 'agent_kpi' : 'board_tasks',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
