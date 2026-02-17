import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import { NextResponse } from 'next/server'

const execAsync = promisify(exec)

export interface RuleItem {
  name: string
  level: 'RED' | 'YELLOW' | 'GREEN'
  status: 'complete' | 'partial' | 'dead'
  statusIcon: string
  bindingScore: number
  maxScore: number
  hasBindingSection: boolean
  hasTrigger: boolean
  hasExecutor: boolean
  hasVerification: boolean
  missingElements: string[]
  lastExecuted?: string
}

export interface RuleSummary {
  totalRules: number
  completeBinding: number
  partialBinding: number
  deadRules: number
  complianceRate: number
  lastScanTime: string
  rules: RuleItem[]
}

// 從規則名稱推測層級（基於規則分級標準）
function inferRuleLevel(fileName: string, content: string): 'RED' | 'YELLOW' | 'GREEN' {
  // 檢查文件內容中的明確標記
  if (content.includes('RED-LEVEL:') || content.includes('🔴')) return 'RED'
  if (content.includes('YELLOW-LEVEL:') || content.includes('🟡')) return 'YELLOW'
  if (content.includes('GREEN-LEVEL:') || content.includes('🟢')) return 'GREEN'
  
  // 基於檔案名稱推測
  const lowercaseName = fileName.toLowerCase()
  
  // 紅級關鍵字
  if (lowercaseName.includes('rate-limit') || 
      lowercaseName.includes('deployment') || 
      lowercaseName.includes('security') ||
      lowercaseName.includes('backup') ||
      lowercaseName.includes('emergency')) {
    return 'RED'
  }
  
  // 黃級關鍵字
  if (lowercaseName.includes('review') || 
      lowercaseName.includes('monitor') ||
      lowercaseName.includes('report') ||
      lowercaseName.includes('task') ||
      lowercaseName.includes('extraction')) {
    return 'YELLOW'
  }
  
  // 預設為綠級
  return 'GREEN'
}

