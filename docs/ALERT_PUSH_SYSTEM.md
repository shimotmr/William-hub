# 警示分級推播系統 - SRD Phase3-3

## 概述

本系統實作 SRD 規格中的警示分級推播機制，根據事件優先級自動選擇最適合的推播方式。

## 優先級定義

| 等級 | 名稱 | 推播方式 | 適用場景 |
|------|------|----------|----------|
| 🟢 P3 | 資訊 | 僅 audit_log | 任務完成、系統健康檢查、備份完成 |
| 🟡 P2 | 待辦 | audit_log + Telegram + PWA 徽章 | 系統警告、代理卡住、會議提醒 |
| 🔴 P1 | 重要 | audit_log + Telegram | 任務失敗、成本超標、庫存不足 |
| 🚨 P0 | 緊急 | audit_log + Telegram + LINE | 系統當機、心跳失敗、交易風險 |

## 資料庫 Schema

### alert_notifications 表
```sql
- id: UUID (主鍵)
- alert_type: TEXT (事件類型)
- priority: TEXT (P0/P1/P2/P3)
- title: TEXT (標題)
- message: TEXT (訊息內容)
- source_service: TEXT (來源服務)
- related_task_id: INTEGER (關聯任務)
- metadata: JSONB (擴充資料)
- push_channels: TEXT[] (推播通道)
- is_sent: BOOLEAN (是否已發送)
- sent_at: TIMESTAMPTZ (發送時間)
- created_at: TIMESTAMPTZ
```

### alert_rules 表
```sql
- id: SERIAL (主鍵)
- event_type: TEXT (事件類型，唯一)
- priority: TEXT (預設優先級)
- push_channels: TEXT[] (推播通道)
- is_enabled: BOOLEAN (是否啟用)
- description: TEXT (說明)
```

## 預設規則

| 事件類型 | 優先級 | 推播通道 |
|----------|--------|----------|
| task_completed | P3 | audit_log |
| task_failed | P1 | audit_log, telegram |
| system_healthy | P3 | audit_log |
| system_warning | P2 | audit_log, telegram |
| system_critical | P0 | audit_log, telegram, line |
| disk_space_low | P2 | audit_log, telegram |
| cost_threshold_exceeded | P1 | audit_log, telegram |
| agent_stuck | P2 | audit_log, telegram |
| heartbeat_failure | P0 | audit_log, telegram, line |
| inventory_low | P1 | audit_log, telegram, line |
| trade_risk | P0 | audit_log, telegram, line |

## API

### POST /api/alerts
創建新警示並自動分級推播

```bash
curl -X POST "http://localhost:3000/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "system_warning",
    "title": "測試警示",
    "message": "這是測試訊息",
    "source_service": "my-service",
    "priority": "P2"
  }'
```

### GET /api/alerts
查詢警示列表

```bash
curl "http://localhost:3000/api/alerts?priority=P0&limit=20"
```

### GET /api/alerts/rules
查詢警示規則

```bash
curl "http://localhost:3000/api/alerts/rules"
```

## 使用方式

### 在 Node.js/TypeScript 中使用
```typescript
import { alert } from '@/lib/alerts';

// 發送不同優先級的警示
await alert.critical('system_critical', '系統當機', '服務無回應');
await alert.warning('system_warning', '磁碟空間不足', '使用率 85%');
await alert.info('task_completed', '任務完成', '任務 #123 完成');

// 使用便捷方法
alert.taskCompleted(123, '分析報告');
alert.systemHealthy('API Service');
alert.costExceeded('OpenAI', 100, 150);
```

### 在 Shell 腳本中使用
```bash
# 使用 Bash 腳本
~/clawd/scripts/alert_notify.sh \
  --type system_warning \
  --title "磁碟空間不足" \
  --message "使用率 85%" \
  --service "disk-health" \
  --priority P2

# 使用 Node.js 腳本
node ~/clawd/scripts/alert-notify.js \
  -t system_critical \
  -T "主機當機" \
  -m "伺服器無回應" \
  -p P0
```

## 頁面

- 警示儀表板: `/alerts` - 查看所有警示記錄
- William Hub 已整合 `/alerts` 路由

## 整合監控腳本

現有腳本可透過警示 API 整合：

```bash
# 在現有監控腳本中添加
~/clawd/scripts/alert_notify.sh \
  --type agent_stuck \
  --title "Agent 卡住" \
  --message "Task #$task_id ($title) 已卡住 $minutes 分鐘"
```

## 驗收標準

✅ 不同優先級警示有對應推播方式
✅ 符合 SRD 規格要求（P0/P1/P2/P3 分級）
✅ 完整 API 和使用文檔
✅ 與 William Hub 整合
✅ 預設規則已配置

## 相關任務

- Board #1136: SRD Phase3-3 警示分級推播（已完成）
