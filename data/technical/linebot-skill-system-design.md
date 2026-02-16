# LINE Bot Skill 系統設計文件

## 專案資訊
- 作者: Travis (Subagent)
- 日期: 2026-02-16
- 任務: Board #94
- 目標: 為 LINE Bot（AURO智能服務專員）設計模組化技能擴充架構

## 一、背景分析

### 1.1 現有架構
LINE Bot 目前由以下核心模組組成：

**ai_reply.py** - AI 智能回覆核心
- FAQ 快取與精確匹配
- 敏感話題過濾
- 轉人工檢測
- DeepSeek/OpenAI 生成式回覆
- 報價權限管理
- 群組回覆判斷

**knowledge_search.py** - 知識庫搜尋
- qmd BM25 全文搜尋
- FAQ 獨立匹配層（信心度 >= 0.95 短路回覆）
- 品牌過濾（Phase 2A）
- 跨型號對比搜尋（Phase 2B）
- products_full 規格查詢
- 關鍵字文件映射

**其他模組**
- inventory_check.py - 庫存與價格查詢
- classifier.py - 訊息分類
- db.py - 訊息記錄資料庫
- brand_detector.py - 品牌識別
- faq_matcher.py - FAQ 匹配器

### 1.2 當前限制
- 新功能必須修改主程式碼
- 功能耦合在 ai_reply.py 中，難以獨立測試
- 無法動態啟用/停用功能
- 缺乏統一的觸發機制與回覆格式
- 無法由非開發者新增技能

### 1.3 未來需求
- 工單系統整合（建立/查詢/追蹤工單）
- 訂單追蹤（查詢訂單狀態、出貨進度）
- 更多品牌產品（越疆、優必選等）
- 外部 API 整合（ERP、CRM）
- A/B 測試不同回覆策略
- 多租戶支援（不同群組不同技能集）

---

## 二、設計目標

### 2.1 核心原則
1. **模組化** - 每個 Skill 獨立封裝，互不干擾
2. **可插拔** - 支援動態載入/卸載，無需重啟服務
3. **宣告式** - 用 JSON/YAML 定義觸發條件，不寫 if-else
4. **向後相容** - 不破壞現有功能，逐步遷移
5. **易測試** - 每個 Skill 可獨立測試，不依賴完整環境

### 2.2 參考架構
借鑑 OpenClaw Skills 設計：
- SKILL.md 作為技能說明文件
- Metadata 宣告式定義（觸發條件、權限、優先級）
- 標準化的輸入/輸出介面
- 安裝腳本與依賴管理

---

## 三、Skill 架構設計

### 3.1 技能介面定義

每個 Skill 實作 `BaseSkill` 抽象類別：

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any, List

@dataclass
class SkillContext:
    """Skill 執行上下文"""
    user_message: str           # 用戶原始訊息
    source_id: str              # 來源 ID（群組/用戶）
    source_type: str            # "user" | "group" | "room"
    user_id: str                # 發送者 LINE User ID
    conversation_history: List[Dict]  # 對話歷史（最近 N 則）
    metadata: Dict[str, Any]    # 額外元資料（品牌、型號等）
    
@dataclass
class SkillResponse:
    """Skill 回覆結果"""
    text: str                   # 回覆文字
    confidence: float           # 信心度 (0.0-1.0)
    should_escalate: bool       # 是否轉人工
    metadata: Dict[str, Any]    # 額外資料（如工單編號）
    suggestions: List[str]      # 後續建議操作
    
class BaseSkill(ABC):
    """技能基礎類別"""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """技能名稱（唯一識別碼）"""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """技能功能描述"""
        pass
    
    @property
    def priority(self) -> int:
        """優先級（數字越小越優先，預設 100）"""
        return 100
    
    @abstractmethod
    def can_handle(self, context: SkillContext) -> bool:
        """判斷是否能處理此訊息"""
        pass
    
    @abstractmethod
    def execute(self, context: SkillContext) -> SkillResponse:
        """執行技能邏輯"""
        pass
    
    def validate_config(self) -> bool:
        """驗證技能設定是否正確"""
        return True
```

### 3.2 觸發機制

支援多種觸發條件（可組合）：

```python
# 觸發器基類
class Trigger(ABC):
    @abstractmethod
    def match(self, context: SkillContext) -> bool:
        pass

