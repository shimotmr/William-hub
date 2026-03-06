// ============================================================
// /api/analytics/heatmap — Usage behavior heatmap data
// ============================================================
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function supabaseQuery(table: string, params: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`)
  return res.json()
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Fetch completed tasks with timestamps
    const since = new Date(Date.now() - days * 86400000).toISOString()
    const tasks = await supabaseQuery(
      'board_tasks',
      `completed_at=gte.${since}&status=in.(已完成,已關閉)&select=id,assignee,completed_at,priority,created_at`
    )

    // Build hourly activity heatmap (7 days x 24 hours)
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))

    // Feature usage from task patterns
    const featureUsage: Record<string, number> = {
      '任務管理': 0,
      '報告產出': 0,
      '程式開發': 0,
      '研究分析': 0,
      '系統監控': 0,
      '部署發佈': 0,
      '安全審查': 0,
      '交易系統': 0,
    }

    // Daily completion counts for trend
    const dailyMap = new Map<string, number>()

    for (const task of tasks) {
      const completedAt = new Date(task.completed_at)
      // Convert to Taiwan time (UTC+8)
      const twTime = new Date(completedAt.getTime() + 8 * 60 * 60 * 1000)
      const dayOfWeek = twTime.getUTCDay()
      const hour = twTime.getUTCHours()

      heatmap[dayOfWeek][hour]++

      // Daily count
      const dayKey = twTime.toISOString().slice(0, 10)
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1)

      // Categorize by assignee/task type
      const assignee = (task.assignee || '').toLowerCase()
      if (['blake', 'coder', 'designer'].includes(assignee)) featureUsage['程式開發']++
      else if (['rex', 'researcher', 'writer'].includes(assignee)) featureUsage['研究分析']++
      else if (['secretary'].includes(assignee)) featureUsage['任務管理']++
      else if (['warren'].includes(assignee)) featureUsage['交易系統']++
      else if (['griffin'].includes(assignee)) featureUsage['安全審查']++
      else if (['oscar'].includes(assignee)) featureUsage['系統監控']++
      else featureUsage['任務管理']++
    }

    // Find peak hours
    let peakHour = 0, peakCount = 0
    const hourTotals = Array(24).fill(0)
    for (let h = 0; h < 24; h++) {
      for (let d = 0; d < 7; d++) {
        hourTotals[h] += heatmap[d][h]
      }
      if (hourTotals[h] > peakCount) {
        peakCount = hourTotals[h]
        peakHour = h
      }
    }

    // Peak day
    let peakDay = 0, peakDayCount = 0
    const dayTotals = Array(7).fill(0)
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        dayTotals[d] += heatmap[d][h]
      }
      if (dayTotals[d] > peakDayCount) {
        peakDayCount = dayTotals[d]
        peakDay = d
      }
    }

    // Sort feature usage
    const sortedFeatures = Object.entries(featureUsage)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, percentage: tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0 }))

    // Daily trend (last 14 days)
    const dailyTrend = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000 + 8 * 3600000)
      const key = d.toISOString().slice(0, 10)
      dailyTrend.push({
        date: key,
        label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
        count: dailyMap.get(key) || 0,
      })
    }

    // Keyboard shortcut suggestions based on usage patterns
    const suggestions = []
    if (featureUsage['任務管理'] > featureUsage['程式開發']) {
      suggestions.push({ key: '⌘+T', action: '快速建任務', reason: '任務管理是最常用功能' })
    }
    if (peakHour >= 9 && peakHour <= 11) {
      suggestions.push({ key: '⌘+D', action: '開啟 Dashboard', reason: '上午是最活躍時段' })
    }
    suggestions.push(
      { key: '⌘+R', action: '重新整理數據', reason: '保持資料最新' },
      { key: '⌘+/', action: '搜尋任務', reason: '快速定位任務' },
    )

    return NextResponse.json({
      status: 'success',
      data: {
        days,
        totalEvents: tasks.length,
        heatmap: {
          data: heatmap,
          dayLabels: dayNames,
          maxValue: Math.max(...heatmap.flat()),
        },
        peakTime: {
          hour: peakHour,
          day: dayNames[peakDay],
          dayIndex: peakDay,
          label: `週${dayNames[peakDay]} ${peakHour}:00`,
        },
        featureUsage: sortedFeatures,
        dailyTrend,
        suggestions,
        hourTotals,
        dayTotals,
      },
    })
  } catch (error) {
    console.error('[analytics/heatmap] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
