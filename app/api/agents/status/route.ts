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
    // Fetch all executing tasks from board_tasks
    const tasksRes = await fetch(
      `${SUPABASE_URL}/rest/v1/board_tasks?status=eq.執行中&select=id,title,assignee,updated_at&order=updated_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 0 }, // Always fresh
      }
    )

    if (!tasksRes.ok) {
      const errText = await tasksRes.text()
      console.error('[agents/status] Supabase error:', errText)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const tasks: Array<{ id: number; title: string; assignee: string; updated_at: string }> =
      await tasksRes.json()

    // Group by assignee — since tasks are ordered by updated_at desc,
    // the first one encountered per assignee is the most recent task.
    const grouped = new Map<string, AgentStatus>()

    for (const task of tasks) {
      const agentName = task.assignee || 'Unknown'
      const existing = grouped.get(agentName)
      if (existing) {
        existing.active_tasks += 1
        // current_task already set to the most recent (first encountered)
      } else {
        grouped.set(agentName, {
          agent_name: agentName,
          active_tasks: 1,
          current_task: task.title,
        })
      }
    }

    const result = Array.from(grouped.values())

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
