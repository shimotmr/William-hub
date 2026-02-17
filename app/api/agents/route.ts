// ============================================================
// /api/agents — Agents list with real-time task status merged
// ============================================================
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

export async function GET() {
  try {
    // Fetch agents and active tasks in parallel
    const [agentsRes, tasksRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/agents?order=created_at.asc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 0 },
      }),
      fetch(
        `${SUPABASE_URL}/rest/v1/board_tasks?status=eq.執行中&select=id,title,assignee&order=updated_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          next: { revalidate: 0 },
        }
      ),
    ])

    if (!agentsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
    }

    const agents = await agentsRes.json()
    const activeTasks: Array<{ id: number; title: string; assignee: string }> =
      tasksRes.ok ? await tasksRes.json() : []

    // Build a map: assignee (lowercase) -> { currentTask, activeTasks count }
    const taskMap = new Map<string, { currentTask: string; activeTasks: number }>()
    for (const task of activeTasks) {
      const key = (task.assignee || '').toLowerCase()
      const existing = taskMap.get(key)
      if (existing) {
        existing.activeTasks += 1
      } else {
        taskMap.set(key, { currentTask: task.title, activeTasks: 1 })
      }
    }

    // Merge task info into each agent
    const result = agents.map((agent: Record<string, unknown>) => {
      const keyById = String(agent.id || '').toLowerCase()
      const keyByName = String(agent.name || '').toLowerCase()
      const taskInfo = taskMap.get(keyById) || taskMap.get(keyByName) || null

      return {
        ...agent,
        currentTask: taskInfo?.currentTask || null,
        activeTasks: taskInfo?.activeTasks || 0,
      }
    })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('[agents] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
