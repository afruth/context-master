'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit3, 
  Flag, 
  FolderOpen, 
  Hash,
  MoreHorizontal,
  Play,
  Square,
  Tag,
  Timer,
  Trash2,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { formatDistance } from 'date-fns'
import { TodoEditDialog } from '@/components/task/todo-edit-dialog'
import { TimerWidget } from '@/components/time/timer-widget'
import { TodoStatus, Priority, PersonalTodo, TimeEntry, User as UserType } from '@prisma/client'

interface TodoDetailProps {
  todo: PersonalTodo & {
    tags: string[]
    totalTimeSpent: number
    activeTimeEntry?: TimeEntry | null
    timeEntries: TimeEntry[]
    _count: {
      timeEntries: number
    }
  }
  user: UserType
}

export function TodoDetailClient({ todo, user }: TodoDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const priorityConfig = {
    LOW: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
    MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
  }

  const statusConfig = {
    TODO: { label: 'To Do', color: 'bg-gray-100 text-gray-800' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/todos/personal/${todo.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete todo')
      }

      toast({
        title: 'Todo deleted',
        description: 'The todo has been successfully deleted.',
      })

      router.push('/dashboard/todos')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete todo. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (newStatus: TodoStatus) => {
    try {
      const response = await fetch(`/api/todos/personal/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update todo')
      }

      toast({
        title: 'Todo updated',
        description: `Todo marked as ${statusConfig[newStatus].label.toLowerCase()}.`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update todo. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/todos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Todos
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{todo.title}</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {todo.status !== 'COMPLETED' && (
                <DropdownMenuItem onClick={() => handleStatusChange('COMPLETED')}>
                  <Square className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              {todo.status === 'COMPLETED' && (
                <DropdownMenuItem onClick={() => handleStatusChange('TODO')}>
                  <Play className="h-4 w-4 mr-2" />
                  Reopen
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {todo.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {todo.description.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Timer className="h-5 w-5 mr-2" />
                Time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimerWidget
                activeTimer={todo.activeTimeEntry ? {
                  id: todo.activeTimeEntry.id,
                  startTime: todo.activeTimeEntry.startTime.toISOString(),
                  description: todo.activeTimeEntry.description,
                  todo: {
                    id: todo.id,
                    title: todo.title,
                    status: todo.status
                  },
                  todoType: 'personal' as const
                } : null}
                onTimerUpdate={() => router.refresh()}
              />

              {todo.timeEntries.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Recent Time Entries</h4>
                  <div className="space-y-2">
                    {todo.timeEntries.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(entry.startTime).toLocaleDateString()} at{' '}
                            {new Date(entry.startTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <span className="font-medium">
                          {entry.duration ? formatTime(entry.duration) : 'In progress...'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {todo._count.timeEntries > 5 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      And {todo._count.timeEntries - 5} more entries...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <Badge className={statusConfig[todo.status].color}>
                  {statusConfig[todo.status].label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Priority</span>
                <Badge variant="outline" className={priorityConfig[todo.priority].color}>
                  <Flag className="h-3 w-3 mr-1" />
                  {priorityConfig[todo.priority].label}
                </Badge>
              </div>

              {todo.category && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Category</span>
                  <Badge variant="outline">
                    <FolderOpen className="h-3 w-3 mr-1" />
                    {todo.category}
                  </Badge>
                </div>
              )}

              {todo.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Due Date</span>
                  <div className="text-sm">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {new Date(todo.dueDate).toLocaleDateString()}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Time</span>
                <span className="text-sm font-medium">
                  {todo.totalTimeSpent > 0 ? formatTime(todo.totalTimeSpent) : 'No time tracked'}
                </span>
              </div>

              {todo.estimatedMinutes && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Estimated</span>
                  <span className="text-sm">{formatTime(todo.estimatedMinutes * 60)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {todo.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {todo.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Created:</span>
                <br />
                {formatDistance(new Date(todo.createdAt), new Date(), { addSuffix: true })}
              </div>
              
              <div>
                <span className="font-medium text-muted-foreground">Last updated:</span>
                <br />
                {formatDistance(new Date(todo.updatedAt), new Date(), { addSuffix: true })}
              </div>

              {todo.completedAt && (
                <div>
                  <span className="font-medium text-muted-foreground">Completed:</span>
                  <br />
                  {formatDistance(new Date(todo.completedAt), new Date(), { addSuffix: true })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <TodoEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        todo={todo}
        onSuccess={() => {
          router.refresh()
          setIsEditDialogOpen(false)
        }}
      />
    </div>
  )
}