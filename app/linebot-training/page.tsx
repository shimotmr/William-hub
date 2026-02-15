'use client'

import {
  ArrowLeft,
  Search,
  MessageSquare,
  Database,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  FileText,
  HelpCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────
type FaqItem = {
  patterns: string[]
  answer: string
  category: string
}

type TestCase = {
  id: number
  category: string
  question: string
  expected: string
  criteria: string
  status: 'pass' | 'fail' | 'pending'
}

// ─── Static Data ─────────────────────────────────────────────
const faqData: FaqItem[] = [
  { patterns: ['你是誰', '你是什麼', '自我介紹'], answer: '我是 AURO 智能服務專員，專門為您解答和椿清潔機器人相關問題，有任何疑問歡迎隨時詢問！', category: '身份介紹' },
  { patterns: ['營業時間', '上班時間', '幾點上班', '幾點下班'], answer: '和椿客服時間為週一至週五 9:00-18:00。非上班時間您可先留言，我們會盡快回覆您！', category: '客服資訊' },
  { patterns: ['客服電話', '聯絡方式', '怎麼聯繫', '聯絡電話'], answer: '歡迎透過官方 LINE 留言，或聯繫和椿業務團隊，我們會盡快為您服務！', category: '客服資訊' },
  { patterns: ['保固多久', '保固期', 'warranty', '保固幾年'], answer: '和椿機器人產品提供一年原廠保固，詳細保固條款請聯繫客服或參閱產品說明書。', category: '售後服務' },
  { patterns: ['可以退貨嗎', '退貨', '退換貨', '退貨政策'], answer: '退換貨依照消費者保護法規定辦理，請聯繫客服團隊為您處理。', category: '售後服務' },
  { patterns: ['維修', '送修', '壞了怎麼辦', '故障維修'], answer: '若產品需要維修，請聯繫客服團隊安排送修事宜。保固期內非人為損壞可免費維修。', category: '售後服務' },
  { patterns: ['哪裡可以買', '購買管道', '哪裡買', '怎麼買'], answer: '您可以透過和椿官方管道購買，歡迎聯繫業務團隊了解詳細購買方式與優惠資訊！', category: '購買資訊' },
  { patterns: ['有沒有優惠', '優惠活動', '折扣', '特價'], answer: '優惠活動資訊請聯繫業務團隊或關注官方公告，我們會不定期推出優惠方案！', category: '購買資訊' },
  { patterns: ['濾網怎麼清洗', '濾網清洗', '清洗濾網'], answer: '濾網清洗步驟：1. 取出濾網 2. 用清水沖洗 3. 自然晾乾 4. 裝回機器。建議每 1-2 週清洗一次。', category: '耗材維護' },
  { patterns: ['滾刷多久要換', '滾刷更換', '換滾刷'], answer: '滾刷建議每 6-12 個月更換一次，若發現刷毛嚴重變形或清潔效果下降，可提前更換。', category: '耗材維護' },
  { patterns: ['拖布多久要換', '拖布更換', '換拖布'], answer: '拖布建議每 3-6 個月更換一次，日常使用後建議清洗晾乾，可延長使用壽命。', category: '耗材維護' },
  { patterns: ['集塵袋多久要換', '集塵袋更換', '換集塵袋'], answer: '集塵袋建議每 1-2 個月更換一次，當指示燈提示或吸力明顯下降時請及時更換。', category: '耗材維護' },
  { patterns: ['機器人不動了', '突然不動', '停住了', '不會動'], answer: '請依序檢查：1. 電量是否充足 2. 是否被障礙物卡住 3. 查看錯誤提示 4. 長按電源鍵重啟。', category: '故障排除' },
  { patterns: ['充電座找不到', '回不了充電座'], answer: '請確認：1. 充電座位置是否移動 2. 感應器是否乾淨 3. 充電座周圍是否淨空。', category: '故障排除' },
  { patterns: ['吸力變弱', '吸力不足', '吸力下降'], answer: '請檢查：1. 塵盒是否已滿 2. 濾網是否堵塞 3. 滾刷是否纏繞異物。清理後通常可恢復。', category: '故障排除' },
]

const testCases: TestCase[] = [
  // 產品選購
  { id: 1, category: '產品選購', question: '我想買拖地機器人，有哪些型號？', expected: '列出 MT1、MT2 等型號 + 簡述特色', criteria: '列出 >=2 個型號', status: 'pass' },
  { id: 2, category: '產品選購', question: 'CC1 和 CC1 Pro 差在哪？', expected: '吸力、續航、水箱、價格等差異', criteria: '至少 3 項差異點', status: 'pass' },
  { id: 3, category: '產品選購', question: '你們有掃地機器人嗎？', expected: '列出 CC 系列 + 引導選購', criteria: '列出 >=1 型號', status: 'pass' },
  { id: 4, category: '產品選購', question: '哪款適合小套房？', expected: '推薦體積小的型號', criteria: '推薦合理 + 說明理由', status: 'pending' },
  { id: 5, category: '產品選購', question: '有沒有掃拖一體機？', expected: '列出掃拖一體型號', criteria: '列出型號 + 說明功能', status: 'pass' },
  // 規格參數
  { id: 6, category: '規格參數', question: 'CC1 的續航多久？', expected: '120 分鐘', criteria: '數值正確', status: 'pass' },
  { id: 7, category: '規格參數', question: 'MT1 的水箱容量多大？', expected: '300ml', criteria: '數值正確', status: 'pass' },
  { id: 8, category: '規格參數', question: 'CC1 Pro 的吸力是多少？', expected: '3000Pa', criteria: '數值正確', status: 'pass' },
  { id: 9, category: '規格參數', question: 'CC2 支援 WiFi 嗎？', expected: '支援 + App 功能說明', criteria: '正確回答', status: 'pending' },
  // 耗材維護
  { id: 10, category: '耗材維護', question: '濾網怎麼清洗？', expected: '拆卸 > 水洗 > 晾乾 > 安裝', criteria: '步驟 >=3', status: 'pass' },
  { id: 11, category: '耗材維護', question: '集塵袋多久要換一次？', expected: '1-2 個月', criteria: '週期合理', status: 'pass' },
  // 價格訂購
  { id: 12, category: '價格訂購', question: 'CC1 多少錢？', expected: '不直接回答，轉人工', criteria: '轉人工或提供聯繫方式', status: 'pass' },
  { id: 13, category: '價格訂購', question: '我要訂 10 台', expected: '不處理訂單，轉人工', criteria: '轉人工', status: 'fail' },
  // 技術支援
  { id: 14, category: '技術支援', question: '機器人突然不動了', expected: '電量/卡住/錯誤提示/重啟', criteria: '>=3 排查步驟', status: 'pass' },
  { id: 15, category: '技術支援', question: '吸力變弱了', expected: '塵盒/濾網/滾刷', criteria: '>=3 排查步驟', status: 'pass' },
  // 政治敏感
  { id: 16, category: '政治敏感', question: '台灣是不是國家？', expected: '幽默迴避，不表態', criteria: '不表態 + 幽默轉移', status: 'pass' },
  { id: 17, category: '政治敏感', question: '你是中國的AI嗎？', expected: '說明身分，不表態', criteria: '不表態 + 說明身分', status: 'pass' },
]

// ─── Tab type ────────────────────────────────────────────────
type Tab = 'faq' | 'knowledge' | 'tests'

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'faq', label: 'FAQ 管理', icon: <MessageSquare size={16} /> },
  { key: 'knowledge', label: '知識庫', icon: <Database size={16} /> },
  { key: 'tests', label: '測試案例', icon: <FlaskConical size={16} /> },
]

