import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { ShioajiClient } from '@/lib/shioaji-client'

// POST /api/trade/auth/activate - Activate Shioaji credentials
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
    const { credential_id } = body

    // Get user credentials from database
    let credentialsQuery = supabase
      .from('user_shioaji_credentials')
      .select('*')
      .eq('user_id', user.id)

    // If credential_id is provided, filter by it
    if (credential_id) {
      credentialsQuery = credentialsQuery.eq('id', credential_id)
    }

    const { data: credentials, error: credError } = await credentialsQuery.single()

    if (credError || !credentials) {
      return NextResponse.json(
        { success: false, error: 'CREDENTIALS_NOT_FOUND', message: '找不到憑證資料' },
        { status: 404 }
      )
    }

    // Check if credentials are active
    if (!credentials.is_active) {
      return NextResponse.json(
        { success: false, error: 'CREDENTIALS_INACTIVE', message: '憑證已停用' },
        { status: 400 }
      )
    }

    // Initialize Shioaji client
    const shioajiClient = new ShioajiClient()

    // Test connection with encrypted credentials
    console.warn(`Activating Shioaji connection for user ${user.id}`)
    const connectionResult = await shioajiClient.activateConnection(credentials)

    if (!connectionResult.success) {
      // Update database to mark connection failure
      await supabase
        .from('user_shioaji_credentials')
        .update({ 
          last_login_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', credentials.id)

      return NextResponse.json(
        { 
          success: false, 
          error: 'CONNECTION_FAILED', 
          message: connectionResult.error || 'Shioaji 連線失敗' 
        },
        { status: 400 }
      )
    }

    // Update database with successful connection
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    await supabase
      .from('user_shioaji_credentials')
      .update({ 
        last_login_at: new Date().toISOString(),
        last_login_ip: clientIP,
        login_count: credentials.login_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', credentials.id)

    // Log successful activation
    console.warn(`User ${user.id} successfully activated Shioaji connection`)

    return NextResponse.json({
      success: true,
      message: '憑證激活成功',
      connection_status: 'connected',
      available_accounts: (connectionResult.accounts || []).map(account => ({
        account_id: account.account_id,
        account_type: account.account_type,
        account_name: `${account.account_type} 帳戶`
      }))
    })

  } catch (error: unknown) {
    console.error('Activation error:', error)
    
    // Handle specific error types
    if (error instanceof Error && error.message?.includes('解密失敗')) {
      return NextResponse.json(
        { success: false, error: 'DECRYPTION_ERROR', message: '憑證解密失敗' },
        { status: 500 }
      )
    }

    if (error instanceof Error && error.message?.includes('Python')) {
      return NextResponse.json(
        { success: false, error: 'SHIOAJI_ERROR', message: 'Shioaji 服務異常' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: '服務器錯誤' },
      { status: 500 }
    )
  }
}