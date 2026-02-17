import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Fetch all quotas
    const { data: quotas, error: quotasError } = await supabase
      .from('model_quotas')
      .select('*')
      .order('model_provider', { ascending: true })
      .order('quota_type', { ascending: true })

    if (quotasError) {
      return NextResponse.json({ error: quotasError.message }, { status: 500 })
    }

    // Fetch current usage directly from model_usage table (last 5 hours)
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    const { data: usageRaw, error: usageError } = await supabase
      .from('model_usage')
      .select('model_provider, model_id, tokens_in, tokens_out, prompt_count')
      .gte('created_at', fiveHoursAgo)

    if (usageError) {
      return NextResponse.json({ error: usageError.message }, { status: 500 })
    }

    // Aggregate usage by model
    const usageByModel: Record<string, { totalTokensIn: number; totalTokensOut: number; totalPrompts: number }> = {}
    
    for (const u of usageRaw || []) {
      const key = `${u.model_provider}:${u.model_id}`
      if (!usageByModel[key]) {
        usageByModel[key] = { totalTokensIn: 0, totalTokensOut: 0, totalPrompts: 0 }
      }
      usageByModel[key].totalTokensIn += Number(u.tokens_in) || 0
      usageByModel[key].totalTokensOut += Number(u.tokens_out) || 0
      usageByModel[key].totalPrompts += Number(u.prompt_count) || 0
    }

    // Group quotas by model
    const quotasByModel: Record<string, typeof quotas> = {}
    for (const q of quotas || []) {
      const key = `${q.model_provider}:${q.model_id}`
      if (!quotasByModel[key]) {
        quotasByModel[key] = []
      }
      quotasByModel[key].push(q)
    }

    // Build response
    const models: Array<{
      model_provider: string
      model_id: string
      current_usage: number
      quota_limit: number
      usage_percentage: number
      status: 'green' | 'yellow' | 'red'
    }> = []

    for (const q of quotas || []) {
      const key = `${q.model_provider}:${q.model_id}`
      const usageData = usageByModel[key]
      const currentUsage = usageData ? usageData.totalPrompts : 0
      const quotaLimit = Number(q.quota_limit)
      const usagePercentage = quotaLimit > 0 ? (currentUsage / quotaLimit) * 100 : 0

      let status: 'green' | 'yellow' | 'red' = 'green'
      if (usagePercentage >= 90) {
        status = 'red'
      } else if (usagePercentage >= 70) {
        status = 'yellow'
      }

      // Use prompts for quota limit comparison
      models.push({
        model_provider: q.model_provider,
        model_id: q.model_id,
        current_usage: currentUsage,
        quota_limit: quotaLimit,
        usage_percentage: Math.round(usagePercentage * 10) / 10,
        status,
      })
    }

    // Get unique models with their quotas
    const uniqueModelKeys = Array.from(new Set(models.map(m => `${m.model_provider}:${m.model_id}`)))
    const uniqueModels = uniqueModelKeys.map(key => {
        const modelData = models.find(m => `${m.model_provider}:${m.model_id}` === key)!
        const quotasForModel = quotasByModel[key] || []
        
        return {
          model_provider: modelData.model_provider,
          model_id: modelData.model_id,
          display_name: getDisplayName(modelData.model_provider, modelData.model_id),
          current_usage: modelData.current_usage,
          quota_limit: modelData.quota_limit,
          usage_percentage: modelData.usage_percentage,
          status: modelData.status,
          quota_type: quotasForModel[0]?.quota_type || 'rolling',
          quota_window_hours: quotasForModel[0]?.quota_window_hours || 5,
        }
      })

    // Calculate summary
    const atRisk = uniqueModels.filter(m => m.status === 'red').length
    const warning = uniqueModels.filter(m => m.status === 'yellow').length

    return NextResponse.json({
      status: 'success',
      data: {
        summary: {
          total_models: uniqueModels.length,
          models_at_risk: atRisk,
          models_warning: warning,
          last_updated: new Date().toISOString(),
        },
        models: uniqueModels,
      },
    })
  } catch (error) {
    console.error('Error in /api/model-usage/summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDisplayName(provider: string, modelId: string): string {
  const names: Record<string, Record<string, string>> = {
    anthropic: {
      'claude-sonnet-4': 'Claude 3.5 Sonnet',
      'claude-opus-4-6': 'Claude 3 Opus',
    },
    minimax: {
      'MiniMax-M2.5': 'MiniMax M2.5',
    },
    moonshot: {
      'moonshot-v1-128k': 'Kimi 128K',
    },
    google: {
      'gemini-2.5-flash': 'Gemini Flash',
    },
    openai: {
      'gpt-4o': 'GPT-4o',
    },
  }
  
  return names[provider]?.[modelId] || `${provider}/${modelId}`
}
