import { NextResponse } from 'next/server'

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

// Fallback data for Vercel deployment (real data fetched from Mac mini via direct API call)
const FALLBACK_DATA: SystemStatus = {
  tokenUsage: { current: 0, limit: 200000, percentage: 0, weeklyQuotaUsed: false },
  sessions: { active: 0, total: 0, mainAgent: 0, subAgents: 0 },
  storage: { openclaw: 'N/A', diskUsage: 0, available: 'N/A' },
  system: { uptime: 'Loading...', lastRestart: 'N/A', status: 'healthy' },
  timestamp: new Date().toISOString(),
}

export async function GET() {
  try {
    // 嘗試從本地 Tailscale 端點獲取數據（如果在 Vercel 上會失敗，返回 fallback）
    const MAC_MINI_ENDPOINT = process.env.MAC_MINI_STATUS_URL || 'http://100.103.23.67:18790/system-status'
    
    // 設置短超時，避免 Vercel 等太久
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    
    try {
      const response = await fetch(MAC_MINI_ENDPOINT, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      })
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data: SystemStatus = await response.json()
        
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
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.log('Mac mini endpoint not reachable, using fallback data')
    }
    
    // Fallback: 返回預設數據
    return NextResponse.json(FALLBACK_DATA)
    
  } catch (error) {
    console.error('System status API error:', error)
    return NextResponse.json(FALLBACK_DATA)
  }
}
