// ============================================================
// /api/agents/status — Real-time agent status from board_tasks
// Groups board_tasks by assignee to show active task counts
// ============================================================
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

export interface AgentStatus {
  agent_name: string
  active_tasks: number
  current_task: string | null
}

export async function GET() {
  try {
    // Fetch all agents from agents table and executing tasks from board_tasks in parallel
    const [agentsRes, tasksRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/agents?order=created_at.asc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 0 },
      }),
      fetch(
        `${SUPABASE_URL}/rest/v1/board_tasks?status=eq.執行中&select=id,title,assignee,updated_at&order=updated_at.desc`,
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
      console.error('[agents/status] Failed to fetch agents')
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
    }

    const agents = await agentsRes.json()
    const tasks: Array<{ id: number; title: string; assignee: string; updated_at: string }> =
      tasksRes.ok ? await tasksRes.json() : []

    // Group tasks by assignee
    const taskMap = new Map<string, { active_tasks: number; current_task: string }>()
    for (const task of tasks) {
      const agentName = task.assignee || 'Unknown'
      const existing = taskMap.get(agentName)
      if (existing) {
        existing.active_tasks += 1
        // current_task already set to the most recent (first encountered)
      } else {
        taskMap.set(agentName, {
          active_tasks: 1,
          current_task: task.title,
        })
      }
    }

    // Build result with all agents, including those without active tasks
    const result: AgentStatus[] = agents.map((agent: { name: string; id: string }) => {
      const taskInfo = taskMap.get(agent.name) || taskMap.get(agent.id) || null
      return {
        agent_name: agent.name,
        active_tasks: taskInfo?.active_tasks || 0,
        current_task: taskInfo?.current_task || null,
      }
    })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('[agents/status] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
