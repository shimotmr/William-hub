// ============================================================
// William Hub — Reports Management Center
// ============================================================
'use client'

import {
  FileText, FileDown, ArrowLeft, Loader2,
  User, Calendar, Filter,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

// --- Types ---
interface Report {
  id: number
  title: string
  date: string
  author: string
  type: 'md' | 'doc' | 'pdf'
  doc_url: string | null
  pdf_url: string | null
  export_status: string | null
  content?: string
  md_content?: string
}

type FilterType = 'all' | 'md' | 'doc' | 'pdf'

// --- Badge colors ---
const typeBadge: Record<string, { bg: string; text: string }> = {
  md: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  doc: { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  pdf: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
}

// --- Export button ---
function ExportDownloadButton({
  label,
  icon: Icon,
  format,
  reportId,
}: {
  label: string
  icon: typeof FileDown
  format: 'pdf' | 'markdown'
  reportId: number
}) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, format }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }))
        alert(err.error || 'Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="(.+)"/)
      a.download = match ? match[1] : `report.${format === 'pdf' ? 'pdf' : 'md'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#e5e5e5',
      }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {label}
    </button>
  )
}

// --- Report Card ---
function ReportCard({
  report,
  selected,
  onClick,
}: {
  report: Report
  selected: boolean
  onClick: () => void
}) {
  const badge = typeBadge[report.type] || typeBadge.md
  const hasExport = report.doc_url || report.pdf_url
  const isExporting = report.export_status === 'exporting'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg transition-all duration-150 ${
        selected
          ? 'border-l-[3px] border-l-blue-500 bg-blue-500/[0.08]'
          : 'border-l-[3px] border-l-transparent hover:bg-white/[0.04]'
      }`}
      style={{ borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[15px] font-semibold text-gray-200 truncate flex-1">
          {report.title}
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full uppercase font-medium shrink-0"
          style={{ background: badge.bg, color: badge.text }}
        >
          {report.type}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1">
        <User size={12} />
        <span>{report.author}</span>
        <Calendar size={12} className="ml-1" />
        <span>{new Date(report.date).toLocaleDateString('zh-TW')}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[12px]">
        {isExporting ? (
          <>
            <Loader2 size={10} className="animate-spin text-amber-400" />
            <span className="text-amber-400">Export...</span>
          </>
        ) : hasExport ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-emerald-400">
              {[report.doc_url && 'Doc', report.pdf_url && 'PDF'].filter(Boolean).join(' / ')}
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />
            <span className="text-gray-600">No export</span>
          </>
        )}
      </div>
    </button>
  )
}

// ============================================================
// Main Page
// ============================================================
export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [mobileShowContent, setMobileShowContent] = useState(false)

  // Fetch list
  useEffect(() => {
    fetch('/api/reports')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReports(data)
          if (data.length > 0) setSelectedId(data[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Fetch detail
  useEffect(() => {
    if (!selectedId) { setSelectedReport(null); return }
    setContentLoading(true)
    fetch(`/api/reports?id=${selectedId}`)
      .then((r) => r.json())
      .then((data) => { if (data && !data.error) setSelectedReport(data) })
      .catch(() => {})
      .finally(() => setContentLoading(false))
  }, [selectedId])

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.type === filter)

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'MD', value: 'md' },
    { label: 'Doc', value: 'doc' },
    { label: 'PDF', value: 'pdf' },
  ]

  // --- Sidebar ---
  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Filter chips */}
      <div className="flex gap-2 p-4 pb-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              filter === f.value
                ? 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                : 'bg-white/[0.08] border border-white/[0.12] text-gray-400 hover:bg-white/[0.12]'
            }`}
          >
            <Filter size={10} className="inline mr-1" />
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">
            <FileText size={32} className="mx-auto mb-3 text-gray-700" />
            No reports
          </div>
        ) : (
          filtered.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              selected={r.id === selectedId}
              onClick={() => {
                setSelectedId(r.id)
                setMobileShowContent(true)
              }}
            />
          ))
        )}
      </div>
    </div>
  )

  // --- Content area ---
  const content = selectedReport ? (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[800px] mx-auto px-6 sm:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2">
              {selectedReport.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1"><User size={14} /> {selectedReport.author}</span>
              <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(selectedReport.date).toLocaleDateString('zh-TW')}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <ExportDownloadButton label="Export PDF" icon={FileDown} format="pdf" reportId={selectedReport.id} />
            <ExportDownloadButton label="Export Markdown" icon={FileText} format="markdown" reportId={selectedReport.id} />
          </div>
        </div>

        {/* Markdown */}
        <article className="prose-dark">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {selectedReport.md_content || selectedReport.content || '_No content_'}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  ) : (
    <div className="h-full flex items-center justify-center text-gray-600">
      <div className="text-center">
        <FileText size={48} className="mx-auto mb-4 text-gray-700" />
        <p className="text-sm">Select a report</p>
      </div>
    </div>
  )

  const contentWithLoading = contentLoading ? (
    <div className="h-full flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-gray-500" />
    </div>
  ) : content

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/60 shrink-0">
        <a href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft size={18} />
        </a>
        <FileText size={18} className="text-blue-400" />
        <h1 className="text-sm font-semibold text-gray-200">Reports</h1>
      </div>

      {/* Desktop layout */}
      <div className="flex-1 overflow-hidden hidden md:flex">
        {/* Sidebar */}
        <div className="w-[320px] border-r border-gray-800/60 shrink-0 bg-gray-900/30">
          {sidebar}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          {contentWithLoading}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex-1 overflow-hidden md:hidden">
        {mobileShowContent ? (
          <div className="h-full flex flex-col">
            <button
              onClick={() => setMobileShowContent(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border-b border-gray-800/60 shrink-0"
            >
              <ArrowLeft size={16} />
              Back to list
            </button>
            <div className="flex-1 overflow-hidden">
              {contentWithLoading}
            </div>
          </div>
        ) : (
          sidebar
        )}
      </div>
    </div>
  )
}
