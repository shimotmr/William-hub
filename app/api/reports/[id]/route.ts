import fs from 'fs'
import path from 'path'

import { NextResponse } from 'next/server'

// This route requires dynamic rendering
export const dynamic = 'force-dynamic'

// Supabase config
const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

// Path to work reports
const WORK_REPORTS_PATH = path.join(process.cwd(), 'data')

interface Report {
  id: number | string
  title: string
  date: string
  author: string
  type: 'md'
  md_content: string
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
    author
  }
}

// Find local report by ID
function findLocalReport(localId: number): Report | null {
  if (!fs.existsSync(WORK_REPORTS_PATH)) {
    return null
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
        if (idCounter === localId) {
          const filepath = path.join(categoryPath, file)
          
          try {
            const content = fs.readFileSync(filepath, 'utf-8')
            const metadata = extractMetadata(content, filepath, category)
            
            return {
              id: `local_${idCounter}`,
              title: metadata.title || path.basename(file, '.md'),
              date: metadata.date || new Date().toISOString().split('T')[0],
              author: metadata.author || 'System',
              type: 'md',
              md_content: content,
              source: 'local'
            }
          } catch (error) {
            console.error(`Error reading file ${filepath}:`, error)
            return null
          }
        }
        idCounter++
      }
    } catch (error) {
      console.error(`Error reading category ${category}:`, error)
    }
  }

  return null
}

// Fetch single report from Supabase
async function fetchSupabaseReport(supabaseId: number): Promise<Report | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${supabaseId}&select=id,title,author,type,md_content,date`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    
    if (!res.ok) {
      return null
    }
    
    const data = await res.json()
    if (!data || data.length === 0) {
      return null
    }

    const report = data[0]
    return {
      id: `supabase_${report.id}`,
      title: report.title || 'Untitled Report',
      date: report.date || new Date().toISOString().split('T')[0],
      author: report.author || 'Agent',
      type: 'md',
      md_content: report.md_content || '',
      source: 'supabase'
    }
  } catch (error) {
    console.error('Error fetching Supabase report:', error)
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // Check if it's a Supabase report (numeric ID or starts with supabase_)
    if (id.startsWith('supabase_')) {
      const supabaseId = parseInt(id.replace('supabase_', ''))
      const report = await fetchSupabaseReport(supabaseId)
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      return NextResponse.json(report)
    } else if (/^\d+$/.test(id)) {
      // Numeric ID - could be either Supabase or local
      const numericId = parseInt(id)
      
      // Try Supabase first
      const supabaseReport = await fetchSupabaseReport(numericId)
      if (supabaseReport) {
        return NextResponse.json(supabaseReport)
      }
      
      // If not found in Supabase, try local
      const localReport = findLocalReport(numericId)
      if (localReport) {
        return NextResponse.json(localReport)
      }
    } else if (id.startsWith('local_')) {
      const localId = parseInt(id.replace('local_', ''))
      const report = findLocalReport(localId)
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      return NextResponse.json(report)
    }

    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  } catch (error) {
    console.error('Error in report detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}