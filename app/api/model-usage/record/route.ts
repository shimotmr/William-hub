import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface UsageRecord {
  provider: string
  model: string
  agent: string
  session_key: string
  input_tokens?: number
  output_tokens?: number
  cost_estimate?: number
  latency_ms?: number
  success?: boolean
  error_message?: string
  metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const body: UsageRecord = await request.json()

    // Validate required fields
    const requiredFields = ['provider', 'model', 'agent', 'session_key'] as const
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Prepare record
    const input_tokens = body.input_tokens || 0
    const output_tokens = body.output_tokens || 0
    const record = {
      provider: body.provider,
      model: body.model,
      agent: body.agent,
      session_key: body.session_key,
      input_tokens,
      output_tokens,
      total_tokens: input_tokens + output_tokens,
      cost_estimate: body.cost_estimate || null,
      latency_ms: body.latency_ms || null,
      success: body.success !== undefined ? body.success : true,
      error_message: body.error_message || null,
      created_at: new Date().toISOString(),
    }

    // Insert into database
    const { data, error } = await supabase
      .from('model_usage_log')
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit
    
    // Filters
    const modelProvider = searchParams.get('model')
    const agentId = searchParams.get('agent')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const sessionKey = searchParams.get('search')
    
    // Build query
    let query = supabase
      .from('model_usage_log')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (modelProvider && modelProvider !== '') {
      query = query.eq('provider', modelProvider)
    }
    
    if (agentId && agentId !== '') {
      query = query.eq('agent', agentId)
    }
    
    if (startDate && startDate !== '') {
      query = query.gte('created_at', startDate)
    }
    
    if (endDate && endDate !== '') {
      // Add one day to include the end date fully
      const endDateObj = new Date(endDate)
      endDateObj.setDate(endDateObj.getDate() + 1)
      query = query.lt('created_at', endDateObj.toISOString())
    }
    
    if (sessionKey && sessionKey !== '') {
      query = query.ilike('session_key', `%${sessionKey}%`)
    }
    
    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data: records, error, count } = await query
    
    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get summary stats
    let summaryQuery = supabase
      .from('model_usage_log')
      .select('input_tokens, output_tokens, total_tokens, cost_estimate', { count: 'exact' })
    
    if (modelProvider && modelProvider !== '') {
      summaryQuery = summaryQuery.eq('provider', modelProvider)
    }
    if (agentId && agentId !== '') {
      summaryQuery = summaryQuery.eq('agent', agentId)
    }
    if (startDate && startDate !== '') {
      summaryQuery = summaryQuery.gte('created_at', startDate)
    }
    if (endDate && endDate !== '') {
      const endDateObj = new Date(endDate)
      endDateObj.setDate(endDateObj.getDate() + 1)
      summaryQuery = summaryQuery.lt('created_at', endDateObj.toISOString())
    }
    
    const { data: summaryData } = await summaryQuery
    
    const totalRequests = summaryData?.length || 0
    const totalTokensIn = summaryData?.reduce((sum, r) => sum + (Number(r.input_tokens) || 0), 0) || 0
    const totalTokensOut = summaryData?.reduce((sum, r) => sum + (Number(r.output_tokens) || 0), 0) || 0
    const totalCost = summaryData?.reduce((sum, r) => sum + (Number(r.cost_estimate) || 0), 0) || 0
    
    // Get unique values for filters
    const { data: modelProviders } = await supabase
      .from('model_usage_log')
      .select('provider')
      .order('provider')
    
    const { data: agentIds } = await supabase
      .from('model_usage_log')
      .select('agent')
      .order('agent')
    
    const uniqueProviders = Array.from(new Set(modelProviders?.map(r => r.provider) || []))
    const uniqueAgents = Array.from(new Set(agentIds?.map(r => r.agent) || []))
    
    return NextResponse.json({
      status: 'success',
      data: {
        records: records || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        },
        summary: {
          total_requests: totalRequests,
          total_tokens_in: totalTokensIn,
          total_tokens_out: totalTokensOut,
          total_tokens: totalTokensIn + totalTokensOut,
          total_cost: Math.round(totalCost * 10000) / 10000
        },
        filters: {
          models: uniqueProviders,
          agents: uniqueAgents
        }
      }
    })
  } catch (error) {
    console.error('Error in /api/model-usage/record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
