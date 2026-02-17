import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

export async function GET() {
  try {
    // 嘗試從 Supabase 獲取討論串
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/agent_threads?order=updated_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 30 },
      }
    )

    if (response.ok) {
      const threads = await response.json()
      return NextResponse.json(threads)
    }

    // 如果表格不存在，返回 mock 數據
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
  } catch (error) {
    console.error('Error fetching threads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads' }, 
      { status: 500 }
    )
  }
}