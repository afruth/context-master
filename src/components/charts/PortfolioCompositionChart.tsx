"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartContainer } from './ChartContainer'
import type { PositionStats } from '@/types/hattrick'

export interface PortfolioCompositionChartProps {
  data: PositionStats[]
  loading?: boolean
  error?: string
  className?: string
}

// Color palette for positions - Vibrant and varied colors (avoiding primary/secondary)
const POSITION_COLORS = [
  'hsl(262 83% 58%)', // Purple
  'hsl(32 95% 56%)', // Orange
  'hsl(338 84% 57%)', // Pink
  'hsl(188 86% 53%)', // Cyan
  'hsl(45 93% 48%)', // Golden Yellow
  'hsl(84 81% 44%)', // Lime Green
  'hsl(14 91% 60%)', // Red Orange
  'hsl(4 78% 56%)', // Loss Red
  'hsl(280 100% 75%)', // Light Purple
  'hsl(160 84% 48%)', // Teal
]

export function PortfolioCompositionChart({ data, loading, error, className }: PortfolioCompositionChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.position,
    value: item.playerCount,
    profit: item.totalProfit,
    averageProfit: item.averageProfit,
    color: POSITION_COLORS[index % POSITION_COLORS.length]
  }))

  const totalPlayers = chartData.reduce((sum, item) => sum + item.value, 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / totalPlayers) * 100).toFixed(1)
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Players:</span>
              <span>{data.value} ({percentage}%)</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total Profit:</span>
              <span className={data.profit >= 0 ? 'text-profit' : 'text-loss'}>
                {formatCurrency(data.profit)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Avg Profit:</span>
              <span className={data.averageProfit >= 0 ? 'text-profit' : 'text-loss'}>
                {formatCurrency(data.averageProfit)}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const emptyState = (
    <div className="text-center">
      <p className="text-muted-foreground">No player data available</p>
      <p className="text-sm text-muted-foreground mt-1">Add players to see portfolio composition</p>
    </div>
  )

  return (
    <ChartContainer
      title="Portfolio Composition"
      description="Current holdings distribution by position"
      loading={loading}
      error={error}
      emptyState={data.length === 0 ? emptyState : undefined}
      className={className}
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}