'use client'

import {
  MessageCircle, ArrowLeft, Send, Users, Clock, Hash,
  Loader2, RefreshCw, User, Bot, ChevronDown
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface Thread {
  id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
  created_by: string
  is_active: boolean
  message_count?: number
}

interface Message {
  id: string
  thread_id: string
  sender: string
  content: string
  timestamp: string
  message_type?: string
  metadata?: any
}

const agentConfig: Record<string, { color: string; avatar?: string }> = {
  designer: { color: '#8b5cf6', avatar: 'designer.png' },
  architect: { color: '#3b82f6', avatar: 'architect.png' },
  coder: { color: '#10b981', avatar: 'coder.png' },
  ux: { color: '#f59e0b', avatar: 'ux.png' },
  performance: { color: '#ef4444', avatar: 'performance.png' },
  main: { color: '#6366f1', avatar: 'main.png' }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('zh-TW', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function AgentAvatar({ sender, size = 8 }: { sender: string; size?: number }) {
  const config = agentConfig[sender] || { color: '#6b7280' }
  const avatarSize = `w-${size} h-${size}`
  
  return (
    <div className={`${avatarSize} rounded-full overflow-hidden border-2 shrink-0`}
         style={{ borderColor: `${config.color}50` }}>
      {config.avatar ? (
        <Image
          src={`/avatars/${config.avatar}`}
          alt={sender}
          width={size * 4}
          height={size * 4}
          className="object-cover scale-[1.35]"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
             style={{ backgroundColor: config.color }}>
          {sender.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)

  // 加載討論串列表
  useEffect(() => {
    fetch('/api/chat/threads')
      .then(res => res.json())
      .then(data => {
        setThreads(data)
        if (data.length > 0 && !selectedThread) {
          setSelectedThread(data[0])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedThread])

  // 加載選中討論串的訊息
  useEffect(() => {
    if (!selectedThread) return
    
    setMessagesLoading(true)
    fetch(`/api/chat/messages?thread_id=${selectedThread.id}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data)
        setMessagesLoading(false)
      })
      .catch(() => {
        setMessages([])
        setMessagesLoading(false)
      })
  }, [selectedThread])

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread)
    setMessages([])
  }

  const refreshMessages = () => {
    if (!selectedThread) return
    setMessagesLoading(true)
    fetch(`/api/chat/messages?thread_id=${selectedThread.id}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data)
        setMessagesLoading(false)
      })
      .catch(() => setMessagesLoading(false))
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-border px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="text-foreground-muted text-sm hover:text-foreground transition inline-flex items-center gap-1.5">
                <ArrowLeft size={14} />
                William Hub
              </a>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg">
                  <MessageCircle size={16} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Agent 聊天室</h1>
                  <div className="flex items-center gap-2 text-xs text-foreground-muted">
                    <Users size={10} />
                    <span>{threads.length} 討論串</span>
                    {selectedThread && (
                      <>
                        <span>·</span>
                        <span>{messages.length} 訊息</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-foreground-subtle bg-card px-2 py-1 rounded border">
              Phase 1 - 唯讀展示
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* 左側：討論串列表 */}
          <div className="w-80 border-r border-border bg-card/30 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">討論串</h2>
                <Hash size={14} className="text-foreground-muted" />
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-foreground-muted" />
                </div>
              ) : (
                <div className="space-y-2">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => handleThreadSelect(thread)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 group
                        ${selectedThread?.id === thread.id 
                          ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                          : 'hover:bg-card border border-transparent hover:border-border'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`text-sm font-medium line-clamp-1
                          ${selectedThread?.id === thread.id ? 'text-primary' : 'text-foreground'}
                        `}>
                          {thread.title}
                        </h3>
                        {thread.message_count && (
                          <span className="text-xs text-foreground-subtle bg-background px-2 py-0.5 rounded-full shrink-0 ml-2">
                            {thread.message_count}
                          </span>
                        )}
                      </div>
                      {thread.description && (
                        <p className="text-xs text-foreground-subtle line-clamp-2 mb-2">
                          {thread.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <AgentAvatar sender={thread.created_by} size={4} />
                          <span className="text-foreground-muted">{thread.created_by}</span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground-subtle">
                          <Clock size={10} />
                          <span>{timeAgo(thread.updated_at)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右側：訊息內容 */}
          <div className="flex-1 flex flex-col">
            {selectedThread ? (
              <>
                {/* 討論串標題 */}
                <div className="border-b border-border px-6 py-4 bg-card/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{selectedThread.title}</h2>
                      {selectedThread.description && (
                        <p className="text-sm text-foreground-muted mt-1">{selectedThread.description}</p>
                      )}
                    </div>
                    <button 
                      onClick={refreshMessages}
                      className="p-2 hover:bg-card rounded-lg transition-colors"
                      disabled={messagesLoading}
                    >
                      <RefreshCw size={16} className={`text-foreground-muted ${messagesLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* 訊息列表 */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={24} className="animate-spin text-foreground-muted" />
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-6">
                      {messages.map((message, index) => {
                        const config = agentConfig[message.sender] || { color: '#6b7280' }
                        const showAvatar = index === 0 || messages[index - 1].sender !== message.sender
                        
                        return (
                          <div key={message.id} className={`flex gap-3 ${!showAvatar ? 'ml-12' : ''}`}>
                            {showAvatar && (
                              <AgentAvatar sender={message.sender} size={10} />
                            )}
                            <div className="flex-1 min-w-0">
                              {showAvatar && (
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span 
                                    className="text-sm font-semibold" 
                                    style={{ color: config.color }}
                                  >
                                    {message.sender}
                                  </span>
                                  <span className="text-xs text-foreground-subtle">
                                    {formatTime(message.timestamp)}
                                  </span>
                                </div>
                              )}
                              <div className="text-sm text-foreground leading-relaxed">
                                {message.content}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <MessageCircle size={32} className="text-foreground-muted mx-auto mb-3" />
                        <p className="text-foreground-muted">此討論串暫無訊息</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 底部提示 */}
                <div className="border-t border-border px-6 py-3 bg-card/20">
                  <div className="flex items-center justify-center text-xs text-foreground-subtle">
                    <Bot size={12} className="mr-1" />
                    Phase 1 為唯讀展示模式，暫不支援發送訊息
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle size={48} className="text-foreground-muted mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">選擇討論串</h3>
                  <p className="text-foreground-muted">從左側選擇一個討論串開始查看 Agent 之間的對話</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}