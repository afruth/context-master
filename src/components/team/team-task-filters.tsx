import * as React from "react"
import { User } from "next-auth"
import { Filter, Search, UserCheck, Clock, Users, X } from "lucide-react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { TeamMemberWithUser } from "@/types/api"

export interface TeamTaskFilters {
  search: string
  assigneeId: string
  priority: string
  status?: string
  createdById?: string
  unassigned?: boolean
}

interface TeamTaskFiltersProps {
  filters: TeamTaskFilters
  onFiltersChange: (filters: TeamTaskFilters) => void
  members: TeamMemberWithUser[]
  currentUser: User
  availableTags?: string[]
  availableCategories?: string[]
  showStatusFilter?: boolean
  taskCounts?: {
    total: number
    myTasks: number
    unassigned: number
    byMember: Record<string, number>
    byPriority: Record<string, number>
    byStatus?: Record<string, number>
  }
}

export function TeamTaskFilters({
  filters,
  onFiltersChange,
  members,
  currentUser,
  availableTags = [],
  availableCategories = [],
  showStatusFilter = false,
  taskCounts,
}: TeamTaskFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const updateFilter = (key: keyof TeamTaskFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      assigneeId: 'all',
      priority: 'all',
      status: 'all',
      createdById: undefined,
      unassigned: false,
    })
  }

  const activeFiltersCount = [
    filters.search && 'search',
    filters.assigneeId !== 'all' && 'assignee',
    filters.priority !== 'all' && 'priority',
    filters.status !== 'all' && 'status',
    filters.createdById && 'creator',
  ].filter(Boolean).length

  const getAssigneeName = (userId: string) => {
    if (userId === currentUser.id) return 'Me'
    const member = members.find(m => m.user.id === userId)
    return member?.user.name || member?.user.email || 'Unknown'
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search todos..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10 pr-10"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={() => updateFilter('search', '')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Quick Filters & Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Quick Filter: My Tasks */}
          <Button
            variant={filters.assigneeId === currentUser.id ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter('assigneeId', filters.assigneeId === currentUser.id ? 'all' : currentUser.id)}
            className="h-8"
          >
            <UserCheck className="h-3 w-3 mr-1" />
            My Tasks
            {taskCounts?.myTasks !== undefined && (
              <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-xs">
                {taskCounts.myTasks}
              </Badge>
            )}
          </Button>

          {/* Quick Filter: Unassigned */}
          <Button
            variant={filters.assigneeId === 'unassigned' ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter('assigneeId', filters.assigneeId === 'unassigned' ? 'all' : 'unassigned')}
            className="h-8"
          >
            <Clock className="h-3 w-3 mr-1" />
            Unassigned
            {taskCounts?.unassigned !== undefined && (
              <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-xs">
                {taskCounts.unassigned}
              </Badge>
            )}
          </Button>

          {/* Quick Filter: High Priority */}
          <Button
            variant={filters.priority === 'high' ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter('priority', filters.priority === 'high' ? 'all' : 'high')}
            className="h-8"
          >
            High Priority
            {taskCounts?.byPriority?.high !== undefined && (
              <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-xs">
                {taskCounts.byPriority.high}
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-muted-foreground">
              Clear all
              <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-xs">
                {activeFiltersCount}
              </Badge>
            </Button>
          )}
          
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-3 w-3 mr-1" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Advanced Filters</h4>
                  <p className="text-sm text-muted-foreground">
                    Fine-tune your todo list view
                  </p>
                </div>

                <Separator />

                {/* Assignee Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assigned to</label>
                  <Select value={filters.assigneeId} onValueChange={(value) => updateFilter('assigneeId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          All Members ({taskCounts?.total || 0})
                        </div>
                      </SelectItem>
                      <SelectItem value={currentUser.id}>
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-3 w-3" />
                          Assigned to Me ({taskCounts?.myTasks || 0})
                        </div>
                      </SelectItem>
                      <SelectItem value="unassigned">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Unassigned ({taskCounts?.unassigned || 0})
                        </div>
                      </SelectItem>
                      <Separator />
                      {members.map((member) => (
                        <SelectItem key={member.user.id} value={member.user.id}>
                          <div className="flex items-center gap-2">
                            <Avatar size="sm">
                              <AvatarImage src={member.user.image || undefined} />
                              <AvatarFallback size="sm">
                                {(member.user.name || member.user.email).slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.user.name || member.user.email}</span>
                            {taskCounts?.byMember?.[member.user.id] !== undefined && (
                              <Badge variant="secondary" className="ml-auto h-4 min-w-[16px] text-xs">
                                {taskCounts.byMember[member.user.id]}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-red-600 font-medium">Urgent</span>
                          {taskCounts?.byPriority?.urgent !== undefined && (
                            <Badge variant="secondary" className="h-4 min-w-[16px] text-xs">
                              {taskCounts.byPriority.urgent}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-orange-600 font-medium">High</span>
                          {taskCounts?.byPriority?.high !== undefined && (
                            <Badge variant="secondary" className="h-4 min-w-[16px] text-xs">
                              {taskCounts.byPriority.high}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-yellow-600 font-medium">Medium</span>
                          {taskCounts?.byPriority?.medium !== undefined && (
                            <Badge variant="secondary" className="h-4 min-w-[16px] text-xs">
                              {taskCounts.byPriority.medium}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-600">Low</span>
                          {taskCounts?.byPriority?.low !== undefined && (
                            <Badge variant="secondary" className="h-4 min-w-[16px] text-xs">
                              {taskCounts.byPriority.low}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter (for list view) */}
                {showStatusFilter && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="todo">
                          <div className="flex items-center justify-between w-full">
                            <span>To Do</span>
                            {taskCounts?.byStatus?.todo !== undefined && (
                              <Badge variant="secondary" className="h-4 min-w-[16px] text-xs">
                                {taskCounts.byStatus.todo}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                        <SelectItem value="in-progress">
                          <div className="flex items-center justify-between w-full">
                            <span>In Progress</span>
                            {taskCounts?.byStatus?.['in-progress'] !== undefined && (
                              <Badge variant="secondary" className="h-4 min-w-[16px] text-xs">
                                {taskCounts.byStatus['in-progress']}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                        <SelectItem value="completed">
                          <div className="flex items-center justify-between w-full">
                            <span>Completed</span>
                            {taskCounts?.byStatus?.completed !== undefined && (
                              <Badge variant="secondary" className="h-4 min-w-[16px] text-xs">
                                {taskCounts.byStatus.completed}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={() => setIsOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{filters.search}"
              <Button
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-0"
                onClick={() => updateFilter('search', '')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          
          {filters.assigneeId !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Assignee: {filters.assigneeId === 'unassigned' ? 'Unassigned' : getAssigneeName(filters.assigneeId)}
              <Button
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-0"
                onClick={() => updateFilter('assigneeId', 'all')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          
          {filters.priority !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Priority: {filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1)}
              <Button
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-0"
                onClick={() => updateFilter('priority', 'all')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              <Button
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-0"
                onClick={() => updateFilter('status', 'all')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}