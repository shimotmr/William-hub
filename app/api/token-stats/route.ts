import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || ''

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  try {
    // Fetch all token_usage records
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/token_usage?select=date,input_tokens,output_tokens,total_tokens,sessions&order=date.desc&limit=30`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        next: { revalidate: 300 }, // cache 5 min
      }
    )
    const rows = await res.json()

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ today: 0, week: 0, month: 0, total: 0 })
    }

    const now = new Date()
    const tzOffset = 8 * 60 * 60 * 1000
    const twNow = new Date(now.getTime() + tzOffset)
    const todayStr = twNow.toISOString().split('T')[0]

    // Calculate week start (Monday)
    const dayOfWeek = twNow.getUTCDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(twNow.getTime() - mondayOffset * 86400000)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // Calculate month start
    const monthStartStr = todayStr.slice(0, 8) + '01'

    let today = 0, week = 0, month = 0, total = 0
    for (const r of rows) {
      const tokens = r.total_tokens || 0
      total += tokens
      if (r.date >= monthStartStr) month += tokens
      if (r.date >= weekStartStr) week += tokens
      if (r.date === todayStr) today = tokens
    }

    return NextResponse.json({ today, week, month, total })
  } catch (e) {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
