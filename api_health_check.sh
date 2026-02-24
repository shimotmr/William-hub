#!/bin/bash

# William Hub API 健康檢查腳本
echo "🔍 William Hub 全面 API 健康檢查"
echo "=================================="

BASE_URL="http://localhost:3001"

# 測試的 API 端點
declare -a apis=(
    "/api/board|Task Board API"
    "/api/reports|Reports API" 
    "/api/model-usage|Model Usage API"
    "/api/rules|SOP Rules API"
    "/api/dashboard|Dashboard API"
    "/api/growth|Growth API"
    "/api/agents|Agents API"
    "/api/system-status|System Status API"
    "/api/token-stats|Token Stats API"
)

# 檢查每個 API
for api_info in "${apis[@]}"; do
    IFS='|' read -r endpoint name <<< "$api_info"
    
    printf "%-25s: " "$name"
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    
    if [ "$status" = "200" ]; then
        echo "✅ OK ($status)"
    else
        echo "❌ FAIL ($status)"
    fi
done

echo ""
echo "🔍 頁面可用性檢查"
echo "=================="

# 測試的頁面
declare -a pages=(
    "/|首頁"
    "/board|Task Board"
    "/reports|Reports"
    "/model-usage|Model Usage"
    "/rules|SOP Rules"
    "/dashboard|Dashboard"
    "/trade|Trading System"
    "/growth|Growth"
    "/rag-testing|RAG Testing"
)

# 檢查每個頁面
for page_info in "${pages[@]}"; do
    IFS='|' read -r path name <<< "$page_info"
    
    printf "%-25s: " "$name"
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    
    if [ "$status" = "200" ]; then
        echo "✅ OK ($status)"
    else
        echo "❌ FAIL ($status)"
    fi
done