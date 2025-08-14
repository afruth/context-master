import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { exportReportSchema } from '@/lib/validations'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const { format: exportFormat, type, teamId, period, startDate, endDate } = exportReportSchema.parse(queryParams)

    // Calculate date range
    let dateRange = {
      startDate: new Date(),
      endDate: new Date(),
    }

    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      }
    } else {
      const now = new Date()
      switch (period) {
        case 'week':
          dateRange.startDate = subDays(now, 7)
          dateRange.endDate = now
          break
        case 'month':
          dateRange.startDate = startOfMonth(now)
          dateRange.endDate = endOfMonth(now)
          break
        case 'quarter':
          dateRange.startDate = startOfMonth(subMonths(now, 2))
          dateRange.endDate = endOfMonth(now)
          break
        case 'year':
          dateRange.startDate = subDays(now, 365)
          dateRange.endDate = now
          break
      }
    }

    let data: any[] = []
    let filename = ''

    switch (type) {
      case 'personal':
        data = await exportPersonalData(session.user.id, dateRange)
        filename = `personal-todos-${format(dateRange.startDate, 'yyyy-MM-dd')}-to-${format(dateRange.endDate, 'yyyy-MM-dd')}`
        break
        
      case 'team':
        if (!teamId) {
          return NextResponse.json({ error: 'Team ID required for team export' }, { status: 400 })
        }
        
        // Check if user has access to team
        const teamMember = await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId,
              userId: session.user.id,
            },
          },
        })
        
        if (!teamMember) {
          return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 })
        }
        
        data = await exportTeamData(teamId, dateRange)
        filename = `team-todos-${teamId}-${format(dateRange.startDate, 'yyyy-MM-dd')}-to-${format(dateRange.endDate, 'yyyy-MM-dd')}`
        break
        
      case 'time-tracking':
        data = await exportTimeTrackingData(session.user.id, teamId, dateRange)
        filename = `time-tracking-${format(dateRange.startDate, 'yyyy-MM-dd')}-to-${format(dateRange.endDate, 'yyyy-MM-dd')}`
        break
        
      case 'overview':
        data = await exportOverviewData(session.user.id, dateRange)
        filename = `overview-${format(dateRange.startDate, 'yyyy-MM-dd')}-to-${format(dateRange.endDate, 'yyyy-MM-dd')}`
        break
    }

    if (exportFormat === 'csv') {
      const csv = convertToCSV(data)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    } else {
      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      })
    }
  } catch (error) {
    console.error('Error exporting data:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

async function exportPersonalData(userId: string, dateRange: { startDate: Date, endDate: Date }) {
  const todos = await prisma.personalTodo.findMany({
    where: {
      userId,
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      archivedAt: null,
    },
    include: {
      timeEntries: {
        select: {
          duration: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return todos.map(todo => ({
    id: todo.id,
    title: todo.title,
    description: todo.description || '',
    status: todo.status,
    priority: todo.priority,
    category: todo.category || '',
    tags: todo.tags ? JSON.parse(todo.tags) : [],
    estimatedMinutes: todo.estimatedMinutes || 0,
    actualMinutes: todo.actualMinutes || 0,
    totalTimeSpent: todo.timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0),
    dueDate: todo.dueDate?.toISOString() || '',
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
    completedAt: todo.completedAt?.toISOString() || '',
  }))
}

async function exportTeamData(teamId: string, dateRange: { startDate: Date, endDate: Date }) {
  const todos = await prisma.teamTodo.findMany({
    where: {
      teamId,
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      archivedAt: null,
    },
    include: {
      assignee: {
        select: {
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      timeEntries: {
        select: {
          duration: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      team: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return todos.map(todo => ({
    id: todo.id,
    title: todo.title,
    description: todo.description || '',
    status: todo.status,
    priority: todo.priority,
    category: todo.category || '',
    tags: todo.tags ? JSON.parse(todo.tags) : [],
    teamName: todo.team.name,
    assigneeName: todo.assignee?.name || '',
    assigneeEmail: todo.assignee?.email || '',
    createdByName: todo.createdBy.name || '',
    createdByEmail: todo.createdBy.email || '',
    estimatedMinutes: todo.estimatedMinutes || 0,
    actualMinutes: todo.actualMinutes || 0,
    totalTimeSpent: todo.timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0),
    commentsCount: todo.comments.length,
    dueDate: todo.dueDate?.toISOString() || '',
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
    completedAt: todo.completedAt?.toISOString() || '',
  }))
}

async function exportTimeTrackingData(userId: string, teamId: string | undefined, dateRange: { startDate: Date, endDate: Date }) {
  const whereClause: any = {
    userId,
    startTime: {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    },
    endTime: { not: null },
  }

  if (teamId) {
    whereClause.teamTodo = {
      teamId,
    }
  }

  const entries = await prisma.timeEntry.findMany({
    where: whereClause,
    include: {
      personalTodo: {
        select: {
          title: true,
          category: true,
        },
      },
      teamTodo: {
        select: {
          title: true,
          category: true,
          team: {
            select: {
              name: true,
            },
          },
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      startTime: 'desc',
    },
  })

  return entries.map(entry => ({
    id: entry.id,
    userName: entry.user.name || entry.user.email,
    userEmail: entry.user.email,
    todoTitle: entry.personalTodo?.title || entry.teamTodo?.title || '',
    todoCategory: entry.personalTodo?.category || entry.teamTodo?.category || '',
    todoType: entry.personalTodo ? 'personal' : 'team',
    teamName: entry.teamTodo?.team?.name || '',
    description: entry.description || '',
    startTime: entry.startTime.toISOString(),
    endTime: entry.endTime?.toISOString() || '',
    duration: entry.duration || 0,
    durationHours: entry.duration ? Math.round((entry.duration / 3600) * 100) / 100 : 0,
    isManual: entry.isManual,
    billable: entry.billable,
    hourlyRate: entry.hourlyRate || 0,
    earnings: entry.billable && entry.hourlyRate && entry.duration
      ? Math.round(((entry.duration / 3600) * entry.hourlyRate) * 100) / 100
      : 0,
    source: entry.source || '',
    createdAt: entry.createdAt.toISOString(),
  }))
}

async function exportOverviewData(userId: string, dateRange: { startDate: Date, endDate: Date }) {
  // Get user's teams
  const userTeams = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const teamIds = userTeams.map(tm => tm.team.id)

  const [personalTodos, teamTodos, timeEntries] = await Promise.all([
    prisma.personalTodo.findMany({
      where: {
        userId,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
        archivedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        category: true,
        createdAt: true,
        completedAt: true,
      },
    }),

    teamIds.length > 0 ? prisma.teamTodo.findMany({
      where: {
        teamId: { in: teamIds },
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
        archivedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        category: true,
        createdAt: true,
        completedAt: true,
        team: {
          select: {
            name: true,
          },
        },
      },
    }) : [],

    prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
        endTime: { not: null },
      },
      select: {
        id: true,
        duration: true,
        startTime: true,
        personalTodoId: true,
        teamTodoId: true,
      },
    }),
  ])

  const data: any[] = []

  // Add personal todos
  personalTodos.forEach(todo => {
    const todoTimeEntries = timeEntries.filter(entry => entry.personalTodoId === todo.id)
    const totalTime = todoTimeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    
    data.push({
      type: 'personal',
      id: todo.id,
      title: todo.title,
      status: todo.status,
      priority: todo.priority,
      category: todo.category || '',
      teamName: '',
      totalTimeSpent: totalTime,
      timeEntriesCount: todoTimeEntries.length,
      createdAt: todo.createdAt.toISOString(),
      completedAt: todo.completedAt?.toISOString() || '',
    })
  })

  // Add team todos
  teamTodos.forEach(todo => {
    const todoTimeEntries = timeEntries.filter(entry => entry.teamTodoId === todo.id)
    const totalTime = todoTimeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    
    data.push({
      type: 'team',
      id: todo.id,
      title: todo.title,
      status: todo.status,
      priority: todo.priority,
      category: todo.category || '',
      teamName: todo.team.name,
      totalTimeSpent: totalTime,
      timeEntriesCount: todoTimeEntries.length,
      createdAt: todo.createdAt.toISOString(),
      completedAt: todo.completedAt?.toISOString() || '',
    })
  })

  return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return 'No data available'
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  return csvContent
}