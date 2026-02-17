
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import { NextRequest, NextResponse } from 'next/server'

import { CredentialEncryption } from '@/lib/encryption'
import { ShioajiClient } from '@/lib/shioaji-client'
import { createClient } from '@/lib/supabase-server'


// GET /api/trade/quote?symbol=2330 - Get single stock quote
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'MISSING_SYMBOL', message: '請提供股票代號' },
        { status: 400 }
      )
    }

    // Validate symbol format
    if (!/^[0-9]{4,6}$/.test(symbol)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_SYMBOL', message: '股票代號格式不正確' },
        { status: 400 }
      )
    }

    // Get user's Shioaji credentials
    const { data: credentials } = await supabase
      .from('user_shioaji_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    let quoteData = null

    if (credentials) {
      try {
        const shioajiClient = new ShioajiClient()
        const result = await shioajiClient.getConnectionStatus(credentials)
        
        if (result.connected) {
          // Get quote from Shioaji
          quoteData = await getQuoteFromShioaji(symbol, credentials)
        }
      } catch (e) {
        console.error('Shioaji quote error:', e)
      }
    }

    // If no quote from Shioaji, use mock data for demo
    if (!quoteData) {
      quoteData = getMockQuote(symbol)
    }

    return NextResponse.json({
      success: true,
      data: {
        quote: quoteData
      }
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
 * Get quote from Shioaji API
 */
async function getQuoteFromShioaji(symbol: string, credentials: Record<string, unknown>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.env.HOME || '', 'clawd', 'trading_env', 'bin', 'python')
    const cliPath = path.join(process.env.HOME || '', 'clawd', 'shioaji_cli.py')
    
    // Create temp credentials file
    const tempCredPath = path.join(process.env.HOME || '', '.openclaw', 'temp', `shioaji_quote_${Date.now()}.json`)
    
    const credData = {
      api_key: new CredentialEncryption().decryptCredential(JSON.parse(credentials.api_key_encrypted as string)),
      secret_key: new CredentialEncryption().decryptCredential(JSON.parse(credentials.secret_key_encrypted as string)),
      provider: 'sinopac'
    }
    
    fs.writeFileSync(tempCredPath, JSON.stringify(credData))
    
    const childProcess = spawn(pythonPath, [
      cliPath,
      'get_quote',
      '--credentials', tempCredPath,
      '--symbol', symbol
    ], {
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    childProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    childProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    childProcess.on('close', (code: number | null) => {
      // Cleanup temp file
      try { fs.unlinkSync(tempCredPath) } catch {}
      
      if (code === 0 && stdout.trim()) {
        try {
          const result = JSON.parse(stdout.trim()) as Record<string, unknown>
          if (result.success && result.data) {
            // Transform to required format
            const q = result.data as Record<string, unknown>
            resolve({
              symbol: q.symbol as string,
              symbol_name: (q.name as string) || symbol,
              last_price: parseFloat((q.price as number)?.toFixed(2)) || 0,
              change: parseFloat((q.change as number)?.toFixed(2)) || 0,
              change_percent: parseFloat((((q.change as number) / ((q.price as number) - (q.change as number))) * 100)?.toFixed(2)) || 0,
              volume: (q.volume as number) || 0,
              bid_price: parseFloat((q.bid_price as number)?.toFixed(2)) || 0,
              ask_price: parseFloat((q.ask_price as number)?.toFixed(2)) || 0,
              updated_at: (q.updated_at as string) || new Date().toISOString()
            })
          } else {
            reject(new Error((result.error as string) || 'Failed to get quote'))
          }
        } catch (e) {
          reject(e)
        }
      } else {
        reject(new Error(stderr || 'Failed to execute quote command'))
      }
    })

    childProcess.on('error', (error: Error) => {
      try { fs.unlinkSync(tempCredPath) } catch {}
      reject(error)
    })
  })
}

/**
 * Mock quote data for demo/offline mode
 */
function getMockQuote(symbol: string): Record<string, unknown> {
  const mockData: Record<string, any> = {
    '2330': {
      symbol: '2330',
      symbol_name: '台積電',
      last_price: 985.00,
      change: 15.00,
      change_percent: 1.55,
      volume: 28453,
      bid_price: 984.00,
      ask_price: 986.00,
      high: 988.00,
      low: 972.00,
      open: 975.00,
      previous_close: 970.00
    },
    '2317': {
      symbol: '2317',
      symbol_name: '鴻海',
      last_price: 178.50,
      change: -2.50,
      change_percent: -1.38,
      volume: 45231,
      bid_price: 178.00,
      ask_price: 179.00,
      high: 182.00,
      low: 177.00,
      open: 181.00,
      previous_close: 181.00
    },
    '2454': {
      symbol: '2454',
      symbol_name: '聯發科',
      last_price: 1285.00,
      change: 35.00,
      change_percent: 2.80,
      volume: 5621,
      bid_price: 1284.00,
      ask_price: 1286.00,
      high: 1290.00,
      low: 1250.00,
      open: 1255.00,
      previous_close: 1250.00
    }
  }

  const data = mockData[symbol] || {
    symbol,
    symbol_name: '未知股票',
    last_price: 0,
    change: 0,
    change_percent: 0,
    volume: 0,
    bid_price: 0,
    ask_price: 0
  }

  return {
    ...data,
    updated_at: new Date().toISOString()
  }
}
