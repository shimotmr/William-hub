import fs from 'fs'
import path from 'path'

import { mdToPdf } from 'md-to-pdf'
import { NextResponse } from 'next/server'

// Path to work reports
const WORK_REPORTS_PATH = '/Users/travis/clawd/work-reports'

const DARK_CSS = `
  body {
    background: #090b10;
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif;
    line-height: 1.7;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  h1, h2, h3, h4, h5, h6 {
    color: #f1f5f9;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }
  h1 { font-size: 1.8em; border-bottom: 1px solid #1e293b; padding-bottom: 0.3em; }
  h2 { font-size: 1.4em; border-bottom: 1px solid #1e293b; padding-bottom: 0.2em; }
  a { color: #60a5fa; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #334155; padding: 8px 12px; text-align: left; }
  th { background: #1e293b; color: #e2e8f0; font-weight: 600; }
  tr:nth-child(even) { background: rgba(255,255,255,0.03); }
  code {
    font-family: "SF Mono", "Fira Code", monospace;
    background: #1e293b;
    color: #e2e8f0;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
  }
  pre {
    background: #1e293b;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
  }
  pre code { background: none; padding: 0; }
  blockquote {
    border-left: 3px solid #3b82f6;
    margin-left: 0;
    padding-left: 16px;
    color: #94a3b8;
  }
  hr { border: none; border-top: 1px solid #1e293b; margin: 2em 0; }
  ul, ol { padding-left: 1.5em; }
  li { margin: 0.3em 0; }
`

// Find report file by ID
function findReportById(reportId: number): { content: string; title: string } | null {
  if (!fs.existsSync(WORK_REPORTS_PATH)) {
    return null
  }

  const categories = fs.readdirSync(WORK_REPORTS_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  let currentId = 1

  for (const category of categories) {
    const categoryPath = path.join(WORK_REPORTS_PATH, category)
    
    try {
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.md'))
        .sort() // Ensure consistent ordering
      
      for (const file of files) {
        if (currentId === reportId) {
          const filepath = path.join(categoryPath, file)
          const content = fs.readFileSync(filepath, 'utf-8')
          
          // Extract title from content or filename
          let title = path.basename(file, '.md')
          const titleMatch = content.match(/^#\s+(.+)$/m)
          if (titleMatch) {
            title = titleMatch[1].replace(/[#*]/g, '').trim()
          }
          
          return { content, title }
        }
        currentId++
      }
    } catch (error) {
      console.error(`Error reading category ${category}:`, error)
    }
  }

  return null
}

export async function POST(request: Request) {
  try {
    const { reportId, format } = await request.json()

    if (!reportId || !['pdf', 'markdown'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid reportId or format. Use "pdf" or "markdown".' },
        { status: 400 }
      )
    }

    // Find report by ID
    const report = findReportById(reportId)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const { content: markdown, title } = report

    if (!markdown) {
      return NextResponse.json({ error: 'Report has no content' }, { status: 400 })
    }

    const safeTitle = (title || `report-${reportId}`)
      .replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_')

    if (format === 'markdown') {
      return new NextResponse(markdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeTitle}.md"`,
        },
      })
    }

    // PDF
    const result = await mdToPdf(
      { content: markdown },
      {
        css: DARK_CSS,
        pdf_options: {
          format: 'A4',
          margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
          printBackground: true,
        },
        launch_options: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      }
    )

    return new NextResponse(new Uint8Array(result.content), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}