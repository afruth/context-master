import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { overviewReportSchema } from '@/lib/validations'
import { subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const { period } = overviewReportSchema.parse(queryParams)

    // Calculate date range
    const now = new Date()
    let dateRange = {
      startDate: new Date(),
      endDate: new Date(),
    }

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

    // Get user's teams
    const userTeams = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
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

    // Get comprehensive overview data
    const [
      personalTodoStats,
      teamTodoStats,
      personalTimeStats,
      teamTimeStats,
      teamOverview,
      recentActivity
    ] = await Promise.all([
      // Personal todo statistics
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

      // Team todo statistics
      teamIds.length > 0 ? prisma.teamTodo.groupBy({
        by: ['status'],
        where: {
          teamId: { in: teamIds },
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          archivedAt: null,
        },
        _count: {
          id: true,
        },
      }) : [],

      // Personal time tracking stats
      prisma.timeEntry.aggregate({
        where: {
          userId: session.user.id,
          personalTodoId: { not: null },
          startTime: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          endTime: { not: null },
        },
        _sum: {
          duration: true,
        },
        _count: {
          id: true,
        },
      }),

      // Team time tracking stats
      teamIds.length > 0 ? prisma.timeEntry.aggregate({
        where: {
          userId: session.user.id,
          teamTodoId: { not: null },
          startTime: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          endTime: { not: null },
          teamTodo: {
            teamId: { in: teamIds },
          },
        },
        _sum: {
          duration: true,
        },
        _count: {
          id: true,
        },
      }) : { _sum: { duration: 0 }, _count: { id: 0 } },

      // Team overview data
      teamIds.length > 0 ? Promise.all(
        teamIds.map(async (teamId) => {
          const [teamInfo, todoCount, completedCount] = await Promise.all([
            prisma.team.findUnique({
              where: { id: teamId },
              select: {
                id: true,
                name: true,
                _count: {
                  select: { members: true },
                },
              },
            }),
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
          ])

          return {
            id: teamInfo?.id,
            name: teamInfo?.name,
            memberCount: teamInfo?._count.members || 0,
            totalTodos: todoCount,
            completedTodos: completedCount,
            completionRate: todoCount > 0 ? Math.round((completedCount / todoCount) * 100) : 0,
          }
        })
      ) : [],

      // Recent activity (last 10 activities)
      prisma.$queryRaw`
        SELECT 
          'personal' as type,
          title,
          status,
          updatedAt,
          NULL as teamName
        FROM personal_todos 
        WHERE userId = ${session.user.id}
          AND updatedAt >= ${subDays(now, 7)}
          AND archivedAt IS NULL
        UNION ALL
        SELECT 
          'team' as type,
          tt.title,
          tt.status,
          tt.updatedAt,
          t.name as teamName
        FROM team_todos tt
        JOIN teams t ON tt.teamId = t.id
        JOIN team_members tm ON t.id = tm.teamId
        WHERE tm.userId = ${session.user.id}
          AND tt.updatedAt >= ${subDays(now, 7)}
          AND tt.archivedAt IS NULL
        ORDER BY updatedAt DESC
        LIMIT 10
      ` as any
    ])

    // Calculate totals
    const personalTotal = personalTodoStats.reduce((sum, item) => sum + item._count.id, 0)
    const teamTotal = teamTodoStats.reduce((sum, item) => sum + item._count.id, 0)
    const totalTodos = personalTotal + teamTotal

    const personalCompleted = personalTodoStats.find(item => item.status === 'COMPLETED')?._count.id || 0
    const teamCompleted = teamTodoStats.find(item => item.status === 'COMPLETED')?._count.id || 0
    const totalCompleted = personalCompleted + teamCompleted

    const totalTimeSpent = (personalTimeStats._sum.duration || 0) + (teamTimeStats._sum.duration || 0)
    const totalSessions = (personalTimeStats._count.id || 0) + (teamTimeStats._count.id || 0)

    // Calculate productivity metrics
    const overallCompletionRate = totalTodos > 0 ? Math.round((totalCompleted / totalTodos) * 100) : 0
    const averageSessionTime = totalSessions > 0 ? Math.round(totalTimeSpent / totalSessions) : 0

    // Format status distribution
    const allStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    const statusDistribution = allStatuses.map(status => {
      const personalCount = personalTodoStats.find(item => item.status === status)?._count.id || 0
      const teamCount = teamTodoStats.find(item => item.status === status)?._count.id || 0
      const totalCount = personalCount + teamCount
      
      return {
        name: status.toLowerCase().replace('_', ' '),
        personal: personalCount,
        team: teamCount,
        total: totalCount,
        percentage: totalTodos > 0 ? Math.round((totalCount / totalTodos) * 100) : 0,
      }
    })

    // Calculate work distribution
    const personalTimePercentage = totalTimeSpent > 0 ? Math.round(((personalTimeStats._sum.duration || 0) / totalTimeSpent) * 100) : 0
    const teamTimePercentage = 100 - personalTimePercentage

    return NextResponse.json({
      data: {
        period,
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        
        // Summary metrics
        summary: {
          totalTodos,
          personalTodos: personalTotal,
          teamTodos: teamTotal,
          totalCompleted,
          personalCompleted,
          teamCompleted,
          overallCompletionRate,
          totalTimeSpent,
          totalSessions,
          averageSessionTime,
          activeTeams: teamIds.length,
        },

        // Work distribution
        distribution: {
          personalTimePercentage,
          teamTimePercentage,
          personalTodoPercentage: totalTodos > 0 ? Math.round((personalTotal / totalTodos) * 100) : 0,
          teamTodoPercentage: totalTodos > 0 ? Math.round((teamTotal / totalTodos) * 100) : 0,
        },

        // Chart data
        charts: {
          statusDistribution,
          workTypeComparison: [
            {
              type: 'Personal',
              todos: personalTotal,
              completed: personalCompleted,
              timeSpent: personalTimeStats._sum.duration || 0,
            },
            {
              type: 'Team',
              todos: teamTotal,
              completed: teamCompleted,
              timeSpent: teamTimeStats._sum.duration || 0,
            },
          ],
        },

        // Team overview
        teams: teamOverview,

        // Recent activity
        recentActivity: (recentActivity as any[]).map((activity: any) => ({
          type: activity.type,
          title: activity.title,
          status: activity.status.toLowerCase().replace('_', ' '),
          updatedAt: activity.updatedAt instanceof Date ? activity.updatedAt.toISOString() : activity.updatedAt,
          teamName: activity.teamName,
        })),

        // Insights
        insights: {
          mostProductiveWorkType: personalTimePercentage > teamTimePercentage ? 'personal' : 'team',
          bestPerformingTeam: teamOverview.length > 0 
            ? teamOverview.reduce((prev, current) => 
                prev.completionRate > current.completionRate ? prev : current
              )?.name 
            : null,
          totalActiveProjects: totalTodos - totalCompleted,
          productivity: overallCompletionRate >= 75 ? 'high' : overallCompletionRate >= 50 ? 'medium' : 'low',
        },
      },
    })
  } catch (error) {
    console.error('Error generating overview report:', error)
    
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