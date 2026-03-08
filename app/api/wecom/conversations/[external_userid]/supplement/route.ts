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
    const content = (body.content || '').trim()

    if (!content) {
      return NextResponse.json({ ok: false, error: 'content required' }, { status: 400 })
    }

    // Ensure conversation exists
    await supabase
      .from('wecom_conversations')
      .upsert({
        external_userid: external_userid,
        updated_at: nowIso()
      }, { onConflict: 'external_userid' })

    // Insert supplement as message
    await supabase
      .from('wecom_messages')
      .insert({
        msg_id: `manual-${Date.now()}`,
        external_userid: external_userid,
        open_kfid: '',
        msg_type: 'manual/supplement',
        sender_name: '客服補充',
        content,
        send_time: Math.floor(Date.now() / 1000),
        source_event: 'manual_append',
        parent_msg_id: '',
        raw_json: JSON.stringify({ manual: true }),
        created_at: nowIso()
      })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Supplement error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
