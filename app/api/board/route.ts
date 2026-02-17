import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

// GET: 取得所有任務
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'active'
    
    let filter: string
    
    switch (category) {
      case 'active':
        // 待辦：真正在做或等著做的
        filter = 'status=in.(待執行,執行中)&order=created_at.asc'
        break
      case 'planned':
        // 規劃中：有想法但還沒排進來
        filter = 'status=in.(待規劃,中期目標)&order=created_at.asc'
        break
      case 'backlog':
        // 長期：遠期願景
        filter = 'status=eq.長期目標&order=created_at.asc'
        break
      case 'done':
        // 已完成：歷史記錄
        filter = 'status=in.(已完成,已關閉)&order=completed_at.desc'
        break
      case 'history':
        // 保持向後相容性
        filter = 'status=in.(已完成,已關閉)&order=completed_at.desc'
        break
      default:
        // 預設顯示待辦
        filter = 'status=in.(待執行,執行中)&order=created_at.asc'
    }
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/board_tasks?${filter}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 新增任務
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/board_tasks`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    })
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: 更新任務
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 })
    }
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/board_tasks?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
    })
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 刪除任務
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 })
    }
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/board_tasks?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
