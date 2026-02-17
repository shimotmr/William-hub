import { NextRequest, NextResponse } from 'next/server'
import { CredentialEncryption, validateApiKeyFormat, validateSecretKeyFormat } from '@/lib/encryption'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// POST /api/trade/auth/credentials - Store Shioaji credentials
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

    // Log security event (optional - could be implemented later)
    console.warn(`User ${user.id} stored Shioaji credentials (${simulation_mode ? 'simulation' : 'production'} mode)`)

    return NextResponse.json({
      success: true,
      message: '憑證設定成功',
      credential_id: data.id,
      is_activated: false
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