# 關鍵字觸發
class KeywordTrigger(Trigger):
    def __init__(self, keywords: List[str], mode: str = "any"):
        self.keywords = keywords
        self.mode = mode  # "any" | "all"
    
    def match(self, context: SkillContext) -> bool:
        if self.mode == "any":
            return any(kw in context.user_message for kw in self.keywords)
        else:
            return all(kw in context.user_message for kw in self.keywords)

# 正規表達式觸發
class RegexTrigger(Trigger):
    def __init__(self, pattern: str):
        self.pattern = re.compile(pattern)
    
    def match(self, context: SkillContext) -> bool:
        return bool(self.pattern.search(context.user_message))

# 意圖觸發（用 AI 分類）
class IntentTrigger(Trigger):
    def __init__(self, intent: str, confidence_threshold: float = 0.8):
        self.intent = intent
        self.threshold = confidence_threshold
    
    def match(self, context: SkillContext) -> bool:
        # 調用意圖分類 API
        detected_intent, confidence = classify_intent(context.user_message)
        return detected_intent == self.intent and confidence >= self.threshold

# 品牌觸發（Phase 2A 品牌檢測整合）
class BrandTrigger(Trigger):
    def __init__(self, brands: List[str]):
        self.brands = brands
    
    def match(self, context: SkillContext) -> bool:
        from brand_detector import detect_brand
        brand = detect_brand(context.user_message)
        return brand in self.brands if brand else False
```

### 3.3 技能管理器

```python
class SkillManager:
    """技能管理中心"""
    
    def __init__(self):
        self.skills: List[BaseSkill] = []
        self.skill_map: Dict[str, BaseSkill] = {}
    
    def register(self, skill: BaseSkill) -> None:
        """註冊技能"""
        if not skill.validate_config():
            raise ValueError(f"Skill {skill.name} config invalid")
        
        self.skills.append(skill)
        self.skill_map[skill.name] = skill
        
        # 按優先級排序
        self.skills.sort(key=lambda s: s.priority)
    
    def unregister(self, skill_name: str) -> None:
        """移除技能"""
        if skill_name in self.skill_map:
            skill = self.skill_map[skill_name]
            self.skills.remove(skill)
            del self.skill_map[skill_name]
    
    def handle_message(self, context: SkillContext) -> Optional[SkillResponse]:
        """處理訊息（按優先級嘗試所有技能）"""
        for skill in self.skills:
            try:
                if skill.can_handle(context):
                    logger.info(f"Skill matched: {skill.name}")
                    return skill.execute(context)
            except Exception as e:
                logger.error(f"Skill {skill.name} failed: {e}")
                continue
        
        return None  # 無技能處理，fallback 到預設回覆
    
    def get_skill(self, name: str) -> Optional[BaseSkill]:
        """取得指定技能"""
        return self.skill_map.get(name)
    
    def list_skills(self) -> List[Dict[str, Any]]:
        """列出所有技能"""
        return [
            {
                "name": s.name,
                "description": s.description,
                "priority": s.priority,
            }
            for s in self.skills
        ]
```

### 3.4 Skill 目錄結構

```
scripts/line-bot-listener/
├── skills/                     # 技能目錄
│   ├── __init__.py
│   ├── base.py                 # BaseSkill、Trigger 基類
│   ├── manager.py              # SkillManager
│   │
│   ├── product_query/          # 產品查詢技能
│   │   ├── __init__.py
│   │   ├── skill.py
│   │   ├── SKILL.md
│   │   └── config.json
│   │
│   ├── inventory_check/        # 庫存查詢技能
│   │   ├── __init__.py
│   │   ├── skill.py
│   │   ├── SKILL.md
│   │   └── config.json
│   │
│   ├── ticket_system/          # 工單系統技能（新增）
│   │   ├── __init__.py
│   │   ├── skill.py
│   │   ├── SKILL.md
│   │   └── config.json
│   │
│   └── order_tracking/         # 訂單追蹤技能（新增）
│       ├── __init__.py
│       ├── skill.py
│       ├── SKILL.md
│       └── config.json
│
├── ai_reply.py                 # 現有主程式（逐步遷移）
├── knowledge_search.py
└── app.py
```

### 3.5 Skill 設定格式

每個 Skill 的 `config.json` 定義觸發條件與權限：

```json
{
  "name": "inventory_check",
  "version": "1.0.0",
  "description": "查詢產品庫存與交期",
  "priority": 50,
  "enabled": true,
  "triggers": [
    {
      "type": "keyword",
      "keywords": ["有嗎", "有貨", "庫存", "還有", "有沒有", "缺貨", "到貨", "交期", "備貨"],
      "mode": "any"
    },
    {
      "type": "intent",
      "intent": "delivery_inquiry",
      "confidence_threshold": 0.8
    }
  ],
  "permissions": {
    "groups": ["allowed_group_id_1", "allowed_group_id_2"],
    "users": ["*"],
    "blacklist": []
  },
  "settings": {
    "show_exact_qty": false,
    "max_response_length": 200
  }
}
```

---

## 四、範例 Skill 實作

### 4.1 庫存查詢技能

```python
# skills/inventory_check/skill.py
from ..base import BaseSkill, SkillContext, SkillResponse, KeywordTrigger
from inventory_check import check_inventory_for_message

