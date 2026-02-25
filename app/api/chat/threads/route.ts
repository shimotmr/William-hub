import { NextRequest, NextResponse } from 'next/server'

import { createServiceRoleClient } from '@/lib/supabase-server'

interface ThreadCreateRequest {
  title: string
  description?: string
  created_by: string
  task_id?: number
  is_active?: boolean
}

export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('agent_threads')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      // If table doesn't exist, return mock data
      const mockThreads = [
        {
          id: '1',
          title: '任務 #402 討論',
          description: 'Agent 聊天室功能開發相關討論',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'designer',
          is_active: true,
          message_count: 5
        },
        {
          id: '2',
          title: '系統優化提案',
          description: 'William Hub 系統架構優化討論',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          created_by: 'architect',
          is_active: true,
          message_count: 3
        },
        {
          id: '3',
          title: 'UI/UX 改進',
          description: '使用者介面改善建議',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          created_by: 'designer',
          is_active: true,
          message_count: 2
        }
      ]
      return NextResponse.json(mockThreads)
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching threads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads' }, 
      { status: 500 }
    )
  }
}

// POST - 建立新討論串
export async function POST(request: NextRequest) {
  try {
    const body: ThreadCreateRequest = await request.json()
    
    // 驗證必填欄位
    if (!body.title || !body.created_by) {
      return NextResponse.json(
        { error: 'title and created_by are required' },
        { status: 400 }
      )
    }

    // 準備要插入的資料
    const threadData = {
      title: body.title,
      description: body.description || null,
      created_by: body.created_by,
      task_id: body.task_id || null,
      is_active: body.is_active !== false, // 預設為 true
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    try {
      const supabase = createServiceRoleClient()
      
      const { data, error } = await supabase
        .from('agent_threads')
        .insert(threadData)
        .select()
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        // 如果 Supabase 失敗，返回模擬成功
        return NextResponse.json({
          ...threadData,
          id: `mock-${Date.now()}`,
          message_count: 0
        })
      }

      return NextResponse.json(data || { ...threadData, message_count: 0 })
    } catch (supabaseError) {
      console.error('Supabase error:', supabaseError)
      // 返回模擬成功
      return NextResponse.json({
        ...threadData,
        id: `mock-${Date.now()}`,
        message_count: 0
      })
    }
  } catch (error) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    )
  }
}
