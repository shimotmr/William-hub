'use client'

import { cn } from '@/lib/utils'

interface StockPriceProps {
  price: number
  change?: number
  size?: 'sm' | 'md' | 'lg'
  showChange?: boolean
  className?: string
}

/**
 * 股價顯示組件
 * 遵循台股慣例：漲紅跌綠
 */
export function StockPrice({ 
  price, 
  change, 
  size = 'md',
  showChange = true,
  className 
}: StockPriceProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  // 決定漲跌顏色 - 台股慣例
  const getChangeColor = (changeValue: number | undefined) => {
    if (changeValue === undefined || changeValue === 0) return 'text-slate-400'
    return changeValue > 0 ? 'text-red-500' : 'text-green-500'  // 漲紅跌綠
  }

  const changeColor = getChangeColor(change)

  return (
    <div className={cn('font-mono', className)}>
      <span className={cn('font-semibold', changeColor, sizeClasses[size])}>
        {price.toFixed(2)}
      </span>
      {showChange && change !== undefined && (
        <span className={cn('ml-1 text-xs', changeColor)}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}
        </span>
      )}
    </div>
  )
}