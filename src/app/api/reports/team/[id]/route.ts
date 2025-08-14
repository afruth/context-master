import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { teamReportSchema } from '@/lib/validations'
import { subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId } = await params
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const { period, startDate, endDate } = teamReportSchema.parse(queryParams)

    // Check if user is a team member
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: session.user.id,
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 })
    }

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

    // Get team data
    const [
      teamInfo,
      totalTodos,
      completedTodos,
      todosByStatus,
      todosByPriority,
      todosByCategory,
      memberStats,
      teamTimeEntries,
      dailyActivity
    ] = await Promise.all([
      // Team info with member count
      prisma.team.findUnique({
        where: { id: teamId },
        include: {
          _count: {
            select: { members: true },
          },
        },
      }),

      // Total todos in period
      prisma.teamTodo.count({
        where: {
          teamId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          archivedAt: null,
        },
      }),
      
      // Completed todos in period
      prisma.teamTodo.count({
        where: {
          teamId,
          status: 'COMPLETED',
          completedAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          archivedAt: null,
        },
      }),

      // Todos by status
      prisma.teamTodo.groupBy({
        by: ['status'],
        where: {
          teamId,
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
      prisma.teamTodo.groupBy({
        by: ['priority'],
        where: {
          teamId,
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
      prisma.teamTodo.groupBy({
        by: ['category'],
        where: {
          teamId,
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

      // Member performance stats
      prisma.teamMember.findMany({
        where: { teamId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              user: {
                where: {
                  assignedTeamTodos: {
                    some: {
                      teamId,
                      createdAt: {
                        gte: dateRange.startDate,
                        lte: dateRange.endDate,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // Time entries for the team
      prisma.timeEntry.findMany({
        where: {
          startTime: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          teamTodo: {
            teamId,
          },
          endTime: { not: null },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          teamTodo: {
            select: {
              title: true,
              category: true,
            },
          },
        },
      }),

      // Daily activity for the team
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as todosCompleted,
          COUNT(*) as todosCreated
        FROM team_todos 
        WHERE teamId = ${teamId}
          AND createdAt >= ${dateRange.startDate}
          AND createdAt <= ${dateRange.endDate}
          AND archivedAt IS NULL
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      ` as any
    ])

    if (!teamInfo) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Calculate member-specific stats
    const memberPerformance = await Promise.all(
      memberStats.map(async (member) => {
        const [assignedTodos, completedTodos, timeSpent] = await Promise.all([
          prisma.teamTodo.count({
            where: {
              teamId,
              assigneeId: member.userId,
              createdAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
              },
              archivedAt: null,
            },
          }),
          prisma.teamTodo.count({
            where: {
              teamId,
              assigneeId: member.userId,
              status: 'COMPLETED',
              completedAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
              },
              archivedAt: null,
            },
          }),
          prisma.timeEntry.aggregate({
            where: {
              userId: member.userId,
              teamTodo: { teamId },
              startTime: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
              },
              endTime: { not: null },
            },
            _sum: {
              duration: true,
            },
          }),
        ])

        const completionRate = assignedTodos > 0 ? Math.round((completedTodos / assignedTodos) * 100) : 0
        const totalTime = timeSpent._sum.duration || 0

        return {
          id: member.userId,
          name: member.user?.name,
          email: member.user?.email,
          image: member.user?.image,
          role: member.role,
          stats: {
            assignedTodos,
            completedTodos,
            completionRate,
            timeSpent: totalTime,
            averageTimePerTodo: completedTodos > 0 ? Math.round(totalTime / completedTodos) : 0,
          },
        }
      })
    )

    // Calculate time tracking metrics
    const totalTimeSeconds = teamTimeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const totalSessions = teamTimeEntries.length
    const averageSessionTime = totalSessions > 0 ? Math.round(totalTimeSeconds / totalSessions) : 0

    // Get daily time tracking data
    const dailyTimeData: Array<{
      date: string
      timeSpent: number
      sessions: number
    }> = []

    const timeEntriesByDate = teamTimeEntries.reduce((acc, entry) => {
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
      .slice(0, 10)

    // Calculate insights
    const workDays = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
    const averageTimePerDay = workDays > 0 ? Math.round(totalTimeSeconds / workDays) : 0
    const mostActiveUser = memberPerformance.reduce((prev, current) => 
      (prev.stats.timeSpent > current.stats.timeSpent) ? prev : current, memberPerformance[0]
    )

    return NextResponse.json({
      data: {
        period,
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        
        // Team info
        team: {
          id: teamInfo.id,
          name: teamInfo.name,
          description: teamInfo.description,
          memberCount: teamInfo._count.members,
        },

        // Summary metrics
        summary: {
          totalTodos,
          completedTodos,
          completionRate,
          totalTimeSpent: totalTimeSeconds,
          totalSessions,
          averageSessionTime,
          averageTimePerDay,
          workDays,
        },

        // Chart data
        charts: {
          todosByStatus: statusData,
          todosByPriority: priorityData,
          todosByCategory: categoryData,
          dailyActivity: dailyActivity.map(day => ({
            date: day.date,
            todosCompleted: Number(day.todosCompleted),
            todosCreated: Number(day.todosCreated),
          })),
          dailyTimeTracking: dailyTimeData.sort((a, b) => a.date.localeCompare(b.date)),
          memberPerformance: memberPerformance.map(member => ({
            name: member.name || member.email,
            completedTodos: member.stats.completedTodos,
            timeSpent: member.stats.timeSpent,
            completionRate: member.stats.completionRate,
          })),
        },

        // Member details
        members: memberPerformance.sort((a, b) => b.stats.timeSpent - a.stats.timeSpent),

        // Insights
        insights: {
          mostActiveCategory: categoryData[0]?.name || null,
          mostActiveUser: mostActiveUser?.name || mostActiveUser?.email || null,
          averageTodosPerDay: workDays > 0 ? Math.round(totalTodos / workDays) : 0,
          averageCompletionTime: completedTodos > 0 ? Math.round(totalTimeSeconds / completedTodos) : 0,
          teamVelocity: completionRate,
        },
      },
    })
  } catch (error) {
    console.error('Error generating team report:', error)
    
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