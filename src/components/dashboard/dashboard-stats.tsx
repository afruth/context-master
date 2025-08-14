'use client'

import * as React from 'react'
import { CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePersonalTodos } from '@/hooks/use-todos'
import { useTeams } from '@/hooks/use-teams'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
}

function StatCard({ title, value, description, icon, trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {description && <span>{description}</span>}
          {trend && (
            <Badge 
              variant={trend.isPositive ? "success" : "secondary"}
              className="text-xs"
            >
              <TrendingUp className={`h-3 w-3 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`} />
              {Math.abs(trend.value)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardStats() {
  const { data: todosData, isLoading: todosLoading } = usePersonalTodos({ limit: 100 })
  const { data: teamsData, isLoading: teamsLoading } = useTeams({ limit: 20 })

  const todos = todosData?.data || []
  const teams = teamsData?.data || []

  // Calculate stats
  const totalTodos = todos.length
  const completedTodos = todos.filter(todo => todo.status === 'COMPLETED').length
  const inProgressTodos = todos.filter(todo => todo.status === 'IN_PROGRESS').length
  const overdueTodos = todos.filter(todo => 
    todo.status !== 'COMPLETED' && 
    todo.dueDate && 
    new Date(todo.dueDate) < new Date()
  ).length
  
  const totalTimeSpent = todos.reduce((acc, todo) => 
    acc + (todo.timeEntries?.totalTime || 0), 0
  )

  const activeTeams = teams.length
  
  // Format time in hours and minutes
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Tasks"
        value={totalTodos}
        description={`${completedTodos} completed`}
        icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
        loading={todosLoading}
      />
      
      <StatCard
        title="In Progress"
        value={inProgressTodos}
        description="Active tasks"
        icon={<Clock className="h-4 w-4 text-blue-500" />}
        loading={todosLoading}
      />
      
      <StatCard
        title="Overdue"
        value={overdueTodos}
        description="Need attention"
        icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        loading={todosLoading}
      />
      
      <StatCard
        title="Time Tracked"
        value={formatTime(totalTimeSpent)}
        description={`${completionRate}% completion rate`}
        icon={<Clock className="h-4 w-4 text-green-500" />}
        loading={todosLoading}
      />
    </div>
  )
}