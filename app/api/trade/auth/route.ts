
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { CredentialEncryption, validateApiKeyFormat, validateSecretKeyFormat } from '@/lib/encryption'
import { ShioajiClient } from '@/lib/shioaji-client'

// POST /api/trade/auth - Store Shioaji credentials (deprecated, use /credentials)
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
    const { api_key, secret_key, ca_cert, ca_password, simulation_mode = true } = body

    // Basic validation
    if (!api_key || !secret_key) {
      return NextResponse.json(
        { success: false, error: 'MISSING_CREDENTIALS', message: 'API Key 和 Secret Key 為必填' },
        { status: 400 }
      )
    }

    // Validate API Key and Secret Key format
    if (!validateApiKeyFormat(api_key)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_API_KEY', message: 'API Key 格式不正確' },
        { status: 400 }
      )
    }

    if (!validateSecretKeyFormat(secret_key)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_SECRET_KEY', message: 'Secret Key 格式不正確' },
        { status: 400 }
      )
    }

    // Initialize encryption service
    const encryption = new CredentialEncryption()
    
    // Encrypt sensitive data
    const encryptedApiKey = encryption.encryptCredential(api_key)
    const encryptedSecretKey = encryption.encryptCredential(secret_key)
    const encryptedCaCert = ca_cert ? encryption.encryptCredential(ca_cert) : null
    const encryptedCaPassword = ca_password ? encryption.encryptCredential(ca_password) : null

    // Store encrypted credentials in database
    const { data, error } = await supabase
      .from('user_shioaji_credentials')
      .upsert({
        user_id: user.id,
        api_key_encrypted: JSON.stringify(encryptedApiKey),
        secret_key_encrypted: JSON.stringify(encryptedSecretKey),
        ca_cert_encrypted: encryptedCaCert ? JSON.stringify(encryptedCaCert) : null,
        ca_cert_password_encrypted: encryptedCaPassword ? JSON.stringify(encryptedCaPassword) : null,
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

  } catch (error: unknown) {
    console.error('API error:', error)
    
    // Handle encryption errors specifically
    if (error instanceof Error && error.message?.includes('加密失敗')) {
      return NextResponse.json(
        { success: false, error: 'ENCRYPTION_ERROR', message: '憑證加密失敗' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服務器錯誤' },
      { status: 500 }
    )
  }
}

// GET /api/trade/auth - Get connection status (deprecated, use /status)
export async function GET(_request: NextRequest) {
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

    // Get user credentials
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
      const connectionStatus = await shioajiClient.getConnectionStatus(credentials)

      return NextResponse.json({
        success: true,
        data: connectionStatus
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
          bandwidth_used_mb: 0.0,
          accounts: [],
          error: 'Shioaji 服務暫時無法連線'
        }
      })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服務器錯誤' },
      { status: 500 }
    )
  }
}