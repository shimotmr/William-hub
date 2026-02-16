# 企業級行動端 Portal 導航設計深度研究報告

**版本**：1.0  
**日期**：2026-02-12  
**目標**：為 Aurotek Sales Portal 手機版改造提供設計依據

---

## 摘要

本報告深入分析了 12 個主流企業工作管理軟體的手機端 UX/UI 設計模式，涵蓋中國系（釘釘、飛書、企業微信、紛享銷客）和國際系（Salesforce、HubSpot、Microsoft Teams、Notion、Monday.com、Slack、ClickUp、Linear）等領先產品。

**核心發現**：
- **底部 Tab 數量**：3-5 個為業界標準，4 個最為常見
- **首頁模式**：「工作台」（入口聚合）vs「Feed」（動態流）兩大流派
- **導航層級**：Push Stack 為主流，Modal 用於快捷操作
- **個人化趨勢**：可自訂底部 Tab、首頁小組件成為差異化競爭點

**對 Aurotek Portal 的建議**：採用 4 Tab 結構（首頁/案件/資源/我的），首頁以「卡片工作台」呈現核心指標與快捷入口，解決現有卡片與 Tab 重疊的問題。

---

## 研究方法

### 資料來源
1. **官方 App Store / Google Play** — 獲取最新版本截圖與功能描述
2. **官方設計文檔** — Slack Design Blog、Microsoft Learn、Material Design Guidelines
3. **專業 UX 資源** — Mobbin、Page Flows、Dribbble、NN/g
4. **用戶評價與反饋** — Reddit、知乎、產品論壇

### 分析維度
- 底部 Tab Bar 結構
- 首頁/工作台設計
- 導航層級與返回邏輯
- 手機 vs 桌面差異策略
- 獨特設計亮點

---

## 個別軟體分析

### 中國系企業 App

---

### 1. 釘釘 (DingTalk) — 阿里巴巴

![DingTalk Mobile UI](svg/01-dingtalk.svg)

**底部 Tab Bar（5 tabs）**：
| Tab | 功能 |
|-----|------|
| 消息 | IM 聊天、群組 |
| 文檔 | 雲文檔、協作 |
| 工作台 | 應用入口聚合 |
| 通訊錄 | 企業通訊錄 |
| 我的 | 個人設定 |

**首頁/工作台設計**：
- **格子矩陣佈局**：3×4 或 4×4 圖標格，可自訂順序
- **常用應用置頂**：AI 助手、考勤、審批、日程等
- **企業定制區**：由管理員配置的專屬應用

**導航層級**：
- Push Stack 為主，層層深入
- 無側邊欄，全靠底部 Tab + 頂部返回
- 搜尋入口：頂部搜尋欄，全局搜索

**手機 vs 桌面差異**：
- 手機端強調「一鍵觸達」，減少層級
- 桌面端側邊欄展開，多欄佈局

**獨特亮點**：
- **AI DingTalk**：智能助手整合，自動生成會議紀要
- **效率島**：聚合待辦、審批、日程的智能區塊
- **DING 一下**：強提醒功能，確保消息必達

---

### 2. 飛書 (Feishu/Lark) — 字節跳動

![Feishu Mobile UI](svg/02-feishu.svg)

**底部 Tab Bar（4 tabs）**：
| Tab | 功能 |
|-----|------|
| 消息 | IM、群聊、機器人 |
| 日曆 | 日程、會議 |
| 工作台 | 應用入口 |
| 我 | 個人中心 |

**首頁/工作台設計**：
- **混合式佈局**：頂部橫向卡片（常用應用）+ 下方列表（全部應用）
- **智能推薦**：根據使用習慣推薦應用
- **搜尋優先**：頂部大搜尋框，支援全局搜索

**導航層級**：
- 三層結構：Tab → 列表 → 詳情
- 側滑返回手勢支援
- Modal 用於快速創建（文檔、日程）

**手機 vs 桌面差異**：
- 手機端簡化左側欄，底部 Tab 為主導航
- 桌面端：左側 Tab Rail + 右側內容區

