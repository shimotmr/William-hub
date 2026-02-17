import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const sortBy = searchParams.get('sort_by') || 'total_tokens'
    const validDays = Math.min(Math.max(days, 1), 90)

    // Fetch agent rankings from view
    const { data: rankings, error } = await supabase
      .from('v_agent_usage_rank')
      .select('*')
      .order(sortBy === 'prompts' ? 'total_prompts' : sortBy === 'cost' ? 'total_cost' : 'total_tokens', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by agent
    const agentData: Record<string, {
      agent_id: string
      total_tokens: number
      total_prompts: number
      total_cost: number
      models: Array<{
        model_provider: string
        model_id: string
        tokens: number
        prompts: number
        cost: number
        percentage: number
      }>
    }> = {}

    for (const row of rankings || []) {
      const agentId = row.agent_id
      if (!agentData[agentId]) {
        agentData[agentId] = {
          agent_id: agentId,
          total_tokens: 0,
          total_prompts: 0,
          total_cost: 0,
          models: [],
        }
      }
      
      const tokens = Number(row.total_tokens) || 0
      const prompts = Number(row.total_prompts) || 0
      const cost = Number(row.total_cost) || 0
      
      agentData[agentId].total_tokens += tokens
      agentData[agentId].total_prompts += prompts
      agentData[agentId].total_cost += cost
      
      agentData[agentId].models.push({
        model_provider: row.model_provider || 'unknown',
        model_id: row.model_id || 'unknown',
        tokens,
        prompts,
        cost,
        percentage: 0, // Will calculate after
      })
    }

    // Calculate percentages and format response
    const responseData = Object.values(agentData).map(agent => {
      // Calculate percentages
      const modelsWithPercentage = agent.models.map(m => ({
        ...m,
        percentage: agent.total_tokens > 0 
          ? Math.round((m.tokens / agent.total_tokens) * 1000) / 10 
          : 0,
      }))

      // Determine activity trend based on prompts
      let activityTrend: 'high' | 'medium' | 'low' = 'low'
      if (agent.total_prompts > 500) {
        activityTrend = 'high'
      } else if (agent.total_prompts > 100) {
        activityTrend = 'medium'
      }

      return {
        agent_id: agent.agent_id,
        display_name: getAgentDisplayName(agent.agent_id),
        total_tokens: agent.total_tokens,
        total_prompts: agent.total_prompts,
        total_cost: Math.round(agent.total_cost * 10000) / 10000,
        models_used: modelsWithPercentage,
        activity_trend: activityTrend,
      }
    })

    // Sort by the requested field
    responseData.sort((a, b) => {
      if (sortBy === 'prompts') return b.total_prompts - a.total_prompts
      if (sortBy === 'cost') return b.total_cost - a.total_cost
      return b.total_tokens - a.total_tokens
    })

    return NextResponse.json({
      status: 'success',
      data: {
        period: `${validDays}d`,
        total_agents: responseData.length,
        rankings: responseData,
      },
    })
  } catch (error) {
    console.error('Error in /api/model-usage/by-agent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getAgentDisplayName(agentId: string): string {
  const names: Record<string, string> = {
    'main': 'Main Agent',
    'coder': 'Coder Agent',
    'analyst': 'Analyst Agent',
    'assistant': 'Assistant',
    'claude': 'Claude',
  }
  
  return names[agentId] || agentId
}
