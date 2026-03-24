#!/usr/bin/env node
/**
 * 供應鏈資料同步腳本 (Task #3819)
 * 從 Timeverse/My-TW-Coverage repo 解析 Markdown → Supabase
 * 
 * 用法: node scripts/sync-supply-chain.mjs
 * 環境變數: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const REPO_URL = 'https://github.com/Timeverse/My-TW-Coverage.git'
const CLONE_DIR = '/tmp/My-TW-Coverage'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 需要 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- Step 1: Clone/Pull repo ---
function cloneRepo() {
  if (fs.existsSync(path.join(CLONE_DIR, '.git'))) {
    console.log('📥 更新 My-TW-Coverage...')
    execSync('git pull', { cwd: CLONE_DIR, stdio: 'pipe' })
  } else {
    console.log('📥 克隆 My-TW-Coverage...')
    execSync(`git clone --depth 1 ${REPO_URL} ${CLONE_DIR}`, { stdio: 'pipe' })
  }
}

// --- Step 2: Parse Markdown ---
function extractWikilinks(text) {
  const matches = text.match(/\[\[([^\]]+)\]\]/g) || []
  return [...new Set(matches.map(m => m.replace(/\[\[|\]\]/g, '')))]
}

function extractSection(text, heading) {
  const regex = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i')
  const match = text.match(regex)
  return match ? match[1].trim() : ''
}

function extractFinancials(text) {
  const section = extractSection(text, '財務概況') || extractSection(text, '財務')
  if (!section) return null
  
  const result = {}
  // Try to extract key metrics from tables or text
  const revenueMatch = section.match(/營收[：:]?\s*([\d,.]+)/i)
  const epsMatch = section.match(/EPS[：:]?\s*([\d,.]+)/i)
  const peMatch = section.match(/本益比[：:]?\s*([\d,.]+)/i) || section.match(/PE[：:]?\s*([\d,.]+)/i)
  const marketCapMatch = section.match(/市值[：:]?\s*([\d,.]+)/i)
  
  if (revenueMatch) result.revenue = revenueMatch[1]
  if (epsMatch) result.eps = epsMatch[1]
  if (peMatch) result.pe_ratio = peMatch[1]
  if (marketCapMatch) result.market_cap = marketCapMatch[1]
  result.raw = section.substring(0, 2000) // Keep raw for display
  
  return Object.keys(result).length > 0 ? result : null
}

function parseMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const filename = path.basename(filePath, '.md')
  
  // Extract ticker and name from first heading: "# 2330 - [[台積電]]" or "# 2330 - 台積電"
  const headingMatch = content.match(/^#\s+(\d{4,6})\s*[-–]\s*(?:\[\[)?([^\]\n]+?)(?:\]\])?\s*$/m)
  if (!headingMatch) return null
  
  const ticker = headingMatch[1]
  const name = headingMatch[2].trim()
  
  // Extract sections
  const overview = extractSection(content, '業務簡介') || extractSection(content, '公司簡介')
  const sectorMatch = content.match(/\*\*板塊[：:]\*\*\s*(.+)/i) || content.match(/板塊[：:]\s*(.+)/i)
  const industryMatch = content.match(/\*\*產業[：:]\*\*\s*(.+)/i) || content.match(/產業[：:]\s*(.+)/i)
  const marketCapMatch = content.match(/\*\*市值[：:]\*\*\s*([\d,.]+)/i)
  
  const upstream = extractSection(content, '供應鏈位置')?.match(/上游[\s\S]*?(?=\*\*下游|$)/i)?.[0] || ''
  const downstream = extractSection(content, '供應鏈位置')?.match(/下游[\s\S]*$/i)?.[0] || ''
  
  const customersSection = extractSection(content, '主要客戶及供應商') || extractSection(content, '主要客戶')
  const customers = extractWikilinks(customersSection.match(/客戶[\s\S]*?(?=###|供應商|$)/i)?.[0] || '')
  const suppliers = extractWikilinks(upstream || (customersSection.match(/供應商[\s\S]*/i)?.[0] || ''))
  
  const wikilinks = extractWikilinks(content)
  const financials = extractFinancials(content)
  
  return {
    ticker,
    name,
    sector: sectorMatch?.[1]?.trim() || null,
    industry: industryMatch?.[1]?.trim() || null,
    market_cap: marketCapMatch ? parseInt(marketCapMatch[1].replace(/,/g, '')) : null,
    business_overview: overview || null,
    financial_summary: financials,
    upstream_text: upstream,
    downstream_text: downstream,
    customers,
    suppliers,
    wikilinks,
    full_content: content,
  }
}

