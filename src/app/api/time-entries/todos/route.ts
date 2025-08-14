import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/time-entries/todos - Get available todos for timer selection
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeCompleted = searchParams.get('includeCompleted') === 'true'

    // Base status filter
    const statusFilter = includeCompleted 
      ? {} 
      : { status: { not: 'COMPLETED' } }

    // Fetch personal todos
    const personalTodos = await prisma.personalTodo.findMany({
      where: {
        userId: session.user.id,
        archivedAt: null,
        ...statusFilter,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        category: true,
        estimatedMinutes: true,
        actualMinutes: true,
      },
      orderBy: [
        { status: 'asc' }, // Active todos first
        { priority: 'desc' }, // Higher priority first
        { updatedAt: 'desc' },
      ],
      take: 50, // Limit for performance
    })

    // Fetch team todos where user is a member
    const teamTodos = await prisma.teamTodo.findMany({
      where: {
        archivedAt: null,
        ...statusFilter,
        team: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        category: true,
        estimatedMinutes: true,
        actualMinutes: true,
        assigneeId: true,
        team: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Active todos first
        { priority: 'desc' }, // Higher priority first
        { updatedAt: 'desc' },
      ],
      take: 50, // Limit for performance
    })

    // Format response
    const formattedPersonalTodos = personalTodos.map(todo => ({
      ...todo,
      type: 'personal' as const,
      teamName: null,
      isAssignedToUser: true,
    }))

    const formattedTeamTodos = teamTodos.map(todo => ({
      ...todo,
      type: 'team' as const,
      teamName: todo.team.name,
      teamColor: todo.team.color,
      isAssignedToUser: todo.assigneeId === session.user.id,
    }))

    // Combine and group by status
    const allTodos = [...formattedPersonalTodos, ...formattedTeamTodos]

    const groupedTodos = {
      inProgress: allTodos.filter(todo => todo.status === 'IN_PROGRESS'),
      todo: allTodos.filter(todo => todo.status === 'TODO'),
      completed: allTodos.filter(todo => todo.status === 'COMPLETED'),
    }

    // Get recent time entries to suggest recently worked on todos
    const recentEntries = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        personalTodoId: true,
        teamTodoId: true,
        startTime: true,
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 10,
    })

    // Extract unique todo IDs from recent entries
    const recentTodoIds = new Set([
      ...recentEntries.filter(e => e.personalTodoId).map(e => e.personalTodoId!),
      ...recentEntries.filter(e => e.teamTodoId).map(e => e.teamTodoId!),
    ])

    // Mark recently worked on todos
    allTodos.forEach(todo => {
      (todo as any).recentlyWorkedOn = recentTodoIds.has(todo.id)
    })

    return NextResponse.json({
      data: {
        todos: allTodos,
        grouped: groupedTodos,
        recentlyWorkedOn: allTodos.filter((todo: any) => todo.recentlyWorkedOn),
      },
    })
  } catch (error) {
    console.error('Error fetching todos for timer:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}