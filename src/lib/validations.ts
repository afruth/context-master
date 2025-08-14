import { z } from 'zod'

// User schemas
export const registerUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'Password must contain at least one letter and one number'
    ),
  name: z.string().max(100, 'Name must be less than 100 characters').optional(),
  username: z.string().max(50, 'Username must be less than 50 characters').optional(),
})

export const updateUserSchema = z.object({
  name: z.string().max(100, 'Name must be less than 100 characters').optional(),
  username: z.string().max(50, 'Username must be less than 50 characters').optional(),
  timezone: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.boolean().optional(),
  language: z.string().max(10).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'Password must contain at least one letter and one number'
    ),
})

// Todo schemas
export const todoStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
export const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export const createPersonalTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  priority: priorityEnum.optional().default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags allowed').optional(),
  color: z.string().max(20).optional(),
  estimatedMinutes: z.number().int().min(0).optional(),
})

export const updatePersonalTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().optional(),
  status: todoStatusEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags allowed').optional(),
  color: z.string().max(20).optional().nullable(),
  estimatedMinutes: z.number().int().min(0).optional().nullable(),
})

export const personalTodoQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)),
  status: todoStatusEnum.optional(),
  priority: priorityEnum.optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const bulkTodoOperationSchema = z.object({
  operation: z.enum(['complete', 'delete', 'archive']),
  todoIds: z.array(z.string().cuid()).min(1, 'At least one todo ID required'),
})

// Team schemas
export const teamRoleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean().optional().default(false),
  color: z.string().max(20).optional(),
  allowGuestInvites: z.boolean().optional().default(false),
  requireApproval: z.boolean().optional().default(false),
  maxMembers: z.number().int().min(1).optional(),
})

export const updateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().max(20).optional(),
  allowGuestInvites: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  maxMembers: z.number().int().min(1).optional(),
})

export const createTeamTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  priority: priorityEnum.optional().default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags allowed').optional(),
  color: z.string().max(20).optional(),
  assigneeId: z.string().cuid().optional(),
  estimatedMinutes: z.number().int().min(0).optional(),
})

export const updateTeamTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().optional(),
  status: todoStatusEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags allowed').optional(),
  color: z.string().max(20).optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  estimatedMinutes: z.number().int().min(0).optional().nullable(),
})

export const invitationStatusEnum = z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'])

export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: teamRoleEnum.optional().default('MEMBER'),
  message: z.string().max(500, 'Message too long').optional(),
})

export const updateMemberRoleSchema = z.object({
  role: teamRoleEnum,
  notifications: z.boolean().optional(),
})

// Time tracking schemas
export const createTimeEntrySchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  description: z.string().max(255).optional(),
  personalTodoId: z.string().cuid().optional(),
  teamTodoId: z.string().cuid().optional(),
  isManual: z.boolean().optional().default(false),
  billable: z.boolean().optional().default(false),
  hourlyRate: z.number().min(0).optional(),
}).refine(
  (data) => Boolean(data.personalTodoId) !== Boolean(data.teamTodoId),
  {
    message: "Either personalTodoId or teamTodoId must be provided, but not both",
    path: ["personalTodoId", "teamTodoId"],
  }
)

export const updateTimeEntrySchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  description: z.string().max(255).optional(),
  personalTodoId: z.string().cuid().optional(),
  teamTodoId: z.string().cuid().optional(),
  isManual: z.boolean().optional(),
  billable: z.boolean().optional(),
  hourlyRate: z.number().min(0).optional(),
})

export const timeEntryQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  todoId: z.string().cuid().optional(),
  todoType: z.enum(['personal', 'team']).optional(),
  billable: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  sortBy: z.enum(['startTime', 'duration', 'createdAt']).optional().default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const startTimerSchema = z.object({
  personalTodoId: z.string().cuid().optional(),
  teamTodoId: z.string().cuid().optional(),
  description: z.string().max(255).optional(),
}).refine(
  (data) => Boolean(data.personalTodoId) !== Boolean(data.teamTodoId),
  {
    message: "Either personalTodoId or teamTodoId must be provided, but not both",
    path: ["personalTodoId", "teamTodoId"],
  }
)

export const timeReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['day', 'week', 'month', 'todo', 'project']).optional().default('day'),
  todoType: z.enum(['personal', 'team', 'all']).optional().default('all'),
  billableOnly: z.boolean().optional().default(false),
})

// Generic pagination schema
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1') || 1),
  limit: z.string().optional().transform(val => Math.min(parseInt(val || '20') || 20, 100)),
})

// Settings schemas
export const applicationPreferencesSchema = z.object({
  defaultTodoPriority: priorityEnum.optional().default('MEDIUM'),
  defaultDueDateOffset: z.enum(['none', '1-hour', '1-day', '3-days', '1-week', '1-month']).optional().default('1-day'),
  autoSaveFrequency: z.enum(['real-time', '30-seconds', '1-minute', '5-minutes']).optional().default('real-time'),
  sidebarCollapsed: z.boolean().optional().default(false),
  defaultViewMode: z.enum(['board', 'list']).optional().default('list'),
  tasksPerPage: z.number().int().min(5).max(100).optional().default(20),
})

export const notificationSettingsSchema = z.object({
  emailTaskAssignments: z.boolean().optional().default(true),
  emailTeamInvitations: z.boolean().optional().default(true),
  pushNotifications: z.boolean().optional().default(false),
  weeklyDigestEmails: z.boolean().optional().default(true),
  dueDateReminders: z.enum(['none', '1-hour', '1-day', '3-days', '1-week']).optional().default('1-day'),
  teamActivityNotifications: z.boolean().optional().default(true),
})

export const displaySettingsSchema = z.object({
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD MMM YYYY']).optional().default('MM/DD/YYYY'),
  timeFormat: z.enum(['12-hour', '24-hour']).optional().default('12-hour'),
  firstDayOfWeek: z.enum(['sunday', 'monday']).optional().default('sunday'),
  showTimezoneInUI: z.boolean().optional().default(true),
  listSpacing: z.enum(['compact', 'comfortable']).optional().default('comfortable'),
  showCompletedTasks: z.boolean().optional().default(false),
})

export const privacySecuritySchema = z.object({
  profileVisibility: z.enum(['public', 'team-only', 'private']).optional().default('team-only'),
  showActivity: z.boolean().optional().default(true),
  showOnlineStatus: z.boolean().optional().default(true),
  emailVisibility: z.enum(['public', 'team-only', 'private']).optional().default('team-only'),
  autoLogoutTimeout: z.enum(['never', '15-minutes', '1-hour', '4-hours', '1-day']).optional().default('1-day'),
})

export const userSettingsSchema = z.object({
  applicationPreferences: applicationPreferencesSchema.optional(),
  notificationSettings: notificationSettingsSchema.optional(),
  displaySettings: displaySettingsSchema.optional(),
  privacySettings: privacySecuritySchema.optional(),
})

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
})

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
})

// Reports schemas
export const personalReportSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const teamReportSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const overviewReportSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
})

export const exportReportSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  type: z.enum(['personal', 'team', 'time-tracking', 'overview']).default('personal'),
  teamId: z.string().cuid().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})