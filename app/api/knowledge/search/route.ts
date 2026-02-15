import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

const SAFE_COLUMNS = 'aurotek_pn,name,spec,product_types,list_price,dealer_price,total_qty'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')

  if (!q || q.trim().length === 0) {
    return NextResponse.json([])
  }

  const query = q.trim()

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/products_full`)
    url.searchParams.set('select', SAFE_COLUMNS)
    url.searchParams.set('or', `(aurotek_pn.ilike.*${query}*,name.ilike.*${query}*,spec.ilike.*${query}*,product_types.ilike.*${query}*)`)
    url.searchParams.set('limit', '50')

    const res = await fetch(url.toString(), {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Search failed', detail: text }, { status: 500 })
    }

    const rows = await res.json()

    const results = rows.map((row: Record<string, unknown>) => ({
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
