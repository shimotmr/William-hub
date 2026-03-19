'use client'

import { ArrowLeft, Zap, Cpu, Layers, Workflow, Clock, Search, Brain } from 'lucide-react'
import Link from 'next/link'

export default function V43Page() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/v4" className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回 V4 系統中心
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">V4.3 架構圖</h1>
        <p className="text-foreground-muted mb-8">最新升級功能</p>

        {/* V4.3 任務狀態 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-4">
            <div className="text-2xl font-bold text-emerald-400">7/7</div>
            <div className="text-sm text-foreground-muted">已完成任務</div>
          </div>
          <div className="rounded-lg bg-blue-500/20 border border-blue-500/30 p-4">
            <div className="text-2xl font-bold text-blue-400">8</div>
            <div className="text-sm text-foreground-muted">總任務數</div>
          </div>
          <div className="rounded-lg bg-purple-500/20 border border-purple-500/30 p-4">
            <div className="text-2xl font-bold text-purple-400">2</div>
            <div className="text-sm text-foreground-muted">新 Skills</div>
          </div>
          <div className="rounded-lg bg-yellow-500/20 border border-yellow-500/30 p-4">
            <div className="text-2xl font-bold text-yellow-400">3</div>
            <div className="text-sm text-foreground-muted">系統升級</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* V4.3 新功能 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl font-semibold">V4.3 新功能</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-blue-500">
                <h3 className="font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Skill 版本管理
                </h3>
                <p className="text-sm text-foreground-muted">建立 Skill 版本管理框架</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-purple-500">
                <h3 className="font-medium flex items-center gap-2">
                  <Workflow className="w-4 h-4" />
                  dispatch_prompt 動態化
                </h3>
                <p className="text-sm text-foreground-muted">根據任務類型動態選擇 prompt 模板</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-green-500">
                <h3 className="font-medium flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Griffin 雙流架構
                </h3>
                <p className="text-sm text-foreground-muted">手動審計 + 即時監控雙流</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-yellow-500">
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  cron 排程整合
                </h3>
                <p className="text-sm text-foreground-muted">自動化排程任務管理</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-pink-500">
                <h3 className="font-medium flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  agent-memory 整合
                </h3>
                <p className="text-sm text-foreground-muted">HEARTBEAT 記憶上下文載入</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-4 border-l-4 border-orange-500">
                <h3 className="font-medium flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Tavily API 搜尋
                </h3>
                <p className="text-sm text-foreground-muted">網路搜尋備援能力</p>
              </div>
            </div>
          </div>

          {/* V4.3 產出 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">V4.3 產出</h2>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="bg-background-elevated rounded-lg p-3">
                <code className="text-pink-400">~/clawd/scripts/skill_version_check.sh</code>
                <p className="text-foreground-muted text-xs">Skill 版本檢查</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-3">
                <code className="text-pink-400">~/clawd/scripts/dispatch_prompt_evolution.py</code>
                <p className="text-foreground-muted text-xs">動態 prompt 生成</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-3">
                <code className="text-pink-400">~/clawd/scripts/heartbeat_agent_memory.py</code>
                <p className="text-foreground-muted text-xs">HEARTBEAT 記憶整合</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-3">
                <code className="text-pink-400">~/clawd/projects/v43-dashboard/</code>
                <p className="text-foreground-muted text-xs">V4.3 Dashboard 前端</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
