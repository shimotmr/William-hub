'use client';

import { useState, useEffect } from 'react';

interface Alert {
  id: string;
  alert_type: string;
  priority: string;
  title: string;
  message: string;
  source_service: string;
  related_task_id: number;
  metadata: Record<string, any>;
  push_channels: string[];
  is_sent: boolean;
  sent_at: string;
  created_at: string;
}

interface AlertStats {
  total: number;
  unreadCount: number;
  byPriority: Record<string, number>;
}

const priorityConfig = {
  P0: { label: 'S級警示', color: 'bg-red-600', text: 'text-red-600', emoji: '🚨' },
  P1: { label: '重要', color: 'bg-orange-500', text: 'text-orange-500', emoji: '⚠️' },
  P2: { label: '待辦', color: 'bg-yellow-500', text: 'text-yellow-600', emoji: '💡' },
  P3: { label: '資訊', color: 'bg-green-500', text: 'text-green-600', emoji: 'ℹ️' }
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats>({ total: 0, unreadCount: 0, byPriority: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('priority', filter);
      params.set('limit', '50');
      
      const response = await fetch(`/api/alerts?${params}`);
      const data = await response.json();
      setAlerts(data.alerts || []);
      
      // 計算統計
      const byPriority: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
      (data.alerts || []).forEach((a: Alert) => {
        if (byPriority[a.priority] !== undefined) {
          byPriority[a.priority]++;
        }
      });
      setStats({
        total: data.total || 0,
        unreadCount: data.unreadCount || 0,
        byPriority
      });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await fetch('/api/alerts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_sent: true })
    });
    fetchAlerts();
  };

  const getPriorityStyle = (priority: string) => {
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.P3;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              🔔 警示中心
              {stats.unreadCount > 0 && (
                <span className="bg-red-600 text-white text-sm px-3 py-1 rounded-full">
                  {stats.unreadCount} 未讀
                </span>
              )}
            </h1>
            <p className="text-gray-400 mt-1">警示分級推播系統 - 掌握系統重要事件</p>
          </div>
          
          {/* 優先級篩選 */}
          <div className="flex gap-2">
            {['all', 'P0', 'P1', 'P2', 'P3'].map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {p === 'all' ? '全部' : `${priorityConfig[p as keyof typeof priorityConfig]?.emoji || ''} ${p}`}
              </button>
            ))}
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Object.entries(priorityConfig).map(([priority, config]) => (
            <div
              key={priority}
              className={`bg-gray-800 rounded-xl p-4 border-l-4 ${
                priority === 'P0' ? 'border-red-500' :
                priority === 'P1' ? 'border-orange-500' :
                priority === 'P2' ? 'border-yellow-500' :
                'border-green-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">{config.label}</span>
                <span className={`text-2xl font-bold ${config.text}`}>
                  {stats.byPriority[priority] || 0}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 警示列表 */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">載入中...</div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">尚無警示記錄</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {alerts.map((alert) => {
                const style = getPriorityStyle(alert.priority);
                return (
                  <div
                    key={alert.id}
                    className={`p-4 hover:bg-gray-750 transition-colors ${
                      !alert.is_sent ? 'bg-gray-800/50' : ''
                    }`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">{style.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.color} text-white`}>
                            {alert.priority}
                          </span>
                          <span className="font-medium truncate">{alert.title}</span>
                          {!alert.is_sent && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{alert.source_service || alert.alert_type}</span>
                          <span>•</span>
                          <span>{new Date(alert.created_at).toLocaleString('zh-TW')}</span>
                          <span>•</span>
                          <span className="flex gap-1">
                            {alert.push_channels?.map((ch) => (
                              <span key={ch} className="px-1.5 py-0.5 bg-gray-700 rounded">
                                {ch === 'telegram' ? '📱' : ch === 'line' ? '💬' : ch === 'pwa_badge' ? '🔔' : '📝'}
                              </span>
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
