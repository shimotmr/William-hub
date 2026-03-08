import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const msgType = searchParams.get('msg_type') || ''
    const externalUserid = searchParams.get('external_userid') || ''

    // Get companies
    const { data: companies } = await supabase
      .from('wecom_companies')
      .select('id, name')
      .order('name')

    // Build conversation query
    let convQuery = supabase
      .from('wecom_conversations')
      .select(`
        external_userid,
        open_kfid,
        display_name,
        company_id,
        wecom_companies!wecom_conversations_company_id_fkey(name)
      `)
      .order('updated_at', { ascending: false })
      .limit(200)

    if (q) {
      convQuery = convQuery.or(`external_userid.ilike.%${q}%,display_name.ilike.%${q}%`)
    }

    const { data: conversations } = await convQuery

    // Transform conversations
    const convList: any[] = (conversations || []).map((c: any) => ({
      external_userid: c.external_userid,
      open_kfid: c.open_kfid,
      display_name: c.display_name,
      company_id: c.company_id,
      company_name: c.wecom_companies?.name || '未分類',
      last_send_time: null as number | null,
      msg_count: 0
    }))

    // Get selected external_userid
    let selected = externalUserid
    if (!selected && convList.length > 0) {
      selected = convList[0].external_userid
    }

    // Get timeline for selected
    let timeline: any[] = []
    if (selected) {
      let msgQuery = supabase
        .from('wecom_messages')
        .select('*')
        .eq('external_userid', selected)
        .order('send_time', { ascending: true })
        .order('id', { ascending: true })

      if (msgType) {
        msgQuery = msgQuery.eq('msg_type', msgType)
      }

      const { data: messages } = await msgQuery
      timeline = messages || []

      // Get message counts per conversation
      for (const conv of convList) {
        const { data: msgs } = await supabase
          .from('wecom_messages')
          .select('send_time', { count: 'exact', head: true })
          .eq('external_userid', conv.external_userid)
        
        conv.msg_count = msgs?.length || 0
        if (msgs && msgs.length > 0) {
          const maxTime = Math.max(...msgs.map((m: any) => m.send_time || 0))
          conv.last_send_time = maxTime > 0 ? maxTime : null
        }
      }
    }

    // Get notes for selected
    let notes: any[] = []
    if (selected) {
      const { data: noteList } = await supabase
        .from('wecom_notes')
        .select('*')
        .eq('external_userid', selected)
        .order('id', { ascending: false })
      notes = noteList || []
    }

    return NextResponse.json({
      companies: companies || [],
      conversations: convList,
      selected_external_userid: selected,
      timeline,
      notes
    })
  } catch (error) {
    console.error('Bootstrap error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
