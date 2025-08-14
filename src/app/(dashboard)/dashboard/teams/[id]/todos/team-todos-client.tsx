'use client'

import * as React from "react"
import { User } from "next-auth"
import { Plus, Users, BarChart3, List, Columns, AlertCircle, Settings, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/cn"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { TaskCard, Task, TaskStatus } from "@/components/task/task-card"
import { TaskList } from "@/components/task/task-list"
import { TaskForm } from "@/components/task/task-form"
import { TeamTaskFilters, TeamTaskFilters as FilterType } from "@/components/team/team-task-filters"
import { TeamWorkloadChart } from "@/components/team/team-workload-chart"
import { TodoDetailModal } from "@/components/team/todo-detail-modal"
import { useTeam, useTeamMembers, useTeamTodos, useCreateTeamTodo, useUpdateTeamTodo, useDeleteTeamTodo } from "@/hooks/use-teams"
import { TeamTodoSummary } from "@/types/api"
import { TaskFormData } from "@/hooks/use-form-validation"

// Extended TaskFormData for team todos
interface TeamTaskFormData extends TaskFormData {
  assigneeId?: string
}
import Link from "next/link"

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
  commentCount: teamTodo.commentCount,
  createdAt: new Date(teamTodo.createdAt),
  updatedAt: new Date(teamTodo.updatedAt),
})

export function TeamTodosClient({ teamId, user }: TeamTodosClientProps) {
  const [activeTab, setActiveTab] = React.useState<'board' | 'list' | 'analytics'>('board')
  const [filters, setFilters] = React.useState<FilterType>({
    search: '',
    assigneeId: 'all',
    priority: 'all',
    status: 'all',
  })
  const [showTaskForm, setShowTaskForm] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<Task | null>(null)
  const [selectedTodo, setSelectedTodo] = React.useState<TeamTodoSummary | null>(null)
  const [showTodoDetail, setShowTodoDetail] = React.useState(false)

  // Queries
  const { data: team, isLoading: teamLoading } = useTeam(teamId)
  const { data: membersData, isLoading: membersLoading } = useTeamMembers(teamId, { limit: 100 })
  
  // Build query params from filters
  const todoQueryParams = React.useMemo(() => ({
    search: filters.search || undefined,
    assigneeId: filters.assigneeId === 'all' ? undefined : 
                filters.assigneeId === 'unassigned' ? 'unassigned' : filters.assigneeId,
    priority: filters.priority === 'all' ? undefined : filters.priority,
    status: filters.status === 'all' ? undefined : filters.status,
    limit: 1000, // Get all todos for client-side operations
  }), [filters])
  
  const { data: todosData, isLoading: todosLoading, refetch: refetchTodos } = useTeamTodos(teamId, todoQueryParams)

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

  // Calculate task counts for filters
  const taskCounts = React.useMemo(() => {
    const allTodos = todos
    return {
      total: allTodos.length,
      myTasks: allTodos.filter(todo => todo.assigneeId === user.id).length,
      unassigned: allTodos.filter(todo => !todo.assigneeId).length,
      byMember: members.reduce((acc, member) => {
        acc[member.user.id] = allTodos.filter(todo => todo.assigneeId === member.user.id).length
        return acc
      }, {} as Record<string, number>),
      byPriority: {
        urgent: allTodos.filter(todo => todo.priority === 'URGENT').length,
        high: allTodos.filter(todo => todo.priority === 'HIGH').length,
        medium: allTodos.filter(todo => todo.priority === 'MEDIUM').length,
        low: allTodos.filter(todo => todo.priority === 'LOW').length,
      },
      byStatus: {
        todo: allTodos.filter(todo => todo.status === 'TODO').length,
        'in-progress': allTodos.filter(todo => todo.status === 'IN_PROGRESS').length,
        completed: allTodos.filter(todo => todo.status === 'COMPLETED').length,
      },
    }
  }, [todos, members, user.id])

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

  const handleCreateTask = async (data: TeamTaskFormData) => {
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

  const handleUpdateTask = async (data: TeamTaskFormData) => {
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

  const handleTaskClick = (task: Task) => {
    const todo = todos.find(t => t.id === task.id)
    if (todo) {
      setSelectedTodo(todo)
      setShowTodoDetail(true)
    }
  }

  const handleTodoDetailEdit = (todo: TeamTodoSummary) => {
    const task = convertTeamTodoToTask(todo)
    setEditingTask(task)
    setShowTaskForm(true)
    setShowTodoDetail(false)
  }

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
            <Link href={`/dashboard/teams/${teamId}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-semibold">{team.name}</h1>
            </div>
            <Badge variant="secondary">Todos</Badge>
          </div>
          
          <div className="ml-auto flex items-center gap-3">
            {/* View Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
              <TabsList>
                <TabsTrigger value="board" className="flex items-center gap-2">
                  <Columns className="h-3 w-3" />
                  Board
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-3 w-3" />
                  List
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-3 w-3" />
                  Analytics
                </TabsTrigger>
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

      {/* Filters - Hide on analytics tab */}
      {activeTab !== 'analytics' && (
        <div className="border-b bg-muted/30 px-6 py-4">
          <TeamTaskFilters
            filters={filters}
            onFiltersChange={setFilters}
            members={members}
            currentUser={user}
            availableTags={availableTags}
            showStatusFilter={activeTab === 'list'}
            taskCounts={taskCounts}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full flex flex-col">
          {/* Board View */}
          <TabsContent value="board" className="flex-1 p-6 m-0">
            {todosLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
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
                    onTaskClick={handleTaskClick}
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
                    onTaskClick={handleTaskClick}
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
                    onTaskClick={handleTaskClick}
                    emptyMessage="No completed tasks"
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="flex-1 p-6 m-0">
            {todosLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <TaskList
                tasks={tasks}
                onTaskStatusChange={handleTaskStatusChange}
                onTaskEdit={handleTaskEdit}
                onTaskDelete={handleTaskDelete}
                onTaskClick={handleTaskClick}
                onAddTask={canCreateTodos ? handleAddTask : undefined}
                emptyMessage={
                  Object.values(filters).some(v => v !== 'all' && v !== '')
                    ? "No todos match your filters"
                    : "No todos in this team yet"
                }
                emptyAction={canCreateTodos ? {
                  label: "Add Todo",
                  onClick: handleAddTask
                } : undefined}
              />
            )}
          </TabsContent>

          {/* Analytics View */}
          <TabsContent value="analytics" className="flex-1 p-6 m-0">
            {todosLoading || membersLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-6">
                <TeamWorkloadChart
                  members={members}
                  todos={todos.map(todo => ({
                    id: todo.id,
                    status: todo.status,
                    assigneeId: todo.assigneeId,
                    createdById: todo.createdById,
                    dueDate: todo.dueDate,
                    completedAt: todo.completedAt,
                    createdAt: todo.createdAt,
                  }))}
                  currentUser={user}
                />
                
                {/* Additional analytics cards can be added here */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Recent Activity</h3>
                    <div className="text-sm text-muted-foreground">
                      Activity tracking coming soon...
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Productivity Trends</h3>
                    <div className="text-sm text-muted-foreground">
                      Trend analysis coming soon...
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
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

      {/* Todo Detail Modal */}
      <TodoDetailModal
        todo={selectedTodo}
        teamId={teamId}
        currentUser={{
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }}
        userRole={userRole}
        open={showTodoDetail}
        onOpenChange={setShowTodoDetail}
        onEdit={handleTodoDetailEdit}
        onStatusChange={handleTaskStatusChange}
      />
    </div>
  )
}