// 解析合規報告
function parseComplianceReport(reportPath: string): RuleSummary {
  try {
    const content = fs.readFileSync(reportPath, 'utf-8')
    const rules: RuleItem[] = []
    
    // 提取掃描時間
    const timeMatch = content.match(/\*\*掃描時間\*\*: (.+)/)
    const lastScanTime = timeMatch ? timeMatch[1] : new Date().toISOString()
    
    // 提取統計數據
    const completeMatch = content.match(/✅ 完整綁定 \| (\d+) \|/)
    const partialMatch = content.match(/⚠️ 部分綁定 \| (\d+) \|/)
    const deadMatch = content.match(/❌ Dead Rules \| (\d+) \|/)
    const totalMatch = content.match(/\*\*總計\*\* \| \*\*(\d+)\*\* \|/)
    
    const completeBinding = completeMatch ? parseInt(completeMatch[1]) : 0
    const partialBinding = partialMatch ? parseInt(partialMatch[1]) : 0
    const deadRules = deadMatch ? parseInt(deadMatch[1]) : 0
    const totalRules = totalMatch ? parseInt(totalMatch[1]) : 0
    
    const complianceRate = totalRules > 0 ? (completeBinding / totalRules) * 100 : 0
    
    // 解析各個規則的詳細信息
    const ruleRegex = /### (✅|⚠️|❌) (.+?) \((.+?)\)\n\n\*\*綁定評分\*\*: (\d+)\/(\d+)\n\n- 執行綁定段落: (✓|✗)\n- 觸發點定義: (✓|✗)\n- 執行者指定: (✓|✗)\n- 驗證機制: (✓|✗)/g
    const ruleMatches = Array.from(content.matchAll(ruleRegex))
    
    for (const match of ruleMatches) {
      const [, icon, fileName, statusText, score, maxScore, binding, trigger, executor, verification] = match
      
      // 讀取原始文件內容來推測層級
      const processesDir = path.join(process.env.HOME || '', 'clawd', 'shared', 'processes')
      const filePath = path.join(processesDir, fileName)
      let fileContent = ''
      try {
        fileContent = fs.readFileSync(filePath, 'utf-8')
      } catch {
        // 文件可能不存在，使用預設值
      }
      
      const rule: RuleItem = {
        name: fileName.replace(/\.(md|txt)$/, ''),
        level: inferRuleLevel(fileName, fileContent),
        status: statusText.includes('完整') ? 'complete' : 
                statusText.includes('部分') ? 'partial' : 'dead',
        statusIcon: icon,
        bindingScore: parseInt(score),
        maxScore: parseInt(maxScore),
        hasBindingSection: binding === '✓',
        hasTrigger: trigger === '✓',
        hasExecutor: executor === '✓',
        hasVerification: verification === '✓',
        missingElements: [],
        lastExecuted: undefined // 這個需要從其他地方取得
      }
      
      // 提取缺失要素
      const ruleSection = content.substring(content.indexOf(match[0]))
      const nextRuleIndex = ruleSection.indexOf('###', 10)
      const ruleContent = nextRuleIndex > 0 ? ruleSection.substring(0, nextRuleIndex) : ruleSection
      
      if (ruleContent.includes('需要新增「執行綁定」段落')) {
        rule.missingElements.push('執行綁定段落')
      }
      if (ruleContent.includes('需要明確定義觸發點')) {
        rule.missingElements.push('觸發點定義')
      }
      if (ruleContent.includes('需要指定執行者')) {
        rule.missingElements.push('執行者指定')
      }
      if (ruleContent.includes('需要定義驗證方式')) {
        rule.missingElements.push('驗證機制')
      }
      
      rules.push(rule)
    }
    
    return {
      totalRules,
      completeBinding,
      partialBinding,
      deadRules,
      complianceRate,
      lastScanTime,
      rules: rules.sort((a, b) => {
        // 按層級排序：RED -> YELLOW -> GREEN
        const levelOrder = { RED: 0, YELLOW: 1, GREEN: 2 }
        const levelDiff = levelOrder[a.level] - levelOrder[b.level]
        if (levelDiff !== 0) return levelDiff
        
        // 同層級按狀態排序：dead -> partial -> complete
        const statusOrder = { dead: 0, partial: 1, complete: 2 }
        return statusOrder[a.status] - statusOrder[b.status]
      })
    }
  } catch (error) {
    console.error('Failed to parse compliance report:', error)
    throw new Error('Failed to parse compliance report', { cause: error })
  }
}

export async function GET() {
  try {
    // 執行合規掃描腳本
    const scriptPath = path.join(process.env.HOME || '', 'clawd', 'scripts', 'rule_compliance_scan.sh')
    
    const { stderr } = await execAsync(`bash "${scriptPath}"`)
    
    if (stderr && !stderr.includes('bc:')) {
      console.warn('Script stderr:', stderr)
    }
    
    // 找到最新的報告文件
    const reportsDir = path.join(process.env.HOME || '', 'clawd', 'reports')
    const reportFiles = fs.readdirSync(reportsDir)
      .filter(f => f.startsWith('rule_compliance_') && f.endsWith('.md'))
      .map(f => ({
        name: f,
        path: path.join(reportsDir, f),
        mtime: fs.statSync(path.join(reportsDir, f)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
    
    if (reportFiles.length === 0) {
      throw new Error('No compliance report found')
    }
    
    const latestReport = reportFiles[0]
    
    // 解析報告
    const summary = parseComplianceReport(latestReport.path)
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error('Error in /api/rules:', error)
    
    // 回傳空的資料結構，避免前端錯誤
    const fallbackData: RuleSummary = {
      totalRules: 0,
      completeBinding: 0,
      partialBinding: 0,
      deadRules: 0,
      complianceRate: 0,
      lastScanTime: new Date().toISOString(),
      rules: []
    }
    
    return NextResponse.json(fallbackData, { 
      status: 200,  // 不回傳 500，讓前端能顯示空狀態
      headers: {
        'X-Error': 'Failed to fetch rules data'
      }
    })
  }
}