'use client'

import { ArrowLeft, Workflow } from 'lucide-react'
import Link from 'next/link'

export default function V42Page() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/v4" className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回 V4 系統中心
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">V4.2 架構圖</h1>
        <p className="text-foreground-muted mb-8">Pipeline 自動化系統</p>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Workflow className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-semibold">Pipeline 系統</h2>
          </div>
          <p className="text-foreground-muted">V4.2 Pipeline 功能待補充...</p>
        </div>
      </div>
    </main>
  )
}
