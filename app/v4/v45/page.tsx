'use client'

import { useState } from 'react'

export default function V45Page() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: '總覽', icon: '📊' },
    { id: 'layers', label: '四層架構', icon: '🔗' },
    { id: 'compare', label: 'V4 vs V4.5', icon: '🔄' },
    { id: 'scripts', label: '腳本映射', icon: '📜' },
    { id: 'flow', label: '完整流程', icon: '📊' },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-purple-400">V4.5</span> 工作流進化
          </h1>
          <p className="text-foreground-muted">
            三層分離 + 連續推進：討論一件事不需要當下就執行，但討論的過程會被自動記住、分解，最後才執行。
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : 'bg-card text-foreground-muted hover:bg-foreground/5'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* 亮點卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <h3 className="font-semibold text-purple-400 mb-2">🔗 統一入口</h3>
                <p className="text-sm text-foreground-muted">不管 William 從哪裡輸入，最後都會進入統一的「任務堆疊」，不會忘記。</p>
              </div>
              <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/20">
                <h3 className="font-semibold text-teal-400 mb-2">🤖 智能分解</h3>
                <p className="text-sm text-foreground-muted">複雜任務自動拆解，選擇最適合的模型與工具組合執行。</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h3 className="font-semibold text-blue-400 mb-2">⚡ 並行處理</h3>
                <p className="text-sm text-foreground-muted">多個獨立子任務同時執行，最後自動彙整結果（gstack 概念）。</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <h3 className="font-semibold text-green-400 mb-2">🧠 自我進化</h3>
                <p className="text-sm text-foreground-muted">失敗經驗自動記住，dispatch_prompt 持續優化。</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-4">
            {/* L1 */}
            <div className="p-4 rounded-lg bg-purple-500/10 border-l-4 border-purple-500">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-purple-400">L1 討論層 (Think) - 輸入統一</h3>
              </div>
              <p className="text-sm text-foreground-muted mb-3">William 任何討論、點子、指令 → 自動存入任務堆疊</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-background p-2 rounded">💬 對話輸入</div>
                <div className="bg-background p-2 rounded">⏰ Cron 排程</div>
                <div className="bg-background p-2 rounded">💡 Ideas/參考</div>
              </div>
            </div>

            {/* L2 */}
            <div className="p-4 rounded-lg bg-teal-500/10 border-l-4 border-teal-500">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-teal-400">L2 任務形成層 (Form) - 智能分解</h3>
              </div>
              <p className="text-sm text-foreground-muted mb-3">自動分析複雜度 → 拆成子任務 → 選擇最佳模型與工具</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-background p-2 rounded">📋 複雜度分析</div>
                <div className="bg-background p-2 rounded">🤖 模型選擇</div>
                <div className="bg-background p-2 rounded">⚡ 工具調度</div>
              </div>
            </div>

            {/* L3 */}
            <div className="p-4 rounded-lg bg-blue-500/10 border-l-4 border-blue-500">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-blue-400">L3 執行調度層 (Execute) - 統一派發</h3>
              </div>
              <p className="text-sm text-foreground-muted mb-3">自動派給最適 Agent → 並行/串行 → 結果彙整</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-background p-2 rounded">🎯 派發策略</div>
                <div className="bg-background p-2 rounded">🔀 並行執行</div>
                <div className="bg-background p-2 rounded">📦 結果彙整</div>
              </div>
            </div>

            {/* L4 */}
            <div className="p-4 rounded-lg bg-green-500/10 border-l-4 border-green-500">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-green-400">L4 反饋優化層 (Feedback) - 自我進化</h3>
              </div>
              <p className="text-sm text-foreground-muted mb-3">失敗重試 → 經驗記憶 → dispatch_prompt 優化</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-background p-2 rounded">🔄 失敗重試</div>
                <div className="bg-background p-2 rounded">🧠 經驗記憶</div>
                <div className="bg-background p-2 rounded">📈 Prompt 優化</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-card border">
              <h3 className="font-semibold mb-3 text-foreground-muted">V4 現有流程</h3>
              <pre className="text-xs text-foreground-muted whitespace-pre-wrap">
{`William 討論
    │
    ├─→ 直接執行（小任務）
    │
    └─→ 討論筆記
              │
              └─→ 手動 create_task.sh
                         │
                         └─→ 派發選擇（難）
                                    │
                                    ├─→ auto_dispatch
                                    ├─→ sessions_spawn
                                    └─→ 忘記→擱置`}
              </pre>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <h3 className="font-semibold mb-3 text-teal-400">V4.5 進化流程</h3>
              <pre className="text-xs whitespace-pre-wrap">
{`William 任何輸入
    │
    └─→ 統一入口 → 任務堆疊
              │
              ↓ 自動萃取
    任務形成層（智能分解）
              │
              ↓ William確認
    執行調度層（派誰+模型）
              │
              ↓ 完成
    反饋優化層（經驗記憶）`}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card">
                  <th className="p-3 text-left">現有腳本</th>
                  <th className="p-3 text-left">歸屬</th>
                  <th className="p-3 text-left">功能</th>
                  <th className="p-3 text-left">狀態</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="p-3">save_idea_to_notion.py</td>
                  <td className="p-3"><span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs">L1</span></td>
                  <td className="p-3">討論存入 Notion</td>
                  <td className="p-3 text-green-400">✅ 現有</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3">create_task.sh</td>
                  <td className="p-3"><span className="px-2 py-1 rounded bg-teal-500/20 text-teal-400 text-xs">L2</span></td>
                  <td className="p-3">建立任務卡</td>
                  <td className="p-3 text-green-400">✅ 現有</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3">auto_dispatch.sh</td>
                  <td className="p-3"><span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">L3</span></td>
                  <td className="p-3">智能派發</td>
                  <td className="p-3 text-yellow-400">⚡ 需整合</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3">heartbeat_*.sh</td>
                  <td className="p-3"><span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">L4</span></td>
                  <td className="p-3">監控與修復</td>
                  <td className="p-3 text-green-400">✅ 現有</td>
                </tr>
                <tr className="border-t border-border bg-purple-500/10">
                  <td className="p-3 font-bold">task_stack_manager.py</td>
                  <td className="p-3"><span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs">NEW</span></td>
                  <td className="p-3">堆疊統一管理</td>
                  <td className="p-3 text-orange-400">⏳ 待開發</td>
                </tr>
                <tr className="border-t border-border bg-teal-500/10">
                  <td className="p-3 font-bold">task_decomposer.py</td>
                  <td className="p-3"><span className="px-2 py-1 rounded bg-teal-500/20 text-teal-400 text-xs">NEW</span></td>
                  <td className="p-3">智能任務分解</td>
                  <td className="p-3 text-orange-400">⏳ 待開發</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'flow' && (
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-4">完整決策流程圖</h3>
            <pre className="text-xs text-foreground-muted whitespace-pre-wrap">{`William 任何輸入
    │
    ├─→ 對話 → 統一入口
    ├─→ Cron → 統一入口
    └─→ Ideas → 統一入口
              │
              ↓
    任務堆疊 (L2 任務形成)
              │
              ├─→ 簡單 → 直接派發
              └─→ 複雜 → 智能分解 → 拆分子任務 → 模型選擇 → 工具調度
                                   │
                                   ↓
    L3 執行調度
              │
              ├─→ 串行 → 依序執行
              └─→ 並行 → 同時執行
                          │
                          ↓
    結果彙整 → L4 反饋優化
              │
              ├─→ 成功 → 存入經驗
              └─→ 失敗 → 分析原因 → 可重試?`}
            </pre>
          </div>
        )}
      </div>
    </main>
  )
}
