import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

const AGENT_ROLES: Record<string, string> = {
  'Travis': '總管 / 主 Agent',
  'Coder': '工程開發',
  'Designer': '設計 / UI',
  'Inspector': '品質檢測',
  'Researcher': '資料調研',
  'Writer': '文案撰寫',
  'Analyst': '數據分析',
  'Secretary': '行政秘書',
}

const KNOWN_AGENTS = Object.keys(AGENT_ROLES)

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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

    // Use Asia/Taipei timezone for date calculations
    const nowTpe = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
    
    // This week completed (Monday as week start)
    const weekStart = new Date(nowTpe)
    const dayOfWeek = weekStart.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    weekStart.setDate(weekStart.getDate() - mondayOffset)
    weekStart.setHours(0, 0, 0, 0)
    
    // Convert weekStart back to UTC for comparison
    const weekStartStr = weekStart.toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
    const weekCompleted = allTasks.filter((t: any) => {
      if (t.status !== '已完成' || !t.completed_at) return false
      const completedTpe = new Date(new Date(t.completed_at).toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
      return completedTpe >= weekStart
    }).length

    // Today in Asia/Taipei
    const todayStart = new Date(nowTpe)
    todayStart.setHours(0, 0, 0, 0)

    // Agent stats - use known agents list, match by assignee containing agent name
    const agentStats = KNOWN_AGENTS.map(agentName => {
      const agentTasks = allTasks.filter((t: any) => {
        const assignee = (t.assignee || '').toLowerCase()
        return assignee.includes(agentName.toLowerCase())
      })
      const completed = agentTasks.filter((t: any) => t.status === '已完成')
      const todayCompleted = completed.filter((t: any) => {
        if (!t.completed_at) return false
        const completedTpe = new Date(new Date(t.completed_at).toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
        return completedTpe >= todayStart
      })
      const activeTasks = agentTasks.filter((t: any) => t.status === '執行中')
      const currentTask = activeTasks.length > 0 ? activeTasks[0].title : null

      return {
        name: agentName,
        role: AGENT_ROLES[agentName],
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
      .filter((t: any) => t.status === '已完成' && t.completed_at)
      .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .slice(0, 10)
      .map((t: any) => ({
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
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