**獨特亮點**：
- **妙記**：會議錄音自動轉文字，支援多語言
- **多維表格**：類 Airtable 的表格數據庫
- **Pin 功能**：重要消息置頂側欄

---

### 3. 企業微信 (WeCom) — 騰訊

![WeCom Mobile UI](svg/03-wecom.svg)

**底部 Tab Bar（4 tabs）**：
| Tab | 功能 |
|-----|------|
| 消息 | 聊天、群組 |
| 通訊錄 | 企業組織架構 |
| 工作台 | OA 應用 |
| 我 | 個人設定 |

**首頁/工作台設計**：
- **微信風格**：與個人微信高度一致的 UI
- **格子入口**：打卡、審批、匯報、日程
- **企業應用**：管理員配置的第三方應用

**導航層級**：
- 與微信一致的交互習慣
- 側滑返回，無需按鈕
- 搜尋：頂部下拉觸發

**手機 vs 桌面差異**：
- 手機端最佳化，桌面為延伸
- 可與個人微信互通

**獨特亮點**：
- **微信互通**：直接與微信用戶聊天
- **客戶朋友圈**：企業版朋友圈營銷
- **活碼**：智能分配客服

---

### 4. 紛享銷客 (Fxiaoke) — 中國 CRM 領導品牌

![Fxiaoke CRM Mobile](svg/04-fxiaoke.svg)

**底部 Tab Bar（5 tabs）**：
| Tab | 功能 |
|-----|------|
| 首頁 | Dashboard 儀表板 |
| 客戶 | CRM 客戶管理 |
| 商機 | 銷售漏斗 |
| 消息 | 內部通訊 |
| 我的 | 個人中心 |

**首頁/工作台設計**：
- **Dashboard 模式**：業績指標、待辦事項
- **卡片組件**：今日目標、客戶拜訪、業績排名
- **快捷入口**：新增客戶、新增商機按鈕

**導航層級**：
- CRM 深度業務流程
- 多層級客戶詳情頁
- 支援離線操作

**獨特亮點**：
- **客戶 360°**：全方位客戶畫像
- **拜訪定位**：GPS 打卡驗證
- **AI 銷售助手**：智能推薦跟進時機

---

### 國際系企業 App

---

### 5. Salesforce Mobile — CRM 龍頭

![Salesforce Mobile UI](svg/05-salesforce.svg)

**底部 Tab Bar（4 tabs + More）**：
| Tab | 功能 |
|-----|------|
| Home | 智能首頁 |
| Opportunities | 商機管道 |
| Accounts | 客戶帳戶 |
| More | 更多模組 |

*注：前 4 個 Tab 可由管理員自訂*

**首頁/工作台設計**：
- **Einstein AI 優先**：智能推薦待處理項目
- **Today's Task**：今日任務列表
- **Recent Records**：最近訪問記錄
- **Quick Actions**：快捷操作按鈕

**導航層級**：
- Tab → Record List → Record Detail → Related List
- Lightning 設計系統
- Global Search 全局搜索

**手機 vs 桌面差異**：
- Mobile Builder 專屬行動佈局
- 手機端頁面可獨立設計
- 離線存取支援

**獨特亮點**：
- **Einstein Activity Capture**：自動同步郵件、行事曆
- **Voice Assistant**：語音指令操作
- **iOS Control Center 整合**：原生快捷方式

---

### 6. HubSpot Mobile — 行銷 + 銷售

![HubSpot Mobile UI](svg/06-hubspot.svg)

**底部 Tab Bar（5 tabs）**：
| Tab | 功能 |
|-----|------|
| Feed | 動態消息流 |
| Tasks | 待辦任務 |
| Contacts | 聯絡人 |
| More | 更多功能 |
| Menu | 導航選單 |

**首頁/工作台設計**：
- **Feed 為主**：活動流、通知
- **Today View**：今日任務、會議
- **Quick Add**：快速新增聯絡人/交易

**導航層級**：
- Feed → Detail View
- Bottom Sheet 常用於篩選
- 搜尋：頂部搜尋欄

