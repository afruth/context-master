'use client'

import { useState, useEffect, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'

// Import chart components
import {
  TodoStatusChart,
  TodoPriorityChart,
  DailyActivityChart,
  TimeTrackingChart,
  CategoryChart,
  TeamPerformanceChart,
  WorkTypeComparisonChart,
  TrendChart,
} from '@/components/charts/chart-components'

// Import report components
import { ReportFilters, QuickFilters, type ReportFilters as ReportFiltersType } from '@/components/reports/report-filters'
import { PersonalKPICards, TeamKPICards, OverviewKPICards } from '@/components/reports/kpi-cards'

// Types for API responses
interface PersonalReportData {
  summary: {
    totalTodos: number
    completedTodos: number
    completionRate: number
    totalTimeSpent: number
    totalSessions: number
    averageSessionTime: number
    averageTimePerDay: number
    workDays: number
  }
  charts: {
    todosByStatus: Array<{ name: string; value: number; percentage: number }>
    todosByPriority: Array<{ name: string; value: number; percentage: number }>
    todosByCategory: Array<{ name: string; value: number; percentage: number }>
    dailyActivity: Array<{ date: string; todosCompleted: number; todosCreated: number }>
    dailyTimeTracking: Array<{ date: string; timeSpent: number; sessions: number }>
  }
  insights: {
    mostProductiveCategory: string | null
    averageTodosPerDay: number
    averageCompletionTime: number
  }
}

interface TeamReportData {
  team: {
    id: string
    name: string
    memberCount: number
  }
  summary: {
    totalTodos: number
    completedTodos: number
    completionRate: number
    totalTimeSpent: number
    totalSessions: number
    averageSessionTime: number
    averageTimePerDay: number
    workDays: number
  }
  charts: {
    todosByStatus: Array<{ name: string; value: number; percentage: number }>
    todosByPriority: Array<{ name: string; value: number; percentage: number }>
    todosByCategory: Array<{ name: string; value: number; percentage: number }>
    dailyActivity: Array<{ date: string; todosCompleted: number; todosCreated: number }>
    dailyTimeTracking: Array<{ date: string; timeSpent: number; sessions: number }>
    memberPerformance: Array<{ name: string; completedTodos: number; timeSpent: number; completionRate: number }>
  }
  members: Array<{
    id: string
    name: string
    email: string
    role: string
    stats: {
      assignedTodos: number
      completedTodos: number
      completionRate: number
      timeSpent: number
      averageTimePerTodo: number
    }
  }>
  insights: {
    mostActiveCategory: string | null
    mostActiveUser: string | null
    averageTodosPerDay: number
    averageCompletionTime: number
    teamVelocity: number
  }
}

interface OverviewReportData {
  summary: {
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
  charts: {
    statusDistribution: Array<{ name: string; personal: number; team: number; total: number; percentage: number }>
    workTypeComparison: Array<{ type: string; todos: number; completed: number; timeSpent: number }>
  }
  teams: Array<{
    id: string
    name: string
    memberCount: number
    totalTodos: number
    completedTodos: number
    completionRate: number
  }>
  recentActivity: Array<{
    type: 'personal' | 'team'
    title: string
    status: string
    updatedAt: string
    teamName: string | null
  }>
  insights: {
    mostProductiveWorkType: 'personal' | 'team'
    bestPerformingTeam: string | null
    totalActiveProjects: number
    productivity: 'high' | 'medium' | 'low'
  }
}

interface Team {
  id: string
  name: string
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'team'>('overview')
  const [selectedTeamId, setSelectedTeamId] = useState<string>()
  const [filters, setFilters] = useState<ReportFiltersType>({
    period: 'month',
    exportFormat: 'csv',
  })

  // Fetch user's teams
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      const result = await response.json()
      return result.data || []
    },
  })

  // Build query parameters
  const buildQueryParams = (additionalParams: Record<string, string> = {}) => {
    const params = new URLSearchParams({
      period: filters.period,
      ...additionalParams,
    })

    if (filters.period === 'custom' && filters.startDate) {
      params.set('startDate', filters.startDate.toISOString())
    }
    if (filters.period === 'custom' && filters.endDate) {
      params.set('endDate', filters.endDate.toISOString())
    }

    return params.toString()
  }

  // Personal report query
  const personalReportQuery = useQuery<{ data: PersonalReportData }>({
    queryKey: ['reports', 'personal', filters],
    queryFn: async () => {
      const queryParams = buildQueryParams()
      const response = await fetch(`/api/reports/personal?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch personal report')
      }
      return response.json()
    },
    enabled: activeTab === 'personal',
  })

  // Team report query
  const teamReportQuery = useQuery<{ data: TeamReportData }>({
    queryKey: ['reports', 'team', selectedTeamId, filters],
    queryFn: async () => {
      if (!selectedTeamId) return null
      const queryParams = buildQueryParams()
      const response = await fetch(`/api/reports/team/${selectedTeamId}?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch team report')
      }
      return response.json()
    },
    enabled: activeTab === 'team' && !!selectedTeamId,
  })

  // Overview report query
  const overviewReportQuery = useQuery<{ data: OverviewReportData }>({
    queryKey: ['reports', 'overview', filters],
    queryFn: async () => {
      const queryParams = buildQueryParams()
      const response = await fetch(`/api/reports/overview?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch overview report')
      }
      return response.json()
    },
    enabled: activeTab === 'overview',
  })

  // Set default team when teams are loaded
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id)
    }
  }, [teams, selectedTeamId])

  // Handle refresh
  const handleRefresh = () => {
    switch (activeTab) {
      case 'personal':
        personalReportQuery.refetch()
        break
      case 'team':
        teamReportQuery.refetch()
        break
      case 'overview':
        overviewReportQuery.refetch()
        break
    }
  }

  // Handle export
  const handleExport = async () => {
    try {
      const exportParams = buildQueryParams({
        format: filters.exportFormat,
        type: activeTab,
        ...(activeTab === 'team' && selectedTeamId ? { teamId: selectedTeamId } : {}),
      })

      const response = await fetch(`/api/reports/export?${exportParams}`)
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.${filters.exportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report')
    }
  }

  const isLoading = personalReportQuery.isLoading || teamReportQuery.isLoading || overviewReportQuery.isLoading

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Analyze your productivity and track your progress across personal and team work.
        </p>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center justify-between">
        <QuickFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="mt-6">
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            onRefresh={handleRefresh}
            onExport={handleExport}
            teams={teams}
            isLoading={isLoading}
            showTeamFilter={activeTab === 'team'}
            showExportOptions={true}
          />
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            {overviewReportQuery.data?.data && (
              <>
                <OverviewKPICards
                  data={overviewReportQuery.data.data.summary}
                  distribution={overviewReportQuery.data.data.distribution}
                  insights={overviewReportQuery.data.data.insights}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <WorkTypeComparisonChart data={overviewReportQuery.data.data.charts.workTypeComparison} />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Performance</CardTitle>
                      <CardDescription>Completion rates across your teams</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {overviewReportQuery.data.data.teams.map((team) => (
                          <div key={team.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{team.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {team.memberCount} members • {team.totalTodos} tasks
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{team.completionRate}%</p>
                              <p className="text-sm text-muted-foreground">{team.completedTodos} completed</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest task updates across all your work</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {overviewReportQuery.data.data.recentActivity.slice(0, 10).map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="capitalize">{activity.type}</span>
                              {activity.teamName && <span>• {activity.teamName}</span>}
                              <span>• {activity.status}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </Suspense>
        </TabsContent>

        {/* Personal Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Suspense fallback={<LoadingSpinner />}>
            {personalReportQuery.data?.data && (
              <>
                <PersonalKPICards
                  data={personalReportQuery.data.data.summary}
                  insights={personalReportQuery.data.data.insights}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <TodoStatusChart data={personalReportQuery.data.data.charts.todosByStatus} />
                  <TodoPriorityChart data={personalReportQuery.data.data.charts.todosByPriority} />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <DailyActivityChart data={personalReportQuery.data.data.charts.dailyActivity} />
                  <TimeTrackingChart data={personalReportQuery.data.data.charts.dailyTimeTracking} />
                </div>

                {personalReportQuery.data.data.charts.todosByCategory.length > 0 && (
                  <CategoryChart data={personalReportQuery.data.data.charts.todosByCategory} />
                )}
              </>
            )}
          </Suspense>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          {teams.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">You are not a member of any teams yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Team Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Team</CardTitle>
                  <CardDescription>Choose a team to view detailed analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeamId(team.id)}
                        className={`p-3 text-left rounded-lg border transition-colors ${
                          selectedTeamId === team.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <p className="font-medium">{team.name}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Team Report */}
              <Suspense fallback={<LoadingSpinner />}>
                {teamReportQuery.data?.data && (
                  <>
                    <TeamKPICards
                      data={teamReportQuery.data.data.summary}
                      team={teamReportQuery.data.data.team}
                      insights={teamReportQuery.data.data.insights}
                    />

                    <div className="grid gap-6 md:grid-cols-2">
                      <TodoStatusChart data={teamReportQuery.data.data.charts.todosByStatus} />
                      <TodoPriorityChart data={teamReportQuery.data.data.charts.todosByPriority} />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <DailyActivityChart data={teamReportQuery.data.data.charts.dailyActivity} />
                      <TimeTrackingChart data={teamReportQuery.data.data.charts.dailyTimeTracking} />
                    </div>

                    {teamReportQuery.data.data.charts.memberPerformance.length > 0 && (
                      <TeamPerformanceChart data={teamReportQuery.data.data.charts.memberPerformance} />
                    )}

                    {teamReportQuery.data.data.charts.todosByCategory.length > 0 && (
                      <CategoryChart data={teamReportQuery.data.data.charts.todosByCategory} />
                    )}

                    {/* Team Members Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Team Member Performance</CardTitle>
                        <CardDescription>Detailed breakdown of each member's contribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {teamReportQuery.data.data.members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                              <div>
                                <p className="font-medium">{member.name || member.email}</p>
                                <p className="text-sm text-muted-foreground capitalize">{member.role.toLowerCase()}</p>
                              </div>
                              <div className="text-right">
                                <div className="flex gap-4 text-sm">
                                  <div>
                                    <p className="font-semibold">{member.stats.completedTodos}</p>
                                    <p className="text-muted-foreground">Completed</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">{member.stats.completionRate}%</p>
                                    <p className="text-muted-foreground">Rate</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">{Math.round(member.stats.timeSpent / 3600)}h</p>
                                    <p className="text-muted-foreground">Time</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </Suspense>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}