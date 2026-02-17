import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase-server'

// DELETE /api/trade/order/[id] - Cancel order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const orderId = params.id

    // Validate order ID format
    if (!orderId || orderId.length < 10) {
      return NextResponse.json(
        { success: false, error: 'INVALID_ORDER_ID', message: '無效的訂單ID' },
        { status: 400 }
      )
    }

    // Get order details and verify ownership
    const { data: order, error: orderError } = await supabase
      .from('trade_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'ORDER_NOT_FOUND', message: '訂單不存在或無權限' },
        { status: 404 }
      )
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'submitted', 'partial']
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ORDER_NOT_CANCELLABLE', 
          message: `訂單狀態為 ${order.status}，無法取消` 
        },
        { status: 400 }
      )
    }

    // TODO: Call Shioaji API to cancel the actual order
    // For now, simulate cancellation
    const cancelSuccess = await simulateOrderCancellation(order.shioaji_order_id)
    
    if (!cancelSuccess.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CANCELLATION_FAILED', 
          message: cancelSuccess.message || '取消訂單失敗' 
        },
        { status: 500 }
      )
    }

    // Update order status in database
    const { error: updateError } = await supabase
      .from('trade_orders')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        api_response: {
          ...order.api_response,
          cancellation: {
            cancelled_at: new Date().toISOString(),
            cancelled_by: 'user',
            reason: 'manual_cancellation'
          }
        }
      })
      .eq('id', orderId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'DATABASE_ERROR', message: '更新訂單狀態失敗' },
        { status: 500 }
      )
    }

    // Log cancellation event
    await logOrderEvent(user.id, 'order_cancelled', {
      order_id: orderId,
      symbol: order.symbol,
      action: order.action,
      quantity: order.quantity,
      price: order.price
    })

    return NextResponse.json({
      success: true,
      message: '訂單取消成功',
      data: {
        order_id: orderId,
        symbol: order.symbol,
        action: order.action,
        quantity: order.quantity,
        price: order.price,
        cancelled_at: new Date().toISOString()
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

/**
 * Simulate Shioaji order cancellation
 * In real implementation, this would call Shioaji API
 */
async function simulateOrderCancellation(_shioajiOrderId?: string): Promise<{success: boolean, message?: string}> {
  // Simulate some random cancellation scenarios
  const random = Math.random()
  
  if (random < 0.05) {
    // 5% chance of cancellation failure (order already filled)
    return {
      success: false,
      message: '訂單已成交，無法取消'
    }
  } else if (random < 0.1) {
    // 5% chance of system error
    return {
      success: false,
      message: 'Shioaji 系統錯誤，請稍後重試'
    }
  }
  
  // 90% success rate
  return { success: true }
}

/**
 * Log order-related events for audit purposes
 */
async function logOrderEvent(userId: string, eventType: string, eventData: any) {
  try {
    // In a real implementation, you might want to log to a separate audit table
    // TODO: 實現正確的審計日誌記錄
    console.warn(`[AUDIT] User ${userId} - ${eventType}:`, eventData)
    
    // TODO: Implement proper audit logging
    // const supabase = await createClient()
    // await supabase.from('audit_logs').insert({
    //   user_id: userId,
    //   event_type: eventType,
    //   event_data: eventData,
    //   created_at: new Date().toISOString()
    // })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}