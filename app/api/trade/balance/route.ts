import { NextRequest, NextResponse } from 'next/server'

// GET /api/trade/balance - Get account balance
export async function GET(request: NextRequest) {
  try {
    // For MVP, we'll use mock data
    // In production, implement proper JWT token validation and real API calls

    // Mock account balance data for MVP
    const mockBalance = {
      cash_balance: 1850000,           // 現金餘額
      available_balance: 1650000,      // 可用餘額
      margin_available: 500000,        // 融資可用額度
      short_available: 300000,         // 融券可用額度
      total_market_value: 2450000,     // 持倉總市值
      total_cost: 2320000,             // 持倉總成本
      unrealized_pnl: 130000,          // 未實現損益
      realized_pnl_today: 15200,       // 今日已實現損益
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