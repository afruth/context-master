'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarIcon, Download, Filter, BarChart3, PieChart, Calendar, Clock } from 'lucide-react'
import { format, startOfWeek, startOfMonth, subDays, subWeeks, subMonths } from 'date-fns'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export function TimeReports() {
  const [dateRange, setDateRange] = React.useState({
    start: subDays(new Date(), 30), // Last 30 days
    end: new Date(),
  })
  const [groupBy, setGroupBy] = React.useState<'day' | 'week' | 'month' | 'todo' | 'project'>('day')
  const [todoType, setTodoType] = React.useState<'personal' | 'team' | 'all'>('all')
  const [billableOnly, setBillableOnly] = React.useState(false)

  // Fetch report data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['time-reports', {
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      groupBy,
      todoType,
      billableOnly,
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        groupBy,
        todoType,
        billableOnly: billableOnly.toString(),
      })

      const response = await fetch(`/api/time-entries/reports?${params}`)
      if (!response.ok) throw new Error('Failed to fetch report data')
      return response.json()
    },
  })

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

  const quickRanges = [
    {
      label: 'Last 7 days',
      value: () => ({ start: subDays(new Date(), 7), end: new Date() })
    },
    {
      label: 'Last 30 days',
      value: () => ({ start: subDays(new Date(), 30), end: new Date() })
    },
    {
      label: 'This week',
      value: () => ({ start: startOfWeek(new Date()), end: new Date() })
    },
    {
      label: 'This month',
      value: () => ({ start: startOfMonth(new Date()), end: new Date() })
    },
  ]

  const handleExport = async (format: 'csv' | 'json') => {
    // TODO: Implement export functionality
    console.log('Export:', format, reportData)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const summary = reportData?.data?.summary || {}
  const groupedData = reportData?.data?.groupedData || []

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Settings
          </CardTitle>
          <CardDescription>
            Configure your time tracking report parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Range</label>
              <Select onValueChange={(value) => {
                const range = quickRanges.find(r => r.label === value)?.value()
                if (range) {
                  setDateRange(range)
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {quickRanges.map((range) => (
                    <SelectItem key={range.label} value={range.label}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !dateRange.start && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.start ? format(dateRange.start, 'PPP') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.start}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, start: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !dateRange.end && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.end ? format(dateRange.end, 'PPP') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.end}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, end: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group By</label>
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Todo Type</label>
              <Select value={todoType} onValueChange={(value: any) => setTodoType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Todos</SelectItem>
                  <SelectItem value="personal">Personal Only</SelectItem>
                  <SelectItem value="team">Team Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filter</label>
              <Select value={billableOnly ? 'billable' : 'all'} onValueChange={(value) => setBillableOnly(value === 'billable')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="billable">Billable Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => refetch()}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('json')}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">{formatDuration(summary.totalTime || 0)}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Billable Time</p>
                <p className="text-2xl font-bold">{formatDuration(summary.billableTime || 0)}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalEarnings || 0)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Todos</p>
                <p className="text-2xl font-bold">{summary.completedTodos || 0}</p>
              </div>
              <PieChart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>
            {groupBy === 'day' && 'Daily Breakdown'}
            {groupBy === 'week' && 'Weekly Breakdown'}
            {groupBy === 'month' && 'Monthly Breakdown'}
            {groupBy === 'todo' && 'Todo Breakdown'}
            {groupBy === 'project' && 'Project Breakdown'}
          </CardTitle>
          <CardDescription>
            Detailed analysis of your time allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groupedData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No data available for the selected period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedData.map((item: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">
                        {item.date || item.weekStart || item.month || item.todoTitle || item.project}
                      </h4>
                      {(item.todoType || item.teamName) && (
                        <p className="text-xs text-muted-foreground">
                          {item.teamName && `Team: ${item.teamName}`}
                          {item.todoType && (
                            <Badge variant="outline" className="ml-2">
                              {item.todoType}
                            </Badge>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{formatDuration(item.totalTime)}</p>
                      {item.earnings > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.earnings)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar showing time relative to max */}
                  <div className="space-y-1">
                    <Progress 
                      value={(item.totalTime / Math.max(...groupedData.map((g: any) => g.totalTime))) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.entriesCount} entries</span>
                      {item.billableTime > 0 && (
                        <span>{formatDuration(item.billableTime)} billable</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}