/**
 * Risk Management Service
 * Implements risk control checks for trading operations
 */

import { createClient } from '@/lib/supabase-server'

export interface OrderData {
  symbol: string
  action: 'buy' | 'sell'
  price?: number
  quantity: number
  order_type: 'limit' | 'market'
}

export interface RiskCheckResult {
  allowed: boolean
  risk_level: 'low' | 'medium' | 'high'
  warnings: string[]
  blocks: string[]
  limits_used: {
    single_order_percentage: number
    daily_volume_percentage: number
    position_concentration_percentage?: number
  }
}

export interface RiskLimits {
  single_order_limit: number     // 單筆金額上限
  daily_volume_limit: number     // 日累計金額上限
  position_concentration_limit: number // 持倉集中度上限
  max_daily_trades: number       // 每日最大交易筆數
  cool_down_minutes: number      // 冷卻時間
  max_trades_per_cooldown: number // 冷卻期內最大交易次數
}

export class RiskManager {
  /**
   * 獲取用戶風控設定
   */
  async getRiskLimits(userId: string): Promise<RiskLimits> {
    const supabase = await createClient()
    const { data: config } = await supabase
      .from('trade_risk_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!config) {
      // Create default risk config if not exists
      await this.createDefaultRiskConfig(userId)
      return {
        single_order_limit: 1000000,    // 預設 100萬
        daily_volume_limit: 5000000,    // 預設 500萬
        position_concentration_limit: 0.30, // 預設 30%
        max_daily_trades: 100,
        cool_down_minutes: 5,
        max_trades_per_cooldown: 10
      }
    }

    return {
      single_order_limit: config.single_order_limit,
      daily_volume_limit: config.daily_volume_limit,
      position_concentration_limit: config.position_concentration_limit,
      max_daily_trades: config.max_daily_trades,
      cool_down_minutes: config.cool_down_minutes,
      max_trades_per_cooldown: config.max_trades_per_cooldown
    }
  }

  /**
   * 執行風險檢查
   */
  async checkRiskLimits(userId: string, orderData: OrderData): Promise<RiskCheckResult> {
    const limits = await this.getRiskLimits(userId)
    const result: RiskCheckResult = {
      allowed: true,
      risk_level: 'low',
      warnings: [],
      blocks: [],
      limits_used: {
        single_order_percentage: 0,
        daily_volume_percentage: 0,
        position_concentration_percentage: 0
      }
    }

    // 計算委託金額
    const orderPrice = orderData.order_type === 'market' 
      ? await this.getMarketPrice(orderData.symbol)
      : orderData.price || 0
    
    const orderAmount = orderPrice * orderData.quantity * 1000 // 張 -> TWD

    // 1. 單筆金額檢查
    const singleOrderPercentage = (orderAmount / limits.single_order_limit) * 100
    result.limits_used.single_order_percentage = singleOrderPercentage

    if (orderAmount > limits.single_order_limit) {
      result.blocks.push(
        `單筆委託金額 ${this.formatCurrency(orderAmount)} 超過限制 ${this.formatCurrency(limits.single_order_limit)}`
      )
      result.allowed = false
    } else if (singleOrderPercentage > 50) {
      result.warnings.push('大額交易，請謹慎確認')
      result.risk_level = 'medium'
    }

    // 2. 日累計金額檢查
    const todayVolume = await this.getDailyTradingVolume(userId)
    const projectedVolume = todayVolume + orderAmount
    const dailyVolumePercentage = (projectedVolume / limits.daily_volume_limit) * 100
    result.limits_used.daily_volume_percentage = dailyVolumePercentage

    if (projectedVolume > limits.daily_volume_limit) {
      result.blocks.push(
        `當日累計交易量將超過限制 ${this.formatCurrency(limits.daily_volume_limit)}`
      )
      result.allowed = false
    } else if (dailyVolumePercentage > 80) {
      result.warnings.push('接近當日交易量限制')
      result.risk_level = 'high'
    }

    // 3. 持倉集中度檢查 (僅對買入檢查)
    if (orderData.action === 'buy') {
      const concentrationRisk = await this.checkPositionConcentration(
        userId, 
        orderData.symbol, 
        orderAmount, 
        limits.position_concentration_limit
      )
      
      if (concentrationRisk.violation) {
        result.blocks.push(concentrationRisk.message)
        result.allowed = false
      } else if (concentrationRisk.warning) {
        result.warnings.push(concentrationRisk.message)
        result.risk_level = 'high'
      }
      
      result.limits_used.position_concentration_percentage = concentrationRisk.percentage * 100
    }

    // 4. 日交易筆數檢查
    const todayTradeCount = await this.getDailyTradeCount(userId)
    if (todayTradeCount >= limits.max_daily_trades) {
      result.blocks.push(`當日交易筆數已達限制 ${limits.max_daily_trades}`)
      result.allowed = false
    }

    // 5. 頻繁交易檢查
    const recentTradeCount = await this.getRecentTradeCount(userId, limits.cool_down_minutes)
    if (recentTradeCount >= limits.max_trades_per_cooldown) {
      result.blocks.push(
        `${limits.cool_down_minutes}分鐘內交易過於頻繁，請稍後再試 (${recentTradeCount}/${limits.max_trades_per_cooldown})`
      )
      result.allowed = false
    }

    return result
  }

