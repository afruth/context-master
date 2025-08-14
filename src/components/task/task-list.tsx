import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Plus, Filter } from "lucide-react"
import { cn } from "@/lib/cn"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { TaskCard, Task, TaskStatus } from "./task-card"

const taskListVariants = cva(
  "flex flex-col h-full",
  {
    variants: {
      variant: {
        default: "bg-background",
        column: "bg-muted/30 rounded-lg p-4",
        board: "min-h-[500px] w-72",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TaskListProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrop">,
    VariantProps<typeof taskListVariants> {
  title?: string
  status?: TaskStatus
  tasks: Task[]
  onTaskStatusChange?: (taskId: string, completed: boolean) => void
  onTaskEdit?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onTaskClick?: (task: Task) => void
  onAddTask?: () => void
  showHeader?: boolean
  showAddButton?: boolean
  droppable?: boolean
  onDrop?: (taskId: string, newStatus: TaskStatus) => void
  emptyMessage?: string
  emptyAction?: {
    label: string
    onClick: () => void
  }
}

const TaskList = React.forwardRef<HTMLDivElement, TaskListProps>(
  ({
    className,
    variant,
    title,
    status,
    tasks,
    onTaskStatusChange,
    onTaskEdit,
    onTaskDelete,
    onTaskClick,
    onAddTask,
    showHeader = true,
    showAddButton = true,
    droppable = false,
    onDrop,
    emptyMessage,
    emptyAction,
    ...props
  }, ref) => {
    const [isDraggedOver, setIsDraggedOver] = React.useState(false)

    const handleDragOver = (e: React.DragEvent) => {
      if (droppable) {
        e.preventDefault()
        setIsDraggedOver(true)
      }
    }

    const handleDragLeave = () => {
      setIsDraggedOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDraggedOver(false)
      
      if (droppable && onDrop && status) {
        const taskId = e.dataTransfer.getData("taskId")
        if (taskId) {
          onDrop(taskId, status)
        }
      }
    }

    const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
      e.dataTransfer.setData("taskId", task.id)
    }

    const getStatusColor = (status: TaskStatus) => {
      switch (status) {
        case "todo":
          return "bg-gray-500"
        case "in-progress":
          return "bg-blue-500"
        case "completed":
          return "bg-green-500"
        default:
          return "bg-gray-500"
      }
    }

    const getStatusLabel = (status: TaskStatus) => {
      switch (status) {
        case "todo":
          return "To Do"
        case "in-progress":
          return "In Progress"
        case "completed":
          return "Completed"
        default:
          return status
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          taskListVariants({ variant }),
          isDraggedOver && "ring-2 ring-primary ring-offset-2",
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...props}
      >
        {showHeader && (title || status) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="font-semibold text-foreground">
                  {title}
                </h3>
              )}
              {status && !title && (
                <h3 className="font-semibold text-foreground">
                  {getStatusLabel(status)}
                </h3>
              )}
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  status && getStatusColor(status)
                )}
              >
                {tasks.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Filter className="h-3 w-3" />
              </Button>
              
              {showAddButton && onAddTask && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onAddTask}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto">
          {tasks.length === 0 ? (
            <EmptyState
              icon={<Plus className="h-6 w-6" />}
              title={emptyMessage || "No tasks yet"}
              description="Create your first task to get started"
              action={emptyAction}
              size="sm"
            />
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                draggable={droppable}
                onDragStart={(e) => handleTaskDragStart(e, task)}
              >
                <TaskCard
                  task={task}
                  onStatusChange={onTaskStatusChange}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                  onClick={onTaskClick}
                  draggable={droppable}
                  variant={task.assignee ? "team" : "personal"}
                />
              </div>
            ))
          )}
        </div>

        {showAddButton && onAddTask && tasks.length > 0 && (
          <Button
            variant="ghost"
            className="mt-3 h-8 justify-start text-muted-foreground hover:text-foreground"
            onClick={onAddTask}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
        )}
      </div>
    )
  }
)
TaskList.displayName = "TaskList"

export { TaskList, taskListVariants }