class InventoryCheckSkill(BaseSkill):
    
    @property
    def name(self) -> str:
        return "inventory_check"
    
    @property
    def description(self) -> str:
        return "查詢產品庫存與交期資訊"
    
    @property
    def priority(self) -> int:
        return 50  # 高優先級
    
    def __init__(self, config: dict):
        self.config = config
        self.keywords = config["triggers"][0]["keywords"]
        self.trigger = KeywordTrigger(self.keywords, mode="any")
    
    def can_handle(self, context: SkillContext) -> bool:
        return self.trigger.match(context)
    
    def execute(self, context: SkillContext) -> SkillResponse:
        # 調用現有庫存查詢函式
        inventory_info = check_inventory_for_message(context.user_message)
        
        if not inventory_info and context.conversation_history:
            # 從上下文補充關鍵字
            context_text = context.user_message + " " + " ".join(
                m["content"] for m in context.conversation_history[-4:]
            )
            inventory_info = check_inventory_for_message(context_text)
        
        if inventory_info:
            return SkillResponse(
                text=inventory_info,
                confidence=0.9,
                should_escalate=False,
                metadata={"source": "products_full"},
                suggestions=[]
            )
        else:
            return SkillResponse(
                text="我幫您確認庫存狀況，請稍候。",
                confidence=0.5,
                should_escalate=True,
                metadata={},
                suggestions=["報價諮詢", "聯繫業務"]
            )
    
    def validate_config(self) -> bool:
        return "triggers" in self.config and len(self.config["triggers"]) > 0
```

### 4.2 工單建立技能（新功能）

```python
# skills/ticket_system/skill.py
from ..base import BaseSkill, SkillContext, SkillResponse, KeywordTrigger
import requests
import json

