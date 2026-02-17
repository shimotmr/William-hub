import { NextRequest, NextResponse } from 'next/server'

// GET /api/trade/profit-loss - Get profit and loss calculation
export async function GET(request: NextRequest) {
  try {
    // For MVP, we'll use mock data
    // In production, implement proper JWT token validation and real calculations

    // Mock profit and loss data for MVP
    const profitLossData = {
      // Summary
      total_realized_pnl: 45200,        // 總已實現損益
      total_unrealized_pnl: 130000,     // 總未實現損益
      total_pnl: 175200,                // 總損益
      total_return_percent: 7.55,       // 總報酬率
      
      // Today's performance
      today_realized_pnl: 15200,        // 今日已實現損益
      today_unrealized_pnl: 8400,       // 今日未實現損益
      
      // Weekly performance
      week_realized_pnl: 28600,         // 週已實現損益
      week_total_pnl: 158600,           // 週總損益
      
      // Cost breakdown
      total_commission: 5847,           // 總手續費
      total_tax: 2184,                  // 總交易稅
      total_costs: 8031,                // 總成本
      
      // Monthly breakdown
      monthly_pnl: [
        { month: '2026-01', pnl: 18200 },
        { month: '2026-02', pnl: 27000 }
      ],
      
      // Recent realized transactions
      recent_transactions: [
        {
          symbol: '2330',
          buy_date: '2026-02-15',
          sell_date: '2026-02-17',
          quantity: 2,
          buy_price: 968.20,
          sell_price: 985.00,
          profit_loss: 33600,
          commission: 547,
          tax: 592
        },
        {
          symbol: '2317',
          buy_date: '2026-02-16',
          sell_date: '2026-02-17',
          quantity: 3,
          buy_price: 178.00,
          sell_price: 179.50,
          profit_loss: 4500,
          commission: 152,
          tax: 161
        }
      ],
      
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: profitLossData
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服務器錯誤' },
      { status: 500 }
    )
  }
}