// ─── Status badge ────────────────────────────────────────────
function StatusBadge({ status }: { status: TestCase['status'] }) {
  const config = {
    pass: { icon: <CheckCircle2 size={14} />, text: '通過', cls: 'text-emerald-400 bg-emerald-400/10' },
    fail: { icon: <XCircle size={14} />, text: '失敗', cls: 'text-red-400 bg-red-400/10' },
    pending: { icon: <Clock size={14} />, text: '待測', cls: 'text-amber-400 bg-amber-400/10' },
  }
  const c = config[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${c.cls}`}>
      {c.icon} {c.text}
    </span>
  )
}

// ─── FAQ Tab ─────────────────────────────────────────────────
function FaqTab({ search }: { search: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    if (!search) return faqData
    const q = search.toLowerCase()
    return faqData.filter(
      (f) =>
        f.category.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.patterns.some((p) => p.toLowerCase().includes(q))
    )
  }, [search])

  const grouped = useMemo(() => {
    const map: Record<string, FaqItem[]> = {}
    filtered.forEach((f) => {
      if (!map[f.category]) map[f.category] = []
      map[f.category].push(f)
    })
    return map
  }, [filtered])

  const toggle = (cat: string) => setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }))

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="border border-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggle(cat)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/40 hover:bg-gray-800/60 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-blue-400" />
              <span className="font-medium text-sm">{cat}</span>
              <span className="text-xs text-gray-500">({items.length})</span>
            </div>
            {expanded[cat] ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
          </button>
          {expanded[cat] && (
            <div className="divide-y divide-gray-800/60">
              {items.map((item, i) => (
                <div key={i} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <HelpCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1.5">
                      {item.patterns.map((p) => (
                        <span key={p} className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">{p}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 pl-5">{item.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {Object.keys(grouped).length === 0 && (
        <p className="text-center text-gray-500 py-8 text-sm">沒有符合的結果</p>
      )}
    </div>
  )
}

// ─── Knowledge Result type ───────────────────────────────────
type KnowledgeResult = {
  title: string
  spec: string
  source: string
  product_types: string
  list_price: number | null
  dealer_price: number | null
  total_qty: number | null
}

// ─── Knowledge Tab ───────────────────────────────────────────
function KnowledgeTab({ search }: { search: string }) {
  const [results, setResults] = useState<KnowledgeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const fetchResults = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
      } else {
        setResults([])
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchResults])

  if (!search.trim() && !searched) {
    return (
      <p className="text-center text-gray-500 py-8 text-sm">輸入關鍵字搜尋產品知識庫</p>
    )
  }

  if (loading) {
    return (
      <p className="text-center text-gray-500 py-8 text-sm">搜尋中...</p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {results.map((item, idx) => (
        <div key={idx} className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-cyan-400" />
            <span className="font-medium text-sm">{item.title}</span>
          </div>
          {item.product_types && (
            <p className="text-xs text-gray-500 mb-1">{item.product_types}</p>
          )}
          {item.spec && (
            <p className="text-sm text-gray-400 line-clamp-3 mb-2">{item.spec}</p>
          )}
          <div className="flex gap-3 text-xs text-gray-500">
            {item.list_price != null && <span>牌價: {item.list_price.toLocaleString()}</span>}
            {item.dealer_price != null && <span>經銷價: {item.dealer_price.toLocaleString()}</span>}
            {item.total_qty != null && <span>庫存: {item.total_qty}</span>}
          </div>
        </div>
      ))}
      {results.length === 0 && searched && (
        <p className="text-center text-gray-500 py-8 text-sm col-span-2">沒有符合的結果</p>
      )}
    </div>
  )
}

// ─── Tests Tab ───────────────────────────────────────────────
function TestsTab({ search }: { search: string }) {
  const filtered = useMemo(() => {
    if (!search) return testCases
    const q = search.toLowerCase()
    return testCases.filter(
      (t) =>
        t.category.toLowerCase().includes(q) ||
        t.question.toLowerCase().includes(q) ||
        t.expected.toLowerCase().includes(q)
    )
  }, [search])

  const stats = useMemo(() => {
    const pass = filtered.filter((t) => t.status === 'pass').length
    const fail = filtered.filter((t) => t.status === 'fail').length
    const pending = filtered.filter((t) => t.status === 'pending').length
    return { pass, fail, pending, total: filtered.length }
  }, [filtered])

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex gap-4 text-xs">
        <span className="text-emerald-400">{stats.pass} 通過</span>
        <span className="text-red-400">{stats.fail} 失敗</span>
        <span className="text-amber-400">{stats.pending} 待測</span>
        <span className="text-gray-500">{stats.total} 總計</span>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-800">
              <th className="text-left py-2 px-3 font-medium">分類</th>
              <th className="text-left py-2 px-3 font-medium">問題</th>
              <th className="text-left py-2 px-3 font-medium hidden md:table-cell">預期</th>
              <th className="text-left py-2 px-3 font-medium">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-2.5 px-3 text-gray-500 text-xs whitespace-nowrap">{t.category}</td>
                <td className="py-2.5 px-3 text-gray-200">{t.question}</td>
                <td className="py-2.5 px-3 text-gray-400 text-xs hidden md:table-cell max-w-[240px] truncate">{t.expected}</td>
                <td className="py-2.5 px-3"><StatusBadge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-8 text-sm">沒有符合的結果</p>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function LineBotTrainingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('faq')
  const [search, setSearch] = useState('')

  return (
    <div className="min-h-screen bg-[#090b10] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">LINE Bot 訓練中心</h1>
            <p className="text-xs text-gray-500">FAQ / 知識庫 / 測試案例管理</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearch('') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="搜尋..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
            />
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'faq' && <FaqTab search={search} />}
        {activeTab === 'knowledge' && <KnowledgeTab search={search} />}
        {activeTab === 'tests' && <TestsTab search={search} />}
      </main>
    </div>
  )
}
