import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// GET /api/trade/balance - Get account balance
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

    // Check user credentials exist
    const { data: credentials } = await supabase
      .from('user_shioaji_credentials')
      .select('is_active, simulation_mode')
      .eq('user_id', user.id)
      .single()

    if (!credentials?.is_active) {
      return NextResponse.json(
        { success: false, error: 'CREDENTIALS_REQUIRED', message: '請先設定 Shioaji 憑證' },
        { status: 400 }
      )
    }

    // TODO: In real implementation, fetch actual balance from Shioaji API
    // For now, calculate mock balance based on trades and positions

    // Get all filled orders to calculate cash flow
    const { data: filledOrders, error: ordersError } = await supabase
      .from('trade_orders')
      .select('action, filled_quantity, filled_price, filled_at, api_response')
      .eq('user_id', user.id)
      .eq('status', 'filled')
      .not('filled_quantity', 'is', null)

    if (ordersError) {
      console.error('Database error:', ordersError)
      return NextResponse.json(
        { success: false, error: 'DATABASE_ERROR', message: '查詢帳戶資料失敗' },
        { status: 500 }
      )
    }

    // Calculate cash flow from trades
    let totalCashOut = 0 // Money spent on buying stocks
    let totalCashIn = 0  // Money received from selling stocks
    let totalCommission = 0
    let totalTax = 0
    let todayPnl = 0

    const today = new Date().toISOString().slice(0, 10)

    filledOrders.forEach(order => {
      const orderValue = (order.filled_quantity || 0) * (order.filled_price || 0) * 1000
      const commission = Math.round(orderValue * 0.001425 * 0.28)
      const tax = order.action === 'sell' ? Math.round(orderValue * 0.003) : 0

      totalCommission += commission

      if (order.action === 'buy') {
        totalCashOut += orderValue + commission
      } else if (order.action === 'sell') {
        totalCashIn += orderValue - commission - tax
        totalTax += tax
      }

      // Calculate today's P&L (simplified)
      if (order.filled_at?.startsWith(today)) {
        if (order.action === 'buy') {
          todayPnl -= (commission + tax)
        } else {
          // For sells, estimate profit based on a mock cost basis
          const estimatedCost = orderValue * 0.95 // Assume 5% profit
          todayPnl += (orderValue - estimatedCost - commission - tax)
        }
      }
    })

    // Mock initial deposit
    const initialDeposit = 2000000 // 2M TWD starting balance

    // Calculate current positions value
    const { data: positions } = await supabase
      .rpc('get_user_positions', { p_user_id: user.id })
      .single()

    // Mock current prices for position valuation
    const mockPrices: { [key: string]: number } = {
      '2330': 985.00,
      '2317': 178.50,
      '2454': 1285.00,
      '2881': 85.60,
      '2412': 132.50,
      '2603': 198.00,
      '2382': 312.00,
      '3711': 168.00
    }

    // Calculate positions market value (simplified calculation)
    let totalMarketValue = 0
    let totalCostBasis = 0

    // Since we don't have actual positions function, calculate from orders
    const positionMap: { [symbol: string]: { qty: number, cost: number } } = {}
    
    filledOrders.forEach(order => {
      const symbol = order.symbol || 'unknown'
      if (!positionMap[symbol]) {
        positionMap[symbol] = { qty: 0, cost: 0 }
      }

      const orderQty = order.filled_quantity || 0
      const orderPrice = order.filled_price || 0
      const orderValue = orderQty * orderPrice * 1000

      if (order.action === 'buy') {
        positionMap[symbol].qty += orderQty
        positionMap[symbol].cost += orderValue
      } else {
        const sellQty = Math.min(orderQty, positionMap[symbol].qty)
        const avgCost = positionMap[symbol].cost / positionMap[symbol].qty
        positionMap[symbol].qty -= sellQty
        positionMap[symbol].cost -= sellQty * avgCost
      }
    })

    Object.entries(positionMap).forEach(([symbol, pos]) => {
      if (pos.qty > 0) {
        const currentPrice = mockPrices[symbol] || (pos.cost / pos.qty / 1000)
        const marketValue = pos.qty * currentPrice * 1000
        totalMarketValue += marketValue
        totalCostBasis += pos.cost
      }
    })

    const unrealizedPnl = totalMarketValue - totalCostBasis
    const cashBalance = initialDeposit - totalCashOut + totalCashIn
    const availableBalance = Math.max(0, cashBalance * 0.95) // 95% of cash is available (5% margin buffer)

    // Mock additional account details
    const mockBalance = {
      cash_balance: Math.round(cashBalance),
      available_balance: Math.round(availableBalance),
      margin_available: credentials.simulation_mode ? 0 : Math.round(totalMarketValue * 0.6), // 60% margin ratio
      short_available: credentials.simulation_mode ? 0 : Math.round(availableBalance * 0.5), // 50% short ratio
      total_market_value: Math.round(totalMarketValue),
      total_cost: Math.round(totalCostBasis),
      unrealized_pnl: Math.round(unrealizedPnl),
      realized_pnl_today: Math.round(todayPnl),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: mockBalance
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服務器錯誤' },
      { status: 500 }
    )
  }
}