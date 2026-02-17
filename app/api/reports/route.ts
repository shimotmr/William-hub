import fs from 'fs'
import path from 'path'

import { NextResponse } from 'next/server'

// This route requires dynamic rendering
export const dynamic = 'force-dynamic'

// PDF storage path
const PDF_DIR = path.join(process.cwd(), 'public', 'reports', 'pdfs')

// Check if a PDF exists for a given numeric report ID
function getPdfInfo(id: number | string): { pdf_url: string | null; pdf_exists: boolean; pdf_size: number | null } {
  try {
    const numericId = String(id)
    if (!fs.existsSync(PDF_DIR)) return { pdf_url: null, pdf_exists: false, pdf_size: null }
    const files = fs.readdirSync(PDF_DIR)
    const match = files.find((f) => f.startsWith(`report-${numericId}-`) && f.endsWith('.pdf'))
    if (!match) return { pdf_url: null, pdf_exists: false, pdf_size: null }
    const stat = fs.statSync(path.join(PDF_DIR, match))
    return { pdf_url: `/api/reports/${numericId}/pdf`, pdf_exists: true, pdf_size: stat.size }
  } catch {
    return { pdf_url: null, pdf_exists: false, pdf_size: null }
  }
}

// Supabase config - use env vars with hardcoded fallback
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

interface Report {
  id: number
  title: string
  date: string
  author: string
  type: 'md'
  doc_url: string | null
  pdf_url: string | null
  pdf_exists?: boolean
  pdf_size?: number | null
  export_status: string | null
  content?: string
  md_content?: string
  category?: string
}

// Fetch reports from Supabase only
async function fetchSupabaseReports(): Promise<Report[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reports?select=id,title,author,type,md_content,date,tasks_extracted,category&order=id.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    })
    
    if (!res.ok) {
      console.error('Failed to fetch Supabase reports')
      return []
    }
    
    const data = await res.json()
    return data.map((report: any) => {
      const pdfInfo = getPdfInfo(report.id)
      return {
        id: report.id,
        title: report.title || 'Untitled Report',
        date: report.date || new Date().toISOString().split('T')[0],
        author: report.author || 'Agent',
        type: 'md' as const,
        doc_url: null,
        pdf_url: pdfInfo.pdf_url,
        pdf_exists: pdfInfo.pdf_exists,
        pdf_size: pdfInfo.pdf_size,
        export_status: null,
        md_content: report.md_content,
        content: report.md_content,
        category: report.category || null,
      }
    })
  } catch (error) {
    console.error('Error fetching Supabase reports:', error)
    return []
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Get reports from Supabase only
    const reports = await fetchSupabaseReports()

    if (id) {
      const report = reports.find(r => r.id === parseInt(id))
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      return NextResponse.json(report)
    }

    // Sort by date descending
    const sortedReports = reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Return list without content to reduce payload size
    const reportsList = sortedReports.map(({ content, md_content, ...report }) => report)
    
    return NextResponse.json(reportsList)
  } catch (error) {
    console.error('Error in reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
