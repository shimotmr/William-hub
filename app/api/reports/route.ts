import fs from 'fs'
import path from 'path'

import { NextResponse } from 'next/server'

// Path to work reports
const WORK_REPORTS_PATH = path.join(process.cwd(), 'data')

interface Report {
  id: number
  title: string
  date: string
  author: string
  type: 'md'
  doc_url: string | null
  pdf_url: string | null
  export_status: string | null
  content?: string
  md_content?: string
  category: string
  filepath: string
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
            id: idCounter++,
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
            filepath: filepath
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

  // Sort by date descending
  return reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const reports = scanReportsDirectory()

    if (id) {
      const report = reports.find(r => r.id === parseInt(id))
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      return NextResponse.json(report)
    }

    // Return list without content to reduce payload size
    const reportsList = reports.map(({ content, md_content, filepath, ...report }) => report)
    
    return NextResponse.json(reportsList)
  } catch (error) {
    console.error('Error in reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}