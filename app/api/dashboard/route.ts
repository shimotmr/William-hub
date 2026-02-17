import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

// Agent roles will be fetched dynamically from agents table

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch agents and tasks in parallel
    const [agentsRes, allTasksRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/agents?order=created_at.asc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }),
      fetch(`${SUPABASE_URL}/rest/v1/board_tasks?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }),
    ])

    if (!agentsRes.ok || !allTasksRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    const agents = await agentsRes.json()
    const allTasks = await allTasksRes.json()

    // Status distribution
    const statusCounts: Record<string, number> = { '待執行': 0, '執行中': 0, '已完成': 0 }
    for (const t of allTasks) {
      const s = t.status || '待執行'
      if (s in statusCounts) statusCounts[s]++
      else statusCounts['待執行']++
    }

    // Use Asia/Taipei timezone for date calculations
    const nowTpe = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
    
    // This week completed (Monday as week start)
    const weekStart = new Date(nowTpe)
    const dayOfWeek = weekStart.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    weekStart.setDate(weekStart.getDate() - mondayOffset)
    weekStart.setHours(0, 0, 0, 0)
    
    // weekStart is already in correct timezone for comparison
    const weekCompleted = allTasks.filter((t: { status: string; completed_at: string | null }) => {
      if (t.status !== '已完成' || !t.completed_at) return false
      const completedTpe = new Date(new Date(t.completed_at).toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
      return completedTpe >= weekStart
    }).length

    // Today in Asia/Taipei
    const todayStart = new Date(nowTpe)
    todayStart.setHours(0, 0, 0, 0)

    // Agent stats - use dynamic agents list from database
    const agentStats = agents.map((agent: { id: string; name: string; role?: string; title?: string }) => {
      const agentName = agent.name
      const agentTasks = allTasks.filter((t: { assignee: string | null }) => {
        const assignee = (t.assignee || '').toLowerCase()
        return assignee.includes(agentName.toLowerCase()) || assignee === agent.id
      })
      const completed = agentTasks.filter((t: { status: string }) => t.status === '已完成')
      const todayCompleted = completed.filter((t: { completed_at: string | null }) => {
        if (!t.completed_at) return false
        const completedTpe = new Date(new Date(t.completed_at).toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
        return completedTpe >= todayStart
      })
      const activeTasks = agentTasks.filter((t: { status: string }) => t.status === '執行中')
      const currentTask = activeTasks.length > 0 ? (activeTasks[0] as { title: string }).title : null

      return {
        name: agentName,
        role: agent.role || agent.title || 'Agent',
        total: agentTasks.length,
        completed: completed.length,
        todayCompleted: todayCompleted.length,
        successRate: agentTasks.length > 0 ? Math.round((completed.length / agentTasks.length) * 100) : 0,
        currentTask,
        isActive: activeTasks.length > 0,
      }
    })

    // Recent completed tasks (activity feed)
    const recentCompleted = allTasks
      .filter((t: { status: string; completed_at: string | null }) => t.status === '已完成' && t.completed_at)
      .sort((a: { completed_at: string }, b: { completed_at: string }) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .slice(0, 10)
      .map((t: { id: number; title: string; completed_at: string; assignee: string | null }) => ({
        id: t.id,
        title: t.title,
        completedAt: t.completed_at,
        assignee: t.assignee || 'Unknown',
      }))

    // Completion rate
    const totalTasks = allTasks.length
    const completionRate = totalTasks > 0 ? Math.round((statusCounts['已完成'] / totalTasks) * 100) : 0

    return NextResponse.json({
      statusCounts,
      totalTasks,
      weekCompleted,
      completionRate,
      agents: agentStats,
      recentCompleted,
    })
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
