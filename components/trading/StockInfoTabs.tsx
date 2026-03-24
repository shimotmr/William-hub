'use client'

import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { Building2, GitBranch, BarChart3, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface SupplyChainEntity {
  name: string
  ticker: string | null
  type: string
  strength: number
  sector: string | null
}

interface StockInfo {
  symbol: string
  name: string
  sector: string | null
  industry: string | null
  market_cap: number | null
  business_overview: string | null
  financial_summary: {
    revenue?: string
    eps?: string
    pe_ratio?: string
    market_cap?: string
    raw?: string
  } | null
  upstream: SupplyChainEntity[]
  downstream: SupplyChainEntity[]
  related_tags: string[]
  updated_at: string
}

function SupplyChainCard({ entity, direction }: { entity: SupplyChainEntity; direction: 'up' | 'down' }) {
  const isClickable = !!entity.ticker

  const inner = (
    <div
      className={clsx(
        'flex items-center justify-between p-3 rounded-lg border transition-colors',
        'border-zinc-700 bg-zinc-800/50',
        isClickable && 'hover:bg-zinc-700/50 cursor-pointer',
        !isClickable && 'opacity-60'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-100 truncate">{entity.name}</span>
          {entity.ticker && (
            <span className="text-xs text-zinc-400 shrink-0">({entity.ticker})</span>
          )}
          {!entity.ticker && (
            <span className="text-xs text-zinc-500 shrink-0">外資</span>
          )}
        </div>
        {entity.sector && (
          <div className="text-xs text-zinc-500 mt-0.5">{entity.sector}</div>
        )}
      </div>

      {/* Strength bar */}
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <div className="w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${(entity.strength || 0.5) * 100}%` }}
          />
        </div>
        {isClickable && <ExternalLink size={12} className="text-zinc-500" />}
      </div>
    </div>
  )

  if (isClickable) {
    return <Link href={`/trade/stocks/${entity.ticker}`}>{inner}</Link>
  }
  return inner
}

function CompanyTab({ data }: { data: StockInfo }) {
  return (
    <div className="space-y-4">
      {/* Basic info */}
      <div className="grid grid-cols-2 gap-3">
        {data.sector && (
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="text-xs text-zinc-500">板塊</div>
            <div className="text-sm text-zinc-200 mt-1">{data.sector}</div>
          </div>
        )}
        {data.industry && (
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="text-xs text-zinc-500">產業</div>
            <div className="text-sm text-zinc-200 mt-1">{data.industry}</div>
          </div>
        )}
        {data.market_cap && (
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 col-span-2">
            <div className="text-xs text-zinc-500">市值（百萬）</div>
            <div className="text-sm text-zinc-200 mt-1">
              {new Intl.NumberFormat('zh-TW').format(data.market_cap)} TWD
            </div>
          </div>
        )}
      </div>

      {/* Business overview */}
      {data.business_overview && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">業務簡介</h3>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
            {data.business_overview}
          </p>
        </div>
      )}

      {/* Tags */}
      {data.related_tags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">相關標籤</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.related_tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-zinc-700/50 text-zinc-400 rounded-full border border-zinc-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SupplyChainTab({ data }: { data: StockInfo }) {
  return (
    <div className="space-y-5">
      {/* Upstream */}
      <section>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-300 mb-2">
          <ChevronUp size={16} className="text-blue-400" />
          上游供應商（設備/材料）
        </h3>
        {data.upstream.length > 0 ? (
          <div className="space-y-1.5">
            {data.upstream.map((e, i) => (
              <SupplyChainCard key={`${e.name}-${i}`} entity={e} direction="up" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 pl-6">暫無資料</p>
        )}
      </section>

      {/* Mid position */}
      <section className="border-l-4 border-blue-500 pl-4 py-2">
        <div className="text-xs text-zinc-500">中游定位</div>
        <div className="text-sm font-semibold text-zinc-200">
          {data.name} ({data.symbol})
          {data.industry && <span className="text-zinc-400 font-normal"> — {data.industry}</span>}
        </div>
      </section>

      {/* Downstream */}
      <section>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-300 mb-2">
          <ChevronDown size={16} className="text-green-400" />
          下游客戶（應用/終端）
        </h3>
        {data.downstream.length > 0 ? (
          <div className="space-y-1.5">
            {data.downstream.map((e, i) => (
              <SupplyChainCard key={`${e.name}-${i}`} entity={e} direction="down" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 pl-6">暫無資料</p>
        )}
      </section>
    </div>
  )
}

function FinancialTab({ data }: { data: StockInfo }) {
  const fs = data.financial_summary

  if (!fs) {
    return <p className="text-sm text-zinc-500">暫無財務資料</p>
  }

  return (
    <div className="space-y-4">
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        {fs.revenue && (
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="text-xs text-zinc-500">營收</div>
            <div className="text-sm text-zinc-200 mt-1">{fs.revenue}</div>
          </div>
        )}
        {fs.eps && (
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="text-xs text-zinc-500">EPS</div>
            <div className="text-sm text-zinc-200 mt-1">{fs.eps}</div>
          </div>
        )}
        {fs.pe_ratio && (
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="text-xs text-zinc-500">本益比</div>
            <div className="text-sm text-zinc-200 mt-1">{fs.pe_ratio}</div>
          </div>
        )}
        {fs.market_cap && (
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="text-xs text-zinc-500">市值</div>
            <div className="text-sm text-zinc-200 mt-1">{fs.market_cap}</div>
          </div>
        )}
      </div>

      {/* Raw financial text */}
      {fs.raw && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">財務概況</h3>
          <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line bg-zinc-800/30 p-3 rounded-lg border border-zinc-700 max-h-96 overflow-y-auto">
            {fs.raw}
          </div>
        </div>
      )}
    </div>
  )
}

export function StockInfoTabs({ symbol }: { symbol: string }) {
  const [activeTab, setActiveTab] = useState<'company' | 'supply' | 'finance'>('company')

  const { data, isLoading, error } = useQuery<StockInfo>({
    queryKey: ['stock-info', symbol],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${symbol}/info`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '載入失敗')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 min
  })

  const tabs = [
    { key: 'company' as const, label: '公司簡介', icon: Building2 },
    { key: 'supply' as const, label: '供應鏈', icon: GitBranch },
    { key: 'finance' as const, label: '財務摘要', icon: BarChart3 },
  ]

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-700 mb-4">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'text-blue-400 border-blue-400'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-600 border-t-blue-400" />
          <span className="ml-2 text-sm text-zinc-500">載入基本面資料...</span>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-sm text-zinc-500">
          {(error as Error).message || '載入失敗'}
        </div>
      )}

      {data && (
        <div className="px-1">
          {activeTab === 'company' && <CompanyTab data={data} />}
          {activeTab === 'supply' && <SupplyChainTab data={data} />}
          {activeTab === 'finance' && <FinancialTab data={data} />}

          {/* Last updated */}
          <div className="mt-4 text-xs text-zinc-600 text-right">
            資料更新：{new Date(data.updated_at).toLocaleDateString('zh-TW')}
          </div>
        </div>
      )}
    </div>
  )
}
