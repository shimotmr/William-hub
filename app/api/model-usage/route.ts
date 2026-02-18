import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get current window start (last 5 hours for rolling window)
    const now = new Date()
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000)
    
    // Get model usage from the past 5 hours (rolling window)
    const { data: usageData, error: usageError } = await supabase
      .from('model_usage')
      .select('model_provider, model_id, tokens_in, tokens_out, cost_usd, created_at')
      .gte('created_at', fiveHoursAgo.toISOString())

    if (usageError) {
      console.error('Usage query error:', usageError)
      return NextResponse.json({ error: usageError.message }, { status: 500 })
    }

    // Get all quotas
    const { data: quotasData, error: quotasError } = await supabase
      .from('model_quotas')
      .select('model_provider, model_id, quota_type, quota_limit, quota_window_hours')
      .eq('quota_type', 'rolling')

    if (quotasError) {
      console.error('Quotas query error:', quotasError)
      return NextResponse.json({ error: quotasError.message }, { status: 500 })
    }

    // Aggregate usage by model
    const usageByModel: Record<string, { 
      provider: string; 
      model: string; 
      quotaUsed: number; 
      quotaLimit: number;
      windowType: string;
    }> = {}

    for (const row of usageData || []) {
      const key = `${row.model_provider}/${row.model_id}`
      if (!usageByModel[key]) {
        usageByModel[key] = {
          provider: row.model_provider,
          model: row.model_id,
          quotaUsed: 0,
          quotaLimit: 0,
          windowType: '5hr'
        }
      }
      usageByModel[key].quotaUsed += Number(row.tokens_in || 0) + Number(row.tokens_out || 0)
    }

    // Map quotas to usage
    for (const quota of quotasData || []) {
      const key = `${quota.model_provider}/${quota.model_id}`
      if (usageByModel[key]) {
        usageByModel[key].quotaLimit = Number(quota.quota_limit)
        usageByModel[key].windowType = `${quota.quota_window_hours || 5}hr`
      } else {
        // Add model with quota even if no recent usage
        usageByModel[key] = {
          provider: quota.model_provider,
          model: quota.model_id,
          quotaUsed: 0,
          quotaLimit: Number(quota.quota_limit),
          windowType: `${quota.quota_window_hours || 5}hr`
        }
      }
    }

    // Format response for frontend
    const models = Object.values(usageByModel).map((item) => {
      const usagePercentage = item.quotaLimit > 0 
        ? Math.round((item.quotaUsed / item.quotaLimit) * 100 * 10) / 10 
        : 0
      
      // Determine status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (usagePercentage >= 100) {
        status = 'critical'
      } else if (usagePercentage >= 80) {
        status = 'warning'
      }

      // Format display name
      const displayName = formatDisplayName(item.provider, item.model)

      return {
        display_name: displayName,
        usage_percentage: usagePercentage,
        quota_used: item.quotaUsed,
        quota_limit: item.quotaLimit,
        status,
        window_type: item.windowType
      }
    })

    // Count statuses
    const healthyCount = models.filter(m => m.status === 'healthy').length
    const warningCount = models.filter(m => m.status === 'warning').length
    const criticalCount = models.filter(m => m.status === 'critical').length

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

function formatDisplayName(provider: string, model: string): string {
  // Handle special cases for display names
  if (provider === 'anthropic') {
    if (model === 'claude-opus-4-6') return 'Claude Opus 4.6'
    if (model === 'claude-sonnet-4-20250514') return 'Claude Sonnet 4'
    if (model.includes('claude')) return model.replace('claude-', 'Claude ').replace(/-/g, ' ')
  }
  if (provider === 'openai') {
    if (model.includes('gpt')) return model.toUpperCase().replace(/-/g, ' ')
  }
  if (provider === 'minimax') {
    return model.toUpperCase()
  }
  if (provider === 'google') {
    return model.replace(/gemini-/gi, 'Gemini ').replace(/-/g, ' ')
  }
  if (provider === 'moonshot') {
    return model.replace(/moonshot-/i, 'Moonshot ').replace(/-/g, ' ')
  }
  return `${provider}/${model}`
}