**獨特亮點**：
- **Business Card Scanner**：名片掃描
- **Calling**：內建通話功能
- **Live Chat**：即時客服整合

---

### 7. Microsoft Teams — 企業協作

![Microsoft Teams Mobile](svg/07-teams.svg)

**底部 Tab Bar（5 tabs）**：
| Tab | 功能 |
|-----|------|
| Activity | 動態通知 |
| Chat | 聊天對話 |
| Teams | 團隊頻道 |
| Calendar | 行事曆會議 |
| More | 更多應用 |

**首頁/工作台設計**：
- **Activity Feed**：所有通知聚合
- **@提及、回覆、反應**分類顯示
- **搜尋入口**：頂部搜尋

**導航層級**：
- Tab → Team → Channel → Post/Files
- Modal 用於快速撰寫
- 深度連結支援

**手機 vs 桌面差異**：
- 手機端 5 Tab，桌面端左側 Rail
- 會議功能手機最佳化
- 頻道 Tab 可自訂

**獨特亮點**：
- **Together Mode**：虛擬會議空間
- **Copilot 整合**：AI 助手
- **跨平台一致性**：Windows/Mac/Mobile 同步

---

### 8. Notion Mobile — 知識管理

![Notion Mobile UI](svg/08-notion.svg)

**底部 Tab Bar（4 tabs）**：
| Tab | 功能 |
|-----|------|
| Home | 最近頁面 |
| Search | 全局搜索 |
| Updates | 更新通知 |
| Inbox | 收件匣 |

**首頁/工作台設計**：
- **Sidebar 為主**：頁面樹狀結構
- **Favorites**：收藏頁面快速訪問
- **Recent**：最近編輯頁面

**導航層級**：
- Page → Sub-page → Block
- Breadcrumb 麵包屑導航
- 側邊欄可展開/收合

**手機 vs 桌面差異**：
- 手機端簡化編輯功能
- 桌面端功能完整
- 同步即時，跨裝置無縫

**獨特亮點**：
- **Block 概念**：一切皆區塊
- **Database View**：多視圖（表格/看板/日曆）
- **AI 整合**：Notion AI 文字生成

---

### 9. Monday.com — 項目管理

![Monday.com Mobile UI](svg/09-monday.svg)

**底部 Tab Bar（4 tabs）**：
| Tab | 功能 |
|-----|------|
| Inbox | 通知收件匣 |
| My Work | 我的任務 |
| Search | 搜索 |
| Menu | 工作區選單 |

**首頁/工作台設計**：
- **My Work 為核心**：個人任務聚合
- **Board View**：看板視圖
- **Widget Dashboard**：可自訂 Dashboard

**導航層級**：
- Menu → Workspace → Board → Item
- Bottom Sheet 篩選器
- Swipe 手勢操作

**獨特亮點**：
- **Vibe Design System**：獨特設計語言
- **Automations**：自動化工作流
- **多視圖切換**：Timeline/Calendar/Kanban

---

### 10. Slack Mobile — 企業通訊

![Slack Mobile UI](svg/10-slack.svg)

**底部 Tab Bar（4 tabs）**：
| Tab | 功能 |
|-----|------|
| Home | 頻道列表 |
| DMs | 私訊 |
| Mentions | @提及 |
| You | 個人設定 |

**首頁/工作台設計**：
- **頻道列表為主**：Channels、DMs、Apps
- **Unreads Filter**：未讀篩選
- **Swipe Down**：最近對話

**導航層級**：
- Tab → Channel → Thread
- Swipe 手勢：下滑 = 最近對話
- Bottom Sheet：設定、篩選

**手機 vs 桌面差異**：
- 2023 年大改版：從 5 Tab 精簡到 3 Tab（現為 4 Tab）
- 桌面端雙側欄，手機端底部 Tab
- Thread 體驗跨平台一致

**獨特亮點**（來自 Slack Design Blog）：
> "We didn't want Slack's expanding capabilities to turn the app into a cluttered space. It was time to rethink the mobile information architecture."
- **Ergonomic Gestures**：符合人體工學的手勢
- **Powerful Filters**：強大篩選功能
- **Header Animation**：滾動時標題收合動畫

