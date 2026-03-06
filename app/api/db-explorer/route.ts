import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function supabaseQuery(sql: string) {
  // Use Supabase REST API via PostgREST or direct pg
  // For schema queries, use the supabase-js client
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  return supabase
}

// GET: list tables or get table columns
export async function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get('table')
  const preview = req.nextUrl.searchParams.get('preview')

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  try {
    if (preview && table) {
      // Preview: fetch first 20 rows from a table
      const safeName = table.replace(/[^a-zA-Z0-9_]/g, '')
      const { data, error, count } = await supabase
        .from(safeName)
        .select('*', { count: 'exact' })
        .limit(20)

      if (error) throw error
      return NextResponse.json({ rows: data, totalCount: count })
    }

    if (table) {
      // Get columns for a specific table via PostgREST OpenAPI spec
      const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_KEY}`, {
        headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` }
      })
      const spec = await res.json()
      const tableDef = spec.definitions?.[table]
      
      if (!tableDef) {
        return NextResponse.json({ error: `Table ${table} not found` }, { status: 404 })
      }

      const columns = Object.entries(tableDef.properties || {}).map(([name, def]: [string, any]) => ({
        column_name: name,
        data_type: def.format || def.type || 'unknown',
        description: def.description || null,
        default: def.default || null,
      }))

      const required = tableDef.required || []
      columns.forEach((c: any) => {
        c.is_nullable = required.includes(c.column_name) ? 'NO' : 'YES'
      })

      return NextResponse.json(columns)
    }

    // List all tables from OpenAPI spec
    const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_KEY}`, {
      headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` }
    })
    const spec = await res.json()
    const tables = Object.keys(spec.definitions || {}).sort().map(name => ({
      table_name: name,
    }))

    return NextResponse.json(tables)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: execute read-only query via PostgREST
export async function POST(req: NextRequest) {
  try {
    const { table, select, filters, orderBy, limit: queryLimit } = await req.json()

    if (!table) {
      return NextResponse.json({ error: 'Missing table name' }, { status: 400 })
    }

    const safeName = table.replace(/[^a-zA-Z0-9_]/g, '')
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { data, error, count } = await supabase
      .from(safeName)
      .select(select || '*', { count: 'exact' })
      .limit(queryLimit || 100)

    if (error) throw error
    return NextResponse.json({ rows: data, totalCount: count })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
