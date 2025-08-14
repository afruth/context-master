'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar,
  BarChart3,
  Timer,
  Award,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ComponentType<any>
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  progress?: number
  badge?: {
    text: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  className?: string
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  progress,
  badge,
  className,
}: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card className={cn('relative', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Main Value */}
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{value}</div>
            {badge && (
              <Badge variant={badge.variant || 'default'}>
                {badge.text}
              </Badge>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}

          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progress.toFixed(1)}% completion rate
              </p>
            </div>
          )}

          {/* Trend */}
          {trend && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className={cn('text-xs font-medium', getTrendColor())}>
                {trend.value > 0 && trend.direction === 'up' && '+'}
                {trend.value}
              </span>
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface PersonalKPICardsProps {
  data: {
    totalTodos: number
    completedTodos: number
    completionRate: number
    totalTimeSpent: number
    totalSessions: number
    averageSessionTime: number
    averageTimePerDay: number
    workDays: number
  }
  insights?: {
    mostProductiveCategory?: string | null
    averageTodosPerDay: number
    averageCompletionTime: number
  }
}

export function PersonalKPICards({ data, insights }: PersonalKPICardsProps) {
  // Convert seconds to formatted time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDecimalTime = (seconds: number): string => {
    return `${(seconds / 3600).toFixed(1)}h`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Tasks"
        value={data.totalTodos}
        subtitle="Tasks in selected period"
        icon={Target}
        badge={
          data.totalTodos > 0 
            ? { text: `${data.completedTodos} completed`, variant: 'outline' }
            : undefined
        }
      />

      <KPICard
        title="Completion Rate"
        value={`${data.completionRate}%`}
        subtitle="Tasks completed vs created"
        icon={CheckCircle}
        progress={data.completionRate}
        badge={
          data.completionRate >= 75 
            ? { text: 'Excellent', variant: 'default' }
            : data.completionRate >= 50 
            ? { text: 'Good', variant: 'secondary' }
            : { text: 'Needs work', variant: 'destructive' }
        }
      />

      <KPICard
        title="Total Time"
        value={formatDecimalTime(data.totalTimeSpent)}
        subtitle={`${data.totalSessions} sessions tracked`}
        icon={Timer}
        trend={
          data.averageTimePerDay > 0 
            ? {
                value: Math.round(data.averageTimePerDay / 3600 * 10) / 10,
                label: 'hours per day',
                direction: 'neutral' as const
              }
            : undefined
        }
      />

      <KPICard
        title="Avg Session"
        value={formatTime(data.averageSessionTime)}
        subtitle="Average time per session"
        icon={Activity}
        trend={
          insights?.averageTodosPerDay 
            ? {
                value: insights.averageTodosPerDay,
                label: 'tasks per day',
                direction: 'neutral' as const
              }
            : undefined
        }
      />

      {insights?.mostProductiveCategory && (
        <KPICard
          title="Top Category"
          value={insights.mostProductiveCategory}
          subtitle="Most productive category"
          icon={Award}
          className="md:col-span-2 lg:col-span-1"
        />
      )}

      {insights?.averageCompletionTime && insights.averageCompletionTime > 0 && (
        <KPICard
          title="Avg Completion"
          value={formatTime(insights.averageCompletionTime)}
          subtitle="Average time per completed task"
          icon={Clock}
          className="md:col-span-2 lg:col-span-1"
        />
      )}
    </div>
  )
}

interface TeamKPICardsProps {
  data: {
    totalTodos: number
    completedTodos: number
    completionRate: number
    totalTimeSpent: number
    totalSessions: number
    averageSessionTime: number
    averageTimePerDay: number
    workDays: number
  }
  team: {
    id: string
    name: string
    memberCount: number
  }
  insights?: {
    mostActiveCategory?: string | null
    mostActiveUser?: string | null
    averageTodosPerDay: number
    averageCompletionTime: number
    teamVelocity: number
  }
}

