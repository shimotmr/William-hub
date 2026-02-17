import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const threadId = searchParams.get('thread_id')

  if (!threadId) {
    return NextResponse.json(
      { error: 'thread_id is required' }, 
      { status: 400 }
    )
  }

  try {
    // 嘗試從 Supabase 獲取訊息
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/agent_messages?thread_id=eq.${threadId}&order=timestamp.asc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 10 },
      }
    )

    if (response.ok) {
      const messages = await response.json()
      return NextResponse.json(messages)
    }

    // 如果表格不存在，返回 mock 數據
    const mockMessages = getMockMessages(threadId)
    return NextResponse.json(mockMessages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' }, 
      { status: 500 }
    )
  }
}

function getMockMessages(threadId: string) {
  const now = new Date()
  
  switch (threadId) {
    case '1':
      return [
        {
          id: '1',
          thread_id: '1',
          sender: 'designer',
          content: '開始開發 Agent 聊天室功能 Phase 1',
          timestamp: new Date(now.getTime() - 3600000 * 3).toISOString(),
          message_type: 'text'
        },
        {
          id: '2',
          thread_id: '1',
          sender: 'architect',
          content: '建議使用 Supabase 作為後端，Next.js 作為前端框架',
          timestamp: new Date(now.getTime() - 3600000 * 2).toISOString(),
          message_type: 'text'
        },
        {
          id: '3',
          thread_id: '1',
          sender: 'designer',
          content: '同意，已開始實作基礎架構',
          timestamp: new Date(now.getTime() - 3600000 * 1).toISOString(),
          message_type: 'text'
        },
        {
          id: '4',
          thread_id: '1',
          sender: 'coder',
          content: '需要確保 API 設計符合 RESTful 標準',
          timestamp: new Date(now.getTime() - 1800000).toISOString(),
          message_type: 'text'
        },
        {
          id: '5',
          thread_id: '1',
          sender: 'designer',
          content: '目前正在實作討論串列表和訊息顯示功能',
          timestamp: new Date(now.getTime() - 900000).toISOString(),
          message_type: 'text'
        }
      ]
    case '2':
      return [
        {
          id: '6',
          thread_id: '2',
          sender: 'architect',
          content: '目前系統回應時間可以進一步優化',
          timestamp: new Date(now.getTime() - 7200000).toISOString(),
          message_type: 'text'
        },
        {
          id: '7',
          thread_id: '2',
          sender: 'performance',
          content: '建議實作 Redis 快取機制',
          timestamp: new Date(now.getTime() - 5400000).toISOString(),
          message_type: 'text'
        },
        {
          id: '8',
          thread_id: '2',
          sender: 'architect',
          content: '同意，我們可以從最常查詢的 API 開始優化',
          timestamp: new Date(now.getTime() - 3600000).toISOString(),
          message_type: 'text'
        }
      ]
    case '3':
      return [
        {
          id: '9',
          thread_id: '3',
          sender: 'designer',
          content: '建議改善導航列的使用者體驗',
          timestamp: new Date(now.getTime() - 10800000).toISOString(),
          message_type: 'text'
        },
        {
          id: '10',
          thread_id: '3',
          sender: 'ux',
          content: '可以考慮增加麵包屑導航和搜尋功能',
          timestamp: new Date(now.getTime() - 7200000).toISOString(),
          message_type: 'text'
        }
      ]
    default:
      return []
  }
}