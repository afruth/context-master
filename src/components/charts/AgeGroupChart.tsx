"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartContainer } from './ChartContainer'
import type { AgeGroupStats } from '@/types/hattrick'

export interface AgeGroupChartProps {
  data: AgeGroupStats[]
  loading?: boolean
  error?: string
  className?: string
}

export function AgeGroupChart({ data, loading, error, className }: AgeGroupChartProps) {
  // Sort age groups in logical order
  const sortOrder = ['15-19', '20-24', '25-29', '30-34', '35+']
  const chartData = data
    .sort((a, b) => sortOrder.indexOf(a.ageGroup) - sortOrder.indexOf(b.ageGroup))
    .map(item => ({
      ageGroup: item.ageGroup,
      playerCount: item.playerCount,
      totalProfit: item.totalProfit,
      averageProfit: item.averageProfit,
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
          <p className="font-medium mb-2">Age {label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Players:</span>
              <span>{data.playerCount}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total Profit:</span>
              <span className={data.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(data.totalProfit)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Avg Profit:</span>
              <span className={data.averageProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(data.averageProfit)}
              </span>
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
      <p className="text-muted-foreground">No age group data available</p>
      <p className="text-sm text-muted-foreground mt-1">Complete transactions to see age group analysis</p>
    </div>
  )

  return (
    <ChartContainer
      title="Age Group Analysis"
      description="Performance and profit distribution by player age groups"
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
              dataKey="ageGroup" 
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
            <Legend />
            <Bar 
              yAxisId="profit"
              dataKey="averageProfit" 
              fill="hsl(84 81% 44%)" 
              name="Average Profit"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              yAxisId="count"
              dataKey="playerCount" 
              fill="hsl(45 93% 48%)" 
              name="Player Count"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}