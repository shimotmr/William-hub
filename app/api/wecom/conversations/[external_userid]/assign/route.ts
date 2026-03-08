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
    const companyName = (body.company_name || '未分類').trim()

    // Ensure company exists
    let { data: company } = await supabase
      .from('wecom_companies')
      .select('id')
      .eq('name', companyName)
      .single()

    let companyId: number
    if (company) {
      companyId = company.id
    } else {
      const { data: newCompany } = await supabase
        .from('wecom_companies')
        .insert({ name: companyName, created_at: nowIso(), updated_at: nowIso() })
        .select('id')
        .single()
      if (!newCompany) {
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
      }
      companyId = newCompany.id
    }

    // Upsert conversation
    await supabase
      .from('wecom_conversations')
      .upsert({
        external_userid: external_userid,
        company_id: companyId,
        updated_at: nowIso()
      }, { onConflict: 'external_userid' })

    return NextResponse.json({ ok: true, external_userid, company_name: companyName })
  } catch (error) {
    console.error('Assign error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
