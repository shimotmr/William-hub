import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Cost per 1M tokens (USD) - approximate pricing
const COST_PER_MILLION: Record<string, { input: number; output: number }> = {
  'anthropic': { input: 15, output: 75 },       // Claude
  'openai': { input: 2.5, output: 10 },          // GPT-4o
  'google': { input: 0.35, output: 1.5 },        // Gemini
  'minimax': { input: 0.4, output: 1.2 },       // MiniMax
  'moonshot': { input: 0.5, output: 1.5 },       // Moonshot
  'deepseek': { input: 0.14, output: 2.8 },      // DeepSeek
  'default': { input: 1, output: 3 },
}

function getCost(provider: string, inputTokens: number, outputTokens: number): number {
  const pricing = COST_PER_MILLION[provider] || COST_PER_MILLION['default']
  return ((inputTokens * pricing.input) + (outputTokens * pricing.output)) / 1000000
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 24h, 7d, 30d
    
    // Calculate time window based on period
    const hoursMap: Record<string, number> = {
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
    }
    const windowHours = hoursMap[period] || 24 * 7
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

    // Fetch model usage log data
    const { data: usageData, error: usageError } = await supabase
      .from('model_usage_log')
      .select('provider, model, input_tokens, output_tokens, cost_estimate, created_at, agent')
      .gte('created_at', windowStart)
      .order('created_at', { ascending: true })

    if (usageError) {
      console.error('model_usage_log error:', usageError)
      return NextResponse.json({ error: usageError.message }, { status: 500 })
    }

    // Calculate 5-hour rolling window current usage
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    const rollingWindowUsage = (usageData || [])
      .filter(row => new Date(row.created_at) >= new Date(fiveHoursAgo))
      .reduce((sum, row) => sum + (Number(row.input_tokens) || 0) + (Number(row.output_tokens) || 0), 0)
    
    const rollingWindowCost = (usageData || [])
      .filter(row => new Date(row.created_at) >= new Date(fiveHoursAgo))
      .reduce((sum, row) => sum + getCost(row.provider, Number(row.input_tokens) || 0, Number(row.output_tokens) || 0), 0)

    // Default 5hr limit (can be adjusted)
    const FIVE_HOUR_LIMIT = 5000000 // 5M tokens

    // === Group by Provider ===
    const byProvider: Record<string, { tokens: number; cost: number; count: number }> = {}
    for (const row of usageData || []) {
      const provider = row.provider || 'unknown'
      if (!byProvider[provider]) {
        byProvider[provider] = { tokens: 0, cost: 0, count: 0 }
      }
      const inputTokens = Number(row.input_tokens) || 0
      const outputTokens = Number(row.output_tokens) || 0
      byProvider[provider].tokens += inputTokens + outputTokens
      byProvider[provider].cost += getCost(provider, inputTokens, outputTokens)
      byProvider[provider].count += 1
    }

    // === Group by Model ===
    const byModel: Record<string, { tokens: number; cost: number; count: number; provider: string }> = {}
    for (const row of usageData || []) {
      const model = row.model || 'unknown'
      const provider = row.provider || 'unknown'
      const key = `${provider}/${model}`
      if (!byModel[key]) {
        byModel[key] = { tokens: 0, cost: 0, count: 0, provider }
      }
      const inputTokens = Number(row.input_tokens) || 0
      const outputTokens = Number(row.output_tokens) || 0
      byModel[key].tokens += inputTokens + outputTokens
      byModel[key].cost += getCost(provider, inputTokens, outputTokens)
      byModel[key].count += 1
    }

    // === Group by Agent ===
    const byAgent: Record<string, { tokens: number; cost: number; count: number }> = {}
    for (const row of usageData || []) {
      const agent = row.agent || 'unknown'
      if (!byAgent[agent]) {
        byAgent[agent] = { tokens: 0, cost: 0, count: 0 }
      }
      const inputTokens = Number(row.input_tokens) || 0
      const outputTokens = Number(row.output_tokens) || 0
      byAgent[agent].tokens += inputTokens + outputTokens
      byAgent[agent].cost += getCost(row.provider, inputTokens, outputTokens)
      byAgent[agent].count += 1
    }

    // === Daily Trend (for line charts) ===
    const dailyTrend: Record<string, { date: string; tokens: number; cost: number; requests: number }> = {}
    for (const row of usageData || []) {
      const date = new Date(row.created_at).toISOString().split('T')[0]
      if (!dailyTrend[date]) {
        dailyTrend[date] = { date, tokens: 0, cost: 0, requests: 0 }
      }
      const inputTokens = Number(row.input_tokens) || 0
      const outputTokens = Number(row.output_tokens) || 0
      dailyTrend[date].tokens += inputTokens + outputTokens
      dailyTrend[date].cost += getCost(row.provider, inputTokens, outputTokens)
      dailyTrend[date].requests += 1
    }

    // === Weekly Trend (aggregated by week) ===
    const weeklyTrend: Record<string, { week: string; tokens: number; cost: number; requests: number }> = {}
    for (const row of usageData || []) {
      const date = new Date(row.created_at)
      const dayOfWeek = date.getUTCDay()
      const monday = new Date(date)
      monday.setUTCDate(date.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      const weekKey = monday.toISOString().split('T')[0]
      
      if (!weeklyTrend[weekKey]) {
        weeklyTrend[weekKey] = { week: weekKey, tokens: 0, cost: 0, requests: 0 }
      }
      const inputTokens = Number(row.input_tokens) || 0
      const outputTokens = Number(row.output_tokens) || 0
      weeklyTrend[weekKey].tokens += inputTokens + outputTokens
      weeklyTrend[weekKey].cost += getCost(row.provider, inputTokens, outputTokens)
      weeklyTrend[weekKey].requests += 1
    }

    // === Monthly Trend (aggregated by month) ===
    const monthlyTrend: Record<string, { month: string; tokens: number; cost: number; requests: number }> = {}
    for (const row of usageData || []) {
      const date = new Date(row.created_at)
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyTrend[monthKey]) {
        monthlyTrend[monthKey] = { month: monthKey, tokens: 0, cost: 0, requests: 0 }
      }
      const inputTokens = Number(row.input_tokens) || 0
      const outputTokens = Number(row.output_tokens) || 0
      monthlyTrend[monthKey].tokens += inputTokens + outputTokens
      monthlyTrend[monthKey].cost += getCost(row.provider, inputTokens, outputTokens)
      monthlyTrend[monthKey].requests += 1
    }

    // === Total Summary ===
    const totalTokens = (usageData || []).reduce((sum, row) => 
      sum + (Number(row.input_tokens) || 0) + (Number(row.output_tokens) || 0), 0)
    const totalCost = (usageData || []).reduce((sum, row) => {
      const inputTokens = Number(row.input_tokens) || 0
      const outputTokens = Number(row.output_tokens) || 0
      return sum + getCost(row.provider, inputTokens, outputTokens)
    }, 0)
    const totalRequests = (usageData || []).length

    // Prepare response
    return NextResponse.json({
      status: 'success',
      data: {
        summary: {
          totalTokens,
          totalCost,
          totalRequests,
          avgTokensPerRequest: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
        },
        rollingWindow: {
          current: rollingWindowUsage,
          limit: FIVE_HOUR_LIMIT,
          percentage: Math.round((rollingWindowUsage / FIVE_HOUR_LIMIT) * 100),
          cost: rollingWindowCost,
        },
        byProvider: Object.entries(byProvider)
          .map(([provider, stats]) => ({ provider, ...stats }))
          .sort((a, b) => b.tokens - a.tokens),
        byModel: Object.entries(byModel)
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.tokens - a.tokens),
        byAgent: Object.entries(byAgent)
          .map(([agent, stats]) => ({ agent, ...stats }))
          .sort((a, b) => b.tokens - a.tokens),
        dailyTrend: Object.values(dailyTrend).sort((a, b) => a.date.localeCompare(b.date)),
        weeklyTrend: Object.values(weeklyTrend).sort((a, b) => a.week.localeCompare(b.week)),
        monthlyTrend: Object.values(monthlyTrend).sort((a, b) => a.month.localeCompare(b.month)),
      },
      period,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Error in /api/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
