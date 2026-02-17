import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// POST /api/trade/auth - Store Shioaji credentials
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { api_key, secret_key, ca_cert, ca_password, simulation_mode = true } = body

    // Basic validation
    if (!api_key || !secret_key) {
      return NextResponse.json(
        { success: false, error: 'MISSING_CREDENTIALS', message: 'API Key 和 Secret Key 為必填' },
        { status: 400 }
      )
    }

    // Validate API Key format (basic check)
    if (!/^[A-Za-z0-9]{20,50}$/.test(api_key)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_API_KEY', message: 'API Key 格式不正確' },
        { status: 400 }
      )
    }

    // For now, store as plain text (TODO: implement AES-256 encryption)
    // In production, these should be encrypted using the CredentialEncryption service
    const { data, error } = await supabase
      .from('user_shioaji_credentials')
      .upsert({
        user_id: user.id,
        api_key_encrypted: api_key, // TODO: encrypt
        secret_key_encrypted: secret_key, // TODO: encrypt
        ca_cert_encrypted: ca_cert || null, // TODO: encrypt
        ca_password_encrypted: ca_password || null, // TODO: encrypt
        simulation_mode,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'DATABASE_ERROR', message: '保存憑證失敗' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '憑證設定成功',
      credential_id: data.id,
      is_activated: false,
      simulation_mode
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服務器錯誤' },
      { status: 500 }
    )
  }
}

// GET /api/trade/auth - Get connection status
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

    // Get user credentials
    const { data: credentials, error: credError } = await supabase
      .from('user_shioaji_credentials')
      .select('id, simulation_mode, is_active, last_login_at, daily_api_calls, created_at')
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

    // TODO: Check actual connection status with Shioaji
    // For now, return mock status based on credentials existence
    return NextResponse.json({
      success: true,
      data: {
        is_connected: credentials.is_active,
        connection_time: credentials.last_login_at || credentials.created_at,
        api_calls_today: credentials.daily_api_calls || 0,
        daily_quota: 10000,
        bandwidth_used_mb: 0.0,
        accounts: credentials.is_active ? [
          {
            account_id: "mock_account_001",
            account_type: "stock",
            is_ca_activated: !credentials.simulation_mode
          }
        ] : []
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