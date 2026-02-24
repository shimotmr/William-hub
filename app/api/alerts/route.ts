import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============== 通知模板系統 ==============
const NOTIFICATION_TEMPLATES = {
  // 預設模板
  default: {
    telegram: `{{emoji}} [{{priority}}] {{title}}\n\n{{message}}`,
    line: `[{{emoji}} {{priority_label}}] {{title}}\n\n{{message}}`,
    pwa: `{{title}}`,
    audit_log: `{{title}} - {{message}}`
  },
  
  // 任務相關
  task: {
    telegram: `{{emoji}} 任務 {{status}}: {{title}}\n\n{{message}}\n\n🔗 {{task_link}}`,
    line: `[{{emoji}}] {{title}}\n\n{{message}}`,
    pwa: `任務 {{status}}: {{title}}`,
    audit_log: `Task {{task_id}}: {{title}}`
  },
  
  // 系統相關
  system: {
    telegram: `{{emoji}} 系統 {{level}}: {{title}}\n\n{{message}}\n\n⏰ {{timestamp}}`,
    line: `[系統{{level}}n\n{{message}}`,
    pwa: `系統] {{title}}\提醒: {{title}}`,
    audit_log: `System {{level}}: {{title}}`
  },
  
  // 成本相關
  cost: {
    telegram: `💰 成本警示: {{title}}\n\n{{message}}\n\n📊 {{amount}}`,
    line: `[💰成本預警] {{title}}\n\n{{message}}\n\n{{amount}}`,
    pwa: `💰 {{title}}`,
    audit_log: `Cost Alert: {{title}} - {{amount}}`
  },
  
  // 庫存相關
  inventory: {
    telegram: `📦 庫存警示: {{title}}\n\n{{message}}\n\n庫存: {{stock_level}}`,
    line: `[📦庫存] {{title}}\n\n{{message}}\n\n庫存: {{stock_level}}`,
    pwa: `📦 {{title}}`,
    audit_log: `Inventory Alert: {{title}}`
  }
};

// 優先級配置
const PRIORITY_CONFIG = {
  P0: { 
    label: 'S級警示', 
    emoji: '🚨', 
    level: 'critical',
    telegram_chat: process.env.TELEGRAM_MAIN_CHAT_ID,
    requires_ack: true 
  },
  P1: { 
    label: '重要', 
    emoji: '⚠️', 
    level: 'warning',
    telegram_chat: process.env.TELEGRAM_GROUP_CHAT_ID,
    requires_ack: false 
  },
  P2: { 
    label: '待辦', 
    emoji: '💡', 
    level: 'info',
    telegram_chat: process.env.TELEGRAM_GROUP_CHAT_ID,
    requires_ack: false 
  },
  P3: { 
    label: '資訊', 
    emoji: 'ℹ️', 
    level: 'info',
    telegram_chat: null,
    requires_ack: false 
  }
};

