'use client'

import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Clock, BarChart3, Filter } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { TimerWidget } from '@/components/time/timer-widget'
import { TimeEntryList } from '@/components/time/time-entry-list'
import { TimeReports } from '@/components/time/time-reports'
import { ManualTimeEntry } from '@/components/time/manual-time-entry'
import { TimeStats } from '@/components/time/time-stats'
import type { ActiveTimer, TimeEntry, TimeStatsData } from '@/types/time'

interface TimeTrackingClientProps {
  userId: string
}

export function TimeTrackingClient({}: TimeTrackingClientProps) {
  const queryClient = useQueryClient()

  // Fetch active timer
  const { data: activeTimer, isLoading: activeTimerLoading } = useQuery<ActiveTimer | null>({
    queryKey: ['active-timer'],
    queryFn: async () => {
      const response = await fetch('/api/time-entries/active')
      if (!response.ok) throw new Error('Failed to fetch active timer')
      const result = await response.json()
      return result.data
    },
    refetchInterval: 1000, // Refetch every second for real-time updates
  })

  // Fetch recent time entries
  const { 
    data: timeEntriesData, 
    isLoading: entriesLoading,
    refetch: refetchEntries
  } = useQuery<{ data: TimeEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ['time-entries', { page: 1, limit: 10 }],
    queryFn: async () => {
      const response = await fetch('/api/time-entries?page=1&limit=10&sortBy=startTime&sortOrder=desc')
      if (!response.ok) throw new Error('Failed to fetch time entries')
      return response.json()
    },
  })

  // Fetch time statistics
  const { data: statsData, isLoading: statsLoading } = useQuery<TimeStatsData>({
    queryKey: ['time-stats'],
    queryFn: async () => {
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const startOfWeek = new Date(startOfToday)
      startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      const [dailyResponse, weeklyResponse, monthlyResponse] = await Promise.all([
        fetch(`/api/time-entries/reports?startDate=${startOfToday.toISOString()}&endDate=${new Date().toISOString()}&groupBy=day`),
        fetch(`/api/time-entries/reports?startDate=${startOfWeek.toISOString()}&endDate=${new Date().toISOString()}&groupBy=week`),
        fetch(`/api/time-entries/reports?startDate=${startOfMonth.toISOString()}&endDate=${new Date().toISOString()}&groupBy=month`),
      ])

      const [daily, weekly, monthly] = await Promise.all([
        dailyResponse.json(),
        weeklyResponse.json(),
        monthlyResponse.json(),
      ])

      return {
        today: daily.data.summary,
        thisWeek: weekly.data.summary,
        thisMonth: monthly.data.summary,
      }
    },
  })

  const handleTimerUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['active-timer'] })
    refetchEntries()
    queryClient.invalidateQueries({ queryKey: ['time-stats'] })
  }, [queryClient, refetchEntries])

  if (activeTimerLoading || entriesLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Timer Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Timer
            </CardTitle>
            <CardDescription>
              Start tracking time on your todos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimerWidget 
              activeTimer={activeTimer} 
              onTimerUpdate={handleTimerUpdate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Stats
            </CardTitle>
            <CardDescription>
              Your time tracking overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeStats data={statsData} />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Entries
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Recent Time Entries</h3>
              <p className="text-sm text-muted-foreground">
                Your latest time tracking activities
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          
          <TimeEntryList 
            entries={timeEntriesData?.data || []} 
            onEntryUpdate={handleTimerUpdate}
          />
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Add Manual Time Entry</h3>
            <p className="text-sm text-muted-foreground">
              Log time that wasn&apos;t tracked automatically
            </p>
          </div>
          
          <ManualTimeEntry onEntryCreated={handleTimerUpdate} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Time Reports & Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Analyze your productivity and time allocation
            </p>
          </div>
          
          <TimeReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}