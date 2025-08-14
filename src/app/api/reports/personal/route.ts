import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { personalReportSchema } from '@/lib/validations'
import { subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const { period, startDate, endDate } = personalReportSchema.parse(queryParams)

    // Calculate date range based on period
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
          dateRange.startDate = startOfWeek(now)
          dateRange.endDate = endOfWeek(now)
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

    // Get personal todos data
    const [
      totalTodos,
      completedTodos,
      todosByStatus,
      todosByPriority,
      todosByCategory,
      timeEntries,
      dailyActivity
    ] = await Promise.all([
      // Total todos in period
      prisma.personalTodo.count({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          archivedAt: null,
        },
      }),
      
      // Completed todos in period
      prisma.personalTodo.count({
        where: {
          userId: session.user.id,
          status: 'COMPLETED',
          completedAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          archivedAt: null,
        },
      }),

      // Todos by status
      prisma.personalTodo.groupBy({
        by: ['status'],
        where: {
          userId: session.user.id,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          archivedAt: null,
        },
        _count: {
          id: true,
        },
      }),

      // Todos by priority
      prisma.personalTodo.groupBy({
        by: ['priority'],
        where: {
          userId: session.user.id,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          archivedAt: null,
        },
        _count: {
          id: true,
        },
      }),

      // Todos by category
      prisma.personalTodo.groupBy({
        by: ['category'],
        where: {
          userId: session.user.id,
          category: { not: null },
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          archivedAt: null,
        },
        _count: {
          id: true,
        },
      }),

      // Time entries for the period
      prisma.timeEntry.findMany({
        where: {
          userId: session.user.id,
          startTime: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          personalTodoId: { not: null },
          endTime: { not: null },
        },
        include: {
          personalTodo: {
            select: {
              title: true,
              category: true,
            },
          },
        },
      }),

      // Daily activity for charts
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as todosCompleted,
          COUNT(*) as todosCreated
        FROM personal_todos 
        WHERE userId = ${session.user.id}
          AND createdAt >= ${dateRange.startDate}
          AND createdAt <= ${dateRange.endDate}
          AND archivedAt IS NULL
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      ` as any
    ])

    // Calculate time tracking metrics
    const totalTimeSeconds = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const totalSessions = timeEntries.length
    const averageSessionTime = totalSessions > 0 ? Math.round(totalTimeSeconds / totalSessions) : 0

    // Get daily time tracking data
    const dailyTimeData: Array<{
      date: string
      timeSpent: number
      sessions: number
    }> = []

    const timeEntriesByDate = timeEntries.reduce((acc, entry) => {
      const date = format(new Date(entry.startTime), 'yyyy-MM-dd')
      if (!acc[date]) {
        acc[date] = { timeSpent: 0, sessions: 0 }
      }
      acc[date].timeSpent += entry.duration || 0
      acc[date].sessions += 1
      return acc
    }, {} as Record<string, { timeSpent: number, sessions: number }>)

    Object.entries(timeEntriesByDate).forEach(([date, data]) => {
      dailyTimeData.push({
        date,
        timeSpent: data.timeSpent,
        sessions: data.sessions,
      })
    })

    // Calculate completion rate
    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

    // Format status data
    const statusData = todosByStatus.map(item => ({
      name: item.status.toLowerCase().replace('_', ' '),
      value: item._count.id,
      percentage: totalTodos > 0 ? Math.round((item._count.id / totalTodos) * 100) : 0,
    }))

    // Format priority data
    const priorityData = todosByPriority.map(item => ({
      name: item.priority.toLowerCase(),
      value: item._count.id,
      percentage: totalTodos > 0 ? Math.round((item._count.id / totalTodos) * 100) : 0,
    }))

    // Format category data
    const categoryData = todosByCategory
      .map(item => ({
        name: item.category || 'Uncategorized',
        value: item._count.id,
        percentage: totalTodos > 0 ? Math.round((item._count.id / totalTodos) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 categories

    // Calculate productivity metrics
    const workDays = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
    const averageTimePerDay = workDays > 0 ? Math.round(totalTimeSeconds / workDays) : 0

    return NextResponse.json({
      data: {
        period,
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        
        // Summary metrics
        summary: {
          totalTodos,
          completedTodos,
          completionRate,
          totalTimeSpent: totalTimeSeconds, // in seconds
          totalSessions,
          averageSessionTime, // in seconds
          averageTimePerDay, // in seconds
          workDays,
        },

        // Chart data
        charts: {
          todosByStatus: statusData,
          todosByPriority: priorityData,
          todosByCategory: categoryData,
          dailyActivity: (dailyActivity as any[]).map((day: any) => ({
            date: day.date,
            todosCompleted: Number(day.todosCompleted),
            todosCreated: Number(day.todosCreated),
          })),
          dailyTimeTracking: dailyTimeData.sort((a, b) => a.date.localeCompare(b.date)),
        },

        // Trends and insights
        insights: {
          mostProductiveCategory: categoryData[0]?.name || null,
          averageTodosPerDay: workDays > 0 ? Math.round(totalTodos / workDays) : 0,
          averageCompletionTime: completedTodos > 0 ? Math.round(totalTimeSeconds / completedTodos) : 0,
        },
      },
    })
  } catch (error) {
    console.error('Error generating personal report:', error)
    
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