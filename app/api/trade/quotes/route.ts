
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import { NextRequest, NextResponse } from 'next/server'

import { CredentialEncryption } from '@/lib/encryption'
import { ShioajiClient } from '@/lib/shioaji-client'
import { createClient } from '@/lib/supabase-server'


// GET /api/trade/quotes?symbols=2330,2317,2454 - Get batch stock quotes
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
    const symbolsParam = searchParams.get('symbols')

    if (!symbolsParam) {
      return NextResponse.json(
        { success: false, error: 'MISSING_SYMBOLS', message: '請提供股票代號' },
        { status: 400 }
      )
    }

    const symbols = symbolsParam.split(',')
      .map(s => s.trim())
      .filter(s => /^[0-9]{4,6}$/.test(s))

    if (symbols.length === 0) {
      return NextResponse.json(
        { success: false, error: 'INVALID_SYMBOLS', message: '無有效的股票代號' },
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

    let quotes: Record<string, unknown>[] = []
    let useMock = true

    if (credentials) {
      try {
        const shioajiClient = new ShioajiClient()
        const result = await shioajiClient.getConnectionStatus(credentials)
        
        if (result.connected) {
          // Get quotes from Shioaji
          quotes = await getQuotesFromShioaji(symbols, credentials)
          useMock = false
        }
      } catch (e: any) {
        console.error('Shioaji quotes error:', e)
      }
    }

    // If no quotes from Shioaji, use mock data for demo
    if (useMock || quotes.length === 0) {
      quotes = symbols.map(symbol => getMockQuote(symbol))
    }

    return NextResponse.json({
      success: true,
      data: {
        quotes
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
 * Get batch quotes from Shioaji API
 */
async function getQuotesFromShioaji(symbols: string[], credentials: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.env.HOME || '', 'clawd', 'trading_env', 'bin', 'python')
    const cliPath = path.join(process.env.HOME || '', 'clawd', 'shioaji_cli.py')
    
    // Create temp credentials file
    const tempCredPath = path.join(process.env.HOME || '', '.openclaw', 'temp', `shioaji_quotes_${Date.now()}.json`)
    
    const credData = {
      api_key: new CredentialEncryption().decryptCredential(JSON.parse(credentials.api_key_encrypted as string)),
      secret_key: new CredentialEncryption().decryptCredential(JSON.parse(credentials.secret_key_encrypted as string)),
      provider: 'sinopac'
    }
    
    fs.writeFileSync(tempCredPath, JSON.stringify(credData))
    
    const childProcess = spawn(pythonPath, [
      cliPath,
      'get_quotes',
      '--credentials', tempCredPath,
      '--symbols', symbols.join(',')
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
          const result = JSON.parse(stdout.trim())
          if (result.success && result.data && result.data.quotes) {
            const quotes = result.data.quotes.map((q: any) => ({
              symbol: q.symbol,
              symbol_name: q.name || q.symbol,
              last_price: parseFloat(q.price?.toFixed(2)) || 0,
              change: parseFloat(q.change?.toFixed(2)) || 0,
              change_percent: parseFloat(((q.change / (q.price - q.change)) * 100)?.toFixed(2)) || 0,
              volume: q.volume || 0,
              bid_price: parseFloat(q.bid_price?.toFixed(2)) || 0,
              ask_price: parseFloat(q.ask_price?.toFixed(2)) || 0,
              updated_at: q.updated_at || new Date().toISOString()
            }))
            resolve(quotes)
          } else {
            reject(new Error(result.error || 'Failed to get quotes'))
          }
        } catch (e) {
          reject(e)
        }
      } else {
        reject(new Error(stderr || 'Failed to execute quotes command'))
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
