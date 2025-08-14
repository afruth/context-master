'use client'

import { useState } from 'react'
import { CalendarIcon, Download, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export interface ReportFilters {
  period: 'week' | 'month' | 'quarter' | 'year' | 'custom'
  startDate?: Date
  endDate?: Date
  teamId?: string
  exportFormat: 'csv' | 'json'
}

interface ReportFiltersProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
  onRefresh: () => void
  onExport: () => void
  teams?: Array<{ id: string; name: string }>
  isLoading?: boolean
  showTeamFilter?: boolean
  showExportOptions?: boolean
}

export function ReportFilters({
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  teams = [],
  isLoading = false,
  showTeamFilter = false,
  showExportOptions = true,
}: ReportFiltersProps) {
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  const handlePeriodChange = (period: ReportFilters['period']) => {
    onFiltersChange({
      ...filters,
      period,
      startDate: period === 'custom' ? filters.startDate : undefined,
      endDate: period === 'custom' ? filters.endDate : undefined,
    })
  }

  const handleStartDateChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      startDate: date,
    })
    setIsStartDateOpen(false)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      endDate: date,
    })
    setIsEndDateOpen(false)
  }

  const handleTeamChange = (teamId: string) => {
    onFiltersChange({
      ...filters,
      teamId: teamId === 'all' ? undefined : teamId,
    })
  }

  const handleExportFormatChange = (exportFormat: 'csv' | 'json') => {
    onFiltersChange({
      ...filters,
      exportFormat,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Report Filters
        </CardTitle>
        <CardDescription>
          Customize your report by selecting time period and other filters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Time Period */}
          <div className="space-y-2">
            <Label htmlFor="period">Time Period</Label>
            <Select value={filters.period} onValueChange={handlePeriodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date (for custom period) */}
          {filters.period === 'custom' && (
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* End Date (for custom period) */}
          {filters.period === 'custom' && (
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={handleEndDateChange}
                    initialFocus
                    disabled={(date) => filters.startDate ? date < filters.startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Team Filter */}
          {showTeamFilter && teams.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select value={filters.teamId || 'all'} onValueChange={handleTeamChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Format */}
          {showExportOptions && (
            <div className="space-y-2">
              <Label htmlFor="export-format">Export Format</Label>
              <Select value={filters.exportFormat} onValueChange={handleExportFormatChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button 
            onClick={onRefresh} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          
          {showExportOptions && (
            <Button 
              variant="outline" 
              onClick={onExport}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface QuickFiltersProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
}

export function QuickFilters({ filters, onFiltersChange }: QuickFiltersProps) {
  const quickPeriods = [
    { label: 'Last 7 days', value: 'week' as const },
    { label: 'This month', value: 'month' as const },
    { label: 'Last 3 months', value: 'quarter' as const },
    { label: 'This year', value: 'year' as const },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {quickPeriods.map((period) => (
        <Button
          key={period.value}
          variant={filters.period === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFiltersChange({ ...filters, period: period.value })}
        >
          {period.label}
        </Button>
      ))}
    </div>
  )
}