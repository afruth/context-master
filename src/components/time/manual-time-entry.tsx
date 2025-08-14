'use client'

import * as React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarIcon, CheckSquare, Users, DollarSign, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ManualTimeEntryProps {
  onEntryCreated: () => void
}

export function ManualTimeEntry({ onEntryCreated }: ManualTimeEntryProps) {
  const [formData, setFormData] = React.useState({
    todoId: '',
    todoType: '' as 'personal' | 'team' | '',
    startDate: new Date(),
    startTime: '',
    endDate: new Date(),
    endTime: '',
    description: '',
    billable: false,
    hourlyRate: '',
  })

  // Fetch available todos
  const { data: todosData } = useQuery({
    queryKey: ['timer-todos'],
    queryFn: async () => {
      const response = await fetch('/api/time-entries/todos?includeCompleted=true')
      if (!response.ok) throw new Error('Failed to fetch todos')
      return response.json()
    },
  })

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create entry')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success('Time entry created')
      // Reset form
      setFormData({
        todoId: '',
        todoType: '' as 'personal' | 'team' | '',
        startDate: new Date(),
        startTime: '',
        endDate: new Date(),
        endTime: '',
        description: '',
        billable: false,
        hourlyRate: '',
      })
      onEntryCreated()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.todoId || !formData.todoType) {
      toast.error('Please select a todo')
      return
    }

    if (!formData.startTime || !formData.endTime) {
      toast.error('Please enter start and end times')
      return
    }

    // Construct start datetime
    const startDateTime = new Date(formData.startDate)
    const [startHour, startMin] = formData.startTime.split(':').map(Number)
    startDateTime.setHours(startHour, startMin, 0, 0)

    // Construct end datetime
    const endDateTime = new Date(formData.endDate)
    const [endHour, endMin] = formData.endTime.split(':').map(Number)
    endDateTime.setHours(endHour, endMin, 0, 0)

    if (endDateTime <= startDateTime) {
      toast.error('End time must be after start time')
      return
    }

    const entryData: any = {
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      description: formData.description,
      billable: formData.billable,
      isManual: true,
    }

    // Set todo reference
    if (formData.todoType === 'personal') {
      entryData.personalTodoId = formData.todoId
    } else {
      entryData.teamTodoId = formData.todoId
    }

    // Add hourly rate if billable
    if (formData.billable && formData.hourlyRate) {
      const rate = parseFloat(formData.hourlyRate)
      if (isNaN(rate) || rate < 0) {
        toast.error('Please enter a valid hourly rate')
        return
      }
      entryData.hourlyRate = rate
    }

    createEntryMutation.mutate(entryData)
  }

  const formatDuration = (start: Date, end: Date): string => {
    const diffMs = end.getTime() - start.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const hours = Math.floor(diffSeconds / 3600)
    const minutes = Math.floor((diffSeconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Calculate current duration
  const currentDuration = React.useMemo(() => {
    if (!formData.startTime || !formData.endTime) {
      return null
    }

    const start = new Date(formData.startDate)
    const [startHour, startMin] = formData.startTime.split(':').map(Number)
    start.setHours(startHour, startMin, 0, 0)

    const end = new Date(formData.endDate)
    const [endHour, endMin] = formData.endTime.split(':').map(Number)
    end.setHours(endHour, endMin, 0, 0)

    if (end > start) {
      return formatDuration(start, end)
    }
    return null
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime])

  // Calculate earnings if billable
  const estimatedEarnings = React.useMemo(() => {
    if (!formData.billable || !formData.hourlyRate || !currentDuration) {
      return null
    }

    const rate = parseFloat(formData.hourlyRate)
    if (isNaN(rate)) return null

    const start = new Date(formData.startDate)
    const [startHour, startMin] = formData.startTime.split(':').map(Number)
    start.setHours(startHour, startMin, 0, 0)

    const end = new Date(formData.endDate)
    const [endHour, endMin] = formData.endTime.split(':').map(Number)
    end.setHours(endHour, endMin, 0, 0)

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return (hours * rate).toFixed(2)
  }, [formData.billable, formData.hourlyRate, formData.startDate, formData.startTime, formData.endDate, formData.endTime, currentDuration])

  if (!todosData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    )
  }

  const allTodos = todosData.data?.todos || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Manual Time Entry
        </CardTitle>
        <CardDescription>
          Log time that wasn&apos;t tracked automatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Todo Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Todo *</label>
            <Select 
              value={formData.todoId ? `${formData.todoType}-${formData.todoId}` : ''} 
              onValueChange={(value) => {
                const [type, id] = value.split('-')
                setFormData(prev => ({
                  ...prev,
                  todoType: type as 'personal' | 'team',
                  todoId: id,
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a todo to track time for" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {allTodos.map((todo: any) => (
                  <SelectItem key={`${todo.type}-${todo.id}`} value={`${todo.type}-${todo.id}`}>
                    <div className="flex items-center gap-2">
                      {todo.type === 'personal' ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Users className="h-4 w-4 text-purple-600" />
                      )}
                      <span>{todo.title}</span>
                      {todo.teamName && (
                        <span className="text-muted-foreground">({todo.teamName})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Range */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Time Range *</h4>
            
            {/* Start Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !formData.startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date || new Date() }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Start Time</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !formData.endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date || new Date() }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">End Time</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Duration Display */}
          {currentDuration && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm font-medium">Duration:</span>
              <span className="text-sm font-mono">{currentDuration}</span>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What were you working on?"
              rows={3}
            />
          </div>

          {/* Billable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Billable Time</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Mark this time as billable to clients
              </p>
            </div>
            <Switch
              checked={formData.billable}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, billable: checked }))}
            />
          </div>

          {/* Hourly Rate */}
          {formData.billable && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Hourly Rate ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                placeholder="0.00"
              />
              {estimatedEarnings && (
                <p className="text-xs text-muted-foreground">
                  Estimated earnings: ${estimatedEarnings}
                </p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  todoId: '',
                  todoType: '' as 'personal' | 'team' | '',
                  startDate: new Date(),
                  startTime: '',
                  endDate: new Date(),
                  endTime: '',
                  description: '',
                  billable: false,
                  hourlyRate: '',
                })
              }}
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={createEntryMutation.isPending}
              className="flex-1"
            >
              {createEntryMutation.isPending && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              Create Entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}