// ============== 推播通道實現 ==============
const PUSH_CHANNELS = {
  // 審計日誌
  audit_log: async (notification: any, template: string) => {
    const { error } = await supabase.from('audit_logs').insert({
      action: `alert_${notification.alert_type}`,
      details: JSON.stringify({
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        metadata: notification.metadata,
        template_used: template
      }),
      page: 'alert_system'
    });
    return { success: !error, error };
  },
  
  // Telegram 推播
  telegram: async (notification: any, template: string) => {
    const config = PRIORITY_CONFIG[notification.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.P3;
    
    // 填充模板變量
    const msg = applyTemplate(template || NOTIFICATION_TEMPLATES.default.telegram, {
      emoji: config.emoji,
      priority: notification.priority,
      priority_label: config.label,
      level: config.level,
      title: notification.title,
      message: notification.message,
      timestamp: new Date().toISOString(),
      ...notification.metadata
    });
    
    const chatId = config.telegram_chat || process.env.TELEGRAM_GROUP_CHAT_ID;
    
    // 如果有 Telegram Bot Token，實際發送
    if (process.env.TELEGRAM_BOT_TOKEN && chatId) {
      try {
        const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: msg,
            parse_mode: 'Markdown'
          })
        });
        const result = await response.json();
        return { success: result.ok, telegram: result };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    
    // 沒有 token 時記錄日誌
    console.log(`[ALERT_TELEGRAM] Would send to ${chatId}:`, msg);
    return { success: true, scheduled: true };
  },
  
  // LINE 推播
  line: async (notification: any, template: string) => {
    // 只對 P0/P1 發送 LINE
    if (!['P0', 'P1'].includes(notification.priority)) {
      return { success: true, skipped: true };
    }
    
    const config = PRIORITY_CONFIG[notification.priority as keyof typeof PRIORITY_CONFIG];
    const msg = applyTemplate(template || NOTIFICATION_TEMPLATES.default.line, {
      emoji: config.emoji,
      priority: notification.priority,
      priority_label: config.label,
      title: notification.title,
      message: notification.message,
      ...notification.metadata
    });
    
    // 如果有 LINE Access Token，實際發送
    if (process.env.LINE_ACCESS_TOKEN) {
      try {
        const lineUrl = 'https://api.line.me/v2/bot/message/broadcast';
        const response = await fetch(lineUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LINE_ACCESS_TOKEN}`
          },
          body: JSON.stringify({ messages: [{ type: 'text', text: msg }] })
        });
        const result = await response.json();
        return { success: !result.error, line: result };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    
    console.log(`[ALERT_LINE] Would send:`, msg);
    return { success: true, scheduled: true };
  },
  
  // PWA Badge 更新
  pwa_badge: async (notification: any, template: string) => {
    console.log('[ALERT_PWA] Badge update:', {
      id: notification.id,
      priority: notification.priority,
      title: notification.title
    });
    return { success: true };
  },
  
  // 電子郵件
  email: async (notification: any, template: string) => {
    // 僅對重要警示發送郵件
    if (!['P0', 'P1'].includes(notification.priority)) {
      return { success: true, skipped: true };
    }
    
    const config = PRIORITY_CONFIG[notification.priority as keyof typeof PRIORITY_CONFIG];
    const msg = applyTemplate(template || NOTIFICATION_TEMPLATES.default.telegram, {
      emoji: config.emoji,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      ...notification.metadata
    });
    
    // 記錄郵件任務（可整合 SendGrid, Mailgun 等）
    console.log(`[ALERT_EMAIL] Would send:`, msg);
    return { success: true, scheduled: true };
  }
};

// 模板替換函數
function applyTemplate(template: string, vars: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

// 根據優先級獲取推播通道
function getChannelsForPriority(priority: string): string[] {
  switch (priority) {
    case 'P0':
      return ['audit_log', 'telegram', 'line', 'email'];
    case 'P1':
      return ['audit_log', 'telegram', 'line'];
    case 'P2':
      return ['audit_log', 'telegram', 'pwa_badge'];
    case 'P3':
    default:
      return ['audit_log'];
  }
}

// ============== 速率限制 ==============
// 簡單的記憶體速率限制（，生產環境應用 Redis）
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(eventType: string, priority: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const windowMs = priority === 'P0' ? 60000 : priority === 'P1' ? 300000 : 600000; // P0: 1min, P1: 5min, P2+: 10min
  const maxPerWindow = priority === 'P0' ? 10 : priority === 'P1' ? 20 : 100;
  
  const key = `${eventType}_${priority}`;
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxPerWindow - 1, resetIn: windowMs };
  }
  
  if (current.count >= maxPerWindow) {
    return { allowed: false, remaining: 0, resetIn: current.resetAt - now };
  }
  
  current.count++;
  return { allowed: true, remaining: maxPerWindow - current.count, resetIn: current.resetAt - now };
}

// 根據事件類型獲取模板
function getTemplateForEvent(eventType: string): string {
  if (eventType.startsWith('task_')) return 'task';
  if (eventType.startsWith('system_')) return 'system';
  if (eventType.includes('cost')) return 'cost';
  if (eventType.includes('inventory')) return 'inventory';
  return 'default';
}

// GET /api/alerts - 獲取警示列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const priority = searchParams.get('priority');
    const alertType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('alert_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (priority) {
      query = query.eq('priority', priority);
    }
    if (alertType) {
      query = query.eq('alert_type', alertType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 獲取統計
    const { count } = await supabase
      .from('alert_notifications')
      .select('*', { count: 'exact', head: true });

    // 獲取未讀計數（最近 24 小時未讀的 P0/P1）
    const { count: unreadCount } = await supabase
      .from('alert_notifications')
      .select('*', { count: 'exact', head: true })
      .in('priority', ['P0', 'P1'])
      .eq('is_sent', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return NextResponse.json({
      alerts: data,
      total: count,
      unreadCount: unreadCount || 0,
      pagination: { limit, offset }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/alerts - 創建新警示並自動分級推播
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      event_type, 
      title, 
      message, 
      source_service, 
      related_task_id,
      related_entity_type,
      related_entity_id,
      metadata = {},
      priority, // 可選，如果未提供則自動根據規則判斷
      channels,  // 可選，如果未提供則使用預設
      bypass_rate_limit = false // 可選，強制發送（跳過速率限制）
    } = body;

    // 1. 檢查速率限制
    if (!bypass_rate_limit) {
      const rateLimitResult = checkRateLimit(event_type, priority || 'P3');
      if (!rateLimitResult.allowed) {
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: `Too many alerts of type "${event_type}". Please wait.`,
          retry_after: Math.ceil(rateLimitResult.resetIn / 1000)
        }, { status: 429 });
      }
    }

    // 2. 確定優先級
    let finalPriority = priority;
    if (!finalPriority) {
      // 根據規則自動判斷
      const { data: rule } = await supabase
        .from('alert_rules')
        .select('priority, push_channels')
        .eq('event_type', event_type)
        .eq('is_enabled', true)
        .single();
      
      if (rule) {
        finalPriority = rule.priority;
      } else {
        // 預設為 P3（資訊）
        finalPriority = 'P3';
      }
    }

    // 2. 確定推播通道
    let pushChannels = channels;
    if (!pushChannels || pushChannels.length === 0) {
      if (channels === undefined) {
        // 使用預設通道
        const { data: rule } = await supabase
          .from('alert_rules')
          .select('push_channels')
          .eq('event_type', event_type)
          .single();
        
        pushChannels = rule?.push_channels || getChannelsForPriority(finalPriority);
      }
    }

    // 3. 創建警示記錄
    const { data: notification, error: insertError } = await supabase
      .from('alert_notifications')
      .insert({
        alert_type: event_type,
        priority: finalPriority,
        title,
        message,
        source_service,
        related_task_id,
        related_entity_type,
        related_entity_id,
        metadata,
        push_channels: pushChannels
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 4. 異步執行推播（不阻塞響應）
    const templateType = getTemplateForEvent(event_type);
    (async () => {
      const pushResults: Record<string, any> = {};
      
      for (const channel of pushChannels || []) {
        const handler = PUSH_CHANNELS[channel as keyof typeof PUSH_CHANNELS];
        if (handler) {
          try {
            pushResults[channel] = await handler(notification, templateType);
          } catch (e: any) {
            pushResults[channel] = { success: false, error: e.message };
          }
        }
      }

      // 更新發送狀態
      await supabase
        .from('alert_notifications')
        .update({ 
          is_sent: true, 
          sent_at: new Date().toISOString() 
        })
        .eq('id', notification.id);
    })();

    return NextResponse.json({
      success: true,
      notification,
      channels: pushChannels
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/alerts - 更新警示狀態
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_sent } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('alert_notifications')
      .update({ 
        is_sent: is_sent ?? true,
        sent_at: is_sent ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notification: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
