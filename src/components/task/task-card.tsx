import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  Calendar,
  Clock,
  MoreHorizontal,
  User,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/cn"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const taskCardVariants = cva(
  "group relative overflow-hidden transition-all duration-200 hover:shadow-md",
  {
    variants: {
      variant: {
        default: "bg-card border hover:border-primary/20",
        personal: "bg-card border-l-4 border-l-primary",
        team: "bg-card border-l-4",
        completed: "bg-muted/50 opacity-75",
      },
      size: {
        sm: "p-3",
        default: "p-4",
        lg: "p-5",
      },
      priority: {
        low: "border-l-gray-300",
        medium: "border-l-yellow-400",
        high: "border-l-orange-400",
        urgent: "border-l-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskStatus = "todo" | "in-progress" | "completed"

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority?: TaskPriority
  dueDate?: Date
  tags?: string[]
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  commentCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface TaskCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick">,
    VariantProps<typeof taskCardVariants> {
  task: Task
  onStatusChange?: (taskId: string, completed: boolean) => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onClick?: (task: Task) => void
  showActions?: boolean
  draggable?: boolean
}

const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(
  ({
    className,
    variant: propVariant,
    size,
    priority: propPriority,
    task,
    onStatusChange,
    onEdit,
    onDelete,
    onClick,
    showActions = true,
    draggable = false,
    ...props
  }, ref) => {
    const isCompleted = task.status === "completed"
    const variant = isCompleted ? "completed" : propVariant
    const priority = propPriority || task.priority

    const handleStatusChange = (checked: boolean) => {
      onStatusChange?.(task.id, checked)
    }

    const handleCardClick = () => {
      onClick?.(task)
    }

    const getPriorityColor = (priority: TaskPriority) => {
      switch (priority) {
        case "low":
          return "text-gray-600"
        case "medium":
          return "text-yellow-600"
        case "high":
          return "text-orange-600"
        case "urgent":
          return "text-red-600"
        default:
          return "text-gray-600"
      }
    }

    return (
      <Card
        ref={ref}
        className={cn(
          taskCardVariants({ variant, size, priority }),
          draggable && "cursor-grab active:cursor-grabbing",
          onClick && "cursor-pointer",
          className
        )}
        onClick={handleCardClick}
        draggable={draggable}
        {...props}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleStatusChange}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn(
                "font-medium leading-tight",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Task actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(task)}>
                        Edit task
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(task.id)}
                        className="text-destructive"
                      >
                        Delete task
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {task.description && (
              <p className={cn(
                "text-sm text-muted-foreground line-clamp-2",
                isCompleted && "line-through"
              )}>
                {task.description}
              </p>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                {task.priority && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className={cn(
                      "h-3 w-3",
                      getPriorityColor(task.priority)
                    )} />
                    <span className="capitalize">{task.priority}</span>
                  </div>
                )}
                
                {task.dueDate && (
                  <div className={cn(
                    "flex items-center gap-1",
                    task.dueDate < new Date() && !isCompleted && "text-red-500"
                  )}>
                    <Calendar className="h-3 w-3" />
                    <span>{format(task.dueDate, "MMM d")}</span>
                  </div>
                )}

                {task.commentCount !== undefined && task.commentCount > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{task.commentCount}</span>
                  </div>
                )}
              </div>

              {task.assignee && (
                <div className="flex items-center gap-1">
                  <Avatar size="sm">
                    <AvatarImage src={task.assignee.avatar} />
                    <AvatarFallback size="sm">
                      {task.assignee.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>
        </div>

        {isCompleted && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        )}
      </Card>
    )
  }
)
TaskCard.displayName = "TaskCard"

export { TaskCard, taskCardVariants }