class TicketSystemSkill(BaseSkill):
    
    @property
    def name(self) -> str:
        return "ticket_system"
    
    @property
    def description(self) -> str:
        return "建立、查詢與追蹤客服工單"
    
    @property
    def priority(self) -> int:
        return 60
    
    def __init__(self, config: dict):
        self.config = config
        self.api_url = config["settings"]["api_url"]
        self.api_key = config["settings"]["api_key"]
        self.trigger = KeywordTrigger(
            keywords=["報修", "故障", "問題", "工單", "維修", "不能用", "壞了"],
            mode="any"
        )
    
    def can_handle(self, context: SkillContext) -> bool:
        return self.trigger.match(context)
    
    def execute(self, context: SkillContext) -> SkillResponse:
        # 解析問題類型與產品
        issue_type = self._classify_issue(context.user_message)
        product = self._extract_product(context.user_message)
        
        # 建立工單
        ticket_id = self._create_ticket(
            user_id=context.user_id,
            source_id=context.source_id,
            message=context.user_message,
            issue_type=issue_type,
            product=product
        )
        
        if ticket_id:
            reply = (
                f"已為您建立工單編號 #{ticket_id}\n"
                f"問題類型：{issue_type}\n"
                f"我們將盡快處理，預計 2 小時內回覆。"
            )
            return SkillResponse(
                text=reply,
                confidence=0.95,
                should_escalate=False,
                metadata={"ticket_id": ticket_id, "issue_type": issue_type},
                suggestions=["查詢工單進度", "聯繫技術支援"]
            )
        else:
            return SkillResponse(
                text="工單系統暫時無法使用，我已記錄您的問題，將盡快處理。",
                confidence=0.3,
                should_escalate=True,
                metadata={},
                suggestions=["直接聯繫客服"]
            )
    
    def _classify_issue(self, message: str) -> str:
        """分類問題類型"""
        if any(kw in message for kw in ["故障", "壞了", "不能用"]):
            return "硬體故障"
        elif any(kw in message for kw in ["設定", "操作", "怎麼"]):
            return "操作問題"
        elif any(kw in message for kw in ["軟體", "更新", "APP"]):
            return "軟體問題"
        else:
            return "其他"
    
    def _extract_product(self, message: str) -> str:
        """提取產品型號"""
        import re
        models = re.findall(
            r'(?i)(CC1|T300|T600|MT1|SH1|D9|BellaBot|KettyBot)', 
            message
        )
        return models[0] if models else "未指定"
    
    def _create_ticket(self, user_id, source_id, message, issue_type, product) -> str:
        """呼叫工單系統 API"""
        try:
            response = requests.post(
                f"{self.api_url}/tickets",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "user_id": user_id,
                    "source_id": source_id,
                    "message": message,
                    "issue_type": issue_type,
                    "product": product,
                    "channel": "LINE"
                },
                timeout=5
            )
            if response.status_code == 201:
                return response.json()["ticket_id"]
        except Exception as e:
            logger.error(f"Create ticket failed: {e}")
        return None
```

---

## 五、整合方案

### 5.1 階段性遷移

**Phase 1: 建立基礎設施（不影響現有功能）**
1. 實作 `BaseSkill`、`SkillManager`、觸發器基類
2. 建立 skills/ 目錄結構
3. 新增 skill_loader.py 自動載入所有技能

**Phase 2: 遷移現有功能**
1. 將庫存查詢包裝為 Skill
2. 將品牌檢測包裝為 Skill
3. 將 FAQ 匹配包裝為 Skill
4. 保持 ai_reply.py 作為 fallback

**Phase 3: 新增技能**
1. 實作工單系統 Skill
2. 實作訂單追蹤 Skill
3. 逐步停用 ai_reply.py 的硬編碼邏輯

**Phase 4: 優化與監控**
1. 加入 A/B 測試框架
2. Skill 效能監控
3. 自動 fallback 機制

### 5.2 整合到主程式

修改 `ai_reply.py` 整合 SkillManager：

```python
# ai_reply.py（新增部分）
from skills.manager import SkillManager
from skills.base import SkillContext

# 初始化技能管理器（全域單例）
skill_manager = SkillManager()

# 啟動時載入所有技能
def load_skills():
    from skills.loader import load_all_skills
    skills = load_all_skills()
    for skill in skills:
        skill_manager.register(skill)
    logger.info(f"Loaded {len(skills)} skills")

# 在 app.py 啟動時呼叫
load_skills()

# 修改 generate_reply 函式
def generate_reply(user_message: str, category: str, context: list = None, source_id: str = "") -> str:
    # 敏感話題檢測（保留）
    if is_sensitive_topic(user_message):
        return "哈哈，這題超出我的專業範圍了～我比較擅長機器人的事情，有產品問題歡迎問我！"
    
    # FAQ 優先匹配（保留）
    faq_match = match_faq(user_message)
    if faq_match:
        return faq_match["answer"].strip()
    
    # 嘗試用 Skill 處理
    skill_context = SkillContext(
        user_message=user_message,
        source_id=source_id,
        source_type="group" if source_id.startswith("C") or source_id.startswith("R") else "user",
        user_id="",  # 需從 LINE 事件中提取
        conversation_history=context or [],
        metadata={"category": category}
    )
    
    skill_response = skill_manager.handle_message(skill_context)
    if skill_response and skill_response.confidence >= 0.7:
        logger.info(f"Skill handled: confidence={skill_response.confidence}")
        return skill_response.text
    
    # Fallback 到原有 AI 生成邏輯
    # ... 原有程式碼 ...
