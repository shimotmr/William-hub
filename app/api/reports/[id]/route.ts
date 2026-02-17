import fs from 'fs'
import path from 'path'

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PDF_DIR = path.join(process.cwd(), 'public', 'reports', 'pdfs')
const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

function checkPdfExists(id: string): { exists: boolean; size: number | null; filename: string | null } {
  try {
    if (!fs.existsSync(PDF_DIR)) return { exists: false, size: null, filename: null }
    const files = fs.readdirSync(PDF_DIR)
    const match = files.find((f) => f.startsWith(`report-${id}-`) && f.endsWith('.pdf'))
    if (!match) return { exists: false, size: null, filename: null }
    const stat = fs.statSync(path.join(PDF_DIR, match))
    return { exists: true, size: stat.size, filename: match }
  } catch {
    return { exists: false, size: null, filename: null }
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 })
  }

  // Check PDF existence
  const pdf = checkPdfExists(id)

  // Fetch report from Supabase
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/reports?id=eq.${id}&select=id,title,author,type,md_content,date&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    )

    if (res.ok) {
      const data = await res.json()
      if (data && data.length > 0) {
        const report = data[0]
        return NextResponse.json({
          id: report.id,
          title: report.title,
          date: report.date,
          author: report.author,
          type: report.type || 'md',
          md_content: report.md_content,
          content: report.md_content,
          doc_url: null,
          pdf_url: pdf.exists ? `/api/reports/${id}/pdf` : null,
          pdf_exists: pdf.exists,
          pdf_size: pdf.size,
          pdf_filename: pdf.filename,
          export_status: null,
          source: 'supabase',
        })
      }
    }
  } catch (err) {
    console.error('Supabase fetch error:', err)
  }

  // Fallback: just return PDF info if found
  if (pdf.exists) {
    return NextResponse.json({
      id: parseInt(id),
      pdf_url: `/api/reports/${id}/pdf`,
      pdf_exists: true,
      pdf_size: pdf.size,
      pdf_filename: pdf.filename,
    })
  }

  return NextResponse.json({ error: 'Report not found' }, { status: 404 })
}
