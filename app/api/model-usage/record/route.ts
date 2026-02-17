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
      .from('model_usage')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (modelProvider && modelProvider !== '') {
      query = query.eq('model_provider', modelProvider)
    }
    
    if (agentId && agentId !== '') {
      query = query.eq('agent_id', agentId)
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
      .from('model_usage')
      .select('prompt_count, tokens_in, tokens_out, cost_usd', { count: 'exact' })
    
    if (modelProvider && modelProvider !== '') {
      summaryQuery = summaryQuery.eq('model_provider', modelProvider)
    }
    if (agentId && agentId !== '') {
      summaryQuery = summaryQuery.eq('agent_id', agentId)
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
    
    const totalPrompts = summaryData?.reduce((sum, r) => sum + (Number(r.prompt_count) || 0), 0) || 0
    const totalTokensIn = summaryData?.reduce((sum, r) => sum + (Number(r.tokens_in) || 0), 0) || 0
    const totalTokensOut = summaryData?.reduce((sum, r) => sum + (Number(r.tokens_out) || 0), 0) || 0
    const totalCost = summaryData?.reduce((sum, r) => sum + (Number(r.cost_usd) || 0), 0) || 0
    
    // Get unique values for filters
    const { data: modelProviders } = await supabase
      .from('model_usage')
      .select('model_provider')
      .order('model_provider')
    
    const { data: agentIds } = await supabase
      .from('model_usage')
      .select('agent_id')
      .order('agent_id')
    
    const uniqueProviders = Array.from(new Set(modelProviders?.map(r => r.model_provider) || []))
    const uniqueAgents = Array.from(new Set(agentIds?.map(r => r.agent_id) || []))
    
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
          total_prompts: totalPrompts,
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