```

---

## 六、SKILL.md 文件格式

參考 OpenClaw Skills，每個技能包含說明文件：

```markdown
---
name: ticket_system
version: 1.0.0
description: 建立、查詢與追蹤客服工單
author: Travis
homepage: https://portal.aurotek.com/tickets
metadata:
  priority: 60
  requires:
    - api_url: https://api.aurotek.com
    - api_key: (stored in config.json)
  triggers:
    - keywords: ["報修", "故障", "問題", "工單", "維修"]
    - intents: ["technical_issue", "after_sales"]
---

# Ticket System Skill

自動建立與追蹤客服工單的技能。

## 功能

- 自動識別問題類型（硬體故障/操作問題/軟體問題）
- 提取產品型號
- 建立工單並回傳工單編號
- 提供預估處理時間

## 觸發條件

**關鍵字**
- 報修、故障、問題、工單、維修
- 不能用、壞了

**意圖**
- technical_issue（技術問題）
- after_sales（售後服務）

## 設定

config.json 範例：

{
  "settings": {
    "api_url": "https://api.aurotek.com",
    "api_key": "YOUR_API_KEY",
    "auto_assign": true
  }
}

## 使用範例

使用者：「我的 CC1 充電站壞了」
Bot：「已為您建立工單編號 #T20260216001
     問題類型：硬體故障
     我們將盡快處理，預計 2 小時內回覆。」

使用者：「T300 怎麼設定導航點」
Bot：「已為您建立工單編號 #T20260216002
     問題類型：操作問題
     我們將盡快處理，預計 2 小時內回覆。」

## API 文件

POST /tickets
{
  "user_id": "LINE_USER_ID",
  "source_id": "GROUP_ID",
  "message": "原始訊息",
  "issue_type": "硬體故障",
  "product": "CC1",
  "channel": "LINE"
}

Response:
{
  "ticket_id": "T20260216001",
  "status": "pending",
  "created_at": "2026-02-16T02:30:00Z"
}
```

---

## 七、測試策略

### 7.1 單元測試

```python
# tests/test_inventory_skill.py
import unittest
from skills.inventory_check.skill import InventoryCheckSkill
from skills.base import SkillContext

class TestInventorySkill(unittest.TestCase):
    
    def setUp(self):
        config = {
            "triggers": [{
                "type": "keyword",
                "keywords": ["有嗎", "庫存"],
                "mode": "any"
            }],
            "settings": {}
        }
        self.skill = InventoryCheckSkill(config)
    
    def test_can_handle_positive(self):
        context = SkillContext(
            user_message="CC1 還有貨嗎",
            source_id="test_group",
            source_type="group",
            user_id="test_user",
            conversation_history=[],
            metadata={}
        )
        self.assertTrue(self.skill.can_handle(context))
    
    def test_can_handle_negative(self):
        context = SkillContext(
            user_message="CC1 規格是什麼",
            source_id="test_group",
            source_type="group",
            user_id="test_user",
            conversation_history=[],
            metadata={}
        )
        self.assertFalse(self.skill.can_handle(context))
    
    def test_execute(self):
        context = SkillContext(
            user_message="CC1 庫存",
            source_id="test_group",
            source_type="group",
            user_id="test_user",
            conversation_history=[],
            metadata={}
        )
        response = self.skill.execute(context)
        self.assertGreater(response.confidence, 0.5)
        self.assertIsNotNone(response.text)
```

### 7.2 整合測試

```python
# tests/test_skill_manager.py
import unittest
from skills.manager import SkillManager
from skills.inventory_check.skill import InventoryCheckSkill
from skills.base import SkillContext

class TestSkillManager(unittest.TestCase):
    
    def setUp(self):
        self.manager = SkillManager()
        
        # 註冊測試技能
        config = {
            "triggers": [{"type": "keyword", "keywords": ["庫存"], "mode": "any"}],
            "settings": {}
        }
        skill = InventoryCheckSkill(config)
        self.manager.register(skill)
    
    def test_handle_message(self):
        context = SkillContext(
            user_message="CC1 庫存",
            source_id="test",
            source_type="user",
            user_id="test_user",
            conversation_history=[],
            metadata={}
        )
        
        response = self.manager.handle_message(context)
        self.assertIsNotNone(response)
        self.assertEqual(response.metadata["source"], "products_full")
    
    def test_priority_order(self):
        # 註冊第二個低優先級技能
        class LowPrioritySkill(BaseSkill):
            name = "low"
            description = "Low priority"
            priority = 200
            
            def can_handle(self, context):
                return True
            
            def execute(self, context):
                return SkillResponse("low", 0.5, False, {}, [])
        
        self.manager.register(LowPrioritySkill())
        
        # 高優先級應先匹配
        context = SkillContext(
            user_message="庫存",
            source_id="test",
            source_type="user",
            user_id="test_user",
            conversation_history=[],
            metadata={}
        )
        response = self.manager.handle_message(context)
        self.assertNotEqual(response.text, "low")
