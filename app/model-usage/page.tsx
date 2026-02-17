'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { ArrowLeft, Search, Activity, DollarSign, TrendingDown, Clock, Download, Filter, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import AgentRanking from '@/app/components/AgentRanking'
import ModelQuotaOverview from '@/app/components/ModelQuotaOverview'
import ModelTrendChart from '@/app/components/ModelTrendChart'

ChartJS.register(ArcElement, Tooltip, Legend)

// Types
interface UsageRecord {
  id: number
  model_provider: string
  model_id: string
  agent_id: string
  session_key: string
  tokens_in: number
  tokens_out: number
  prompt_count: number
  cost_usd: number
  created_at: string
}

interface ApiResponse {
  status: string
  data: {
    records: UsageRecord[]
    pagination: {
      page: number
      limit: number
      total: number
      total_pages: number
    }
    summary: {
      total_prompts: number
      total_tokens_in: number
      total_tokens_out: number
      total_tokens: number
      total_cost: number
    }
    filters: {
      models: string[]
      agents: string[]
    }
  }
}

// Model colors
const modelColors: Record<string, string> = {
  'anthropic': '#8b5cf6',
  'openai': '#10b981',
  'minimax': '#f59e0b',
  'moonshot': '#06b6d4',
  'google': '#3b82f6',
}

function getModelColor(provider: string): string {
  return modelColors[provider] || '#6b7280'
}

