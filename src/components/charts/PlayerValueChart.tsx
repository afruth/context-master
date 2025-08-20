"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer } from './ChartContainer'
import type { PlayerValueDistribution } from '@/types/hattrick'

export interface PlayerValueChartProps {
  data: PlayerValueDistribution[]
  loading?: boolean
  error?: string
  className?: string
}

export function PlayerValueChart({ data, loading, error, className }: PlayerValueChartProps) {
  // Use the provided player value distribution data
  const chartData = data.map(item => ({
    range: item.range,
    count: item.count,
    totalValue: item.totalValue,
    averageValue: item.count > 0 ? item.totalValue / item.count : 0
  }))

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
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label} Value Range</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Players:</span>
              <span>{data.count}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total Value:</span>
              <span>{formatCurrency(data.totalValue)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Avg Value:</span>
              <span>{formatCurrency(data.averageValue)}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const emptyState = (
    <div className="text-center">
      <p className="text-muted-foreground">No value distribution data available</p>
      <p className="text-sm text-muted-foreground mt-1">Complete transactions to see value analysis</p>
    </div>
  )

  return (
    <ChartContainer
      title="Player Value Distribution"
      description="Performance analysis by player purchase value ranges"
      loading={loading}
      error={error}
      emptyState={chartData.length === 0 ? emptyState : undefined}
      className={className}
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="range" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="profit"
              orientation="left"
              tickFormatter={formatCurrency}
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="count"
              orientation="right"
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              yAxisId="profit"
              dataKey="totalValue" 
              fill="hsl(262 83% 58%)" 
              name="Total Value"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              yAxisId="count"
              dataKey="count" 
              fill="hsl(188 86% 53%)" 
              name="Player Count"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}