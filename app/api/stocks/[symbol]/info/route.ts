import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

/**
 * GET /api/stocks/{symbol}/info
 * 取得股票基本面資訊：公司簡介、供應鏈、財務摘要
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params

  if (!/^\d{4,6}$/.test(symbol)) {
    return NextResponse.json(
      { error: '無效的股票代號' },
      { status: 400 }
    )
  }

  try {
    // 1. Get company entity
    const { data: entity, error: entityError } = await supabase
      .from('supply_chain_entities')
      .select('*')
      .eq('ticker', symbol)
      .single()

    if (entityError || !entity) {
      return NextResponse.json(
        { error: '找不到該股票資料', symbol },
        { status: 404 }
      )
    }

    // 2. Get upstream suppliers (from_entity → this company)
    const { data: upstreamRels } = await supabase
      .from('supply_chain_relationships')
      .select(`
        relationship_type, strength, evidence,
        from_entity:supply_chain_entities!supply_chain_relationships_from_entity_id_fkey(
          id, name, ticker, entity_type, sector, industry
        )
      `)
      .eq('to_entity_id', entity.id)
      .eq('direction', 'upstream')
      .order('strength', { ascending: false })
      .limit(20)

    // 3. Get downstream customers (this company → to_entity)
    const { data: downstreamRels } = await supabase
      .from('supply_chain_relationships')
      .select(`
        relationship_type, strength, evidence,
        to_entity:supply_chain_entities!supply_chain_relationships_to_entity_id_fkey(
          id, name, ticker, entity_type, sector, industry
        )
      `)
      .eq('from_entity_id', entity.id)
      .eq('direction', 'downstream')
      .order('strength', { ascending: false })
      .limit(20)

    // 4. Get full doc for raw content
    const { data: doc } = await supabase
      .from('supply_chain_docs')
      .select('wikilinks')
      .eq('ticker', symbol)
      .single()

    // Format response
    const upstream = (upstreamRels || []).map(r => ({
      name: (r.from_entity as any)?.name,
      ticker: (r.from_entity as any)?.ticker,
      type: r.relationship_type,
      strength: r.strength,
      sector: (r.from_entity as any)?.sector,
    }))

    const downstream = (downstreamRels || []).map(r => ({
      name: (r.to_entity as any)?.name,
      ticker: (r.to_entity as any)?.ticker,
      type: r.relationship_type,
      strength: r.strength,
      sector: (r.to_entity as any)?.sector,
    }))

    return NextResponse.json({
      symbol: entity.ticker,
      name: entity.name,
      sector: entity.sector,
      industry: entity.industry,
      market_cap: entity.market_cap,
      business_overview: entity.business_overview,
      financial_summary: entity.financial_summary,
      upstream,
      downstream,
      related_tags: doc?.wikilinks?.slice(0, 15) || [],
      updated_at: entity.updated_at,
    })
  } catch (err: any) {
    console.error('Stock info error:', err)
    return NextResponse.json(
      { error: '伺服器錯誤', detail: err.message },
      { status: 500 }
    )
  }
}
