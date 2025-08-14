'use client'

import * as React from 'react'
import { Clock, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { TimeStatsData } from '@/types/time'

interface TimeStatsProps {
  data?: TimeStatsData
}

export function TimeStats({ data }: TimeStatsProps) {
  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0h 0m'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (!data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  const stats = [
    {
      label: 'Today',
      icon: Clock,
      time: formatDuration(data.today?.totalTime || 0),
      earnings: formatCurrency(data.today?.totalEarnings || 0),
      todos: data.today?.completedTodos || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      label: 'This Week',
      icon: TrendingUp,
      time: formatDuration(data.thisWeek?.totalTime || 0),
      earnings: formatCurrency(data.thisWeek?.totalEarnings || 0),
      todos: data.thisWeek?.completedTodos || 0,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      label: 'This Month',
      icon: Target,
      time: formatDuration(data.thisMonth?.totalTime || 0),
      earnings: formatCurrency(data.thisMonth?.totalEarnings || 0),
      todos: data.thisMonth?.completedTodos || 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
  ]

  return (
    <div className="space-y-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            'p-3 rounded-lg border transition-colors',
            stat.bgColor
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <stat.icon className={cn('h-4 w-4', stat.color)} />
              <span className="text-sm font-medium">{stat.label}</span>
            </div>
          </div>
          
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Time</span>
              <span className="font-mono">{stat.time}</span>
            </div>
            
            {stat.earnings !== '$0.00' && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Earnings</span>
                <span className="font-mono">{stat.earnings}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Todos Done</span>
              <span className="font-mono">{stat.todos}</span>
            </div>
          </div>
        </div>
      ))}

      {/* Quick Productivity Insight */}
      {data.today && data.today.totalTime > 0 && (
        <div className="pt-3 border-t">
          <div className="text-xs text-muted-foreground text-center">
            {data.today.completedTodos > 0 ? (
              <>
                You&apos;ve completed {data.today.completedTodos} todo
                {data.today.completedTodos !== 1 ? 's' : ''} today!
                {data.today.totalTime > 0 && (
                  <> Average: {formatDuration(Math.floor(data.today.totalTime / data.today.completedTodos))} per todo</>
                )}
              </>
            ) : (
              'Keep up the great work! Track time to see your productivity insights.'
            )}
          </div>
        </div>
      )}
    </div>
  )
}