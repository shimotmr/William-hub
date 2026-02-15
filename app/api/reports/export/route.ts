import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

export async function POST(request: Request) {
  try {
    const { reportId, format } = await request.json()

    if (!reportId || !['doc', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Invalid reportId or format' }, { status: 400 })
    }

    // Fetch the report title
    const reportRes = await fetch(
      `${SUPABASE_URL}/rest/v1/reports?id=eq.${reportId}&select=id,title`,
      { headers }
    )
    const reports = await reportRes.json()
    if (!reports.length) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    const report = reports[0]

    // Create board_task
    const taskRes = await fetch(`${SUPABASE_URL}/rest/v1/board_tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        priority: 'P0',
        title: `Export report ${format.toUpperCase()}: ${report.title}`,
        assignee: 'Writer',
        status: '待處理',
      }),
    })
    if (!taskRes.ok) return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    const [task] = await taskRes.json()

    // Update report export_status
    await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${reportId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        export_status: 'exporting',
        export_task_id: task.id,
        updated_at: new Date().toISOString(),
      }),
    })

    return NextResponse.json({ taskId: task.id })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
