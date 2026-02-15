import { mdToPdf } from 'md-to-pdf'
import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://eznawjbgzmcnkxcisrjj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bmF3amJnem1jbmt4Y2lzcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTkxMTUsImV4cCI6MjA4NTczNTExNX0.KrZbgeF5z76BTjOPvBTxRkuEt_OqpmgsqMAd60wA1J0'

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

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

export async function POST(request: Request) {
  try {
    const { reportId, format } = await request.json()

    if (!reportId || !['pdf', 'markdown'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid reportId or format. Use "pdf" or "markdown".' },
        { status: 400 }
      )
    }

    // Fetch report with content
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/reports?id=eq.${reportId}&select=id,title,md_content,content`,
      { headers }
    )
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
    }
    const data = await res.json()
    if (!data.length) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const report = data[0]
    const markdown = report.md_content || report.content || ''

    if (!markdown) {
      return NextResponse.json({ error: 'Report has no content' }, { status: 400 })
    }

    const safeTitle = (report.title || `report-${reportId}`)
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
