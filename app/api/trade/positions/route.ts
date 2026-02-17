import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

// GET /api/trade/positions - Get user positions
export async function GET(request: NextRequest) {
  try {
    // For MVP, we'll use a mock user ID
    // In production, implement proper JWT token validation
    const mockUserId = 'mock-user-id-123'

    // Check user credentials exist (mock for MVP)
    const mockCredentials = {
      is_active: true
    }

    if (!mockCredentials.is_active) {
      return NextResponse.json(
        { success: false, error: 'CREDENTIALS_REQUIRED', message: '請先設定 Shioaji 憑證' },
        { status: 400 }
      )
    }

    // Try to fetch real positions from Shioaji API first
    let realPositions = null
    try {
      // TODO: Implement real Shioaji API call here
      // const { ShioajiClient } = await import('@/lib/shioaji-client')
      // const shioajiClient = new ShioajiClient()
      // realPositions = await shioajiClient.getPositions(credentials)
      
      // For now, use calculation from orders but keep the structure
      console.log('Using calculated positions - Shioaji integration pending')
    } catch (error) {
      console.warn('Shioaji API call failed, falling back to calculation:', error)
    }

    // Mock filled orders data for MVP (calculate positions from these)
    const filledOrders = [
      {
        symbol: '2330',
        action: 'buy',
        filled_quantity: 5,
        filled_price: 968.20,
        filled_at: '2026-02-15T09:30:00Z'
      },
      {
        symbol: '2317',
        action: 'buy',
        filled_quantity: 10,
        filled_price: 178.00,
        filled_at: '2026-02-16T10:15:00Z'
      },
      {
        symbol: '2454',
        action: 'buy',
        filled_quantity: 2,
        filled_price: 1285.00,
        filled_at: '2026-02-17T11:00:00Z'
      },
      {
        symbol: '2317',
        action: 'sell',
        filled_quantity: 3,
        filled_price: 179.50,
        filled_at: '2026-02-17T14:30:00Z'
      }
    ]

    // Calculate net positions
    const positionMap: { [symbol: string]: {
      symbol: string
      quantity: number
      totalCost: number
      trades: number
    }} = {}

    filledOrders.forEach(order => {
      if (!positionMap[order.symbol]) {
        positionMap[order.symbol] = {
          symbol: order.symbol,
          quantity: 0,
          totalCost: 0,
          trades: 0
        }
      }

      const position = positionMap[order.symbol]
      const orderQuantity = order.filled_quantity || 0
      const orderPrice = order.filled_price || 0
      const orderValue = orderQuantity * orderPrice * 1000

      if (order.action === 'buy') {
        position.quantity += orderQuantity
        position.totalCost += orderValue
      } else if (order.action === 'sell') {
        // For sell orders, reduce quantity and adjust cost proportionally
        if (position.quantity > 0) {
          const avgCost = position.totalCost / position.quantity
          const sellQuantity = Math.min(orderQuantity, position.quantity)
          position.quantity -= sellQuantity
          position.totalCost -= sellQuantity * avgCost
        }
      }
      position.trades++
    })

    // Filter out zero positions and get current prices
    const activePositions = Object.values(positionMap).filter(pos => pos.quantity > 0)

    // Mock current prices (in real implementation, get from quotes cache or API)
    const currentPrices: { [symbol: string]: { price: number, name: string } } = {
      '2330': { price: 985.00, name: '台積電' },
      '2317': { price: 178.50, name: '鴻海' },
      '2454': { price: 1285.00, name: '聯發科' },
      '2881': { price: 85.60, name: '富邦金' },
      '2412': { price: 132.50, name: '中華電' },
      '2603': { price: 198.00, name: '長榮' },
      '2382': { price: 312.00, name: '廣達' },
      '3711': { price: 168.00, name: '日月光投控' }
    }

    const positions = activePositions.map(pos => {
      const avgCost = pos.totalCost / (pos.quantity * 1000)
      const currentInfo = currentPrices[pos.symbol] || { price: avgCost, name: '未知股票' }
      const currentPrice = currentInfo.price
      const marketValue = pos.quantity * currentPrice * 1000
      const unrealizedPnl = marketValue - pos.totalCost
      const unrealizedPnlPercent = (unrealizedPnl / pos.totalCost) * 100

      return {
        symbol: pos.symbol,
        symbol_name: currentInfo.name,
        quantity: pos.quantity,
        avg_cost: avgCost,
        current_price: currentPrice,
        market_value: marketValue,
        cost_basis: pos.totalCost,
        unrealized_pnl: unrealizedPnl,
        unrealized_pnl_percent: unrealizedPnlPercent,
        updated_at: new Date().toISOString()
      }
    })

    // Calculate summary
    const summary = {
      total_cost: positions.reduce((sum, pos) => sum + pos.cost_basis, 0),
      total_market_value: positions.reduce((sum, pos) => sum + pos.market_value, 0),
      total_unrealized_pnl: positions.reduce((sum, pos) => sum + pos.unrealized_pnl, 0),
      total_unrealized_pnl_percent: 0
    }

    if (summary.total_cost > 0) {
      summary.total_unrealized_pnl_percent = (summary.total_unrealized_pnl / summary.total_cost) * 100
    }

    return NextResponse.json({
      success: true,
      data: {
        positions,
        summary
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