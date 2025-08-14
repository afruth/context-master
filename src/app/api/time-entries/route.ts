import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { 
  createTimeEntrySchema, 
  startTimerSchema,
  timeEntryQuerySchema 
} from '@/lib/validations'
import { z } from 'zod'

// GET /api/time-entries - List user's time entries with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const {
      page,
      limit,
      startDate,
      endDate,
      todoId,
      todoType,
      billable,
      sortBy,
      sortOrder,
    } = timeEntryQuerySchema.parse(queryParams)

    // Build filter conditions
    const where: any = {
      userId: session.user.id,
    }

    if (startDate) {
      where.startTime = { ...where.startTime, gte: new Date(startDate) }
    }
    
    if (endDate) {
      where.startTime = { ...where.startTime, lte: new Date(endDate) }
    }

    if (todoId && todoType) {
      if (todoType === 'personal') {
        where.personalTodoId = todoId
      } else if (todoType === 'team') {
        where.teamTodoId = todoId
      }
    }

    if (typeof billable === 'boolean') {
      where.billable = billable
    }

    // Calculate offset for pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const total = await prisma.timeEntry.count({ where })
    
    // Fetch time entries with related data
    const timeEntries = await prisma.timeEntry.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        personalTodo: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        teamTodo: {
          select: {
            id: true,
            title: true,
            status: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Calculate durations and format response
    const formattedEntries = timeEntries.map(entry => {
      let calculatedDuration = entry.duration
      
      // If no stored duration and we have start/end times, calculate it
      if (!calculatedDuration && entry.startTime && entry.endTime) {
        calculatedDuration = Math.floor(
          (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000
        )
      }

      return {
        ...entry,
        duration: calculatedDuration,
        todo: entry.personalTodo || entry.teamTodo,
        todoType: entry.personalTodo ? 'personal' : 'team',
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: formattedEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching time entries:', error)
    
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

// POST /api/time-entries - Create new time entry or start timer
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Check if this is a "start timer" request (no endTime)
    const isTimerStart = !body.endTime

    if (isTimerStart) {
      // Validate as timer start
      const validatedData = startTimerSchema.parse(body)
      
      // Check if user already has an active timer
      const activeTimer = await prisma.timeEntry.findFirst({
        where: {
          userId: session.user.id,
          endTime: null,
        },
      })

      if (activeTimer) {
        return NextResponse.json(
          { error: 'You already have an active timer running. Stop it first.' },
          { status: 400 }
        )
      }

      // Verify todo exists and user has access
      if (validatedData.personalTodoId) {
        const personalTodo = await prisma.personalTodo.findFirst({
          where: {
            id: validatedData.personalTodoId,
            userId: session.user.id,
          },
        })

        if (!personalTodo) {
          return NextResponse.json(
            { error: 'Personal todo not found or access denied' },
            { status: 404 }
          )
        }
      }

      if (validatedData.teamTodoId) {
        const teamTodo = await prisma.teamTodo.findFirst({
          where: {
            id: validatedData.teamTodoId,
            team: {
              members: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          },
          include: {
            team: true,
          },
        })

        if (!teamTodo) {
          return NextResponse.json(
            { error: 'Team todo not found or access denied' },
            { status: 404 }
          )
        }
      }

      // Create new timer entry
      const timeEntry = await prisma.timeEntry.create({
        data: {
          userId: session.user.id,
          startTime: new Date(),
          description: validatedData.description,
          personalTodoId: validatedData.personalTodoId,
          teamTodoId: validatedData.teamTodoId,
          isManual: false,
        },
        include: {
          personalTodo: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          teamTodo: {
            select: {
              id: true,
              title: true,
              status: true,
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json({
        data: {
          ...timeEntry,
          todo: timeEntry.personalTodo || timeEntry.teamTodo,
          todoType: timeEntry.personalTodo ? 'personal' : 'team',
        },
      }, { status: 201 })
    } else {
      // Validate as full time entry creation
      const validatedData = createTimeEntrySchema.parse(body)

      // Verify todo exists and user has access
      if (validatedData.personalTodoId) {
        const personalTodo = await prisma.personalTodo.findFirst({
          where: {
            id: validatedData.personalTodoId,
            userId: session.user.id,
          },
        })

        if (!personalTodo) {
          return NextResponse.json(
            { error: 'Personal todo not found or access denied' },
            { status: 404 }
          )
        }
      }

      if (validatedData.teamTodoId) {
        const teamTodo = await prisma.teamTodo.findFirst({
          where: {
            id: validatedData.teamTodoId,
            team: {
              members: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          },
        })

        if (!teamTodo) {
          return NextResponse.json(
            { error: 'Team todo not found or access denied' },
            { status: 404 }
          )
        }
      }

      // Calculate duration if both start and end times are provided
      let duration: number | undefined
      if (validatedData.endTime) {
        const startTime = new Date(validatedData.startTime)
        const endTime = new Date(validatedData.endTime)
        
        if (endTime <= startTime) {
          return NextResponse.json(
            { error: 'End time must be after start time' },
            { status: 400 }
          )
        }

        duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
      }

      // Create time entry
      const timeEntry = await prisma.timeEntry.create({
        data: {
          userId: session.user.id,
          startTime: new Date(validatedData.startTime),
          endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
          duration,
          description: validatedData.description,
          personalTodoId: validatedData.personalTodoId,
          teamTodoId: validatedData.teamTodoId,
          isManual: validatedData.isManual,
          billable: validatedData.billable,
          hourlyRate: validatedData.hourlyRate,
        },
        include: {
          personalTodo: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          teamTodo: {
            select: {
              id: true,
              title: true,
              status: true,
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json({
        data: {
          ...timeEntry,
          todo: timeEntry.personalTodo || timeEntry.teamTodo,
          todoType: timeEntry.personalTodo ? 'personal' : 'team',
        },
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating time entry:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}