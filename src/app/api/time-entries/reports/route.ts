import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { timeReportSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/time-entries/reports - Generate time reports
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const {
      startDate,
      endDate,
      groupBy,
      todoType,
      billableOnly,
    } = timeReportSchema.parse(queryParams)

    // Build base filter conditions
    const where: any = {
      userId: session.user.id,
      startTime: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      endTime: {
        not: null, // Only completed entries
      },
    }

    // Filter by todo type
    if (todoType === 'personal') {
      where.personalTodoId = { not: null }
    } else if (todoType === 'team') {
      where.teamTodoId = { not: null }
    }

    // Filter by billable entries only
    if (billableOnly) {
      where.billable = true
    }

    // Fetch time entries with related data
    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        personalTodo: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        teamTodo: {
          select: {
            id: true,
            title: true,
            category: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    // Calculate total time and billable time
    const totalSeconds = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const billableSeconds = timeEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)

    // Calculate total earnings
    const totalEarnings = timeEntries
      .filter(entry => entry.billable && entry.hourlyRate)
      .reduce((sum, entry) => {
        const hours = (entry.duration || 0) / 3600
        return sum + (hours * (entry.hourlyRate || 0))
      }, 0)

    // Group data based on groupBy parameter
    let groupedData: any = {}

    if (groupBy === 'day') {
      groupedData = groupByDay(timeEntries)
    } else if (groupBy === 'week') {
      groupedData = groupByWeek(timeEntries)
    } else if (groupBy === 'month') {
      groupedData = groupByMonth(timeEntries)
    } else if (groupBy === 'todo') {
      groupedData = groupByTodo(timeEntries)
    } else if (groupBy === 'project') {
      groupedData = groupByProject(timeEntries)
    }

    // Get productivity metrics
    const completedTodos = await getCompletedTodosInRange(
      session.user.id,
      startDate,
      endDate,
      todoType
    )

    return NextResponse.json({
      data: {
        summary: {
          totalTime: totalSeconds,
          billableTime: billableSeconds,
          totalEarnings,
          entriesCount: timeEntries.length,
          completedTodos,
        },
        groupedData,
        period: {
          startDate,
          endDate,
          groupBy,
        },
      },
    })
  } catch (error) {
    console.error('Error generating time report:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// Helper function to group by day
function groupByDay(entries: any[]) {
  const grouped: Record<string, any> = {}
  
  entries.forEach(entry => {
    const date = new Date(entry.startTime).toISOString().split('T')[0]
    
    if (!grouped[date]) {
      grouped[date] = {
        date,
        totalTime: 0,
        billableTime: 0,
        earnings: 0,
        entriesCount: 0,
      }
    }
    
    grouped[date].totalTime += entry.duration || 0
    grouped[date].entriesCount++
    
    if (entry.billable) {
      grouped[date].billableTime += entry.duration || 0
      if (entry.hourlyRate) {
        const hours = (entry.duration || 0) / 3600
        grouped[date].earnings += hours * entry.hourlyRate
      }
    }
  })
  
  return Object.values(grouped).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

// Helper function to group by week
function groupByWeek(entries: any[]) {
  const grouped: Record<string, any> = {}
  
  entries.forEach(entry => {
    const date = new Date(entry.startTime)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!grouped[weekKey]) {
      grouped[weekKey] = {
        weekStart: weekKey,
        totalTime: 0,
        billableTime: 0,
        earnings: 0,
        entriesCount: 0,
      }
    }
    
    grouped[weekKey].totalTime += entry.duration || 0
    grouped[weekKey].entriesCount++
    
    if (entry.billable) {
      grouped[weekKey].billableTime += entry.duration || 0
      if (entry.hourlyRate) {
        const hours = (entry.duration || 0) / 3600
        grouped[weekKey].earnings += hours * entry.hourlyRate
      }
    }
  })
  
  return Object.values(grouped).sort((a: any, b: any) => 
    new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
  )
}

// Helper function to group by month
function groupByMonth(entries: any[]) {
  const grouped: Record<string, any> = {}
  
  entries.forEach(entry => {
    const date = new Date(entry.startTime)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        month: monthKey,
        totalTime: 0,
        billableTime: 0,
        earnings: 0,
        entriesCount: 0,
      }
    }
    
    grouped[monthKey].totalTime += entry.duration || 0
    grouped[monthKey].entriesCount++
    
    if (entry.billable) {
      grouped[monthKey].billableTime += entry.duration || 0
      if (entry.hourlyRate) {
        const hours = (entry.duration || 0) / 3600
        grouped[monthKey].earnings += hours * entry.hourlyRate
      }
    }
  })
  
  return Object.values(grouped).sort((a: any, b: any) => 
    a.month.localeCompare(b.month)
  )
}

// Helper function to group by todo
function groupByTodo(entries: any[]) {
  const grouped: Record<string, any> = {}
  
  entries.forEach(entry => {
    const todo = entry.personalTodo || entry.teamTodo
    const todoKey = todo ? todo.id : 'no-todo'
    
    if (!grouped[todoKey]) {
      grouped[todoKey] = {
        todoId: todo?.id || null,
        todoTitle: todo?.title || 'No Todo',
        todoType: entry.personalTodo ? 'personal' : entry.teamTodo ? 'team' : null,
        teamName: entry.teamTodo?.team?.name || null,
        totalTime: 0,
        billableTime: 0,
        earnings: 0,
        entriesCount: 0,
      }
    }
    
    grouped[todoKey].totalTime += entry.duration || 0
    grouped[todoKey].entriesCount++
    
    if (entry.billable) {
      grouped[todoKey].billableTime += entry.duration || 0
      if (entry.hourlyRate) {
        const hours = (entry.duration || 0) / 3600
        grouped[todoKey].earnings += hours * entry.hourlyRate
      }
    }
  })
  
  return Object.values(grouped).sort((a: any, b: any) => 
    b.totalTime - a.totalTime
  )
}

// Helper function to group by project/category
function groupByProject(entries: any[]) {
  const grouped: Record<string, any> = {}
  
  entries.forEach(entry => {
    const todo = entry.personalTodo || entry.teamTodo
    const project = todo?.category || (entry.teamTodo?.team?.name) || 'Uncategorized'
    
    if (!grouped[project]) {
      grouped[project] = {
        project,
        totalTime: 0,
        billableTime: 0,
        earnings: 0,
        entriesCount: 0,
        todosCount: new Set(),
      }
    }
    
    grouped[project].totalTime += entry.duration || 0
    grouped[project].entriesCount++
    
    if (todo) {
      grouped[project].todosCount.add(todo.id)
    }
    
    if (entry.billable) {
      grouped[project].billableTime += entry.duration || 0
      if (entry.hourlyRate) {
        const hours = (entry.duration || 0) / 3600
        grouped[project].earnings += hours * entry.hourlyRate
      }
    }
  })
  
  // Convert Set to count
  const result = Object.values(grouped).map((item: any) => ({
    ...item,
    todosCount: item.todosCount.size,
  }))
  
  return result.sort((a: any, b: any) => b.totalTime - a.totalTime)
}

// Helper function to get completed todos in date range
async function getCompletedTodosInRange(
  userId: string, 
  startDate: string, 
  endDate: string, 
  todoType: 'personal' | 'team' | 'all'
) {
  const dateRange = {
    gte: new Date(startDate),
    lte: new Date(endDate),
  }

  let personalCount = 0
  let teamCount = 0

  if (todoType === 'personal' || todoType === 'all') {
    personalCount = await prisma.personalTodo.count({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: dateRange,
      },
    })
  }

  if (todoType === 'team' || todoType === 'all') {
    teamCount = await prisma.teamTodo.count({
      where: {
        status: 'COMPLETED',
        completedAt: dateRange,
        team: {
          members: {
            some: { userId },
          },
        },
      },
    })
  }

  return personalCount + teamCount
}