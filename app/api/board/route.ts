import { NextResponse } from 'next/server'

import { createServiceRoleClient } from '@/lib/supabase-server'

// GET: 取得所有任務
export async function GET(request: Request) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'active'
    
    let query = supabase.from('board_tasks').select('*')
    
    switch (category) {
      case 'active':
        // 待辦：真正在做或等著做的
        query = query.in('status', ['待執行', '執行']).order('created_at', { ascending: true })
        break
      case 'planned':
        // 規劃中：有想法但還沒排進來
        query = query.in('status', ['待規劃', '中期目標']).order('created_at', { ascending: true })
        break
      case 'backlog':
        // 長期：遠期願景
        query = query.eq('status', '長期目標').order('created_at', { ascending: true })
        break
      case 'recurring':
        // 週期性：所有有週期設定的任務
        query = query.not('recurrence_type', 'eq', 'none').not('recurrence_type', 'is', 'null').order('next_run_at', { ascending: true })
        break
      case 'done':
        // 已完成：歷史記錄
        query = query.in('status', ['已完成', '已關閉']).order('completed_at', { ascending: false })
        break
      case 'history':
        // 保持向後相容性
        query = query.in('status', ['已完成', '已關閉']).order('completed_at', { ascending: false })
        break
      default:
        // 預設顯示待辦
        query = query.in('status', ['待執行', '執行']).order('created_at', { ascending: true })
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 新增任務
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('board_tasks')
      .insert(body)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }
    
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
    
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('board_tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }
    
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
    
    const supabase = createServiceRoleClient()
    
    const { error } = await supabase
      .from('board_tasks')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
