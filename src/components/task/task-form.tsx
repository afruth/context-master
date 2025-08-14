import * as React from "react"
import { Controller } from "react-hook-form"
import { CalendarDays, User, Tag, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useFormValidation, taskValidationSchema, TaskFormData } from "@/hooks/use-form-validation"
import { TaskPriority, TaskStatus } from "./task-card"

export interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TaskFormData) => Promise<void> | void
  initialData?: Partial<TaskFormData>
  mode?: "create" | "edit"
  availableAssignees?: Array<{
    id: string
    name: string
    email: string
    avatar?: string
  }>
  availableTags?: string[]
  loading?: boolean
}

const TaskForm: React.FC<TaskFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
  availableAssignees = [],
  availableTags = [],
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useFormValidation({
    schema: taskValidationSchema,
    defaultValues: {
      title: "",
      description: "",
      priority: "medium" as TaskPriority,
      dueDate: undefined,
      tags: [],
      assigneeId: "",
      ...initialData,
    },
  })

  React.useEffect(() => {
    if (open && initialData) {
      reset(initialData)
    } else if (open) {
      reset({
        title: "",
        description: "",
        priority: "medium" as TaskPriority,
        dueDate: undefined,
        tags: [],
        assigneeId: "",
      })
    }
  }, [open, initialData, reset])

  const handleFormSubmit = async (data: any) => {
    try {
      await onSubmit(data as TaskFormData)
      onOpenChange(false)
      reset()
    } catch (error) {
      console.error("Failed to submit task:", error)
    }
  }

  const tagOptions: MultiSelectOption[] = availableTags.map(tag => ({
    label: tag,
    value: tag,
  }))

  const priorityOptions = [
    { value: "low", label: "Low", color: "text-gray-600" },
    { value: "medium", label: "Medium", color: "text-yellow-600" },
    { value: "high", label: "High", color: "text-orange-600" },
    { value: "urgent", label: "Urgent", color: "text-red-600" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Add a new task to your project. Fill in the details below."
              : "Update the task details below."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title..."
                {...register("title")}
                error={!!errors.title}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a description..."
                autoResize
                rows={3}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Priority and Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={cn("h-3 w-3", option.color)} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select due date"
                      className="w-full"
                    />
                  )}
                />
              </div>
            </div>

            {/* Assignee */}
            {availableAssignees.length > 0 && (
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Controller
                  name="assigneeId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to someone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {availableAssignees.map((assignee) => (
                          <SelectItem key={assignee.id} value={assignee.id}>
                            <div className="flex items-center gap-2">
                              <Avatar size="sm">
                                <AvatarImage src={assignee.avatar} />
                                <AvatarFallback>
                                  {assignee.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{assignee.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {assignee.email}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {/* Tags */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      options={tagOptions}
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder="Add tags..."
                      searchPlaceholder="Search tags..."
                      emptyText="No tags found"
                    />
                  )}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {(isSubmitting || loading) && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              {mode === "create" ? "Create Task" : "Update Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { TaskForm }