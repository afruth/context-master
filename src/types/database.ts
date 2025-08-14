import { 
  User, 
  Team, 
  TeamMember, 
  TeamInvitation,
  PersonalTodo,
  TeamTodo,
  TodoComment,
  TimeEntry,
  TeamRole,
  InvitationStatus,
  TodoStatus,
  Priority
} from '@prisma/client'

// Re-export Prisma enums for convenience
export { TeamRole, InvitationStatus, TodoStatus, Priority }

// Extended types with relations
export type UserWithTeams = User & {
  teamMembers: (TeamMember & {
    team: {
      id: string
      name: string
      slug: string
      color: string | null
      description: string | null
    }
  })[]
}

export type TeamWithMembers = Team & {
  owner: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  members: (TeamMember & {
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
  })[]
  _count: {
    members: number
    todos: number
  }
}

export type TeamWithUserRole = TeamWithMembers & {
  userRole: TeamRole | null
  memberCount: number
  todoCount: number
}

export type PersonalTodoWithTimeEntries = PersonalTodo & {
  timeEntries: TimeEntry[]
  user: {
    id: string
    name: string | null
    email: string
  }
}

export type TeamTodoWithDetails = TeamTodo & {
  team: {
    id: string
    name: string
    slug: string
    color: string | null
  }
  assignee: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  createdBy: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  timeEntries: TimeEntry[]
  comments: (TodoComment & {
    user: {
      id: string
      name: string | null
      image: string | null
    }
  })[]
  _count: {
    comments: number
    timeEntries: number
  }
}

export type TeamInvitationWithDetails = TeamInvitation & {
  team: {
    id: string
    name: string
    description: string | null
    color: string | null
  }
  inviter: {
    id: string
    name: string | null
    email: string
  }
}

export type TimeEntryWithContext = TimeEntry & {
  user: {
    id: string
    name: string | null
    email: string
  }
  personalTodo: {
    id: string
    title: string
  } | null
  teamTodo: {
    id: string
    title: string
    team: {
      id: string
      name: string
    }
  } | null
}

export type TodoCommentWithUser = TodoComment & {
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

// Utility types for creating new records
export type CreatePersonalTodoData = {
  title: string
  description?: string
  status?: TodoStatus
  priority?: Priority
  dueDate?: Date
  category?: string
  tags?: string[]
  color?: string
  estimatedMinutes?: number
}

export type CreateTeamTodoData = {
  title: string
  description?: string
  status?: TodoStatus
  priority?: Priority
  dueDate?: Date
  category?: string
  tags?: string[]
  color?: string
  estimatedMinutes?: number
  assigneeId?: string
  isTemplate?: boolean
  templateName?: string
}

export type CreateTeamData = {
  name: string
  description?: string
  slug: string
  color?: string
  isPublic?: boolean
  allowGuestInvites?: boolean
  requireApproval?: boolean
  maxMembers?: number
}

export type CreateTeamInvitationData = {
  email: string
  teamId: string
  role?: TeamRole
  message?: string
  expiresAt: Date
}

export type CreateTimeEntryData = {
  startTime: Date
  endTime?: Date
  duration?: number
  description?: string
  personalTodoId?: string
  teamTodoId?: string
  isManual?: boolean
  source?: string
  billable?: boolean
  hourlyRate?: number
}

// Filter and query types
export type TodoFilters = {
  status?: TodoStatus[]
  priority?: Priority[]
  category?: string[]
  tags?: string[]
  assigneeId?: string
  dueDate?: {
    from?: Date
    to?: Date
  }
  search?: string
}

export type TeamFilters = {
  role?: TeamRole[]
  isPublic?: boolean
  search?: string
}

export type TimeEntryFilters = {
  startDate?: Date
  endDate?: Date
  todoId?: string
  todoType?: 'personal' | 'team'
  billable?: boolean
}

// Dashboard summary types
export type PersonalDashboardSummary = {
  totalTodos: number
  completedTodos: number
  inProgressTodos: number
  overdueTodos: number
  totalTimeToday: number
  totalTimeWeek: number
  upcomingDeadlines: PersonalTodo[]
}

export type TeamDashboardSummary = {
  totalTodos: number
  completedTodos: number
  inProgressTodos: number
  overdueTodos: number
  totalMembers: number
  activeMembers: number
  recentActivity: (TodoComment | TimeEntry)[]
  upcomingDeadlines: TeamTodoWithDetails[]
}

// Analytics types
export type TodoAnalytics = {
  completionRate: number
  averageCompletionTime: number
  productivityTrend: {
    date: string
    completed: number
    created: number
  }[]
  categoryDistribution: {
    category: string
    count: number
  }[]
  priorityDistribution: {
    priority: Priority
    count: number
  }[]
}

export type TeamAnalytics = {
  memberActivity: {
    userId: string
    userName: string
    todosCompleted: number
    timeSpent: number
  }[]
  todosByStatus: {
    status: TodoStatus
    count: number
  }[]
  timeTracking: {
    totalTime: number
    billableTime: number
    averageSessionLength: number
  }
}

// Error types
export type DatabaseErrorType = 
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'VALIDATION_ERROR'
  | 'CONSTRAINT_VIOLATION'
  | 'CONNECTION_ERROR'
  | 'UNKNOWN_ERROR'

export type DatabaseOperationResult<T> = {
  success: boolean
  data?: T
  error?: {
    type: DatabaseErrorType
    message: string
    details?: unknown
  }
}

// Pagination types
export type PaginatedResult<T> = {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export type PaginationOptions = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}