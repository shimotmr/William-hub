import fs from 'fs'
import path from 'path'

import { NextResponse } from 'next/server'

// This route requires dynamic rendering
export const dynamic = 'force-dynamic'

// Path to work reports
const WORK_REPORTS_PATH = path.join(process.cwd(), 'data')

// PDF storage path
const PDF_DIR = path.join(process.cwd(), 'public', 'reports', 'pdfs')

// Check if a PDF exists for a given numeric report ID
function getPdfInfo(id: number | string): { pdf_url: string | null; pdf_exists: boolean; pdf_size: number | null } {
  try {
    const numericId = String(id).replace(/^supabase_/, '')
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

// Supabase config
const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

interface Report {
  id: number | string
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
  filepath?: string
  source: 'local' | 'supabase'
}

// Extract metadata from markdown content
function extractMetadata(content: string, filepath: string, category: string): Partial<Report> {
  // Extract title (first h1)
  let title = path.basename(filepath, '.md')
  const titleMatch = content.match(/^#\s+(.+)$/m)
  if (titleMatch) {
    title = titleMatch[1].replace(/[#*]/g, '').trim()
  }

  // Try to extract date from various formats
  let date = new Date().toISOString().split('T')[0] // fallback to today
  
  // Look for date patterns in content
  const datePatterns = [
    /\*\*日期\*\*[：:]\s*(\d{4}-\d{2}-\d{2})/,
    /日期[：:]\s*(\d{4}-\d{2}-\d{2})/,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{4}\/\d{2}\/\d{2})/,
    /(\d{4}\.\d{2}\.\d{2})/
  ]
  
  for (const pattern of datePatterns) {
    const match = content.match(pattern)
    if (match) {
      const extractedDate = match[1].replace(/[/.]/g, '-')
      if (extractedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = extractedDate
        break
      }
    }
  }

  // If no date found in content, try to extract from filename
  const filenameDateMatch = filepath.match(/(\d{4}-\d{2}-\d{2})/)
  if (filenameDateMatch) {
    date = filenameDateMatch[1]
  }

  // Extract author 
  let author = 'System'
  const authorPatterns = [
    /\*\*作者\*\*[：:]\s*(.+)/,
    /作者[：:]\s*(.+)/,
    /\*\*Author\*\*[：:]\s*(.+)/,
    /Author[：:]\s*(.+)/,
    /by\s+(.+)/i
  ]
  
  for (const pattern of authorPatterns) {
    const match = content.match(pattern)
    if (match) {
      author = match[1].trim()
      break
    }
  }

  return {
    title,
    date,
    author,
    category
  }
}

// Scan directory for markdown files
function scanReportsDirectory(): Report[] {
  const reports: Report[] = []
  
  if (!fs.existsSync(WORK_REPORTS_PATH)) {
    return reports
  }

  const categories = fs.readdirSync(WORK_REPORTS_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  let idCounter = 1

  for (const category of categories) {
    const categoryPath = path.join(WORK_REPORTS_PATH, category)
    
    try {
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.md'))
      
      for (const file of files) {
        const filepath = path.join(categoryPath, file)
        
        try {
          const content = fs.readFileSync(filepath, 'utf-8')
          const metadata = extractMetadata(content, filepath, category)
          
          const report: Report = {
            id: `local_${idCounter++}`,
            title: metadata.title || path.basename(file, '.md'),
            date: metadata.date || new Date().toISOString().split('T')[0],
            author: metadata.author || 'System',
            type: 'md',
            doc_url: null,
            pdf_url: null,
            export_status: null,
            content: content,
            md_content: content,
            category: category,
            filepath: filepath,
            source: 'local'
          }
          
          reports.push(report)
        } catch (error) {
          console.error(`Error reading file ${filepath}:`, error)
        }
      }
    } catch (error) {
      console.error(`Error reading category ${category}:`, error)
    }
  }

  return reports
}

// Fetch reports from Supabase
async function fetchSupabaseReports(): Promise<Report[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reports?select=id,title,author,type,md_content,date,tasks_extracted&order=id.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
        id: `supabase_${report.id}`,
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
        source: 'supabase' as const,
        supabase_id: report.id // Keep original ID for lookups
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

    // Get both local and Supabase reports
    const localReports = scanReportsDirectory()
    const supabaseReports = await fetchSupabaseReports()
    const allReports = [...localReports, ...supabaseReports]

    if (id) {
      const report = allReports.find(r => r.id === id || r.id === parseInt(id))
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      return NextResponse.json(report)
    }

    // Sort by date descending
    const sortedReports = allReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Return list without content to reduce payload size
    const reportsList = sortedReports.map(({ content, md_content, filepath, ...report }) => report)
    
    return NextResponse.json(reportsList)
  } catch (error) {
    console.error('Error in reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}