---

### 11. ClickUp Mobile — 全能項目管理

![ClickUp Mobile UI](svg/11-clickup.svg)

**底部 Tab Bar（5 tabs）**：
| Tab | 功能 |
|-----|------|
| Home | 儀表板 |
| Inbox | 通知 |
| Chat | 對話 |
| Search | 搜索 |
| More | 更多 |

**首頁/工作台設計**：
- **Home Dashboard**：個人化儀表板
- **Today/Overdue Tasks**：今日/逾期任務
- **Favorites**：收藏空間

**導航層級**：
- 複雜層級：Space → Folder → List → Task
- 用戶反饋：「底部導航在深層頁面消失」
- 搜尋：中心 Tab

**獨特亮點**：
- **Multiple Views**：15+ 種視圖
- **ClickUp Brain**：AI 助手
- **Docs + Tasks 整合**

---

### 12. Linear Mobile — 現代 Issue Tracking

![Linear Mobile UI](svg/12-linear.svg)

**底部 Tab Bar（4 tabs，可自訂）**：
| Tab | 功能 |
|-----|------|
| Inbox | 通知收件匣 |
| My Issues | 我的 Issue |
| Teams | 團隊 |
| Projects | 專案 |

**首頁/工作台設計**：
- **Pulse View**：跨團隊工作概覽（2026 新增）
- **My Issues**：個人任務清單
- **極簡美學**：大量留白，高對比

**導航層級**：
- 高度自訂：可 Pin 特定 Project/Document
- Liquid Glass 風格（靈感來自 Apple）
- Keyboard Shortcuts 桌面版

**獨特亮點**：
- **設計哲學**：「設計只是參考，不是交付物」
- **速度至上**：極致性能最佳化
- **可自訂導航**：2026-01 更新允許重排 Tab

---

## 比較表格

### 底部導航結構比較

| App | Tab 數量 | Tab 內容 | 首頁模式 |
|-----|---------|---------|---------|
| 釘釘 | 5 | 消息/文檔/工作台/通訊錄/我的 | 格子工作台 |
| 飛書 | 4 | 消息/日曆/工作台/我 | 混合式 |
| 企業微信 | 4 | 消息/通訊錄/工作台/我 | 格子工作台 |
| 紛享銷客 | 5 | 首頁/客戶/商機/消息/我的 | Dashboard |
| Salesforce | 4+More | 可自訂 | AI Dashboard |
| HubSpot | 5 | Feed/Tasks/Contacts/More/Menu | Feed |
| Teams | 5 | Activity/Chat/Teams/Calendar/More | Activity Feed |
| Notion | 4 | Home/Search/Updates/Inbox | Sidebar |
| Monday.com | 4 | Inbox/My Work/Search/Menu | My Work |
| Slack | 4 | Home/DMs/Mentions/You | 頻道列表 |
| ClickUp | 5 | Home/Inbox/Chat/Search/More | Dashboard |
| Linear | 4 | 可自訂 | Pulse/Issues |

### 設計模式比較

| 維度 | 中國系特點 | 國際系特點 |
|------|-----------|-----------|
| Tab 數量 | 4-5 個，傾向多功能 | 4 個為主流，精簡 |
| 首頁模式 | 格子工作台（入口聚合） | Feed/Dashboard（內容優先） |
| 功能入口 | 大圖標格子 | 卡片/列表混合 |
| 導航深度 | 較深，模組多 | 較淺，扁平化 |
| 搜尋位置 | 頂部搜尋欄 | 專用 Tab 或頂部 |
| 個人化 | 管理員配置為主 | 用戶自訂為主 |

### 功能入口風格比較

| App | 入口風格 | 特點 |
|-----|---------|------|
| 釘釘 | 小圖標格子 (4×4) | 密集但可自訂 |
| 飛書 | 橫向卡片 + 列表 | 層次分明 |
| 企業微信 | 微信風格格子 | 熟悉感 |
| Salesforce | 可配置 Compact Layout | 專業 |
| HubSpot | 卡片 + 快捷按鈕 | 行銷導向 |
| Notion | Sidebar 頁面樹 | 靈活 |
| Slack | 頻道列表 | 對話為中心 |

