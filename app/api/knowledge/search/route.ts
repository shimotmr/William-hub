import { NextRequest, NextResponse } from 'next/server'

import { createServiceRoleClient } from '@/lib/supabase-server'

const SAFE_COLUMNS = 'aurotek_pn,name,spec,product_types,list_price,dealer_price,total_qty'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')

  if (!q || q.trim().length === 0) {
    return NextResponse.json([])
  }

  const query = q.trim()

  try {
    const supabase = createServiceRoleClient()

    const { data: rows, error } = await supabase
      .from('products_full')
      .select(SAFE_COLUMNS)
      .or(`aurotek_pn.ilike.*${query}*,name.ilike.*${query}*,spec.ilike.*${query}*,product_types.ilike.*${query}*`)
      .limit(50)

    if (error) {
      return NextResponse.json({ error: 'Search failed', detail: error.message }, { status: 500 })
    }

    const results = rows?.map((row) => ({
      title: `${row.aurotek_pn || ''} - ${row.name || ''}`.replace(/^ - | - $/g, ''),
      spec: row.spec || '',
      source: 'products_full',
      product_types: row.product_types || '',
      list_price: row.list_price ?? null,
      dealer_price: row.dealer_price ?? null,
      total_qty: row.total_qty ?? null,
    }))

    return NextResponse.json(results)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
