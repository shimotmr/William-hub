import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'daily' | 'agents' | 'today'
    
    const today = new Date().toISOString().split('T')[0]

    // Get today's stats
    const { data: todayData, error: todayError } = await supabase
      .from('model_usage_log')
      .select('provider, model, agent, input_tokens, output_tokens, total_tokens, cost_estimate, success')
      .gte('created_at', `${today}T00:00:00Z`)

    if (todayError) {
      return NextResponse.json({ error: todayError.message }, { status: 500 })
    }

    // Today's summary
    const todaySummary = {
      total_requests: todayData?.length || 0,
      total_tokens_in: todayData?.reduce((sum, r) => sum + (r.input_tokens || 0), 0) || 0,
      total_tokens_out: todayData?.reduce((sum, r) => sum + (r.output_tokens || 0), 0) || 0,
      total_tokens: todayData?.reduce((sum, r) => sum + (r.total_tokens || 0), 0) || 0,
      total_cost: todayData?.reduce((sum, r) => sum + (Number(r.cost_estimate) || 0), 0) || 0,
      success_rate: todayData?.length 
        ? Math.round((todayData.filter(r => r.success).length / todayData.length) * 100 * 10) / 10
        : 0,
    }

    // Model distribution (today)
    const modelStats: Record<string, { tokens: number; cost: number; count: number }> = {}
    for (const r of todayData || []) {
      const key = `${r.provider}/${r.model}`
      if (!modelStats[key]) {
        modelStats[key] = { tokens: 0, cost: 0, count: 0 }
      }
      modelStats[key].tokens += r.total_tokens || 0
      modelStats[key].cost += Number(r.cost_estimate) || 0
      modelStats[key].count += 1
    }

    const modelDistribution = Object.entries(modelStats).map(([name, stats]) => ({
      name,
      provider: name.split('/')[0],
      model: name.split('/')[1],
      ...stats,
    })).sort((a, b) => b.cost - a.cost)

    // Agent ranking (today)
    const agentStats: Record<string, { tokens: number; cost: number; count: number; success: number }> = {}
    for (const r of todayData || []) {
      const agent = r.agent || 'unknown'
      if (!agentStats[agent]) {
        agentStats[agent] = { tokens: 0, cost: 0, count: 0, success: 0 }
      }
      agentStats[agent].tokens += r.total_tokens || 0
      agentStats[agent].cost += Number(r.cost_estimate) || 0
      agentStats[agent].count += 1
      if (r.success) agentStats[agent].success += 1
    }

    const agentRanking = Object.entries(agentStats).map(([agent, stats]) => ({
      agent,
      total_tokens: stats.tokens,
      total_cost: stats.cost,
      request_count: stats.count,
      success_rate: Math.round((stats.success / stats.count) * 100 * 10) / 10,
    })).sort((a, b) => b.total_cost - a.total_cost)

    return NextResponse.json({
      status: 'success',
      data: {
        today: todaySummary,
        modelDistribution,
        agentRanking,
      },
    })
  } catch (error) {
    console.error('Error in /api/model-usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