### 深層導航方式比較

| App | 主要方式 | 輔助方式 |
|-----|---------|---------|
| 釘釘 | Push Stack | - |
| 飛書 | Push Stack | Modal (創建) |
| Salesforce | Push Stack | Bottom Sheet |
| Teams | Push Stack | Modal (撰寫) |
| Slack | Push Stack | Swipe Gesture |
| Linear | Push Stack | Pin to Nav |

---

## Aurotek Sales Portal 設計建議

### 背景回顧
- **功能模組**：業績管理、產品目錄、報價單、會議逐字稿、數位資源庫、Agent 中控台、後台管理
- **用戶**：3-5 位業務人員 + 管理者
- **現有問題**：首頁卡片與底部 Tab 功能重疊

### 1. 底部 Tab 最佳配置

**建議採用 4 Tab 結構**：

| Tab | 名稱 | 功能 | 圖標建議 |
|-----|------|------|---------|
| 1 | 首頁 | 業績儀表板 + 快捷入口 | 🏠 Home |
| 2 | 案件 | 案件列表 + 漏斗 | 📋 Briefcase |
| 3 | 資源 | 產品目錄 + 數位資源庫 | 📚 Library |
| 4 | 我的 | 個人設定 + Agent 入口 | 👤 Person |

**不建議的配置**：
- ❌ 5+ Tabs：空間不足，觸控困難
- ❌ 業績/報價/逐字稿分開 Tab：功能重疊
- ❌ 後台管理放底部 Tab：非高頻功能

**視覺化設計**：

![Aurotek Portal 建議方案](svg/13-aurotek-portal.svg)

### 2. 首頁/工作台佈局建議

**採用「卡片儀表板」模式**：

```
┌─────────────────────────────────┐
│  🔍 搜尋案件、產品...            │ ← 頂部搜尋
├─────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐       │
│  │本月業績 │  │案件數   │       │ ← 數據卡片區
│  │ $2.4M   │  │  12     │       │
│  └─────────┘  └─────────┘       │
├─────────────────────────────────┤
│  ⚡ 快捷入口                     │ ← 橫向滾動
│  [+報價] [+案件] [逐字稿] [AI]  │
├─────────────────────────────────┤
│  📋 待處理案件 (3)              │ ← 列表區
│  ├─ 案件A - 報價中              │
│  ├─ 案件B - 待跟進              │
│  └─ 案件C - 近期活動            │
├─────────────────────────────────┤
│  📊 本週業績趨勢                │ ← 圖表卡片
│  [Mini Chart]                   │
└─────────────────────────────────┘
```

**設計原則**：
- **數據優先**：業績指標最上方，一眼掌握
- **快捷操作**：常用功能橫向滾動，避免格子過多
- **待辦驅動**：待處理項目提醒
- **可自訂**：允許用戶調整卡片順序

### 3. 子頁面導航模式

**採用 Push Stack + Modal 混合**：

| 場景 | 導航方式 | 範例 |
|------|---------|------|
| 案件列表 → 詳情 | Push | 左滑返回 |
| 創建報價單 | Modal (Full Screen) | 右上角「完成」 |
| 快速記事 | Bottom Sheet | 下滑關閉 |
| 篩選條件 | Bottom Sheet | 確認/取消 |
| 產品詳情 | Push | Breadcrumb |

**返回邏輯**：
- iOS：側滑返回手勢
- Android：系統返回鍵 + 左上返回按鈕
- 深層頁面：保留底部 Tab（參考 Slack 設計）

### 4. 桌面 vs 手機差異策略

