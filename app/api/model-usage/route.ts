import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const windowHours = searchParams.get('window') ? parseInt(searchParams.get('window')!) : 48
    
    // Calculate time window
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

    // Get usage data within window from model_usage table
    const { data: usageData, error: usageError } = await supabase
      .from('model_usage')
      .select('model_provider, model_id, tokens_in, tokens_out, cost_usd, created_at')
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
    const usageByModel: Record<string, { tokensIn: number; tokensOut: number; cost: number }> = {}
    
    for (const row of usageData || []) {
      const key = `${row.model_provider}/${row.model_id}`
      if (!usageByModel[key]) {
        usageByModel[key] = { tokensIn: 0, tokensOut: 0, cost: 0 }
      }
      usageByModel[key].tokensIn += Number(row.tokens_in) || 0
      usageByModel[key].tokensOut += Number(row.tokens_out) || 0
      usageByModel[key].cost += Number(row.cost_usd) || 0
    }

    // Build models array with quota matching
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

    // Map usage to quotas
    for (const [modelKey, usage] of Object.entries(usageByModel)) {
      const [provider, modelId] = modelKey.split('/')
      
      // Find matching quota (prefer rolling window, then others)
      const matchingQuota = quotaData?.find(
        q => q.model_provider === provider && q.model_id === modelId
      )

      const quotaLimit = matchingQuota?.quota_limit || 1000 // Default if no quota
      const windowType = matchingQuota?.quota_type || 'rolling'
      
      // Calculate usage percentage (using total tokens)
      const quotaUsed = usage.tokensIn + usage.tokensOut
      const usagePercentage = Math.min(Math.round((quotaUsed / quotaLimit) * 100), 100)
      
      // Determine status
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

      // Format display name
      const displayName = formatModelName(provider, modelId)

      models.push({
        display_name: displayName,
        usage_percentage: usagePercentage,
        quota_used: quotaUsed,
        quota_limit: quotaLimit,
        status,
        window_type: windowType
      })
    }

    // If no usage data, return empty models array with zeros
    if (models.length === 0) {
      return NextResponse.json({
        models: [],
        healthy_count: 0,
        warning_count: 0,
        critical_count: 0
      })
    }

    return NextResponse.json({
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
