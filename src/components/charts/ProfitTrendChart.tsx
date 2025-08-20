"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartContainer } from './ChartContainer'
import type { ProfitTrendData } from '@/types/hattrick'

export interface ProfitTrendChartProps {
  data: ProfitTrendData[]
  loading?: boolean
  error?: string
  className?: string
}

export function ProfitTrendChart({ data, loading, error, className }: ProfitTrendChartProps) {
  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date + '-01').toLocaleDateString('en-US', { 
      month: 'short', 
      year: '2-digit' 
    })
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{
      value: number
      dataKey: string
      payload: any
      color: string
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.dataKey === 'cumulativeProfit' ? 'Total' : 'Monthly'}:</span>
              <span className={entry.value >= 0 ? 'text-profit' : 'text-loss'}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          <div className="text-xs text-muted-foreground mt-1">
            Transactions: {payload[0]?.payload?.transactionCount || 0}
          </div>
        </div>
      )
    }
    return null
  }

  const emptyState = (
    <div className="text-center">
      <p className="text-muted-foreground">No profit data available</p>
      <p className="text-sm text-muted-foreground mt-1">Complete some transactions to see trends</p>
    </div>
  )

  return (
    <ChartContainer
      title="Profit Trends"
      description="Monthly and cumulative profit performance over time"
      loading={loading}
      error={error}
      emptyState={data.length === 0 ? emptyState : undefined}
      className={className}
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="formattedDate" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="monthlyProfit" 
              stroke="hsl(262 83% 58%)" 
              strokeWidth={2}
              name="Monthly Profit"
              dot={{ fill: 'hsl(262 83% 58%)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="cumulativeProfit" 
              stroke="hsl(32 95% 56%)" 
              strokeWidth={2}
              name="Cumulative Profit"
              dot={{ fill: 'hsl(32 95% 56%)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}