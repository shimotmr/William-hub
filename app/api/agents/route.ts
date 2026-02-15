import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

export async function GET() {
  try {
    // Fetch agents
    const agentsRes = await fetch(`${SUPABASE_URL}/rest/v1/agents?order=created_at.asc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 30 },
    })

    if (!agentsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
    }

    const agents = await agentsRes.json()

    // Fetch active tasks (status = 執行中)
    const tasksRes = await fetch(
      `${SUPABASE_URL}/rest/v1/board_tasks?status=eq.執行中&select=id,title,assignee`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 30 },
      }
    )

    const activeTasks = tasksRes.ok ? await tasksRes.json() : []

    // Map tasks to agents
    const taskMap: Record<string, string> = {}
    for (const task of activeTasks) {
      const assignee = (task.assignee || '').toLowerCase()
      if (!taskMap[assignee]) {
        taskMap[assignee] = task.title
      }
    }

    // Merge
    const result = agents.map((agent: any) => ({
      ...agent,
      currentTask: taskMap[agent.id] || taskMap[agent.name?.toLowerCase()] || null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
