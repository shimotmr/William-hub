/**
 * Alert Notification Client
 * 警示分級推播客戶端
 * 
 * 使用方式:
 * import { alert } from '@/lib/alerts';
 * 
 * // 發送警示
 * await alert.info('task_completed', '任務完成', '任務 #123 已完成');
 * await alert.warning('system_warning', '系統警告', '磁碟空間不足');
 * await alert.critical('system_critical', '系統錯誤', '服務當機');
 */

// 優先級映射
const Priority = {
  P0: 'P0', // 緊急 - S級警示
  P1: 'P1', // 重要
  P2: 'P2', // 一般 - 待辦提示
  P3: 'P3'  // 資訊 - 靜默日誌
} as const;

// 便捷方法
export const alert = {
  /**
   * 發送 P0 緊急警示 - S級警示（強推送 + LINE）
   */
  critical: (eventType: string, title: string, message: string, options?: AlertOptions) => 
    sendAlert(eventType, title, message, { ...options, priority: 'P0' }),

  /**
   * 發送 P1 重要警示（推送到主聊天）
   */
  important: (eventType: string, title: string, message: string, options?: AlertOptions) =>
    sendAlert(eventType, title, message, { ...options, priority: 'P1' }),

  /**
   * 發送 P2 一般警示 - 待辦提示（PWA 徽章 + Telegram）
   */
  warning: (eventType: string, title: string, message: string, options?: AlertOptions) =>
    sendAlert(eventType, title, message, { ...options, priority: 'P2' }),

  /**
   * 發送 P3 資訊 - 靜默日誌（僅 audit_log）
   */
  info: (eventType: string, title: string, message: string, options?: AlertOptions) =>
    sendAlert(eventType, title, message, { ...options, priority: 'P3' }),

  /**
   * 通用發送方法
   */
  send: sendAlert,

  /**
   * 便捷方法：任務完成
   */
  taskCompleted: (taskId: number, taskTitle: string) =>
    sendAlert('task_completed', '任務完成', `任務 #${taskId} (${taskTitle}) 已完成`, {
      related_task_id: taskId,
      related_entity_type: 'board_task'
    }),

  /**
   * 便捷方法：任務失敗
   */
  taskFailed: (taskId: number, taskTitle: string, reason?: string) =>
    sendAlert('task_failed', '任務失敗', `任務 #${taskId} (${taskTitle}) 失敗${reason ? `: ${reason}` : ''}`, {
      priority: 'P1',
      related_task_id: taskId,
      related_entity_type: 'board_task'
    }),

  /**
   * 便捷方法：系統健康檢查
   */
  systemHealthy: (service: string, details?: string) =>
    sendAlert('system_healthy', '系統健康', `${service} 運作正常${details ? `: ${details}` : ''}`, {
      source_service: service
    }),

  /**
   * 便捷方法：系統警告
   */
  systemWarning: (service: string, warning: string, metadata?: Record<string, any>) =>
    sendAlert('system_warning', '系統警告', `${service}: ${warning}`, {
      priority: 'P2',
      source_service: service,
      metadata
    }),

  /**
   * 便捷方法：系統嚴重錯誤
   */
  systemCritical: (service: string, error: string, metadata?: Record<string, any>) =>
    sendAlert('system_critical', '🚨 系統錯誤', `${service}: ${error}`, {
      priority: 'P0',
      source_service: service,
      metadata
    }),

  /**
   * 便捷方法：成本超標
   */
  costExceeded: (category: string, threshold: number, actual: number) =>
    sendAlert('cost_threshold_exceeded', '成本超標', `${category} 費用 $${actual} 超過預算 $${threshold}`, {
      priority: 'P1',
      metadata: { category, threshold, actual }
    }),

  /**
   * 便捷方法：庫存不足
   */
  inventoryLow: (product: string, quantity: number) =>
    sendAlert('inventory_low', '庫存不足', `產品 ${product} 庫存僅剩 ${quantity} 件`, {
      priority: 'P1',
      metadata: { product, quantity }
    })
};

interface AlertOptions {
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
  channels?: string[];
  source_service?: string;
  related_task_id?: number;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata?: Record<string, any>;
}

async function sendAlert(
  eventType: string,
  title: string,
  message: string,
  options: AlertOptions = {}
) {
  try {
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        title,
        message,
        ...options
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to send alert:', error);
    return { error: 'Failed to send alert' };
  }
}

export { Priority };
