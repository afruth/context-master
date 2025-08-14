import { NextRequest } from 'next/server'
import { userSettingsSchema } from '@/lib/validations'
import { 
  requireAuth, 
  successResponse, 
  errorResponse, 
  withErrorHandler 
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  
  // Get user settings - for now we'll use a simple JSON field on the user model
  // In a production app, you might want a separate UserSettings table
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      settings: true, // Assuming you add a JSON field called 'settings' to the User model
    },
  })

  if (!userProfile) {
    return errorResponse('User not found', 404)
  }

  // Return settings or defaults
  const settings = userProfile.settings || {
    applicationPreferences: {
      defaultTodoPriority: 'MEDIUM',
      defaultDueDateOffset: '1-day',
      autoSaveFrequency: 'real-time',
      sidebarCollapsed: false,
      defaultViewMode: 'list',
      tasksPerPage: 20,
    },
    notificationSettings: {
      emailTaskAssignments: true,
      emailTeamInvitations: true,
      pushNotifications: false,
      weeklyDigestEmails: true,
      dueDateReminders: '1-day',
      teamActivityNotifications: true,
    },
    displaySettings: {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12-hour',
      firstDayOfWeek: 'sunday',
      showTimezoneInUI: true,
      listSpacing: 'comfortable',
      showCompletedTasks: false,
    },
    privacySettings: {
      profileVisibility: 'team-only',
      showActivity: true,
      showOnlineStatus: true,
      emailVisibility: 'team-only',
      autoLogoutTimeout: '1-day',
    },
  }

  return successResponse(settings)
})

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  const body = await request.json()
  
  const validatedData = userSettingsSchema.parse(body)
  
  // Get current settings
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { settings: true },
  })

  const currentSettings = currentUser?.settings || {}
  
  // Merge new settings with existing ones
  const updatedSettings = {
    ...currentSettings,
    ...validatedData,
    // Merge nested objects
    applicationPreferences: {
      ...currentSettings.applicationPreferences,
      ...validatedData.applicationPreferences,
    },
    notificationSettings: {
      ...currentSettings.notificationSettings,
      ...validatedData.notificationSettings,
    },
    displaySettings: {
      ...currentSettings.displaySettings,
      ...validatedData.displaySettings,
    },
    privacySettings: {
      ...currentSettings.privacySettings,
      ...validatedData.privacySettings,
    },
  }
  
  // Update user settings
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      settings: updatedSettings,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      settings: true,
    },
  })
  
  return successResponse(updatedUser.settings, 'Settings updated successfully')
})

// Export data endpoint
export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  if (action === 'export') {
    // Get all user data for export
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        settings: true,
        createdAt: true,
        personalTodos: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            category: true,
            tags: true,
            color: true,
            estimatedMinutes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        teamMemberships: {
          select: {
            role: true,
            joinedAt: true,
            team: {
              select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
              },
            },
          },
        },
      },
    })

    if (!userData) {
      return errorResponse('User not found', 404)
    }

    const exportData = {
      user: userData,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }

    return successResponse(exportData, 'Data exported successfully')
  }
  
  if (action === 'clear-completed') {
    // Clear all completed personal todos
    const result = await prisma.personalTodo.deleteMany({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
    })

    return successResponse(
      { deletedCount: result.count },
      `${result.count} completed tasks cleared successfully`
    )
  }
  
  if (action === 'archive-old') {
    // Archive tasks older than 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const result = await prisma.personalTodo.updateMany({
      where: {
        userId: user.id,
        createdAt: {
          lt: ninetyDaysAgo,
        },
        status: {
          not: 'COMPLETED',
        },
      },
      data: {
        // Add an archived field to your schema, or use a status like 'ARCHIVED'
        status: 'CANCELLED', // Using CANCELLED as archived for now
        updatedAt: new Date(),
      },
    })

    return successResponse(
      { archivedCount: result.count },
      `${result.count} old tasks archived successfully`
    )
  }

  return errorResponse('Invalid action', 400)
})