// --- Step 3: Upsert to Supabase ---
async function syncToSupabase(companies) {
  console.log(`📊 同步 ${companies.length} 家公司到 Supabase...`)
  
  // 1. Upsert entities
  const entityMap = new Map() // name -> id
  
  // Batch upsert companies
  for (let i = 0; i < companies.length; i += 50) {
    const batch = companies.slice(i, i + 50).map(c => ({
      entity_type: 'company',
      ticker: c.ticker,
      name: c.name,
      sector: c.sector,
      industry: c.industry,
      market_cap: c.market_cap,
      business_overview: c.business_overview,
      financial_summary: c.financial_summary,
      updated_at: new Date().toISOString(),
    }))
    
    const { data, error } = await supabase
      .from('supply_chain_entities')
      .upsert(batch, { onConflict: 'name', ignoreDuplicates: false })
      .select('id, name, ticker')
    
    if (error) {
      console.error(`❌ Entity batch ${i} error:`, error.message)
      continue
    }
    if (data) data.forEach(e => entityMap.set(e.name, e.id))
    process.stdout.write(`\r  實體: ${Math.min(i + 50, companies.length)}/${companies.length}`)
  }
  console.log()
  
  // Fetch all entity IDs for relationship building
  const { data: allEntities } = await supabase
    .from('supply_chain_entities')
    .select('id, name, ticker')
  if (allEntities) allEntities.forEach(e => entityMap.set(e.name, e.id))
  
  // 2. Upsert docs
  for (let i = 0; i < companies.length; i += 50) {
    const batch = companies.slice(i, i + 50).map(c => ({
      ticker: c.ticker,
      company_name: c.name,
      full_content: c.full_content,
      wikilinks: c.wikilinks,
      updated_at: new Date().toISOString(),
    }))
    
    const { error } = await supabase
      .from('supply_chain_docs')
      .upsert(batch, { onConflict: 'ticker' })
    
    if (error) console.error(`❌ Docs batch ${i} error:`, error.message)
    process.stdout.write(`\r  文檔: ${Math.min(i + 50, companies.length)}/${companies.length}`)
  }
  console.log()
  
  // 3. Build relationships
  const relationships = []
  for (const company of companies) {
    const companyId = entityMap.get(company.name)
    if (!companyId) continue
    
    // Suppliers → company (upstream)
    for (const supplierName of company.suppliers) {
      const supplierId = entityMap.get(supplierName)
      if (supplierId && supplierId !== companyId) {
        relationships.push({
          from_entity_id: supplierId,
          to_entity_id: companyId,
          relationship_type: 'supplier',
          direction: 'upstream',
          strength: 0.70,
        })
      }
    }
    
    // Company → customers (downstream)
    for (const customerName of company.customers) {
      const customerId = entityMap.get(customerName)
      if (customerId && customerId !== companyId) {
        relationships.push({
          from_entity_id: companyId,
          to_entity_id: customerId,
          relationship_type: 'customer',
          direction: 'downstream',
          strength: 0.70,
        })
      }
    }
  }
  
  // Batch upsert relationships
  for (let i = 0; i < relationships.length; i += 50) {
    const batch = relationships.slice(i, i + 50)
    const { error } = await supabase
      .from('supply_chain_relationships')
      .upsert(batch, { onConflict: 'from_entity_id,to_entity_id,relationship_type' })
    
    if (error) console.error(`❌ Rel batch ${i} error:`, error.message)
    process.stdout.write(`\r  關係: ${Math.min(i + 50, relationships.length)}/${relationships.length}`)
  }
  console.log()
  
  console.log(`✅ 同步完成: ${companies.length} 實體, ${relationships.length} 關係`)
}

// --- Main ---
async function main() {
  console.log('🚀 供應鏈資料同步開始')
  
  cloneRepo()
  
  // Find all Markdown files in Pilot_Reports
  const reportsDir = path.join(CLONE_DIR, 'Pilot_Reports')
  if (!fs.existsSync(reportsDir)) {
    console.error('❌ Pilot_Reports 目錄不存在')
    // Try alternative paths
    const altDirs = fs.readdirSync(CLONE_DIR).filter(d => 
      fs.statSync(path.join(CLONE_DIR, d)).isDirectory() && !d.startsWith('.')
    )
    console.log('可用目錄:', altDirs)
    process.exit(1)
  }
  
  const mdFiles = []
  function findMdFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) findMdFiles(fullPath)
      else if (entry.name.endsWith('.md')) mdFiles.push(fullPath)
    }
  }
  findMdFiles(reportsDir)
  
  console.log(`📄 找到 ${mdFiles.length} 個 Markdown 檔案`)
  
  const companies = []
  for (const file of mdFiles) {
    try {
      const parsed = parseMarkdownFile(file)
      if (parsed) companies.push(parsed)
    } catch (e) {
      // Skip unparseable files
    }
  }
  
  console.log(`✅ 成功解析 ${companies.length} 家公司`)
  
  await syncToSupabase(companies)
}

main().catch(e => {
  console.error('❌ 同步失敗:', e.message)
  process.exit(1)
})
