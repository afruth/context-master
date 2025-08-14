import * as React from "react"
import { 
  Filter, 
  X, 
  Calendar, 
  User, 
  Tag, 
  AlertTriangle,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRangePicker } from "@/components/ui/date-picker"
import { Separator } from "@/components/ui/separator"
import { TaskPriority, TaskStatus } from "./task-card"

export interface TaskFilters {
  search?: string
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assigneeIds?: string[]
  tags?: string[]
  dueDateRange?: {
    from?: Date
    to?: Date
  }
  overdue?: boolean
  completedAt?: {
    from?: Date
    to?: Date
  }
}

export interface TaskFiltersProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  availableAssignees?: Array<{
    id: string
    name: string
    avatar?: string
  }>
  availableTags?: string[]
  className?: string
  showSearch?: boolean
  showQuickFilters?: boolean
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  availableAssignees = [],
  availableTags = [],
  className,
  showSearch = true,
  showQuickFilters = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const updateFilters = (updates: Partial<TaskFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const statusOptions = [
    { value: "todo", label: "To Do" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ] as const

  const priorityOptions = [
    { value: "low", label: "Low", color: "text-gray-600" },
    { value: "medium", label: "Medium", color: "text-yellow-600" },
    { value: "high", label: "High", color: "text-orange-600" },
    { value: "urgent", label: "Urgent", color: "text-red-600" },
  ] as const

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status?.length) count++
    if (filters.priority?.length) count++
    if (filters.assigneeIds?.length) count++
    if (filters.tags?.length) count++
    if (filters.dueDateRange?.from || filters.dueDateRange?.to) count++
    if (filters.overdue) count++
    return count
  }

  const hasActiveFilters = getActiveFiltersCount() > 0

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showSearch && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.search || ""}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-8"
          />
        </div>
      )}

      {showQuickFilters && (
        <>
          {/* Quick filter buttons */}
          <Button
            variant={filters.overdue ? "default" : "ghost"}
            size="sm"
            onClick={() => updateFilters({ overdue: !filters.overdue })}
          >
            Overdue
          </Button>

          <Button
            variant={filters.status?.includes("completed") ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              const isActive = filters.status?.includes("completed")
              updateFilters({
                status: isActive ? [] : ["completed"]
              })
            }}
          >
            Completed
          </Button>
        </>
      )}

      {/* Advanced filters popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
              >
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-auto p-1 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-3 w-3" />
                Status
              </label>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={filters.status?.includes(option.value as TaskStatus) ?? false}
                      onCheckedChange={(checked) => {
                        const currentStatus = filters.status || []
                        const newStatus = checked
                          ? [...currentStatus, option.value as TaskStatus]
                          : currentStatus.filter(s => s !== option.value)
                        updateFilters({ status: newStatus })
                      }}
                    />
                    <label
                      htmlFor={`status-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-3 w-3" />
                Priority
              </label>
              <div className="space-y-2">
                {priorityOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${option.value}`}
                      checked={filters.priority?.includes(option.value as TaskPriority) ?? false}
                      onCheckedChange={(checked) => {
                        const currentPriority = filters.priority || []
                        const newPriority = checked
                          ? [...currentPriority, option.value as TaskPriority]
                          : currentPriority.filter(p => p !== option.value)
                        updateFilters({ priority: newPriority })
                      }}
                    />
                    <label
                      htmlFor={`priority-${option.value}`}
                      className={cn("text-sm font-normal cursor-pointer", option.color)}
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Due Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Due Date Range
              </label>
              <DateRangePicker
                value={filters.dueDateRange}
                onChange={(range) => updateFilters({ dueDateRange: range })}
                placeholder="Select date range"
                className="w-full"
              />
            </div>

            {/* Assignee Filter */}
            {availableAssignees.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Assignees
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableAssignees.map((assignee) => (
                      <div key={assignee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`assignee-${assignee.id}`}
                          checked={filters.assigneeIds?.includes(assignee.id) ?? false}
                          onCheckedChange={(checked) => {
                            const currentAssignees = filters.assigneeIds || []
                            const newAssignees = checked
                              ? [...currentAssignees, assignee.id]
                              : currentAssignees.filter(id => id !== assignee.id)
                            updateFilters({ assigneeIds: newAssignees })
                          }}
                        />
                        <label
                          htmlFor={`assignee-${assignee.id}`}
                          className="text-sm font-normal cursor-pointer truncate"
                        >
                          {assignee.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    Tags
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={filters.tags?.includes(tag) ?? false}
                          onCheckedChange={(checked) => {
                            const currentTags = filters.tags || []
                            const newTags = checked
                              ? [...currentTags, tag]
                              : currentTags.filter(t => t !== tag)
                            updateFilters({ tags: newTags })
                          }}
                        />
                        <label
                          htmlFor={`tag-${tag}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1 ml-2">
          {filters.search && (
            <Badge variant="secondary" className="text-xs">
              Search: {filters.search}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => updateFilters({ search: "" })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.overdue && (
            <Badge variant="secondary" className="text-xs">
              Overdue
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => updateFilters({ overdue: false })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export { TaskFilters }