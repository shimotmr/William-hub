import { exec } from 'child_process'
import { promisify } from 'util'

import { NextResponse } from 'next/server'

const execPromise = promisify(exec)

export const dynamic = 'force-dynamic'

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

export async function GET() {
  try {
    // 執行監控腳本
    const { stdout, stderr } = await execPromise(
      '~/clawd/scripts/system_status_api.sh',
      { timeout: 5000 } // 5 秒超時
    )

    if (stderr) {
      console.error('System status script stderr:', stderr)
    }

    const data: SystemStatus = JSON.parse(stdout)

    // 狀態判斷邏輯
    let systemStatus: 'healthy' | 'warning' | 'error' = 'healthy'

    // Token usage 警告
    if (data.tokenUsage.percentage > 90 || data.tokenUsage.weeklyQuotaUsed) {
      systemStatus = 'error'
    } else if (data.tokenUsage.percentage > 70) {
      systemStatus = 'warning'
    }

    // 磁碟空間警告
    if (data.storage.diskUsage > 80) {
      systemStatus = systemStatus === 'error' ? 'error' : 'warning'
    }

    // 更新狀態
    data.system.status = systemStatus

    return NextResponse.json(data)
  } catch (error) {
    console.error('System status API error:', error)
    
    // 返回降級數據
    return NextResponse.json({
      tokenUsage: { current: 0, limit: 200000, percentage: 0, weeklyQuotaUsed: false },
      sessions: { active: 0, total: 0, mainAgent: 0, subAgents: 0 },
      storage: { openclaw: 'N/A', diskUsage: 0, available: 'N/A' },
      system: { uptime: 'N/A', lastRestart: 'N/A', status: 'error' as const },
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch system status',
    }, { status: 500 })
  }
}
