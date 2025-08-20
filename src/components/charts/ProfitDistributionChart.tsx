"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { MonthlyProfitData } from '@/types/hattrick'

export interface ProfitDistributionChartProps {
  data: MonthlyProfitData[]
  className?: string
  height?: number
}

export function ProfitDistributionChart({ 
  data, 
  className = "",
  height = 80
}: ProfitDistributionChartProps) {
  const chartData = data.slice(-6).map(item => ({
    month: item.month.substring(0, 3),
    profit: item.totalProfit
  }))

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`
    }
    return `$${value}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      return (
        <div className="bg-background border border-border rounded px-2 py-1 shadow-lg text-xs">
          <p>{label}: {formatCurrency(value)}</p>
        </div>
      )
    }
    return null
  }

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    )
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10 }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="profit" 
            fill="hsl(14 91% 60%)" 
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}