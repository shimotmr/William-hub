'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Company {
  id: number
  name: string
}

interface Conversation {
  external_userid: string
  open_kfid: string
  display_name: string
  company_id: number | null
  company_name: string
  last_send_time: number | null
  msg_count: number
}

interface Message {
  id: number
  msg_id: string
  external_userid: string
  open_kfid: string
  msg_type: string
  sender_name: string
  content: string
  send_time: number
  source_event: string
  parent_msg_id: string
  created_at: string
}

interface Note {
  id: number
  external_userid: string
  note: string
  created_at: string
}

export default function WeComPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedExternal, setSelectedExternal] = useState('')
  const [timeline, setTimeline] = useState<Message[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [q, setQ] = useState('')
  const [msgType, setMsgType] = useState('')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  
  // Form states
  const [assignName, setAssignName] = useState('')
  const [supplement, setSupplement] = useState('')
  const [note, setNote] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (selectedExternal) params.set('external_userid', selectedExternal)
      if (msgType) params.set('msg_type', msgType)
      
      const res = await fetch(`/api/wecom/bootstrap?${params}`)
      const data = await res.json()
      
      setCompanies(data.companies || [])
      setConversations(data.conversations || [])
      setTimeline(data.timeline || [])
      setNotes(data.notes || [])
      
      if (data.selected_external_userid && !selectedExternal) {
        setSelectedExternal(data.selected_external_userid)
      }
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await fetch('/api/wecom/import-log', { method: 'POST' })
      const data = await res.json()
      alert(`匯入完成: imported=${data.imported}, merged_split=${data.merged_split}`)
      loadData()
    } catch (err) {
      console.error('Import error:', err)
    }
    setImporting(false)
  }

  const handleAssign = async () => {
    if (!selectedExternal || !assignName) return
    try {
      await fetch(`/api/wecom/conversations/${encodeURIComponent(selectedExternal)}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: assignName })
      })
      setAssignName('')
      loadData()
    } catch (err) {
      console.error('Assign error:', err)
    }
  }

  const handleSupplement = async () => {
    if (!selectedExternal || !supplement) return
    try {
      await fetch(`/api/wecom/conversations/${encodeURIComponent(selectedExternal)}/supplement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: supplement })
      })
      setSupplement('')
      loadData()
    } catch (err) {
      console.error('Supplement error:', err)
    }
  }

  const handleNote = async () => {
    if (!selectedExternal || !note) return
    try {
      await fetch(`/api/wecom/conversations/${encodeURIComponent(selectedExternal)}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      })
      setNote('')
      loadData()
    } catch (err) {
      console.error('Note error:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [q, msgType])

  const formatTime = (ts: number) => {
    if (!ts) return ''
    return new Date(ts * 1000).toLocaleString('zh-TW')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            WeCom 客服歸類系統
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {importing ? '匯入中...' : '匯入 wecom_inbox.log'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 flex gap-4">
          <input
            type="text"
            placeholder="搜尋對話..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
          <select
            value={msgType}
            onChange={(e) => setMsgType(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="">所有類型</option>
            <option value="text">text</option>
            <option value="incoming/text">incoming/text</option>
            <option value="merged/text">merged/text</option>
            <option value="manual/supplement">manual/supplement</option>
          </select>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar - Companies & Conversations */}
          <div className="col-span-3 space-y-4">
            {/* Companies */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">公司</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {companies.map(c => (
                  <div key={c.id} className="text-sm text-gray-600 dark:text-gray-300">
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Conversations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">對話列表</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {conversations.map(c => (
                  <button
                    key={c.external_userid}
                    onClick={() => setSelectedExternal(c.external_userid)}
                    className={`w-full text-left p-2 rounded ${
                      selectedExternal === c.external_userid
                        ? 'bg-orange-100 dark:bg-orange-900'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {c.display_name || c.external_userid}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {c.company_name} · {c.msg_count}則
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Timeline */}
          <div className="col-span-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
              時間軸 {selectedExternal && `(${selectedExternal})`}
            </h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500">載入中...</div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {timeline.map(m => (
                  <div key={m.id} className="border-l-2 border-orange-300 pl-3">
                    <div className="text-xs text-gray-500">
                      {formatTime(m.send_time)} · {m.msg_type}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {m.sender_name && <span className="font-bold">{m.sender_name}: </span>}
                      {m.content}
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    選擇對話查看時間軸
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Actions & Notes */}
          <div className="col-span-3 space-y-4">
            {/* Assign Company */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">改派公司</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="公司名稱"
                  value={assignName}
                  onChange={(e) => setAssignName(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={handleAssign}
                  className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  儲存
                </button>
              </div>
            </div>

            {/* Add Supplement */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">補充訊息</h3>
              <textarea
                value={supplement}
                onChange={(e) => setSupplement(e.target.value)}
                placeholder="補充內容..."
                rows={3}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                onClick={handleSupplement}
                className="mt-2 w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                新增補充
              </button>
            </div>

            {/* Add Note */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">客服註記</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="註記內容..."
                rows={3}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                onClick={handleNote}
                className="mt-2 w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                新增註記
              </button>
            </div>

            {/* Notes List */}
            {notes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">既有註記</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {notes.map(n => (
                    <div key={n.id} className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="text-gray-600 dark:text-gray-300">{n.note}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString('zh-TW')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
