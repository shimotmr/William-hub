import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: fetch tasks that need approval + approval history
export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get('view') || 'pending'

  try {
    if (view === 'pending') {
      const { data, error } = await supabase
        .from('board_tasks')
        .select('id, title, priority, status, assignee, approval_status, approval_required, plan, created_at, description')
        .or('approval_status.eq.待核准,approval_status.eq.待審批')
        .order('priority')
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json(data)
    }

    if (view === 'history') {
      const { data, error } = await supabase
        .from('board_tasks')
        .select('id, title, priority, status, assignee, approval_status, approved_by, approved_at, created_at, result')
        .in('approval_status', ['已核准', '已拒絕', '自動批准'])
        .order('approved_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Invalid view' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH: approve or reject
export async function PATCH(req: NextRequest) {
  try {
    const { id, action, reason } = await req.json()

    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const updates: Record<string, any> = {
      approval_status: action === 'approve' ? '已核准' : '已拒絕',
      approved_by: 'william-hub',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (action === 'reject' && reason) {
      updates.result = `拒絕原因: ${reason}`
    }

    const { data, error } = await supabase
      .from('board_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
