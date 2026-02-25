import { NextResponse } from 'next/server'

import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Fetch agents, tasks, and token usage in parallel
    const [agentsRes, allTasksRes, tokenRes] = await Promise.all([
      supabase.from('agents').select('*').order('created_at', { ascending: true }),
      supabase.from('board_tasks').select('*').order('created_at', { ascending: false }),
      // Fetch last 7 days token usage
      supabase.from('model_usage_log').select('created_at,input_tokens,output_tokens,cost_estimate').order('created_at', { ascending: false }).limit(5000),
    ])

    if (agentsRes.error || allTasksRes.error || tokenRes.error) {
      console.error('Supabase errors:', agentsRes.error, allTasksRes.error, tokenRes.error)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    const agents = agentsRes.data
    const allTasks = allTasksRes.data
    const tokenData = tokenRes.data

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

    // Running tasks (status = '執行中')
    const runningTasks = allTasks
      .filter((t: { status: string }) => t.status === '執行中')
      .sort((a: { updated_at: string }, b: { updated_at: string }) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 20)
      .map((t: { id: number; title: string; assignee: string | null; updated_at: string; description: string | null }) => ({
        id: t.id,
        title: t.title,
        assignee: t.assignee || 'Unassigned',
        updatedAt: t.updated_at,
        description: t.description,
      }))

    // Token consumption trend - last 7 days
    const tzOffset = 8 * 60 * 60 * 1000 // Taiwan timezone
    const now = new Date()
    const today = new Date(now.getTime() + tzOffset).toISOString().split('T')[0]
    
    // Initialize 7 days data
    const tokenTrend: { date: string; tokens: number; cost: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = new Date(d.getTime() + tzOffset).toISOString().split('T')[0]
      tokenTrend.push({ date: dateStr, tokens: 0, cost: 0 })
    }

    // Aggregate token data by date
    if (Array.isArray(tokenData)) {
      for (const row of tokenData) {
        const rowDate = new Date(new Date(row.created_at).getTime() + tzOffset).toISOString().split('T')[0]
        const dayIndex = tokenTrend.findIndex(d => d.date === rowDate)
        if (dayIndex >= 0) {
          tokenTrend[dayIndex].tokens += (Number(row.input_tokens) || 0) + (Number(row.output_tokens) || 0)
          tokenTrend[dayIndex].cost += Number(row.cost_estimate) || 0
        }
      }
    }

    return NextResponse.json({
      statusCounts,
      totalTasks,
      weekCompleted,
      completionRate,
      agents: agentStats,
      recentCompleted,
      runningTasks,
      tokenTrend,
    })
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
