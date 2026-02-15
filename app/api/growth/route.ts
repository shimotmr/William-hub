import { NextResponse } from 'next/server'

// Phase 1: 簡化版 API，只提供任務完成趨勢資料
// 不需要 Supabase client，直接呼叫 Management API

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

interface DailyCount {
  date: string
  count: number
}

interface GrowthData {
  trend: DailyCount[]
  summary: {
    total: number
    avgPerDay: number
    cumulative: number[]
  }
}

export async function GET() {
  try {
    // 查詢最近 30 天的任務完成記錄
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = thirtyDaysAgo.toISOString().split('T')[0]

    // 使用 Supabase REST API
    const url = `${SUPABASE_URL}/rest/v1/board_tasks?select=completed_at&status=eq.已完成&completed_at=gte.${startDate}&order=completed_at.asc`
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })

    if (!response.ok) {
      console.error('Supabase API error:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    const tasks = await response.json()

    // 按日期聚合
    const dailyMap = new Map<string, number>()
    
    for (const task of tasks) {
      if (!task.completed_at) continue
      const date = task.completed_at.split('T')[0]
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
    }

    // 填補缺失日期（最近 30 天）
    const trend: DailyCount[] = []
    const cumulative: number[] = []
    let cumulativeSum = 0

    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const count = dailyMap.get(dateStr) || 0
      trend.push({ date: dateStr, count })
      cumulativeSum += count
      cumulative.push(cumulativeSum)
    }

    const total = trend.reduce((sum, item) => sum + item.count, 0)
    const avgPerDay = total / 30

    const data: GrowthData = {
      trend,
      summary: {
        total,
        avgPerDay: Math.round(avgPerDay * 10) / 10,
        cumulative,
      },
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Growth API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
