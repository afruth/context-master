"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartContainer } from './ChartContainer'
import type { MonthlyProfitData } from '@/types/hattrick'

export interface ProfitLossComparisonChartProps {
  data: MonthlyProfitData[]
  loading?: boolean
  error?: string
  className?: string
}

export function ProfitLossComparisonChart({ data, loading, error, className }: ProfitLossComparisonChartProps) {
  const chartData = data.map(item => {
    // Separate positive and negative profits for better visualization
    const profit = item.totalProfit > 0 ? item.totalProfit : 0
    const loss = item.totalProfit < 0 ? Math.abs(item.totalProfit) : 0
    
    return {
      month: item.month.substring(0, 3),
      year: item.year,
      profit,
      loss,
      transactions: item.transactionCount
    }
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const netProfit = data.profit - data.loss
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label} {data.year}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Profit:</span>
              <span className="text-green-600">{formatCurrency(data.profit)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Loss:</span>
              <span className="text-red-600">{formatCurrency(data.loss)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-1">
              <span className="text-muted-foreground font-medium">Net:</span>
              <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(netProfit)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Transactions:</span>
              <span>{data.transactions}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const emptyState = (
    <div className="text-center">
      <p className="text-muted-foreground">No profit/loss data available</p>
      <p className="text-sm text-muted-foreground mt-1">Complete transactions to see comparison</p>
    </div>
  )

  return (
    <ChartContainer
      title="Profit vs Loss Analysis"
      description="Monthly breakdown of profitable and loss-making transactions"
      loading={loading}
      error={error}
      emptyState={data.length === 0 ? emptyState : undefined}
      className={className}
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
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
            <Bar 
              dataKey="profit" 
              fill="#10b981" 
              name="Profit"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="loss" 
              fill="#ef4444" 
              name="Loss"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}