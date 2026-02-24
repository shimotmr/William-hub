// 測試首頁資料載入的簡單腳本
const testHomepageData = async () => {
  console.log('🔍 測試首頁資料載入...')
  
  try {
    // 測試活動任務 API
    const activeResponse = await fetch('http://localhost:3000/api/board?category=active')
    const activeData = await activeResponse.json()
    console.log(`✅ 活動任務: ${activeData.length} 個`)
    
    // 測試完成任務 API  
    const doneResponse = await fetch('http://localhost:3000/api/board?category=done')
    const doneData = await doneResponse.json()
    console.log(`✅ 已完成任務: ${doneData.length} 個`)
    
    // 測試 Token Stats
    const tokenResponse = await fetch('http://localhost:3000/api/token-stats')
    const tokenData = await tokenResponse.json()
    console.log(`Token Stats:`, tokenData)
    
    // 測試 Agents
    const agentsResponse = await fetch('http://localhost:3000/api/agents')
    const agentsData = await agentsResponse.json()
    console.log(`✅ Agents: ${agentsData.length} 個`)
    
    console.log('✅ 所有 API 測試完成')
    
  } catch (error) {
    console.error('❌ 測試失败:', error)
  }
}

// 如果在 Node.js 環境中運行
if (typeof require !== 'undefined') {
  const fetch = require('node-fetch')
  testHomepageData()
}