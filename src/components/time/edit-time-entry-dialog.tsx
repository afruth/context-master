'use client'

import * as React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarIcon, CheckSquare, Users, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { TimeEntry, TimerTodosResponse } from '@/types/time'

interface EditTimeEntryDialogProps {
  entry: TimeEntry
  open: boolean
  onOpenChange: (open: boolean) => void
  onEntryUpdate: () => void
}

export function EditTimeEntryDialog({
  entry,
  open,
  onOpenChange,
  onEntryUpdate
}: EditTimeEntryDialogProps) {
  const [formData, setFormData] = React.useState({
    startTime: '',
    startDate: null as Date | null,
    endTime: '',
    endDate: null as Date | null,
    description: '',
    billable: false,
    hourlyRate: '',
    todoId: '',
    todoType: '' as 'personal' | 'team' | '',
  })

  // Initialize form data when entry changes
  React.useEffect(() => {
    if (entry) {
      const startDateTime = new Date(entry.startTime)
      const endDateTime = entry.endTime ? new Date(entry.endTime) : null
      
      setFormData({
        startTime: startDateTime.toTimeString().slice(0, 5), // HH:MM format
        startDate: startDateTime,
        endTime: endDateTime ? endDateTime.toTimeString().slice(0, 5) : '',
        endDate: endDateTime,
        description: entry.description || '',
        billable: entry.billable || false,
        hourlyRate: entry.hourlyRate?.toString() || '',
        todoId: entry.todo?.id || '',
        todoType: entry.todoType || '',
      })
    }
  }, [entry])

  // Fetch available todos
  const { data: todosData } = useQuery<{ data: TimerTodosResponse }>({
    queryKey: ['timer-todos'],
    queryFn: async () => {
      const response = await fetch('/api/time-entries/todos?includeCompleted=true')
      if (!response.ok) throw new Error('Failed to fetch todos')
      return response.json()
    },
  })

  // Update entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async (data: Partial<TimeEntry>) => {
      const response = await fetch(`/api/time-entries/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update entry')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success('Time entry updated')
      onEntryUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.startDate || !formData.startTime) {
      toast.error('Start date and time are required')
      return
    }

    // Construct start datetime
    const startDateTime = new Date(formData.startDate)
    const [startHour, startMin] = formData.startTime.split(':').map(Number)
    startDateTime.setHours(startHour, startMin, 0, 0)

    // Construct end datetime if provided
    let endDateTime: Date | null = null
    if (formData.endDate && formData.endTime) {
      endDateTime = new Date(formData.endDate)
      const [endHour, endMin] = formData.endTime.split(':').map(Number)
      endDateTime.setHours(endHour, endMin, 0, 0)

      if (endDateTime <= startDateTime) {
        toast.error('End time must be after start time')
        return
      }
    }

    const updateData: any = {
      startTime: startDateTime.toISOString(),
      description: formData.description,
      billable: formData.billable,
    }

    if (endDateTime) {
      updateData.endTime = endDateTime.toISOString()
    }

    if (formData.billable && formData.hourlyRate) {
      const rate = parseFloat(formData.hourlyRate)
      if (isNaN(rate) || rate < 0) {
        toast.error('Please enter a valid hourly rate')
        return
      }
      updateData.hourlyRate = rate
    }

    // Handle todo change
    if (formData.todoId && formData.todoType) {
      if (formData.todoType === 'personal') {
        updateData.personalTodoId = formData.todoId
      } else {
        updateData.teamTodoId = formData.todoId
      }
    }

    updateEntryMutation.mutate(updateData)
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
    if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
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

  if (!todosData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const allTodos = todosData.data?.todos || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Todo Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Todo</label>
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
                <SelectValue placeholder="Select a todo" />
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

          {/* Start Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
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
                    selected={formData.startDate || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
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
              <label className="text-sm font-medium">End Date</label>
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
                    selected={formData.endDate || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          {/* Duration Display */}
          {currentDuration && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <span className="text-sm font-medium">Duration:</span>
              <span className="text-sm">{currentDuration}</span>
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
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateEntryMutation.isPending}
              className="flex-1"
            >
              {updateEntryMutation.isPending && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              Update Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}