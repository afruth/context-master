'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Filter, Search, SortAsc } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AppLayout } from '@/components/layouts/app-layout'
import { TaskList } from '@/components/task/task-list'
import { TaskFilters } from '@/components/task/task-filters'
import { usePersonalTodos, useUpdatePersonalTodo, useDeletePersonalTodo } from '@/hooks/use-todos'
import { Task } from '@/components/task/task-card'
import { PersonalTodoSummary } from '@/types/api'

interface PersonalTodosClientProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

// Transform API data to Task format
function transformTodoToTask(todo: PersonalTodoSummary): Task {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description || undefined,
    status: todo.status.toLowerCase().replace('_', '-') as Task['status'],
    priority: todo.priority?.toLowerCase() as Task['priority'],
    dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
    tags: todo.tags || [],
    createdAt: new Date(todo.createdAt),
    updatedAt: new Date(todo.updatedAt),
  }
}

export function PersonalTodosClient({ user }: PersonalTodosClientProps) {
  const router = useRouter()
  const [filters, setFilters] = React.useState({
    status: 'all',
    priority: 'all',
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc' as const,
  })

  const [page, setPage] = React.useState(1)
  const limit = 20

  // Process filters for API call - convert 'all' to empty/undefined
  const apiFilters = React.useMemo(() => ({
    status: filters.status === 'all' ? undefined : filters.status,
    priority: filters.priority === 'all' ? undefined : filters.priority,
    search: filters.search || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  }), [filters])

  const { data, isLoading, error } = usePersonalTodos({
    ...apiFilters,
    page,
    limit,
  })

  const updateTodo = useUpdatePersonalTodo()
  const deleteTodo = useDeletePersonalTodo()

  const todos = data?.data || []
  const totalTodos = data?.pagination?.total || 0
  const hasMore = data?.pagination?.hasNext || false

  // Transform todos to Task format
  const tasks: Task[] = React.useMemo(() => 
    todos.map(transformTodoToTask), [todos]
  )

  // Group tasks by status for board view
  const tasksByStatus = React.useMemo(() => {
    return {
      todo: tasks.filter(task => task.status === 'todo'),
      'in-progress': tasks.filter(task => task.status === 'in-progress'),
      completed: tasks.filter(task => task.status === 'completed'),
    }
  }, [tasks])

  const [viewMode, setViewMode] = React.useState<'list' | 'board'>('list')

  const handleStatusChange = (taskId: string, completed: boolean) => {
    updateTodo.mutate({
      id: taskId,
      data: {
        status: completed ? 'COMPLETED' : 'TODO',
      },
    })
  }

  const handleTaskEdit = (task: Task) => {
    // TODO: Open edit dialog/form
    console.log('Edit task:', task)
  }

  const handleTaskDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTodo.mutate(taskId)
    }
  }

  const handleTaskClick = (task: Task) => {
    router.push(`/dashboard/todos/${task.id}`)
  }

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPage(1) // Reset to first page when filters change
  }

  const loadMore = () => {
    if (hasMore) {
      setPage(prev => prev + 1)
    }
  }

  return (
    <AppLayout user={user}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Personal Todos</h1>
                <p className="text-muted-foreground">
                  Manage your personal tasks and stay organized
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'board' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('board')}
                >
                  Board
                </Button>
                <Link href="/dashboard/todos/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Todo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalTodos}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {tasksByStatus['in-progress'].length}
                </div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tasksByStatus.completed.length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {tasksByStatus.todo.length}
                </div>
                <div className="text-xs text-muted-foreground">To Do</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search todos..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => handleFiltersChange({ search: e.target.value })}
                  />
                </div>
              </div>

              <Select value={filters.status} onValueChange={(value) => handleFiltersChange({ status: value })}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priority} onValueChange={(value) => handleFiltersChange({ priority: value })}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={`${filters.sortBy}-${filters.sortOrder}`} 
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-')
                  handleFiltersChange({ 
                    sortBy, 
                    sortOrder: sortOrder as 'asc' | 'desc' 
                  })
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt-desc">Recent</SelectItem>
                  <SelectItem value="createdAt-desc">Newest</SelectItem>
                  <SelectItem value="dueDate-asc">Due Date</SelectItem>
                  <SelectItem value="priority-desc">Priority</SelectItem>
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">Failed to load todos</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-4">
                <TaskList
                  tasks={tasks}
                  onTaskStatusChange={handleStatusChange}
                  onTaskEdit={handleTaskEdit}
                  onTaskDelete={handleTaskDelete}
                  onTaskClick={handleTaskClick}
                  showHeader={false}
                  emptyMessage="No todos found"
                  emptyAction={{
                    label: 'Create your first todo',
                    onClick: () => window.location.href = '/dashboard/todos/new',
                  }}
                />
                
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={loadMore}>
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TaskList
                  title="To Do"
                  status="todo"
                  variant="column"
                  tasks={tasksByStatus.todo}
                  onTaskStatusChange={handleStatusChange}
                  onTaskEdit={handleTaskEdit}
                  onTaskDelete={handleTaskDelete}
                  onTaskClick={handleTaskClick}
                  droppable
                  onDrop={(taskId, newStatus) => {
                    const statusMap = {
                      'todo': 'TODO',
                      'in-progress': 'IN_PROGRESS',
                      'completed': 'COMPLETED',
                    }
                    updateTodo.mutate({
                      id: taskId,
                      data: { status: statusMap[newStatus] },
                    })
                  }}
                />
                
                <TaskList
                  title="In Progress"
                  status="in-progress"
                  variant="column"
                  tasks={tasksByStatus['in-progress']}
                  onTaskStatusChange={handleStatusChange}
                  onTaskEdit={handleTaskEdit}
                  onTaskDelete={handleTaskDelete}
                  onTaskClick={handleTaskClick}
                  droppable
                  onDrop={(taskId, newStatus) => {
                    const statusMap = {
                      'todo': 'TODO',
                      'in-progress': 'IN_PROGRESS',
                      'completed': 'COMPLETED',
                    }
                    updateTodo.mutate({
                      id: taskId,
                      data: { status: statusMap[newStatus] },
                    })
                  }}
                />
                
                <TaskList
                  title="Completed"
                  status="completed"
                  variant="column"
                  tasks={tasksByStatus.completed}
                  onTaskStatusChange={handleStatusChange}
                  onTaskEdit={handleTaskEdit}
                  onTaskDelete={handleTaskDelete}
                  onTaskClick={handleTaskClick}
                  droppable
                  onDrop={(taskId, newStatus) => {
                    const statusMap = {
                      'todo': 'TODO',
                      'in-progress': 'IN_PROGRESS',
                      'completed': 'COMPLETED',
                    }
                    updateTodo.mutate({
                      id: taskId,
                      data: { status: statusMap[newStatus] },
                    })
                  }}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  )
}