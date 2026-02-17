import fs from 'fs'
import path from 'path'

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PDF_DIR = path.join(process.cwd(), 'public', 'reports', 'pdfs')

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  // Sanitize: only allow numeric IDs
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 })
  }

  // Find matching PDF file (pattern: report-{id}-*.pdf)
  let pdfPath: string | null = null
  let filename = `report-${id}.pdf`

  try {
    if (fs.existsSync(PDF_DIR)) {
      const files = fs.readdirSync(PDF_DIR)
      const match = files.find(
        (f) => f.startsWith(`report-${id}-`) && f.endsWith('.pdf')
      )
      if (match) {
        pdfPath = path.join(PDF_DIR, match)
        filename = match
      }
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  if (!pdfPath || !fs.existsSync(pdfPath)) {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
  }

  // Stream the file
  const stat = fs.statSync(pdfPath)
  const fileBuffer = fs.readFileSync(pdfPath)

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'no-cache',
    },
  })
}
