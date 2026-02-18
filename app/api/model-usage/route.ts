import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const windowHours = searchParams.get('window') ? parseInt(searchParams.get('window')!) : 24
    
    // Calculate time window
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

    // Get usage data within window from model_usage table
    const { data: usageData, error: usageError } = await supabase
      .from('model_usage')
      .select('model_provider, model_id, tokens_in, tokens_out, cost_usd, created_at, agent_id')
      .gte('created_at', windowStart)

    if (usageError) {
      return NextResponse.json({ error: usageError.message }, { status: 500 })
    }

    // Get quota data from model_quotas table
    const { data: quotaData, error: quotaError } = await supabase
      .from('model_quotas')
      .select('model_provider, model_id, quota_limit, quota_type, quota_window_hours')

    if (quotaError) {
      return NextResponse.json({ error: quotaError.message }, { status: 500 })
    }

    // Aggregate usage by model
    const usageByModel: Record<string, { tokens: number; cost: number; count: number; provider: string; model: string }> = {}
    
    for (const row of usageData || []) {
      const key = `${row.model_provider}/${row.model_id}`
      if (!usageByModel[key]) {
        usageByModel[key] = { tokens: 0, cost: 0, count: 0, provider: row.model_provider, model: row.model_id }
      }
      usageByModel[key].tokens += (Number(row.tokens_in) || 0) + (Number(row.tokens_out) || 0)
      usageByModel[key].cost += Number(row.cost_usd) || 0
      usageByModel[key].count += 1
    }

    // Model distribution (for frontend compatibility)
    const modelDistribution = Object.entries(usageByModel).map(([name, stats]) => ({
      name,
      provider: stats.provider,
      model: stats.model,
      tokens: stats.tokens,
      cost: stats.cost,
      count: stats.count,
    })).sort((a, b) => b.cost - a.cost)

    // Agent ranking
    const usageByAgent: Record<string, { tokens: number; cost: number; count: number }> = {}
    
    for (const row of usageData || []) {
      const agent = row.agent_id || 'unknown'
      if (!usageByAgent[agent]) {
        usageByAgent[agent] = { tokens: 0, cost: 0, count: 0 }
      }
      usageByAgent[agent].tokens += (Number(row.tokens_in) || 0) + (Number(row.tokens_out) || 0)
      usageByAgent[agent].cost += Number(row.cost_usd) || 0
      usageByAgent[agent].count += 1
    }

    const agentRanking = Object.entries(usageByAgent).map(([agent, stats]) => ({
      agent,
      total_tokens: stats.tokens,
      total_cost: stats.cost,
      request_count: stats.count,
      success_rate: 100, // Assume 100% since we don't have failure data in model_usage
    })).sort((a, b) => b.total_cost - a.total_cost)

    // Today's summary
    const todaySummary = {
      total_requests: usageData?.length || 0,
      total_tokens_in: usageData?.reduce((sum, r) => sum + (Number(r.tokens_in) || 0), 0) || 0,
      total_tokens_out: usageData?.reduce((sum, r) => sum + (Number(r.tokens_out) || 0), 0) || 0,
      total_tokens: usageData?.reduce((sum, r) => sum + (Number(r.tokens_in) || 0) + (Number(r.tokens_out) || 0), 0) || 0,
      total_cost: usageData?.reduce((sum, r) => sum + (Number(r.cost_usd) || 0), 0) || 0,
      success_rate: 100,
    }

    // Build new format models for quota tracking
    const models: Array<{
      display_name: string
      usage_percentage: number
      quota_used: number
      quota_limit: number
      status: 'healthy' | 'warning' | 'critical'
      window_type: string
    }> = []

    let healthyCount = 0
    let warningCount = 0
    let criticalCount = 0

    for (const [modelKey, usage] of Object.entries(usageByModel)) {
      const [provider, modelId] = modelKey.split('/')
      
      const matchingQuota = quotaData?.find(
        q => q.model_provider === provider && q.model_id === modelId
      )

      const quotaLimit = matchingQuota?.quota_limit || 1000
      const windowType = matchingQuota?.quota_type || 'rolling'
      
      const quotaUsed = usage.tokens
      const usagePercentage = Math.min(Math.round((quotaUsed / quotaLimit) * 100), 100)
      
      let status: 'healthy' | 'warning' | 'critical'
      if (usagePercentage < 70) {
        status = 'healthy'
        healthyCount++
      } else if (usagePercentage < 90) {
        status = 'warning'
        warningCount++
      } else {
        status = 'critical'
        criticalCount++
      }

      models.push({
        display_name: formatModelName(provider, modelId),
        usage_percentage: usagePercentage,
        quota_used: quotaUsed,
        quota_limit: quotaLimit,
        status,
        window_type: windowType
      })
    }

    // Return both formats for compatibility
    return NextResponse.json({
      status: 'success',
      data: {
        today: todaySummary,
        modelDistribution,
        agentRanking,
      },
      // New format fields
      models,
      healthy_count: healthyCount,
      warning_count: warningCount,
      critical_count: criticalCount
    })

  } catch (error) {
    console.error('Error in /api/model-usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to format model display names
function formatModelName(provider: string, modelId: string): string {
  const providerNames: Record<string, string> = {
    'anthropic': 'Anthropic',
    'openai': 'OpenAI',
    'google': 'Google',
    'minimax': 'MiniMax',
    'moonshot': 'Moonshot'
  }

  const modelNames: Record<string, string> = {
    'claude-sonnet-4': 'Claude Sonnet 4',
    'claude-opus-4-6': 'Claude Opus 4.6',
    'gpt-4o': 'GPT-4o',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'MiniMax-M2.5': 'MiniMax M2.5',
    'moonshot-v1-128k': 'Moonshot V1 128K'
  }

  const providerName = providerNames[provider] || provider
  const modelName = modelNames[modelId] || modelId

  return `${providerName} ${modelName}`
}
