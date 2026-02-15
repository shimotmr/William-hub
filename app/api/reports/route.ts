import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/reports?id=eq.${id}&select=*`,
        { headers }
      )
      if (!res.ok) return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
      const data = await res.json()
      if (!data.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(data[0])
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/reports?select=id,title,date,author,type,doc_url,pdf_url,export_status&order=date.desc`,
      { headers }
    )
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
