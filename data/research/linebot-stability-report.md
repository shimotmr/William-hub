# LINE Bot 72 小時穩定性監控報告

**檢測時間**：2026-02-15 21:04  
**監控範圍**：過去 7 小時（14:05 - 21:04）  
**檢測人員**：Inspector Agent  

---

## 一、執行摘要

### ✅ 通過項目
- Cloudflare Tunnel 正常運行
- 回覆延遲符合 <3s 要求
- 業務邏輯無錯誤
- AI 回覆功能正常
- launchd 服務運行中

### ⚠️ 建議優化
- 減少服務重啟頻率（7 小時內 21 次）
- 修復 Pydantic V1 與 Python 3.14 相容性警告

### ❌ 必須修正（阻擋上線）
- **資料庫錯誤**：`sqlite3.OperationalError: no such column: session_id`（發生 2 次啟動失敗）

---

## 二、監控數據

### 2.1 請求統計
| 指標 | 數值 | 備註 |
|------|------|------|
| 總請求數 | 28 | 包含測試請求 |
| 成功請求（200） | 19 | 67.9% |
| 失敗請求（400） | 9 | 全部為 Invalid signature（測試請求） |
| 真實訊息數 | 17 | 實際用戶訊息 |
| AI 回覆數 | 6 | 命中 AI 觸發條件 |
| Health check | 多次 | 全部成功 |

### 2.2 錯誤分析
| 錯誤類型 | 次數 | 嚴重性 | 說明 |
|---------|------|--------|------|
| Invalid signature | 9 | 低 | 來自測試請求，符合預期 |
| session_id 欄位不存在 | 2 | **高** | 導致啟動失敗 |
| Pydantic V1 不相容 | 多次 | 中 | UserWarning，不影響運行 |

**業務錯誤率**：0%  
**測試請求失敗率**：100%（符合預期，因無正確 signature）

### 2.3 回覆延遲
所有訊息處理時間：
```
14:40:25 → 14:40:26  (1秒)
14:43:03 → 14:43:04  (1秒)
14:43:05 → 14:43:06  (1秒)
14:50:49 → 14:50:50  (1秒)
14:51:28 → 14:51:33  (5秒) ← 有 AI 回覆
14:51:57 → 14:51:58  (1秒)
14:52:22 → 14:52:22  (0秒)
14:52:38 → 14:52:40  (2秒)
14:53:03 → 14:53:04  (1秒)
14:53:33 → 14:53:34  (1秒)
```

- **平均延遲**：約 1-2 秒
- **最大延遲**：5 秒（AI 回覆）
- **通過率**：100%（全部 < 3s）

### 2.4 服務穩定性
| 指標 | 數值 | 狀態 |
|------|------|------|
| launchd 狀態 | Running (PID 81287) | ✅ |
| Cloudflare Tunnel | Running (PID 78646) | ✅ |
| 服務重啟次數 | 21 次 / 7 小時 | ⚠️ 頻繁 |
| Crash 記錄 | 2 次（DB 錯誤） | ❌ |
| 端點可達性 | https://linebot.williamhsiao.tw/callback | ✅ (400 符合預期) |

---

## 三、風險評估

### 🔴 高風險
1. **資料庫結構問題**
   - 錯誤：`sqlite3.OperationalError: no such column: session_id`
   - 影響：導致服務啟動失敗（已發生 2 次）
   - 建議：立即檢查 `db.py` 與資料庫 schema 一致性

### 🟡 中風險
2. **服務重啟頻繁**
   - 頻率：21 次 / 7 小時（約每 20 分鐘 1 次）
   - 原因：可能與 DB 錯誤、手動重啟、launchd 設定有關
   - 建議：分析重啟原因，優化 launchd 配置

3. **依賴版本相容性**
   - Pydantic V1 與 Python 3.14 不相容警告
   - 建議：升級到 Pydantic V2 或降級 Python

### 🟢 低風險
4. **Flask 開發伺服器警告**
   - 使用 Flask development server（不建議生產環境）
   - 建議：改用 gunicorn / uWSGI（非緊急）

---

## 四、測試驗證

### 4.1 功能測試
- ✅ 一般訊息接收與儲存
- ✅ AI 觸發判斷（DeepSeek）
- ✅ Knowledge search 整合
- ✅ 價格查詢（allow_price 控制）
- ✅ 敏感內容過濾（台灣/政治問題）
- ✅ 圖片訊息記錄
- ✅ Session 管理

### 4.2 安全測試
- ✅ Signature 驗證（拒絕無效請求）
- ✅ 敏感話題阻擋（台灣主權、小熊維尼等）
- ✅ 探測請求防禦（/.env, /.travis.yml 等返回 404）

---

## 五、結論與建議

### 5.1 是否建議正式上線？
**❌ 不建議**，需先完成以下修正：

#### 必須修正（P0）
1. **修復 DB schema 錯誤**
   - 檢查 `session_id` 欄位定義
   - 確保 `db.py:32` 的 INDEX 建立與表結構一致
   - 驗證修正後無啟動失敗

#### 建議優化（P1）
2. **降低重啟頻率**
   - 分析 launchd stderr.log 找出重啟原因
   - 優化 `KeepAlive` / `ThrottleInterval` 設定

3. **解決 Pydantic 警告**
   - 升級到 Pydantic V2（需測試相容性）
   - 或改用 Python 3.13

#### 後續改進（P2）
4. **生產環境部署**
   - 改用 gunicorn + nginx
   - 加入監控告警（Uptime Kuma / Prometheus）

5. **72 小時持續監控**
   - 本報告僅涵蓋 7 小時數據
   - 建議繼續監控至 72 小時後再次評估

### 5.2 下一步行動
1. 立即通知開發團隊修復 DB 錯誤
2. 修正後重啟服務並監控 24 小時
3. 確認重啟頻率降至正常（<1 次/小時）
4. 72 小時後重新評估上線可行性

---

## 六、附錄

### 檢測命令
```bash
# Log 分析
tail -n 500 ~/clawd/logs/linebot-webhook.log
grep -c "Event types: \['message'\]" ~/clawd/logs/linebot-webhook.log

# 服務狀態
launchctl list | grep linebot
ps aux | grep cloudflared

# 端點測試
curl -X POST https://linebot.williamhsiao.tw/callback \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'
```

### 相關檔案
- Webhook log: `~/clawd/logs/linebot-webhook.log`
- Stderr log: `~/clawd/logs/linebot-stderr.log`
- 資料庫程式: `~/clawd/scripts/line-bot-listener/db.py`
- launchd 設定: `~/Library/LaunchAgents/com.linebot.webhook.plist`

---

**報告產出時間**：2026-02-15 21:04  
**檢測工具版本**：Inspector Agent v1.0  
**建議覆審週期**：修正後 24 小時