  /**
   * 獲取今日交易量
   */
  private async getDailyTradingVolume(userId: string): Promise<number> {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const { data: orders } = await supabase
      .from('trade_orders')
      .select('quantity, filled_price, price, order_type')
      .eq('user_id', userId)
      .gte('ordered_at', `${today}T00:00:00.000Z`)
      .in('status', ['filled', 'partial'])

    if (!orders) return 0

    return orders.reduce((total, order) => {
      const price = order.filled_price || order.price || 0
      return total + (price * order.quantity * 1000)
    }, 0)
  }

  /**
   * 獲取今日交易筆數
   */
  private async getDailyTradeCount(userId: string): Promise<number> {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('trade_orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('ordered_at', `${today}T00:00:00.000Z`)

    return count || 0
  }

  /**
   * 獲取最近N分鐘內交易筆數
   */
  private async getRecentTradeCount(userId: string, minutes: number): Promise<number> {
    const supabase = await createClient()
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('trade_orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('ordered_at', cutoffTime)

    return count || 0
  }

  /**
   * 檢查持倉集中度
   */
  private async checkPositionConcentration(
    userId: string, 
    symbol: string, 
    newOrderAmount: number, 
    concentrationLimit: number
  ): Promise<{violation: boolean, warning: boolean, message: string, percentage: number}> {
    // 獲取用戶總資產 (簡化版本，實際應該調用帳戶API)
    const totalAssets = await this.getTotalAssets(userId)
    
    // 獲取該股票當前持倉價值
    const currentPositionValue = await this.getPositionValue(userId, symbol)
    
    // 計算新的持倉價值
    const newPositionValue = currentPositionValue + newOrderAmount
    const concentrationPercentage = newPositionValue / totalAssets

    if (concentrationPercentage > concentrationLimit) {
      return {
        violation: true,
        warning: false,
        message: `${symbol} 持倉集中度將達 ${(concentrationPercentage * 100).toFixed(1)}%，超過限制 ${(concentrationLimit * 100).toFixed(1)}%`,
        percentage: concentrationPercentage
      }
    } else if (concentrationPercentage > concentrationLimit * 0.8) {
      return {
        violation: false,
        warning: true,
        message: `${symbol} 持倉集中度將達 ${(concentrationPercentage * 100).toFixed(1)}%，接近限制`,
        percentage: concentrationPercentage
      }
    }

    return {
      violation: false,
      warning: false,
      message: '',
      percentage: concentrationPercentage
    }
  }

  /**
   * 獲取用戶總資產 (簡化版本)
   */
  private async getTotalAssets(_userId: string): Promise<number> {
    // 簡化實作：假設總資產為 1000萬
    // 實際實作應該調用帳戶餘額 + 持倉市值
    return 10000000
  }

  /**
   * 獲取特定股票持倉價值
   */
  private async getPositionValue(userId: string, symbol: string): Promise<number> {
    const supabase = await createClient()
    // 簡化實作：計算該股票的已成交訂單淨值
    // 實際實作應該調用持倉API
    const { data: orders } = await supabase
      .from('trade_orders')
      .select('action, quantity, filled_price, price')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .in('status', ['filled', 'partial'])

    if (!orders) return 0

    let netShares = 0
    let _totalCost = 0

    orders.forEach(order => {
      const shares = order.quantity
      const price = order.filled_price || order.price || 0
      const cost = shares * price * 1000

      if (order.action === 'buy') {
        netShares += shares
        _totalCost += cost
      } else {
        netShares -= shares
        _totalCost -= cost
      }
    })

    // 如果淨持股為正，返回當前市值；否則返回0
    if (netShares > 0) {
      const currentPrice = await this.getMarketPrice(symbol)
      return netShares * currentPrice * 1000
    }
    
    return 0
  }

  /**
   * 獲取市場價格 (簡化版本)
   */
  private async getMarketPrice(symbol: string): Promise<number> {
    const supabase = await createClient()
    const { data: quote } = await supabase
      .from('stock_quotes_cache')
      .select('last_price')
      .eq('symbol', symbol)
      .single()

    return quote?.last_price || 100 // 預設價格100元
  }

  /**
   * 創建預設風控設定
   */
  private async createDefaultRiskConfig(userId: string) {
    const supabase = await createClient()
    await supabase
      .from('trade_risk_config')
      .insert({
        user_id: userId,
        single_order_limit: 1000000,
        daily_volume_limit: 5000000,
        position_concentration_limit: 0.30
      })
  }

  /**
   * 格式化金額顯示
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
}

export const riskManager = new RiskManager()