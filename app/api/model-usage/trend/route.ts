import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7', 10)
    const validDays = Math.min(Math.max(days, 1), 90) // 1-90 days

    // Fetch daily usage trend
    const { data: trends, error } = await supabase
      .from('v_model_usage_daily')
      .select('*')
      .gte('usage_date', new Date(Date.now() - validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('usage_date', { ascending: true })
      .order('model_provider', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by model and date
    const dataByModel: Record<string, Array<{
      date: string
      tokens_in: number
      tokens_out: number
      prompts: number
      cost: number
    }>> = {}

    for (const row of trends || []) {
      const key = `${row.model_provider}:${row.model_id}`
      if (!dataByModel[key]) {
        dataByModel[key] = []
      }
      dataByModel[key].push({
        date: row.usage_date,
        tokens_in: Number(row.total_tokens_in) || 0,
        tokens_out: Number(row.total_tokens_out) || 0,
        prompts: Number(row.prompt_count) || 0,
        cost: Number(row.total_cost) || 0,
      })
    }

    // Format response
    const trendData = Object.entries(dataByModel).map(([key, dataPoints]) => {
      const [model_provider, model_id] = key.split(':')
      
      // Calculate totals and trend direction
      const totalTokens = dataPoints.reduce((sum, d) => sum + d.tokens_in + d.tokens_out, 0)
      const totalPrompts = dataPoints.reduce((sum, d) => sum + d.prompts, 0)
      const totalCost = dataPoints.reduce((sum, d) => sum + d.cost, 0)
      const avgDaily = dataPoints.length > 0 ? totalTokens / dataPoints.length : 0

      // Simple trend: compare first half vs second half
      let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (dataPoints.length >= 4) {
        const mid = Math.floor(dataPoints.length / 2)
        const firstHalf = dataPoints.slice(0, mid).reduce((sum, d) => sum + d.tokens_in + d.tokens_out, 0) / mid
        const secondHalf = dataPoints.slice(mid).reduce((sum, d) => sum + d.tokens_in + d.tokens_out, 0) / (dataPoints.length - mid)
        
        if (secondHalf > firstHalf * 1.1) {
          trendDirection = 'increasing'
        } else if (secondHalf < firstHalf * 0.9) {
          trendDirection = 'decreasing'
        }
      }

      return {
        model_provider,
        model_id,
        display_name: getDisplayName(model_provider, model_id),
        data_points: dataPoints.map(d => ({
          date: d.date,
          tokens: d.tokens_in + d.tokens_out,
          tokens_in: d.tokens_in,
          tokens_out: d.tokens_out,
          prompts: d.prompts,
          cost: d.cost,
        })),
        total_tokens: totalTokens,
        total_prompts: totalPrompts,
        total_cost: Math.round(totalCost * 10000) / 10000,
        average_daily: Math.round(avgDaily),
        trend_direction: trendDirection,
      }
    })

    return NextResponse.json({
      status: 'success',
      data: {
        period: `${validDays}d`,
        granularity: 'day',
        trends: trendData,
      },
    })
  } catch (error) {
    console.error('Error in /api/model-usage/trend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDisplayName(provider: string, modelId: string): string {
  const names: Record<string, Record<string, string>> = {
    anthropic: {
      'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
      'claude-3-opus-20240229': 'Claude 3 Opus',
    },
    minimax: {
      'abab6.5s-chat': 'MiniMax M2.5',
    },
    moonshot: {
      'moonshot-v1-128k': 'Kimi 128K',
    },
    google: {
      'gemini-1.5-flash': 'Gemini Flash',
    },
    openai: {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
    },
  }
  
  return names[provider]?.[modelId] || `${provider}/${modelId}`
}
