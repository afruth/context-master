'use client'

import * as React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Play, 
  Square, 
  Clock,
  CheckSquare,
  Users,
  Edit3
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { ActiveTimer, TimerTodosResponse } from '@/types/time'

interface TimerWidgetProps {
  activeTimer?: ActiveTimer | null
  onTimerUpdate: () => void
}

export function TimerWidget({ activeTimer, onTimerUpdate }: TimerWidgetProps) {
  const [elapsedTime, setElapsedTime] = React.useState(0)
  const [description, setDescription] = React.useState('')
  const [isStartDialogOpen, setIsStartDialogOpen] = React.useState(false)
  
  // Store timer state in localStorage for persistence
  React.useEffect(() => {
    if (activeTimer) {
      const stored = localStorage.getItem('timer-state')
      if (stored) {
        const state = JSON.parse(stored)
        setDescription(state.description || activeTimer.description || '')
      } else {
        setDescription(activeTimer.description || '')
      }
    }
  }, [activeTimer])

  // Update elapsed time every second when timer is active
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (activeTimer) {
      const updateElapsed = () => {
        const now = new Date()
        const start = new Date(activeTimer.startTime)
        const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000)
        setElapsedTime(elapsed)
        
        // Store timer state
        localStorage.setItem('timer-state', JSON.stringify({
          timerId: activeTimer.id,
          description: description,
          startTime: activeTimer.startTime,
        }))
      }
      
      updateElapsed()
      interval = setInterval(updateElapsed, 1000)
    } else {
      setElapsedTime(0)
      localStorage.removeItem('timer-state')
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTimer, description])

  // Fetch available todos for timer
  const { data: todosData } = useQuery<{ data: TimerTodosResponse }>({
    queryKey: ['timer-todos'],
    queryFn: async () => {
      const response = await fetch('/api/time-entries/todos')
      if (!response.ok) throw new Error('Failed to fetch todos')
      return response.json()
    },
  })

  // Start timer mutation
  const startTimerMutation = useMutation({
    mutationFn: async (data: { 
      personalTodoId?: string
      teamTodoId?: string 
      description?: string 
    }) => {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start timer')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success('Timer started')
      setIsStartDialogOpen(false)
      onTimerUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Stop timer mutation
  const stopTimerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/time-entries/active', {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to stop timer')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success('Timer stopped')
      setDescription('')
      onTimerUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update description mutation
  const updateDescriptionMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      if (!activeTimer) return
      
      const response = await fetch(`/api/time-entries/${activeTimer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDescription }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update description')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success('Description updated')
      onTimerUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartTimer = (todoData: { todoId: string; todoType: 'personal' | 'team' }) => {
    const payload = {
      description: description,
      ...(todoData.todoType === 'personal' 
        ? { personalTodoId: todoData.todoId }
        : { teamTodoId: todoData.todoId }
      ),
    }
    
    startTimerMutation.mutate(payload)
  }

  const handleUpdateDescription = () => {
    if (!activeTimer) return
    updateDescriptionMutation.mutate(description)
  }

  const priorityColors = {
    LOW: 'bg-green-500',
    MEDIUM: 'bg-yellow-500',
    HIGH: 'bg-orange-500',
    URGENT: 'bg-red-500',
  }

  const statusColors = {
    TODO: 'bg-gray-500',
    IN_PROGRESS: 'bg-blue-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-gray-400',
  }

  if (activeTimer) {
    return (
      <div className="space-y-4">
        {/* Active Timer Display */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-mono font-bold text-primary">
            {formatTime(elapsedTime)}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Running since {new Date(activeTimer.startTime).toLocaleTimeString()}
          </div>
        </div>

        {/* Current Todo */}
        {activeTimer.todo && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {activeTimer.todoType === 'personal' ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Users className="h-4 w-4 text-purple-600" />
                  )}
                  <div>
                    <h4 className="font-medium">{activeTimer.todo.title}</h4>
                    {activeTimer.todoType === 'team' && activeTimer.todo.team && (
                      <p className="text-xs text-muted-foreground">
                        {activeTimer.todo.team.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn('text-white', statusColors[activeTimer.todo.status as keyof typeof statusColors])}
                  >
                    {activeTimer.todo.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Description</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpdateDescription}
              disabled={updateDescriptionMutation.isPending}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            className="resize-none"
            rows={2}
          />
        </div>

        {/* Timer Controls */}
        <div className="flex gap-2">
          <Button
            onClick={() => stopTimerMutation.mutate()}
            disabled={stopTimerMutation.isPending}
            variant="outline"
            className="flex-1"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Timer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* No Active Timer */}
      <div className="text-center space-y-2">
        <div className="text-3xl font-mono font-bold text-muted-foreground">
          00:00:00
        </div>
        <p className="text-sm text-muted-foreground">
          No timer running
        </p>
      </div>

      {/* Start Timer Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Start Timer
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Timer</DialogTitle>
          </DialogHeader>
          <StartTimerForm
            todos={todosData?.data}
            onStart={handleStartTimer}
            isLoading={startTimerMutation.isPending}
            description={description}
            onDescriptionChange={setDescription}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface StartTimerFormProps {
  todos?: TimerTodosResponse
  onStart: (data: { todoId: string; todoType: 'personal' | 'team' }) => void
  isLoading: boolean
  description: string
  onDescriptionChange: (value: string) => void
}

function StartTimerForm({ 
  todos, 
  onStart, 
  isLoading, 
  description, 
  onDescriptionChange 
}: StartTimerFormProps) {
  const [selectedTodo, setSelectedTodo] = React.useState<string>('')
  const [selectedType, setSelectedType] = React.useState<'personal' | 'team' | ''>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTodo || !selectedType) {
      toast.error('Please select a todo to track time for')
      return
    }
    
    onStart({ todoId: selectedTodo, todoType: selectedType as 'personal' | 'team' })
  }

  if (!todos) {
    return <LoadingSpinner />
  }

  const recentTodos = todos.recentlyWorkedOn || []
  const allTodos = todos.todos || []

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Description (optional)</label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="What are you working on?"
          className="resize-none"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Select Todo</label>
        
        {recentTodos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Recently worked on:</p>
            <div className="space-y-1">
              {recentTodos.slice(0, 3).map((todo) => (
                <Button
                  key={`${todo.type}-${todo.id}`}
                  variant={selectedTodo === todo.id && selectedType === todo.type ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start h-auto p-3"
                  type="button"
                  onClick={() => {
                    setSelectedTodo(todo.id)
                    setSelectedType(todo.type)
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    {todo.type === 'personal' ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Users className="h-4 w-4 text-purple-600" />
                    )}
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">{todo.title}</div>
                      {todo.teamName && (
                        <div className="text-xs text-muted-foreground">{todo.teamName}</div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Select value={`${selectedType}-${selectedTodo}`} onValueChange={(value) => {
          const [type, id] = value.split('-')
          setSelectedType(type as 'personal' | 'team')
          setSelectedTodo(id)
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a todo to track time for" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {allTodos.filter((todo) => todo.status !== 'COMPLETED').map((todo) => (
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

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
          <Play className="h-4 w-4 mr-2" />
          Start Timer
        </Button>
      </div>
    </form>
  )
}