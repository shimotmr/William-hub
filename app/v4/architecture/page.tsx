'use client'

import { Cpu, GitBranch, Layers, Workflow, Zap, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function V4ArchitecturePage() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/v4" className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回 V4 系統中心
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">V4 系統架構圖</h1>
        <p className="text-foreground-muted mb-8">Travis V4 核心系統架構</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 系統架構圖 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">核心架構</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-blue-500">
                <h3 className="font-medium">Travis (Main Agent)</h3>
                <p className="text-sm text-foreground-muted">任務調度、Heartbeat、記憶管理</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-purple-500">
                <h3 className="font-medium">Skill Library</h3>
                <p className="text-sm text-foreground-muted">Agent Skills 集合：Blake, Rex, Griffin...</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-green-500">
                <h3 className="font-medium">Dispatch System</h3>
                <p className="text-sm text-foreground-muted">動態 prompt 生成、任務派發</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-yellow-500">
                <h3 className="font-medium">HEARTBEAT</h3>
                <p className="text-sm text-foreground-muted">系統監控、健康檢查</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-pink-500">
                <h3 className="font-medium">Search (qmd + Tavily)</h3>
                <p className="text-sm text-foreground-muted">語義搜尋 + 網路搜尋</p>
              </div>
            </div>
          </div>

          {/* 資料流 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Workflow className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">資料流</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400">1</span>
                </div>
                <div>
                  <h3 className="font-medium">User → Travis</h3>
                  <p className="text-sm text-foreground-muted">接收任務請求</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400">2</span>
                </div>
                <div>
                  <h3 className="font-medium">Travis → Skill Library</h3>
                  <p className="text-sm text-foreground-muted">選擇合適的 Agent Skill</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400">3</span>
                </div>
                <div>
                  <h3 className="font-medium">Skill → dispatch_prompt</h3>
                  <p className="text-sm text-foreground-muted">動態生成任務 prompt</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-yellow-400">4</span>
                </div>
                <div>
                  <h3 className="font-medium">Agent Execution</h3>
                  <p className="text-sm text-foreground-muted">執行任務並記錄結果</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <span className="text-pink-400">5</span>
                </div>
                <div>
                  <h3 className="font-medium">HEARTBEAT</h3>
                  <p className="text-sm text-foreground-muted">監控、異常處理、回報</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
