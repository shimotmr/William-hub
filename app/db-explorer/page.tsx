'use client'

import { ArrowLeft, Database, Search, Table2, ChevronRight, Download, RefreshCw, Copy, Check, Eye, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

type TableInfo = { table_name: string; row_count?: number }
type ColumnInfo = {
  column_name: string
  data_type: string
  is_nullable: string
  description: string | null
  default: string | null
}

export default function DBExplorerPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [search, setSearch] = useState('')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Query builder state
  const [queryTable, setQueryTable] = useState('')
  const [querySelect, setQuerySelect] = useState('*')
  const [queryLimit, setQueryLimit] = useState(50)
  const [queryResults, setQueryResults] = useState<any[] | null>(null)
  const [queryCount, setQueryCount] = useState<number | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [queryLoading, setQueryLoading] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [])

  async function fetchTables() {
    setLoading(true)
    try {
      const res = await fetch('/api/db-explorer')
      const data = await res.json()
      setTables(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function selectTable(name: string) {
    setSelectedTable(name)
    setQueryTable(name)
    setPreviewData(null)
    setColumns([])

    try {
      const res = await fetch(`/api/db-explorer?table=${encodeURIComponent(name)}`)
      const data = await res.json()
      setColumns(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
  }

  async function fetchPreview(name: string) {
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/db-explorer?table=${encodeURIComponent(name)}&preview=1`)
      const data = await res.json()
      setPreviewData(data.rows || [])
      setPreviewCount(data.totalCount)
    } catch { /* ignore */ }
    setPreviewLoading(false)
  }

  async function runQuery() {
    if (!queryTable) return
    setQueryLoading(true)
    setQueryError(null)
    setQueryResults(null)

    try {
      const res = await fetch('/api/db-explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: queryTable,
          select: querySelect || '*',
          limit: queryLimit,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setQueryError(data.error)
      } else {
        setQueryResults(data.rows || [])
        setQueryCount(data.totalCount)
      }
    } catch (e: any) {
      setQueryError(e.message)
    }
    setQueryLoading(false)
  }

  function exportCSV(data: any[], filename: string) {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const rows = data.map(row =>
      headers.map(h => {
        const v = row[h]
        if (v === null || v === undefined) return ''
        const str = typeof v === 'object' ? JSON.stringify(v) : String(v)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyJSON(data: any[]) {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredTables = tables.filter(t =>
    t.table_name.toLowerCase().includes(search.toLowerCase())
  )

  const typeColors: Record<string, string> = {
    'integer': 'text-blue-500',
    'bigint': 'text-blue-500',
    'text': 'text-green-500',
    'character varying': 'text-green-500',
    'boolean': 'text-purple-500',
    'timestamp with time zone': 'text-amber-500',
    'timestamp without time zone': 'text-amber-500',
    'jsonb': 'text-pink-500',
    'json': 'text-pink-500',
    'ARRAY': 'text-cyan-500',
    'numeric': 'text-blue-400',
    'double precision': 'text-blue-400',
    'real': 'text-blue-400',
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        {/* Sidebar: Table List */}
        <aside className="w-72 shrink-0 border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <Link href="/" className="text-foreground-muted hover:text-foreground transition-colors">
                <ArrowLeft size={18} />
              </Link>
              <Database size={20} className="text-primary" />
              <h1 className="text-lg font-bold">DB Explorer</h1>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                placeholder="搜尋表格..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-sm pl-8 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="text-xs text-foreground-muted mt-2">
              {filteredTables.length} / {tables.length} 表格
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-foreground-muted">載入中...</div>
            ) : (
              filteredTables.map(t => (
                <button
                  key={t.table_name}
                  onClick={() => selectTable(t.table_name)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-muted/50 transition-colors border-b border-border/50 ${
                    selectedTable === t.table_name ? 'bg-primary/10 text-primary border-l-2 border-l-primary' : ''
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0 truncate">
                    <Table2 size={14} className="shrink-0 text-foreground-muted" />
                    {t.table_name}
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-foreground-subtle" />
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {!selectedTable ? (
            <div className="flex items-center justify-center h-full text-foreground-muted">
              <div className="text-center">
                <Database size={48} className="mx-auto mb-4 opacity-30" />
                <p>選擇左側表格以查看結構</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Table Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Table2 size={20} className="text-primary" />
                    {selectedTable}
                  </h2>
                  <p className="text-sm text-foreground-muted mt-1">
                    {columns.length} 個欄位
                    {previewCount !== null && ` · ${previewCount.toLocaleString()} 筆資料`}
                  </p>
                </div>
                <button
                  onClick={() => fetchPreview(selectedTable)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <Eye size={14} />
                  預覽資料
                </button>
              </div>

              {/* Schema */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 text-sm font-medium text-foreground-muted border-b border-border">
                  表結構
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 text-foreground-muted text-left">
                      <th className="px-4 py-2 font-medium">欄位名稱</th>
                      <th className="px-4 py-2 font-medium">資料型別</th>
                      <th className="px-4 py-2 font-medium">可為空</th>
                      <th className="px-4 py-2 font-medium">預設值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map(col => (
                      <tr key={col.column_name} className="border-t border-border hover:bg-muted/20">
                        <td className="px-4 py-2 font-mono text-sm font-medium">{col.column_name}</td>
                        <td className={`px-4 py-2 font-mono text-xs ${typeColors[col.data_type] || 'text-foreground-muted'}`}>
                          {col.data_type}
                        </td>
                        <td className="px-4 py-2">
                          {col.is_nullable === 'YES'
                            ? <span className="text-xs text-foreground-muted">nullable</span>
                            : <span className="text-xs text-error font-medium">NOT NULL</span>
                          }
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-foreground-muted truncate max-w-[200px]">
                          {col.default || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Data Preview */}
              {previewLoading && (
                <div className="text-center py-8 text-foreground-muted">
                  <RefreshCw size={20} className="mx-auto mb-2 animate-spin" />
                  載入資料中...
                </div>
              )}

              {previewData && previewData.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 text-sm font-medium text-foreground-muted border-b border-border flex items-center justify-between">
                    <span>資料預覽 (前 20 筆 / 共 {previewCount?.toLocaleString()})</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyJSON(previewData)}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? '已複製' : 'JSON'}
                      </button>
                      <button
                        onClick={() => exportCSV(previewData, selectedTable)}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                      >
                        <Download size={12} />
                        CSV
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30 text-foreground-muted text-left">
                          {Object.keys(previewData[0]).map(key => (
                            <th key={key} className="px-3 py-2 font-medium whitespace-nowrap">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, i) => (
                          <tr key={i} className="border-t border-border hover:bg-muted/20">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="px-3 py-1.5 whitespace-nowrap max-w-[250px] truncate font-mono">
                                {val === null ? <span className="text-foreground-subtle italic">null</span> :
                                 typeof val === 'object' ? JSON.stringify(val).slice(0, 60) :
                                 String(val).slice(0, 80)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Query Builder */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 text-sm font-medium text-foreground-muted border-b border-border">
                  快速查詢
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-foreground-muted mb-1 block">表格</label>
                      <input
                        type="text"
                        value={queryTable}
                        onChange={e => setQueryTable(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-foreground-muted mb-1 block">SELECT 欄位</label>
                      <input
                        type="text"
                        value={querySelect}
                        onChange={e => setQuerySelect(e.target.value)}
                        placeholder="* 或 id, name, status"
                        className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-foreground-muted mb-1 block">Limit</label>
                      <input
                        type="number"
                        value={queryLimit}
                        onChange={e => setQueryLimit(Number(e.target.value))}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={runQuery}
                      disabled={queryLoading || !queryTable}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {queryLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                      執行查詢
                    </button>
                    {queryResults && (
                      <div className="flex gap-2">
                        <span className="text-xs text-foreground-muted">
                          返回 {queryResults.length} 筆{queryCount !== null && ` / 共 ${queryCount.toLocaleString()}`}
                        </span>
                        <button
                          onClick={() => exportCSV(queryResults, `${queryTable}_query`)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                        >
                          <Download size={12} />
                          匯出 CSV
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {queryError && (
                  <div className="mx-4 mb-4 p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error">
                    {queryError}
                  </div>
                )}

                {queryResults && queryResults.length > 0 && (
                  <div className="overflow-x-auto border-t border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30 text-foreground-muted text-left">
                          {Object.keys(queryResults[0]).map(key => (
                            <th key={key} className="px-3 py-2 font-medium whitespace-nowrap">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.map((row, i) => (
                          <tr key={i} className="border-t border-border hover:bg-muted/20">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="px-3 py-1.5 whitespace-nowrap max-w-[250px] truncate font-mono">
                                {val === null ? <span className="text-foreground-subtle italic">null</span> :
                                 typeof val === 'object' ? JSON.stringify(val).slice(0, 60) :
                                 String(val).slice(0, 80)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
