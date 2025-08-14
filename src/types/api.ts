import { 
  User, 
  PersonalTodo, 
  TeamTodo, 
  Team, 
  TeamMember, 
  TeamInvitation, 
  TimeEntry, 
  TodoComment,
  TodoStatus,
  Priority,
  TeamRole,
  InvitationStatus
} from '@prisma/client'

// Extended types with relations
export interface UserProfile extends Omit<User, 'password'> {
  // Excludes password for security
}

export interface PersonalTodoWithTimeEntries extends Omit<PersonalTodo, 'tags'> {
  timeEntries: TimeEntry[]
  tags: string[] // Parsed from JSON
}

export interface PersonalTodoSummary extends Omit<PersonalTodo, 'tags'> {
  timeEntries: {
    totalTime: number // in minutes
    entryCount: number
  }
  tags: string[] // Parsed from JSON
}

export interface TeamTodoWithDetails extends Omit<TeamTodo, 'tags'> {
  assignee: UserProfile | null
  createdBy: UserProfile
  comments: TodoCommentWithUser[]
  timeEntries: TimeEntry[]
  tags: string[] // Parsed from JSON
}

export interface TeamTodoSummary extends Omit<TeamTodo, 'assignee' | 'createdBy' | 'tags'> {
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
  commentCount: number
  timeEntries: {
    totalTime: number // in minutes
    entryCount: number
  }
  tags: string[] // Parsed from JSON
}

export interface TeamWithStats extends Team {
  memberCount: number
  role: TeamRole // Current user's role
  todoStats?: {
    total: number
    completed: number
    inProgress: number
    overdue: number
  }
  lastActivity?: string
}

export interface TeamDetails extends Team {
  owner: UserProfile
  memberCount: number
  userRole: TeamRole
  todoStats: {
    total: number
    completed: number
    inProgress: number
    overdue: number
  }
}

export interface TeamMemberWithUser extends TeamMember {
  user: UserProfile
  todoStats?: {
    assigned: number
    completed: number
    overdue: number
  }
}

export interface TeamInvitationWithInviter extends TeamInvitation {
  inviter: {
    id: string
    name: string | null
    email: string
  }
}

export interface TodoCommentWithUser extends TodoComment {
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

export interface TimeEntryWithContext extends TimeEntry {
  todo: {
    id: string
    title: string
    type: 'personal' | 'team'
  }
  team?: {
    id: string
    name: string
  } | null
}

// API Request/Response types
export interface CreatePersonalTodoRequest {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  category?: string
  tags?: string[]
  color?: string
  estimatedMinutes?: number
}

export interface UpdatePersonalTodoRequest {
  title?: string
  description?: string
  status?: TodoStatus
  priority?: Priority
  dueDate?: string | null
  category?: string | null
  tags?: string[]
  color?: string | null
  estimatedMinutes?: number | null
}

export interface CreateTeamRequest {
  name: string
  description?: string
  isPublic?: boolean
  color?: string
  allowGuestInvites?: boolean
  requireApproval?: boolean
  maxMembers?: number
}

export interface UpdateTeamRequest {
  name?: string
  description?: string
  color?: string
  allowGuestInvites?: boolean
  requireApproval?: boolean
  maxMembers?: number
}

export interface CreateTeamTodoRequest {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  category?: string
  tags?: string[]
  color?: string
  assigneeId?: string
  estimatedMinutes?: number
}

export interface UpdateTeamTodoRequest {
  title?: string
  description?: string
  status?: TodoStatus
  priority?: Priority
  dueDate?: string | null
  category?: string | null
  tags?: string[]
  color?: string | null
  assigneeId?: string | null
  estimatedMinutes?: number | null
}

export interface CreateInvitationRequest {
  email: string
  role?: TeamRole
  message?: string
}

export interface UpdateMemberRoleRequest {
  role?: TeamRole
  notifications?: boolean
}

export interface BulkTodoOperation {
  operation: 'complete' | 'delete' | 'archive'
  todoIds: string[]
}

export interface BulkOperationResult {
  processed: number
  failed: number
  errors?: string[]
}

export interface CreateTimeEntryRequest {
  startTime: string
  endTime?: string
  description?: string
  isManual?: boolean
}

export interface UpdateTimeEntryRequest {
  endTime?: string
  description?: string
  isManual?: boolean
}

// Query parameter types
export interface PersonalTodoQuery {
  page?: number
  limit?: number
  status?: TodoStatus
  priority?: Priority
  category?: string
  tags?: string
  search?: string
  dueBefore?: string
  dueAfter?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority'
  sortOrder?: 'asc' | 'desc'
}

export interface TeamTodoQuery extends PersonalTodoQuery {
  assigneeId?: string
  createdById?: string
  unassigned?: boolean
}

export interface TeamMemberQuery {
  page?: number
  limit?: number
  role?: TeamRole
  search?: string
}

export interface TimeEntryQuery {
  page?: number
  limit?: number
  todoType?: 'personal' | 'team'
  todoId?: string
  teamId?: string
  startDate?: string
  endDate?: string
  sortBy?: 'startTime' | 'duration' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// Report types
export interface PersonalProductivityReport {
  period: string
  startDate: string
  endDate: string
  todos: {
    total: number
    completed: number
    inProgress: number
    todo: number
    cancelled: number
    completionRate: number
  }
  timeTracking: {
    totalTime: number // seconds
    totalSessions: number
    averageSessionTime: number // seconds
    workDays: number
    averageTimePerDay: number // seconds
  }
  categories: Array<{
    name: string
    todoCount: number
    completedCount: number
    totalTime: number // seconds
  }>
  priorities: Array<{
    priority: Priority
    todoCount: number
    completedCount: number
    totalTime: number // seconds
  }>
  dailyActivity: Array<{
    date: string
    todosCompleted: number
    timeSpent: number // seconds
    todosCreated: number
  }>
}

export interface TeamProductivityReport extends PersonalProductivityReport {
  team: {
    id: string
    name: string
    memberCount: number
  }
  members: Array<{
    id: string
    name: string | null
    email: string
    role: TeamRole
    todos: {
      total: number
      completed: number
      completionRate: number
    }
    timeTracking: {
      totalTime: number // seconds
      sessionCount: number
    }
  }>
}