export function TeamKPICards({ data, team, insights }: TeamKPICardsProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDecimalTime = (seconds: number): string => {
    return `${(seconds / 3600).toFixed(1)}h`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Team Tasks"
        value={data.totalTodos}
        subtitle={`${team.memberCount} team members`}
        icon={Users}
        badge={
          data.totalTodos > 0 
            ? { text: `${data.completedTodos} completed`, variant: 'outline' }
            : undefined
        }
      />

      <KPICard
        title="Team Velocity"
        value={`${data.completionRate}%`}
        subtitle="Team completion rate"
        icon={TrendingUp}
        progress={data.completionRate}
        badge={
          data.completionRate >= 80 
            ? { text: 'High', variant: 'default' }
            : data.completionRate >= 60 
            ? { text: 'Medium', variant: 'secondary' }
            : { text: 'Low', variant: 'destructive' }
        }
      />

      <KPICard
        title="Total Time"
        value={formatDecimalTime(data.totalTimeSpent)}
        subtitle={`${data.totalSessions} total sessions`}
        icon={Clock}
        trend={
          data.averageTimePerDay > 0 
            ? {
                value: Math.round(data.averageTimePerDay / 3600 * 10) / 10,
                label: 'hours per day',
                direction: 'neutral' as const
              }
            : undefined
        }
      />

      <KPICard
        title="Avg Session"
        value={formatTime(data.averageSessionTime)}
        subtitle="Average session length"
        icon={Activity}
        trend={
          insights?.averageTodosPerDay 
            ? {
                value: insights.averageTodosPerDay,
                label: 'tasks per day',
                direction: 'neutral' as const
              }
            : undefined
        }
      />

      {insights?.mostActiveCategory && (
        <KPICard
          title="Top Category"
          value={insights.mostActiveCategory}
          subtitle="Most active category"
          icon={Award}
        />
      )}

      {insights?.mostActiveUser && (
        <KPICard
          title="Top Contributor"
          value={insights.mostActiveUser}
          subtitle="Most active team member"
          icon={Users}
        />
      )}

      {insights?.averageCompletionTime && insights.averageCompletionTime > 0 && (
        <KPICard
          title="Avg Completion"
          value={formatTime(insights.averageCompletionTime)}
          subtitle="Average completion time"
          icon={Timer}
        />
      )}

      <KPICard
        title="Work Days"
        value={data.workDays}
        subtitle="Days in reporting period"
        icon={Calendar}
      />
    </div>
  )
}

interface OverviewKPICardsProps {
  data: {
    totalTodos: number
    personalTodos: number
    teamTodos: number
    totalCompleted: number
    personalCompleted: number
    teamCompleted: number
    overallCompletionRate: number
    totalTimeSpent: number
    totalSessions: number
    averageSessionTime: number
    activeTeams: number
  }
  distribution: {
    personalTimePercentage: number
    teamTimePercentage: number
    personalTodoPercentage: number
    teamTodoPercentage: number
  }
  insights?: {
    mostProductiveWorkType: 'personal' | 'team'
    bestPerformingTeam?: string | null
    totalActiveProjects: number
    productivity: 'high' | 'medium' | 'low'
  }
}

export function OverviewKPICards({ data, distribution, insights }: OverviewKPICardsProps) {
  const formatDecimalTime = (seconds: number): string => {
    return `${(seconds / 3600).toFixed(1)}h`
  }

  const getProductivityBadge = (productivity: string) => {
    switch (productivity) {
      case 'high':
        return { text: 'High Productivity', variant: 'default' as const }
      case 'medium':
        return { text: 'Good Productivity', variant: 'secondary' as const }
      case 'low':
        return { text: 'Needs Improvement', variant: 'destructive' as const }
      default:
        return { text: 'No Data', variant: 'outline' as const }
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Tasks"
        value={data.totalTodos}
        subtitle={`${data.personalTodos} personal, ${data.teamTodos} team`}
        icon={Target}
        progress={data.overallCompletionRate}
      />

      <KPICard
        title="Overall Progress"
        value={`${data.overallCompletionRate}%`}
        subtitle={`${data.totalCompleted} tasks completed`}
        icon={CheckCircle}
        badge={getProductivityBadge(insights?.productivity || 'low')}
      />

      <KPICard
        title="Total Time"
        value={formatDecimalTime(data.totalTimeSpent)}
        subtitle={`${data.totalSessions} sessions across all work`}
        icon={Timer}
        trend={{
          value: distribution.personalTimePercentage,
          label: '% personal work',
          direction: 'neutral' as const
        }}
      />

      <KPICard
        title="Active Teams"
        value={data.activeTeams}
        subtitle="Teams you're working with"
        icon={Users}
        badge={
          insights?.bestPerformingTeam 
            ? { text: insights.bestPerformingTeam, variant: 'outline' }
            : undefined
        }
      />

      <KPICard
        title="Work Distribution"
        value={`${distribution.personalTodoPercentage}% / ${distribution.teamTodoPercentage}%`}
        subtitle="Personal / Team task split"
        icon={BarChart3}
        badge={{
          text: insights?.mostProductiveWorkType === 'personal' ? 'Personal Focus' : 'Team Focus',
          variant: 'secondary'
        }}
      />

      <KPICard
        title="Active Projects"
        value={insights?.totalActiveProjects || 0}
        subtitle="Incomplete tasks across all work"
        icon={Activity}
      />

      <KPICard
        title="Avg Session"
        value={`${Math.round((data.averageSessionTime / 60) * 10) / 10}min`}
        subtitle="Average session length"
        icon={Clock}
      />

      <KPICard
        title="Time Distribution"
        value={`${distribution.personalTimePercentage}% / ${distribution.teamTimePercentage}%`}
        subtitle="Personal / Team time split"
        icon={Activity}
      />
    </div>
  )
}