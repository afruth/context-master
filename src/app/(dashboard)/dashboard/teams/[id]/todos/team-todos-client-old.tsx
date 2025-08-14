'use client'

import * as React from "react"
import { User } from "next-auth"
import { Plus, Users, Filter, Search, UserCheck, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/cn"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { TaskCard, Task, TaskStatus } from "@/components/task/task-card"
import { TaskList } from "@/components/task/task-list"
import { TaskForm } from "@/components/task/task-form"
import { useTeam, useTeamMembers, useTeamTodos, useCreateTeamTodo, useUpdateTeamTodo, useDeleteTeamTodo } from "@/hooks/use-teams"
import { TeamTodoSummary } from "@/types/api"

interface TeamTodosClientProps {
  teamId: string
  user: User
}

// Convert API types to component types
const convertTeamTodoToTask = (teamTodo: TeamTodoSummary): Task => ({
  id: teamTodo.id,
  title: teamTodo.title,
  description: teamTodo.description || undefined,
  status: teamTodo.status.toLowerCase() as TaskStatus,
  priority: teamTodo.priority?.toLowerCase() as Task['priority'],
  dueDate: teamTodo.dueDate ? new Date(teamTodo.dueDate) : undefined,
  tags: teamTodo.tags,
  assignee: teamTodo.assignee ? {
    id: teamTodo.assignee.id,
    name: teamTodo.assignee.name || teamTodo.assignee.email,
    avatar: teamTodo.assignee.image || undefined,
  } : undefined,
  createdAt: new Date(teamTodo.createdAt),
  updatedAt: new Date(teamTodo.updatedAt),
})

export function TeamTodosClient({ teamId, user }: TeamTodosClientProps) {
  const [view, setView] = React.useState<'board' | 'list'>('board')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>('all')
  const [selectedPriority, setSelectedPriority] = React.useState<string>('all')
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all')
  const [showTaskForm, setShowTaskForm] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<Task | null>(null)

  // Queries
  const { data: team, isLoading: teamLoading } = useTeam(teamId)
  const { data: membersData, isLoading: membersLoading } = useTeamMembers(teamId, { limit: 100 })
  const { data: todosData, isLoading: todosLoading, refetch: refetchTodos } = useTeamTodos(teamId, {
    search: searchTerm || undefined,
    assigneeId: selectedAssignee === 'all' ? undefined : selectedAssignee === 'unassigned' ? 'unassigned' : selectedAssignee,
    priority: selectedPriority === 'all' ? undefined : selectedPriority,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    limit: 1000, // Get all todos for board view
  })

  // Mutations
  const createTodoMutation = useCreateTeamTodo(teamId)
  const updateTodoMutation = useUpdateTeamTodo(teamId)
  const deleteTodoMutation = useDeleteTeamTodo(teamId)

  const members = membersData?.data || []
  const todos = todosData?.data || []
  const tasks = todos.map(convertTeamTodoToTask)

  // Check user permissions
  const userRole = team?.userRole
  const canCreateTodos = userRole && ['OWNER', 'ADMIN', 'MEMBER'].includes(userRole)
  const canEditAllTodos = userRole && ['OWNER', 'ADMIN'].includes(userRole)

  // Filter tasks by status for board view
  const todoTasks = tasks.filter(task => task.status === 'todo')
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress')
  const completedTasks = tasks.filter(task => task.status === 'completed')

  // Get available assignees for task form
  const availableAssignees = members.map(member => ({
    id: member.user.id,
    name: member.user.name || member.user.email,
    email: member.user.email,
    avatar: member.user.image || undefined,
  }))

  // Get available tags from existing todos
  const availableTags = Array.from(
    new Set(todos.flatMap(todo => todo.tags || []))
  ).filter(Boolean)

  const handleCreateTask = async (data: any) => {
    await createTodoMutation.mutateAsync({
      title: data.title,
      description: data.description,
      priority: data.priority?.toUpperCase(),
      dueDate: data.dueDate,
      category: data.category,
      tags: data.tags,
      assigneeId: data.assigneeId === 'unassigned' ? undefined : data.assigneeId,
      estimatedMinutes: data.estimatedMinutes,
    })
  }

  const handleUpdateTask = async (data: any) => {
    if (!editingTask) return
    
    await updateTodoMutation.mutateAsync({
      todoId: editingTask.id,
      data: {
        title: data.title,
        description: data.description,
        status: data.status?.toUpperCase(),
        priority: data.priority?.toUpperCase(),
        dueDate: data.dueDate,
        category: data.category,
        tags: data.tags,
        assigneeId: data.assigneeId === 'unassigned' ? undefined : data.assigneeId,
        estimatedMinutes: data.estimatedMinutes,
      },
    })
    setEditingTask(null)
  }

  const handleTaskStatusChange = async (taskId: string, completed: boolean) => {
    const newStatus = completed ? 'COMPLETED' : 'TODO'
    await updateTodoMutation.mutateAsync({
      todoId: taskId,
      data: { status: newStatus },
    })
  }

  const handleTaskEdit = (task: Task) => {
    // Check permissions
    const canEdit = canEditAllTodos || task.assignee?.id === user.id
    if (!canEdit) return
    
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleTaskDelete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    const canDelete = canEditAllTodos || task?.assignee?.id === user.id
    if (!canDelete) return
    
    await deleteTodoMutation.mutateAsync(taskId)
  }

  const handleDragDrop = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    // Check permissions - can change status of assigned tasks or if admin/owner
    const canChangeStatus = canEditAllTodos || task.assignee?.id === user.id
    if (!canChangeStatus) return
    
    await updateTodoMutation.mutateAsync({
      todoId: taskId,
      data: { status: newStatus.toUpperCase() },
    })
  }

  const handleAddTask = () => {
    if (!canCreateTodos) return
    setEditingTask(null)
    setShowTaskForm(true)
  }

  // Filter options
  const myTasksCount = tasks.filter(task => task.assignee?.id === user.id).length
  const unassignedTasksCount = tasks.filter(task => !task.assignee).length

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!team) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8" />}
        title="Team not found"
        description="The team you're looking for doesn't exist or you don't have access to it."
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-semibold">{team.name}</h1>
            </div>
            <Badge variant="secondary">Todos</Badge>
          </div>
          
          <div className="ml-auto flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search todos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
            
            {/* View Toggle */}
            <Tabs value={view} onValueChange={(value) => setView(value as 'board' | 'list')}>
              <TabsList className="grid grid-cols-2 w-32">
                <TabsTrigger value="board">Board</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Add Todo Button */}
            {canCreateTodos && (
              <Button onClick={handleAddTask} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Todo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b bg-muted/50 px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Assignee Filter */}
          <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value={user.id}>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-3 w-3" />
                  Assigned to Me ({myTasksCount})
                </div>
              </SelectItem>
              <SelectItem value="unassigned">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Unassigned ({unassignedTasksCount})
                </div>
              </SelectItem>
              {members.map((member) => (
                <SelectItem key={member.user.id} value={member.user.id}>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback size="sm">
                        {(member.user.name || member.user.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {member.user.name || member.user.email}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter (for list view) */}
          {view === 'list' && (
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {todosLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : view === 'board' ? (
          /* Board View */
          <div className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              {/* To Do Column */}
              <TaskList
                title="To Do"
                status="todo"
                tasks={todoTasks}
                variant="column"
                droppable={canEditAllTodos}
                onDrop={handleDragDrop}
                onTaskStatusChange={handleTaskStatusChange}
                onTaskEdit={handleTaskEdit}
                onTaskDelete={handleTaskDelete}
                onAddTask={canCreateTodos ? handleAddTask : undefined}
                emptyMessage="No todos yet"
                emptyAction={canCreateTodos ? {
                  label: "Add Todo",
                  onClick: handleAddTask
                } : undefined}
              />

              {/* In Progress Column */}
              <TaskList
                title="In Progress"
                status="in-progress"
                tasks={inProgressTasks}
                variant="column"
                droppable={canEditAllTodos}
                onDrop={handleDragDrop}
                onTaskStatusChange={handleTaskStatusChange}
                onTaskEdit={handleTaskEdit}
                onTaskDelete={handleTaskDelete}
                emptyMessage="No tasks in progress"
              />

              {/* Completed Column */}
              <TaskList
                title="Completed"
                status="completed"
                tasks={completedTasks}
                variant="column"
                droppable={canEditAllTodos}
                onDrop={handleDragDrop}
                onTaskStatusChange={handleTaskStatusChange}
                onTaskEdit={handleTaskEdit}
                onTaskDelete={handleTaskDelete}
                emptyMessage="No completed tasks"
              />
            </div>
          </div>
        ) : (
          /* List View */
          <TaskList
            tasks={tasks}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            onAddTask={canCreateTodos ? handleAddTask : undefined}
            emptyMessage={
              searchTerm || selectedAssignee !== 'all' || selectedPriority !== 'all' || selectedStatus !== 'all'
                ? "No todos match your filters"
                : "No todos in this team yet"
            }
            emptyAction={canCreateTodos ? {
              label: "Add Todo",
              onClick: handleAddTask
            } : undefined}
          />
        )}
      </div>

      {/* Task Form Modal */}
      <TaskForm
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask ? {
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          dueDate: editingTask.dueDate,
          tags: editingTask.tags,
          assigneeId: editingTask.assignee?.id || 'unassigned',
        } : undefined}
        mode={editingTask ? "edit" : "create"}
        availableAssignees={availableAssignees}
        availableTags={availableTags}
        loading={createTodoMutation.isPending || updateTodoMutation.isPending}
      />
    </div>
  )
}