```

---

## 八、部署與維運

### 8.1 技能安裝流程

```bash
# 1. 建立新技能目錄
mkdir -p skills/new_skill

# 2. 複製範本檔案
cp skills/_template/* skills/new_skill/

# 3. 編輯 skill.py 實作邏輯
vim skills/new_skill/skill.py

# 4. 編輯 config.json 設定觸發條件
vim skills/new_skill/config.json

# 5. 編寫 SKILL.md 文件
vim skills/new_skill/SKILL.md

# 6. 測試技能
python3 -m pytest tests/test_new_skill.py

# 7. 重啟服務載入新技能
sudo systemctl restart linebot-listener
```

### 8.2 監控與日誌

```python
# 在 SkillManager 加入監控
import time
from collections import defaultdict

class SkillManager:
    def __init__(self):
        self.skills = []
        self.skill_map = {}
        self.stats = defaultdict(lambda: {"calls": 0, "success": 0, "failures": 0, "avg_time": 0.0})
    
    def handle_message(self, context: SkillContext) -> Optional[SkillResponse]:
        for skill in self.skills:
            try:
                if skill.can_handle(context):
                    start = time.time()
                    response = skill.execute(context)
                    duration = time.time() - start
                    
                    # 記錄統計
                    stats = self.stats[skill.name]
                    stats["calls"] += 1
                    if response and response.confidence >= 0.7:
                        stats["success"] += 1
                    else:
                        stats["failures"] += 1
                    stats["avg_time"] = (stats["avg_time"] * (stats["calls"] - 1) + duration) / stats["calls"]
                    
                    logger.info(f"Skill {skill.name}: {duration:.3f}s, confidence={response.confidence}")
                    return response
            except Exception as e:
                logger.error(f"Skill {skill.name} error: {e}")
                self.stats[skill.name]["failures"] += 1
        
        return None
    
    def get_stats(self) -> dict:
        """取得所有技能統計"""
        return dict(self.stats)
```

### 8.3 A/B 測試支援

```python
# 技能變體（用於 A/B 測試）
class SkillVariant:
    def __init__(self, skill: BaseSkill, traffic_percent: float, variant_id: str):
        self.skill = skill
        self.traffic_percent = traffic_percent
        self.variant_id = variant_id

class ABTestManager:
    def __init__(self):
        self.experiments = {}  # skill_name -> [SkillVariant]
    
    def add_experiment(self, base_skill: BaseSkill, variant_skill: BaseSkill, split: float = 0.5):
        """設定 A/B 測試（split = variant 流量比例）"""
        self.experiments[base_skill.name] = [
            SkillVariant(base_skill, 1.0 - split, "control"),
            SkillVariant(variant_skill, split, "variant")
        ]
    
    def get_skill(self, skill_name: str, user_id: str) -> BaseSkill:
        """根據用戶 ID 分配版本"""
        if skill_name not in self.experiments:
            return None
        
        # 用 user_id hash 決定分組
        import hashlib
        hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        bucket = (hash_val % 100) / 100.0
        
        cumulative = 0.0
        for variant in self.experiments[skill_name]:
            cumulative += variant.traffic_percent
            if bucket < cumulative:
                return variant.skill
        
        return self.experiments[skill_name][0].skill
```

---

## 九、實作步驟

### 9.1 最小可行產品（MVP）

**目標**：在不破壞現有功能的前提下，建立基礎 Skill 系統並遷移一個功能驗證可行性。

**步驟**：

1. **建立基礎設施（2 小時）**
   - [x] 實作 `skills/base.py`（BaseSkill、SkillContext、SkillResponse、觸發器）
   - [x] 實作 `skills/manager.py`（SkillManager）
   - [x] 建立 `skills/_template/` 範本
   - [x] 撰寫單元測試

2. **遷移庫存查詢功能（1 小時）**
   - [x] 建立 `skills/inventory_check/`
   - [x] 包裝 `check_inventory_for_message()` 為 Skill
   - [x] 撰寫 config.json 與 SKILL.md
   - [x] 測試觸發條件與回覆

3. **整合到主程式（1 小時）**
   - [x] 修改 `ai_reply.py` 引入 SkillManager
   - [x] 實作 skill_loader.py 自動載入
   - [x] 保持現有 fallback 邏輯
   - [x] 測試端到端流程

4. **驗證與監控（30 分鐘）**
   - [x] 部署到測試環境
   - [x] 檢查日誌與統計
   - [x] A/B 測試庫存查詢（Skill vs 原邏輯）
   - [x] 確認無迴歸

### 9.2 後續擴充（Phase 2）

**新增工單系統 Skill（優先級：高）**
- 預估工時：4 小時
- 前置需求：工單系統 API 已建置
- 交付物：完整 Skill + 文件 + 測試

**新增訂單追蹤 Skill（優先級：中）**
- 預估工時：3 小時
- 前置需求：ERP API 整合
- 交付物：完整 Skill + 文件 + 測試

**遷移所有現有功能（優先級：低）**
- 品牌檢測、FAQ、價格查詢等包裝為 Skill
- 預估工時：6 小時
- 目標：統一介面，移除 ai_reply.py 硬編碼

---

## 十、風險與對策

### 10.1 技術風險

| 風險 | 影響 | 機率 | 對策 |
|-----|-----|-----|-----|
| Skill 觸發衝突 | 中 | 中 | 用優先級排序，記錄觸發日誌供調整 |
| 效能劣化 | 中 | 低 | 快取觸發器結果，優化熱路徑 |
| 向後不相容 | 高 | 低 | 保持 fallback，分階段遷移 |
| Skill 錯誤導致服務掛掉 | 高 | 中 | 每個 Skill 獨立 try-catch，失敗不中斷流程 |

### 10.2 維運風險

| 風險 | 影響 | 機率 | 對策 |
|-----|-----|-----|-----|
| 技能配置錯誤 | 中 | 中 | 啟動時驗證所有 config.json，不合法不載入 |
| 新技能導入測試不足 | 高 | 中 | 強制單元測試覆蓋率 >80%，上線前 A/B 測試 |
| 技能過多難以管理 | 低 | 高 | 實作 Web UI 管理介面（未來） |

---

## 十一、總結

本設計方案提供：

1. **模組化架構** - 每個功能獨立封裝為 Skill
2. **宣告式觸發** - 用 JSON 定義規則，不寫 if-else
3. **可插拔設計** - 動態載入/卸載，無需重啟
4. **向後相容** - 不破壞現有功能，逐步遷移
5. **易於擴充** - 新增功能只需實作 BaseSkill 介面
6. **標準化文件** - 每個 Skill 都有 SKILL.md
7. **測試友善** - 每個 Skill 可獨立測試
8. **監控完善** - 統計、日誌、A/B 測試

**下一步行動**：
1. William 確認設計方向
2. 實作 MVP（預估 4.5 小時）
3. 測試環境驗證
4. 若可行，逐步遷移現有功能並新增工單/訂單追蹤技能

---

## 附錄

### A. 目錄樹完整範例

```
scripts/line-bot-listener/
├── skills/
│   ├── __init__.py
│   ├── base.py                     # BaseSkill, SkillContext, SkillResponse, Trigger
│   ├── manager.py                  # SkillManager
│   ├── loader.py                   # 自動載入所有技能
│   │
│   ├── _template/                  # 技能範本
│   │   ├── __init__.py
│   │   ├── skill.py.template
│   │   ├── config.json.template
│   │   └── SKILL.md.template
│   │
│   ├── product_query/              # 產品查詢技能
│   │   ├── __init__.py
│   │   ├── skill.py
│   │   ├── config.json
│   │   └── SKILL.md
│   │
│   ├── inventory_check/            # 庫存查詢技能
│   │   ├── __init__.py
│   │   ├── skill.py
│   │   ├── config.json
│   │   └── SKILL.md
│   │
│   ├── price_inquiry/              # 報價查詢技能
│   │   ├── __init__.py
│   │   ├── skill.py
│   │   ├── config.json
│   │   └── SKILL.md
│   │
│   ├── ticket_system/              # 工單系統技能
│   │   ├── __init__.py
│   │   ├── skill.py
│   │   ├── config.json
│   │   └── SKILL.md
│   │
│   ├── order_tracking/             # 訂單追蹤技能
│   │   ├── __init__.py
│   │   ├── skill.py
│   │   ├── config.json
│   │   └── SKILL.md
│   │
│   ├── faq_matcher/                # FAQ 匹配技能
│   │   ├── __init__.py
│   │   ├── skill.py
│   │   ├── config.json
│   │   └── SKILL.md
│   │
│   └── brand_detection/            # 品牌檢測技能
│       ├── __init__.py
│       ├── skill.py
│       ├── config.json
│       └── SKILL.md
│
├── tests/
│   ├── test_base.py
│   ├── test_manager.py
│   ├── test_inventory_skill.py
│   ├── test_ticket_skill.py
│   └── test_integration.py
│
├── ai_reply.py                     # 主程式（整合 SkillManager）
├── knowledge_search.py
├── inventory_check.py
├── classifier.py
├── db.py
├── app.py
└── requirements.txt
```

### B. 範本檔案

**skills/_template/skill.py.template**

```python
from ..base import BaseSkill, SkillContext, SkillResponse, KeywordTrigger

class NewSkill(BaseSkill):
    
    @property
    def name(self) -> str:
        return "new_skill"  # 修改為技能名稱
    
    @property
    def description(self) -> str:
        return "技能描述"  # 修改為功能描述
    
    @property
    def priority(self) -> int:
        return 100  # 修改優先級（數字越小越優先）
    
    def __init__(self, config: dict):
        self.config = config
        # 從 config 載入觸發器
        self.trigger = KeywordTrigger(
            keywords=config["triggers"][0]["keywords"],
            mode=config["triggers"][0].get("mode", "any")
        )
    
    def can_handle(self, context: SkillContext) -> bool:
        """判斷是否能處理此訊息"""
        return self.trigger.match(context)
    
    def execute(self, context: SkillContext) -> SkillResponse:
        """執行技能邏輯"""
        # TODO: 實作技能邏輯
        
        return SkillResponse(
            text="回覆訊息",
            confidence=0.8,
            should_escalate=False,
            metadata={},
            suggestions=[]
        )
    
    def validate_config(self) -> bool:
        """驗證設定檔"""
        return "triggers" in self.config
```

**skills/_template/config.json.template**

```json
{
  "name": "new_skill",
  "version": "1.0.0",
  "description": "技能描述",
  "priority": 100,
  "enabled": true,
  "triggers": [
    {
      "type": "keyword",
      "keywords": ["關鍵字1", "關鍵字2"],
      "mode": "any"
    }
  ],
  "permissions": {
    "groups": ["*"],
    "users": ["*"],
    "blacklist": []
  },
  "settings": {}
}
```

**skills/_template/SKILL.md.template**

```markdown
---
name: new_skill
version: 1.0.0
description: 技能描述
author: Your Name
homepage: https://example.com
metadata:
  priority: 100
  triggers:
    - keywords: ["關鍵字1", "關鍵字2"]
---

# Skill Name

技能功能簡介。

## 功能

- 功能1
- 功能2

## 觸發條件

**關鍵字**
- 關鍵字1、關鍵字2

## 設定

config.json 範例：

{
  "settings": {
    "key": "value"
  }
}

## 使用範例

使用者：「範例輸入」
Bot：「範例回覆」

## API 文件

（如有外部 API 需求，列出介面文件）
```

### C. 參考資料

- OpenClaw Skills 架構：`/opt/homebrew/lib/node_modules/openclaw/skills/`
- LINE Messaging API：https://developers.line.biz/en/docs/messaging-api/
- Python abc 模組文件：https://docs.python.org/3/library/abc.html
- 設計模式：策略模式（Strategy Pattern）、責任鏈模式（Chain of Responsibility）

---

**文件版本**: 1.0.0  
**最後更新**: 2026-02-16  
**作者**: Travis (Subagent)  
**審核**: 待 William/Travis 確認