function getModelIcon(provider: string): string {
  switch (provider) {
    case 'anthropic': return 'C'
    case 'openai': return 'O'
    case 'minimax': return 'M'
    case 'moonshot': return 'K'
    case 'google': return 'G'
    default: return '?'
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString()
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return '剛剛'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`
  return `${Math.floor(diff / 604800)} 週前`
}

export default function ModelUsageDetailPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [modelFilter, setModelFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Build query params
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (modelFilter) params.set('model', modelFilter)
      if (agentFilter) params.set('agent', agentFilter)
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/model-usage/record?${params.toString()}`)
      const json = await res.json()
      
      if (json.status === 'success') {
        setData(json)
        setError(null)
      } else {
        setError(json.error || 'Failed to fetch')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, limit])

  // Handle filter apply
  const applyFilters = () => {
    setPage(1)
    fetchData()
  }

  // Clear filters
  const clearFilters = () => {
    setModelFilter('')
    setAgentFilter('')
    setStartDate('')
    setEndDate('')
    setSearch('')
    setPage(1)
    fetchData()
  }

  const hasFilters = modelFilter || agentFilter || startDate || endDate || search

  // Quick filter buttons
  const setQuickFilter = (type: '24h' | '7d' | '30d') => {
    const now = new Date()
    const start = new Date()
    
    if (type === '24h') {
      start.setDate(now.getDate() - 1)
    } else if (type === '7d') {
      start.setDate(now.getDate() - 7)
    } else if (type === '30d') {
      start.setDate(now.getDate() - 30)
    }
    
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(now.toISOString().split('T')[0])
    setPage(1)
    fetchData()
  }

  const records = data?.data?.records || []
  const pagination = data?.data?.pagination
  const summary = data?.data?.summary
  const filters = data?.data?.filters

  return (
    <main className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-purple-500/[0.05] rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-blue-500/[0.07] rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground text-sm transition-colors">
            <ArrowLeft size={14} />
            返回 Dashboard
          </Link>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            模型用量詳情
          </h1>
          <p className="text-foreground-muted">
            查看完整的模型使用記錄和用量分析
          </p>
        </header>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Activity size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {formatNumber(pagination?.total || 0)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">總記錄數</span>
              </div>
            </div>
            
            <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Activity size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {formatNumber(summary.total_tokens)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">Total Tokens</span>
              </div>
            </div>
            
            <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <DollarSign size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                ${summary.total_cost.toFixed(4)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">總成本</span>
              </div>
            </div>
            
            <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {formatNumber(summary.total_prompts)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">總請求數</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
              <Filter size={14} /> 篩選條件
            </h2>
            {hasFilters && (
              <button 
                onClick={clearFilters}
                className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1"
              >
                <X size={12} /> 清除篩選
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date Range */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-foreground-muted mb-2">
                日期範圍
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Model Filter */}
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-2">
                模型
              </label>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">全部模型</option>
                {filters?.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            
            {/* Agent Filter */}
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-2">
                Agent
              </label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">全部 Agent</option>
                {filters?.agents.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-2">
                搜尋 Session
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Session key..."
                  className="w-full px-3 py-2 pl-9 text-sm bg-background border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" size={14} />
              </div>
            </div>
          </div>
          
          {/* Quick Filters + Apply */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
            <span className="text-xs text-foreground-muted mr-2">快速篩選:</span>
            <button 
              onClick={() => setQuickFilter('24h')}
              className="px-3 py-1 text-xs rounded-full bg-primary text-primary-foreground"
            >
              24小時內
            </button>
            <button 
              onClick={() => setQuickFilter('7d')}
              className="px-3 py-1 text-xs rounded-full border border-border hover:bg-muted"
            >
              7天內
            </button>
            <button 
              onClick={() => setQuickFilter('30d')}
              className="px-3 py-1 text-xs rounded-full border border-border hover:bg-muted"
            >
              30天內
            </button>
            
            <button 
              onClick={applyFilters}
              className="ml-auto px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              套用篩選
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-border bg-card backdrop-blur-sm overflow-hidden mb-6">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider">
                使用記錄
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-subtle">
                  顯示 {((pagination?.page || 1) - 1) * (pagination?.limit || 50) + 1}-
                  {Math.min((pagination?.page || 1) * (pagination?.limit || 50), pagination?.total || 0)} 筆
                  （共 {pagination?.total || 0} 筆記錄）
                </span>
              </div>
            </div>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-border border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
          
          {/* Error State */}
          {error && !loading && (
            <div className="text-center text-red-400 py-8">
              載入失敗: {error}
              <button onClick={fetchData} className="ml-4 text-foreground-muted hover:text-foreground">
                重試
              </button>
            </div>
          )}
          
          {/* Table */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      時間
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      模型
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Tokens In
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Tokens Out
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                      Session
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-foreground-muted py-8">
                        沒有找到符合的記錄
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => {
                      const color = getModelColor(record.model_provider)
                      return (
                        <tr key={record.id} className="border-b border-border hover:bg-background-elevated/50">
                          <td className="px-4 py-3">
                            <div className="text-sm text-foreground">
                              {new Date(record.created_at).toLocaleString('zh-TW')}
                            </div>
                            <div className="text-[10px] text-foreground-subtle">
                              {timeAgo(record.created_at)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                                style={{ background: color }}
                              >
                                {getModelIcon(record.model_provider)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {record.model_id}
                                </div>
                                <div className="text-[10px] text-foreground-subtle">
                                  {record.model_provider}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {record.agent_id}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-mono">
                              {formatNumber(record.tokens_in)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-mono">
                              {formatNumber(record.tokens_out)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-mono text-emerald-400">
                              ${record.cost_usd.toFixed(4)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button className="text-xs text-primary hover:underline truncate max-w-[120px] block">
                              {record.session_key}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-border bg-background/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <select 
                    value={limit}
                    onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                    className="px-2 py-1 text-xs bg-background border border-border rounded"
                  >
                    <option value="25">25 筆/頁</option>
                    <option value="50">50 筆/頁</option>
                    <option value="100">100 筆/頁</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-xs border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一頁
                  </button>
                  <span className="text-xs text-foreground-muted">
                    第 {page} / {pagination.total_pages} 頁
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                    disabled={page >= pagination.total_pages}
                    className="px-3 py-1 text-xs border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full Dashboard Components (optional, can be hidden in detail view) */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">儀表板總覽</h2>
          <ModelQuotaOverview />
          <ModelTrendChart />
          <AgentRanking />
        </div>
      </div>
    </main>
  )
}
