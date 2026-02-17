import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// GET /api/trade/quotes - Get stock quotes
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
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
    const includeOrderbook = searchParams.get('include') === 'orderbook'

    if (!symbolsParam) {
      return NextResponse.json(
        { success: false, error: 'MISSING_SYMBOLS', message: '請提供股票代號' },
        { status: 400 }
      )
    }

    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(s => /^[0-9]{4,6}$/.test(s))

    if (symbols.length === 0) {
      return NextResponse.json(
        { success: false, error: 'INVALID_SYMBOLS', message: '無有效的股票代號' },
        { status: 400 }
      )
    }

    // Check if quotes exist in cache table
    const { data: cachedQuotes, error: cacheError } = await supabase
      .from('stock_quotes_cache')
      .select('*')
      .in('symbol', symbols)
      .eq('market', 'TW')

    if (cacheError) {
      console.error('Cache query error:', cacheError)
    }

    // Mock real-time quotes (in production, this would fetch from Shioaji API)
    const mockQuotes = {
      '2330': {
        symbol: '2330',
        symbol_name: '台積電',
        last_price: 985.00 + (Math.random() - 0.5) * 4,
        change: 15.00 + (Math.random() - 0.5) * 2,
        change_percent: 1.55 + (Math.random() - 0.5) * 0.2,
        volume: Math.floor(28453 + Math.random() * 5000),
        high: 988.00,
        low: 972.00,
        open: 975.00,
        previous_close: 970.00,
        limit_up: 1067.00,
        limit_down: 873.00,
        is_trading_halt: false,
        orderbook: includeOrderbook ? {
          bids: [
            { price: 984.00, volume: 400 },
            { price: 983.00, volume: 350 },
            { price: 982.00, volume: 250 },
            { price: 981.00, volume: 180 },
            { price: 980.00, volume: 120 }
          ],
          asks: [
            { price: 986.00, volume: 500 },
            { price: 987.00, volume: 300 },
            { price: 988.00, volume: 150 },
            { price: 989.00, volume: 200 },
            { price: 990.00, volume: 100 }
          ]
        } : undefined
      },
      '2317': {
        symbol: '2317',
        symbol_name: '鴻海',
        last_price: 178.50 + (Math.random() - 0.5) * 2,
        change: -2.50 + (Math.random() - 0.5) * 1,
        change_percent: -1.38 + (Math.random() - 0.5) * 0.1,
        volume: Math.floor(45231 + Math.random() * 8000),
        high: 182.00,
        low: 177.00,
        open: 181.00,
        previous_close: 181.00,
        limit_up: 199.10,
        limit_down: 162.90,
        is_trading_halt: false,
        orderbook: includeOrderbook ? {
          bids: [
            { price: 178.00, volume: 800 },
            { price: 177.50, volume: 600 },
            { price: 177.00, volume: 450 },
            { price: 176.50, volume: 300 },
            { price: 176.00, volume: 250 }
          ],
          asks: [
            { price: 179.00, volume: 700 },
            { price: 179.50, volume: 500 },
            { price: 180.00, volume: 400 },
            { price: 180.50, volume: 300 },
            { price: 181.00, volume: 200 }
          ]
        } : undefined
      },
      '2454': {
        symbol: '2454',
        symbol_name: '聯發科',
        last_price: 1285.00 + (Math.random() - 0.5) * 20,
        change: 35.00 + (Math.random() - 0.5) * 10,
        change_percent: 2.80 + (Math.random() - 0.5) * 0.5,
        volume: Math.floor(5621 + Math.random() * 2000),
        high: 1290.00,
        low: 1250.00,
        open: 1255.00,
        previous_close: 1250.00,
        limit_up: 1375.00,
        limit_down: 1125.00,
        is_trading_halt: false,
        orderbook: includeOrderbook ? {
          bids: [
            { price: 1284.00, volume: 100 },
            { price: 1283.00, volume: 80 },
            { price: 1282.00, volume: 60 },
            { price: 1281.00, volume: 50 },
            { price: 1280.00, volume: 40 }
          ],
          asks: [
            { price: 1286.00, volume: 120 },
            { price: 1287.00, volume: 90 },
            { price: 1288.00, volume: 70 },
            { price: 1289.00, volume: 60 },
            { price: 1290.00, volume: 50 }
          ]
        } : undefined
      }
    }

    const quotes = symbols.map(symbol => {
      const cached = cachedQuotes?.find(q => q.symbol === symbol)
      const mock = mockQuotes[symbol as keyof typeof mockQuotes]
      
      if (mock) {
        return {
          ...mock,
          updated_at: new Date().toISOString()
        }
      }

      // If no mock data, return cached or default
      if (cached) {
        return {
          symbol: cached.symbol,
          symbol_name: cached.name || '未知股票',
          last_price: cached.last_price || 0,
          change: cached.change || 0,
          change_percent: cached.change_percent || 0,
          volume: cached.volume || 0,
          high: cached.high || cached.last_price || 0,
          low: cached.low || cached.last_price || 0,
          open: cached.open || cached.last_price || 0,
          previous_close: cached.previous_close || cached.last_price || 0,
          limit_up: cached.price_limit_up || (cached.last_price ? cached.last_price * 1.1 : 0),
          limit_down: cached.price_limit_down || (cached.last_price ? cached.last_price * 0.9 : 0),
          is_trading_halt: cached.is_trading_halt || false,
          updated_at: cached.updated_at || new Date().toISOString()
        }
      }

      // Return minimal data if no info available
      return {
        symbol,
        symbol_name: '未知股票',
        last_price: 0,
        change: 0,
        change_percent: 0,
        volume: 0,
        high: 0,
        low: 0,
        open: 0,
        previous_close: 0,
        limit_up: 0,
        limit_down: 0,
        is_trading_halt: false,
        updated_at: new Date().toISOString()
      }
    })

    // Update cache with latest quotes (background operation)
    quotes.forEach(quote => {
      if (quote.last_price > 0) {
        supabase
          .from('stock_quotes_cache')
          .upsert({
            symbol: quote.symbol,
            market: 'TW',
            name: quote.symbol_name,
            last_price: quote.last_price,
            change: quote.change,
            change_percent: quote.change_percent,
            volume: quote.volume,
            high: quote.high,
            low: quote.low,
            open: quote.open,
            previous_close: quote.previous_close,
            price_limit_up: quote.limit_up,
            price_limit_down: quote.limit_down,
            is_trading_halt: quote.is_trading_halt,
            updated_at: new Date().toISOString(),
            data_source: 'shioaji'
          })
          .then(() => {}) // Silent update
          .catch(err => console.error('Cache update error:', err))
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        quotes
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服務器錯誤' },
      { status: 500 }
    )
  }
}