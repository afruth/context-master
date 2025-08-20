"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartContainer } from './ChartContainer'
import type { PositionStats } from '@/types/hattrick'

export interface PositionPerformanceChartProps {
  data: PositionStats[]
  loading?: boolean
  error?: string
  className?: string
}

export function PositionPerformanceChart({ data, loading, error, className }: PositionPerformanceChartProps) {
  const chartData = data.map(item => ({
    position: item.position,
    totalProfit: item.totalProfit,
    averageProfit: item.averageProfit,
    playerCount: item.playerCount,
    successRate: item.successRate,
    holdingPeriod: item.averageHoldingPeriod
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
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Players:</span>
              <span>{data.playerCount}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total Profit:</span>
              <span className={data.totalProfit >= 0 ? 'text-profit' : 'text-loss'}>
                {formatCurrency(data.totalProfit)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Avg Profit:</span>
              <span className={data.averageProfit >= 0 ? 'text-profit' : 'text-loss'}>
                {formatCurrency(data.averageProfit)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Success Rate:</span>
              <span>{data.successRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Avg Holding:</span>
              <span>{data.holdingPeriod} weeks</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const emptyState = (
    <div className="text-center">
      <p className="text-muted-foreground">No position data available</p>
      <p className="text-sm text-muted-foreground mt-1">Complete transactions to see position performance</p>
    </div>
  )

  return (
    <ChartContainer
      title="Position Performance"
      description="Profit and performance metrics by player position"
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
              dataKey="position" 
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
              dataKey="totalProfit" 
              fill="hsl(188 86% 53%)" 
              name="Total Profit"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="averageProfit" 
              fill="hsl(338 84% 57%)" 
              name="Average Profit"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}