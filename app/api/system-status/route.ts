import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || ''
)

type SystemStatus = {
  tokenUsage: {
    current: number
    limit: number
    percentage: number
    weeklyQuotaUsed: boolean
  }
  sessions: {
    active: number
    total: number
    mainAgent: number
    subAgents: number
  }
  storage: {
    openclaw: string
    diskUsage: number
    available: string
  }
  system: {
    uptime: string
    lastRestart: string
    status: 'healthy' | 'warning' | 'error'
  }
  timestamp: string
}

const FALLBACK_DATA: SystemStatus = {
  tokenUsage: { current: 0, limit: 200000, percentage: 0, weeklyQuotaUsed: false },
  sessions: { active: 0, total: 0, mainAgent: 0, subAgents: 0 },
  storage: { openclaw: 'N/A', diskUsage: 0, available: 'N/A' },
  system: { uptime: 'Loading...', lastRestart: 'N/A', status: 'healthy' },
  timestamp: new Date().toISOString(),
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('system_status')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.error('Supabase query error:', error)
      return NextResponse.json(FALLBACK_DATA)
    }

    const result: SystemStatus = {
      tokenUsage: {
        current: data.token_usage?.current ?? 0,
        limit: data.token_usage?.limit ?? 200000,
        percentage: data.token_usage?.percentage ?? 0,
        weeklyQuotaUsed: (data.token_usage?.percentage ?? 0) > 95,
      },
      sessions: {
        active: data.sessions?.active ?? 0,
        total: data.sessions?.total ?? 0,
        mainAgent: data.sessions?.mainAgent ?? 0,
        subAgents: data.sessions?.subAgents ?? 0,
      },
      storage: {
        openclaw: data.storage?.openclaw ?? 'N/A',
        diskUsage: data.storage?.diskUsage ?? 0,
        available: data.storage?.available ?? 'N/A',
      },
      system: {
        uptime: data.system_info?.uptime ?? 'N/A',
        lastRestart: data.system_info?.lastRestart ?? 'N/A',
        status: data.system_info?.status ?? 'healthy',
      },
      timestamp: data.created_at,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('System status API error:', error)
    return NextResponse.json(FALLBACK_DATA)
  }
}
