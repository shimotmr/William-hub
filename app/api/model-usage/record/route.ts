import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface UsageRecord {
  model_provider: string
  model_id: string
  agent_id: string
  session_key: string
  tokens_in?: number
  tokens_out?: number
  prompt_count?: number
  cost_usd?: number
  metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const body: UsageRecord = await request.json()

    // Validate required fields
    const requiredFields = ['model_provider', 'model_id', 'agent_id', 'session_key'] as const
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Prepare record
    const record = {
      model_provider: body.model_provider,
      model_id: body.model_id,
      agent_id: body.agent_id,
      session_key: body.session_key,
      tokens_in: body.tokens_in || 0,
      tokens_out: body.tokens_out || 0,
      prompt_count: body.prompt_count || 1,
      cost_usd: body.cost_usd || 0,
      created_at: new Date().toISOString(),
    }

    // Insert into database
    const { data, error } = await supabase
      .from('model_usage')
      .insert(record)
      .select('id, created_at')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      data: {
        id: data.id,
        recorded_at: data.created_at,
      },
    })
  } catch (error) {
    console.error('Error in /api/model-usage/record:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle other methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to record usage.' },
    { status: 405 }
  )
}
