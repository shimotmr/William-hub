import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function nowIso() {
  return new Date().toISOString()
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ external_userid: string }> }
) {
  try {
    const { external_userid } = await params
    const body = await request.json()
    const note = (body.note || '').trim()

    if (!note) {
      return NextResponse.json({ ok: false, error: 'note required' }, { status: 400 })
    }

    // Insert note
    await supabase
      .from('wecom_notes')
      .insert({
        external_userid,
        note,
        created_at: nowIso()
      })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Note error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
