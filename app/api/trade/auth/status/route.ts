import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { ShioajiClient } from '@/lib/shioaji-client'

// GET /api/trade/auth/status - Get Shioaji connection status
export async function GET(_request: NextRequest) {
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

    // Get user credentials from database
    const { data: credentials, error: credError } = await supabase
      .from('user_shioaji_credentials')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (credError || !credentials) {
      return NextResponse.json({
        success: true,
        data: {
          is_connected: false,
          connection_time: null,
          api_calls_today: 0,
          daily_quota: 10000,
          bandwidth_used_mb: 0,
          accounts: []
        }
      })
    }

    // Check if credentials are active
    if (!credentials.is_active) {
      return NextResponse.json({
        success: true,
        data: {
          is_connected: false,
          connection_time: null,
          api_calls_today: credentials.daily_api_calls || 0,
          daily_quota: 10000,
          bandwidth_used_mb: 0,
          accounts: []
        }
      })
    }

    // Initialize Shioaji client
    const shioajiClient = new ShioajiClient()

    try {
      // Get real-time connection status
      console.warn(`Checking Shioaji connection status for user ${user.id}`)
      const connectionStatus = await shioajiClient.getConnectionStatus(credentials)

      // Update API call count (simple increment for now)
      const newApiCallCount = (credentials.daily_api_calls || 0) + 1
      await supabase
        .from('user_shioaji_credentials')
        .update({ 
          daily_api_calls: newApiCallCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', credentials.id)

      return NextResponse.json({
        success: true,
        data: {
          is_connected: connectionStatus.connected,
          connection_time: connectionStatus.connection_time,
          api_calls_today: newApiCallCount,
          daily_quota: connectionStatus.daily_quota,
          bandwidth_used_mb: connectionStatus.bandwidth_used_mb,
          accounts: connectionStatus.accounts,
          simulation_mode: credentials.simulation_mode,
          last_login_at: credentials.last_login_at,
          credential_id: credentials.id
        }
      })

    } catch (shioajiError: unknown) {
      // If Shioaji connection check fails, return cached status
      console.warn(`Shioaji connection check failed for user ${user.id}:`, shioajiError instanceof Error ? shioajiError.message : String(shioajiError))
      
      return NextResponse.json({
        success: true,
        data: {
          is_connected: false,
          connection_time: credentials.last_login_at || credentials.created_at,
          api_calls_today: credentials.daily_api_calls || 0,
          daily_quota: 10000,
          bandwidth_used_mb: 0,
          accounts: [],
          simulation_mode: credentials.simulation_mode,
          last_login_at: credentials.last_login_at,
          credential_id: credentials.id,
          error: 'Shioaji 服務暫時無法連線'
        }
      })
    }

  } catch (error: unknown) {
    console.error('Status check error:', error)

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服務器錯誤' },
      { status: 500 }
    )
  }
}