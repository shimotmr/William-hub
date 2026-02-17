
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import { NextRequest, NextResponse } from 'next/server'

import { CredentialEncryption } from '@/lib/encryption'
import { ShioajiClient } from '@/lib/shioaji-client'
import { createClient } from '@/lib/supabase-server'


// GET /api/trade/market-snapshot - Get market overview (TWS index)
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '用戶未認證' },
        { status: 401 }
      )
    }

    // Get user's Shioaji credentials
    const { data: credentials } = await supabase
      .from('user_shioaji_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    let marketData = null
    let useMock = true

    if (credentials) {
      try {
        const shioajiClient = new ShioajiClient()
        const result = await shioajiClient.getConnectionStatus(credentials)
        
        if (result.connected) {
          // Get market snapshot from Shioaji
          marketData = await getMarketSnapshotFromShioaji(credentials)
          useMock = false
        }
      } catch (e) {
        console.error('Shioaji market snapshot error:', e)
      }
    }

    // If no data from Shioaji, use mock data for demo
    if (useMock || !marketData) {
      marketData = getMockMarketSnapshot()
    }

    return NextResponse.json({
      success: true,
      data: marketData
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: error.message || '服務器錯誤' },
      { status: 500 }
    )
  }
}

/**
 * Get market snapshot from Shioaji API
 */
async function getMarketSnapshotFromShioaji(credentials: Record<string, unknown>): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const pythonPath = path.join(process.env.HOME || '', 'clawd', 'trading_env', 'bin', 'python')
    const cliPath = path.join(process.env.HOME || '', 'clawd', 'shioaji_cli.py')
    
    // Create temp credentials file
    const tempCredPath = path.join(process.env.HOME || '', '.openclaw', 'temp', `shioaji_market_${Date.now()}.json`)
    
    const credData = {
      api_key: new CredentialEncryption().decryptCredential(JSON.parse(credentials.api_key_encrypted as string)),
      secret_key: new CredentialEncryption().decryptCredential(JSON.parse(credentials.secret_key_encrypted as string)),
      provider: 'sinopac'
    }
    
    fs.writeFileSync(tempCredPath, JSON.stringify(credData))
    
    const childProcess = spawn(pythonPath, [
      cliPath,
      'get_market_snapshot',
      '--credentials', tempCredPath
    ], {
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''

    childProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    childProcess.stderr.on('data', (data: Buffer) => {
      // Log stderr for debugging but don't store
      console.warn('Shioaji stderr:', data.toString())
    })

    childProcess.on('close', (code: number | null) => {
      // Cleanup temp file
      try { fs.unlinkSync(tempCredPath) } catch {}
      
      if (code === 0 && stdout.trim()) {
        try {
          const result = JSON.parse(stdout.trim())
          if (result.success && result.data) {
            resolve(result.data)
          } else {
            // Return mock if Shioaji fails
            resolve(getMockMarketSnapshot())
          }
        } catch (_e) {
          resolve(getMockMarketSnapshot())
        }
      } else {
        resolve(getMockMarketSnapshot())
      }
    })

    childProcess.on('error', (_error: Error) => {
      try { fs.unlinkSync(tempCredPath) } catch {}
      resolve(getMockMarketSnapshot())
    })
  })
}

/**
 * Mock market snapshot data for demo/offline mode
 */
function getMockMarketSnapshot(): Record<string, unknown> {
  return {
    market_status: 'open',
    is_trading_hours: true,
    indices: [
      {
        symbol: '0050',
        symbol_name: '台灣50',
        last_price: 158.75,
        change: 2.35,
        change_percent: 1.50,
        volume: 5234000,
        updated_at: new Date().toISOString()
      },
      {
        symbol: '0051',
        symbol_name: '台灣中型100',
        last_price: 68.42,
        change: 0.88,
        change_percent: 1.30,
        volume: 2150000,
        updated_at: new Date().toISOString()
      }
    ],
    summary: {
      total_volume: 892345678,
      advancing: 423,
      declining: 387,
      unchanged: 112,
      total_listed: 922
    },
    updated_at: new Date().toISOString()
  }
}