| 功能 | 桌面版 | 手機版 |
|------|--------|--------|
| 導航 | 左側 Rail + 頂部 Tab | 底部 4 Tab |
| 首頁 | 多欄 Dashboard | 單欄卡片流 |
| 報價單編輯 | 完整編輯器 | 簡化版 + 提示「桌面操作」 |
| 逐字稿 | 全文編輯 | 閱讀為主，快速標記 |
| 後台管理 | 完整功能 | 隱藏或僅查看 |
| Agent 中控台 | 完整互動 | 快捷指令模式 |

**策略總結**：
- 手機端專注「查看 + 快速操作」
- 複雜操作引導至桌面端
- 數據同步即時，跨裝置無縫

### 5. 設計原則總結

#### ✅ DO（建議採用）

1. **4 Tab 原則**：不超過 5 個，4 個最佳
2. **拇指友好區**：重要操作放底部、中央
3. **圖標 + 文字**：Tab 要有 Label，避免純圖標
4. **一致性**：與系統平台規範對齊（iOS HIG, Material Design）
5. **空狀態設計**：無內容時提供引導
6. **手勢支援**：側滑返回、下拉刷新
7. **搜尋置頂**：全局搜尋入口明顯

#### ❌ DON'T（避免）

1. **Tab 過載**：超過 5 個 Tab
2. **首頁功能重複**：卡片入口 ≠ Tab 功能
3. **層級過深**：超過 3 層需要重新設計 IA
4. **忽略空狀態**：隱藏或禁用無內容 Tab
5. **複雜表單**：手機端不應強迫填寫長表單
6. **底部 Tab 滾動**：Tab Bar 必須固定

---

## 實施路線圖

### Phase 1：資訊架構重整（1-2 週）
- 確定 4 Tab 結構
- 規劃首頁卡片內容
- 移除重複功能

### Phase 2：UI 設計（2-3 週）
- 設計首頁卡片組件
- 設計案件列表/詳情頁
- 設計資源庫瀏覽體驗

### Phase 3：原型測試（1 週）
- 內部業務人員測試
- 收集反饋，迭代

### Phase 4：開發實施（依技術選擇）
- PWA：Service Worker + App Shell
- React Native：Native Navigation

---

## 結論

經過對 12 個主流企業 App 的深度分析，我們得出以下核心結論：

1. **4 Tab 是黃金標準**：Slack、Notion、Linear 等現代 App 都採用 4 Tab，平衡功能與易用性

2. **首頁應是「儀表板」而非「入口聚合」**：中國 App 傾向格子入口，但國際趨勢是數據 Dashboard + 快捷操作

3. **深層導航保持簡潔**：Push Stack 為主，Modal 用於創建操作

4. **手機端專注核心任務**：查看 + 快速操作，複雜功能留給桌面

5. **個人化是趨勢**：Linear 可自訂 Tab 順序、Salesforce 可配置首頁佈局

對於 Aurotek Sales Portal：
- 採用 **首頁/案件/資源/我的** 4 Tab 結構
- 首頁以 **業績 Dashboard + 待辦 + 快捷入口** 呈現
- 解決現有 **卡片與 Tab 重疊** 的問題
- 為 3-5 位業務提供 **高效、專注的移動體驗**

---

## 參考資源

### 設計文檔
- [Slack Design: Re-designing Slack on Mobile](https://slack.design/articles/re-designing-slack-on-mobile/)
- [Material Design 3: Navigation Bar](https://m3.material.io/components/navigation-bar)
- [Apple HIG: Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Linear: How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)

### UI 截圖資源
- [Mobbin: Mobile & Web App Design Reference](https://mobbin.com)
- [Page Flows: User Flow Examples](https://pageflows.com)

### 最佳實踐
- [NN/g: Basic Patterns for Mobile Navigation](https://www.nngroup.com/articles/mobile-navigation-patterns/)
- [Smashing Magazine: Golden Rules of Bottom Navigation](https://www.smashingmagazine.com/2016/11/the-golden-rules-of-mobile-navigation-design/)
- [UX World: Bottom Tab Bar Best Practices](https://uxdworld.com/bottom-tab-bar-navigation-design-best-practices/)

---

*報告完成日期：2026-02-12*  
*作者：Jarvis (UX Research Agent)*
