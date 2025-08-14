export interface TimeEntry {
  id: string
  startTime: string
  endTime?: string | null
  duration?: number | null
  description?: string | null
  isManual: boolean
  billable: boolean
  hourlyRate?: number | null
  personalTodoId?: string | null
  teamTodoId?: string | null
  userId: string
  createdAt: string
  updatedAt: string
  personalTodo?: {
    id: string
    title: string
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  } | null
  teamTodo?: {
    id: string
    title: string
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    team: {
      id: string
      name: string
    }
  } | null
  todo?: {
    id: string
    title: string
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    team?: {
      id: string
      name: string
    }
  }
  todoType: 'personal' | 'team'
}

export interface ActiveTimer {
  id: string
  startTime: string
  endTime?: string | null
  description?: string | null
  todo?: {
    id: string
    title: string
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    team?: {
      id: string
      name: string
    }
  }
  todoType: 'personal' | 'team'
}

export interface TimerTodo {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category?: string | null
  estimatedMinutes?: number | null
  actualMinutes?: number | null
  type: 'personal' | 'team'
  teamName?: string | null
  teamColor?: string | null
  isAssignedToUser: boolean
  recentlyWorkedOn?: boolean
}

export interface TimerTodosResponse {
  todos: TimerTodo[]
  grouped: {
    inProgress: TimerTodo[]
    todo: TimerTodo[]
    completed: TimerTodo[]
  }
  recentlyWorkedOn: TimerTodo[]
}

export interface TimeReportSummary {
  totalTime: number
  billableTime: number
  totalEarnings: number
  entriesCount: number
  completedTodos: number
}

export interface TimeReportGroupedData {
  date?: string
  weekStart?: string
  month?: string
  todoId?: string
  todoTitle?: string
  todoType?: 'personal' | 'team'
  teamName?: string
  project?: string
  totalTime: number
  billableTime: number
  earnings: number
  entriesCount: number
  todosCount?: number
}

export interface TimeReportData {
  summary: TimeReportSummary
  groupedData: TimeReportGroupedData[]
  period: {
    startDate: string
    endDate: string
    groupBy: string
  }
}

export interface TimeStatsData {
  today?: TimeReportSummary
  thisWeek?: TimeReportSummary
  thisMonth?: TimeReportSummary
}