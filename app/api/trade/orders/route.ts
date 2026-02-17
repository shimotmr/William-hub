
import { NextRequest, NextResponse } from 'next/server'

import { riskManager } from '@/lib/risk-management'
import { createClient } from '@/lib/supabase-server'

// POST /api/trade/orders - Place new order
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { 
      symbol, 
      action, 
      order_type = 'limit', 
      price, 
      quantity, 
      account_type = 'cash'
    } = body

    // Validate required fields
    if (!symbol || !action || !quantity) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: '股票代號、買賣方向和數量為必填' },
        { status: 400 }
      )
    }

    // Validate symbol format (Taiwan stock codes)
    if (!/^[0-9]{4,6}$/.test(symbol)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_SYMBOL', message: '股票代號格式不正確' },
        { status: 400 }
      )
    }

    // Validate action
    if (!['buy', 'sell'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_ACTION', message: '買賣方向必須為 buy 或 sell' },
        { status: 400 }
      )
    }

    // Validate quantity
    if (quantity <= 0 || quantity > 1000) {
      return NextResponse.json(
        { success: false, error: 'INVALID_QUANTITY', message: '數量必須介於 1-1000 張' },
        { status: 400 }
      )
    }

    // Validate price for limit orders
    if (order_type === 'limit' && (!price || price <= 0)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_PRICE', message: '限價單必須指定有效價格' },
        { status: 400 }
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

    // Calculate estimated amounts
    const orderPrice = order_type === 'market' ? null : price
    const estimatedAmount = orderPrice ? orderPrice * quantity * 1000 : null
    const commission = estimatedAmount ? Math.round(estimatedAmount * 0.001425 * 0.28) : 0
    const tax = action === 'sell' && estimatedAmount ? Math.round(estimatedAmount * 0.003) : 0
    const totalAmount = estimatedAmount ? estimatedAmount + commission + tax : null

    // Risk management checks
    const riskCheck = await riskManager.checkRiskLimits(user.id, {
      symbol,
      action,
      price: orderPrice,
      quantity,
      order_type
    })

    if (!riskCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'RISK_VIOLATION',
          message: '風控檢查未通過',
          risk_blocks: riskCheck.blocks,
          risk_warnings: riskCheck.warnings,
          limits_used: riskCheck.limits_used
        },
        { status: 400 }
      )
    }

    // For buy orders, check balance (simplified - in real implementation, query account balance)
    if (action === 'buy' && totalAmount) {
      // TODO: Implement actual balance check
      const mockBalance = 1000000 // Mock balance of 1M TWD
      if (totalAmount > mockBalance) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'INSUFFICIENT_BALANCE', 
            message: '帳戶餘額不足',
            required_amount: totalAmount,
            available_balance: mockBalance
          },
          { status: 400 }
        )
      }
    }

    // Generate unique order ID
    const orderId = crypto.randomUUID()
    const shioajiOrderId = `SJ_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    // Insert order into database
    const { data: order, error: orderError } = await supabase
      .from('trade_orders')
      .insert({
        id: orderId,
        user_id: user.id,
        symbol,
        action,
        order_type,
        quantity,
        price: orderPrice,
        status: 'submitted',
        shioaji_order_id: shioajiOrderId,
        margin_trading_type: account_type,
        ordered_at: new Date().toISOString(),
        api_response: {
          estimated_amount: estimatedAmount,
          commission,
          tax,
          total_amount: totalAmount
        }
      })
      .select()
      .single()

    if (orderError) {
      console.error('Database error:', orderError)
      return NextResponse.json(
        { success: false, error: 'DATABASE_ERROR', message: '下單記錄保存失敗' },
        { status: 500 }
      )
    }

    // TODO: Actually submit order to Shioaji API
    // For now, simulate order submission
    setTimeout(async () => {
      // Simulate order fill after 1-5 seconds
      const fillDelay = Math.random() * 4000 + 1000
      setTimeout(async () => {
        const filledPrice = orderPrice || (action === 'buy' ? price * 1.001 : price * 0.999)
        await supabase
          .from('trade_orders')
          .update({ 
            status: 'filled',
            filled_quantity: quantity,
            filled_price: filledPrice,
            filled_at: new Date().toISOString()
          })
          .eq('id', orderId)
      }, fillDelay)
    }, 100)

    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        shioaji_order_id: shioajiOrderId,
        symbol,
        action,
        quantity,
        price: orderPrice,
        estimated_amount: estimatedAmount,
        commission,
        tax,
        total_amount: totalAmount,
        status: 'submitted',
        created_at: order.ordered_at
      },
      risk_info: {
        risk_level: riskCheck.risk_level,
        warnings: riskCheck.warnings,
        limits_used: riskCheck.limits_used
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

// GET /api/trade/orders - Get user orders
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
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('trade_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('ordered_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: orders, error: ordersError } = await query
      .range(offset, offset + limit - 1)

    if (ordersError) {
      console.error('Database error:', ordersError)
      return NextResponse.json(
        { success: false, error: 'DATABASE_ERROR', message: '查詢訂單失敗' },
        { status: 500 }
      )
    }

    // Get stock names (mock for now)
    const stockNames: { [key: string]: string } = {
      '2330': '台積電',
      '2317': '鴻海',
      '2454': '聯發科',
      '2881': '富邦金',
      '2412': '中華電',
      '2603': '長榮',
      '2382': '廣達'
    }

    const formattedOrders = orders.map(order => ({
      order_id: order.id,
      shioaji_order_id: order.shioaji_order_id,
      symbol: order.symbol,
      symbol_name: stockNames[order.symbol] || '未知股票',
      action: order.action,
      order_type: order.order_type,
      quantity: order.quantity,
      price: order.price,
      filled_quantity: order.filled_quantity || 0,
      filled_price: order.filled_price,
      status: order.status,
      created_at: order.ordered_at,
      updated_at: order.updated_at || order.ordered_at
    }))

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        total: orders.length,
        has_more: orders.length === limit
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