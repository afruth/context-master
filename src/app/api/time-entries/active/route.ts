import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/time-entries/active - Get user's active timer
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
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
      orderBy: {
        startTime: 'desc',
      },
    })

    if (!activeTimer) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({
      data: {
        ...activeTimer,
        todo: activeTimer.personalTodo || activeTimer.teamTodo,
        todoType: activeTimer.personalTodo ? 'personal' : 'team',
      },
    })
  } catch (error) {
    console.error('Error fetching active timer:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// DELETE /api/time-entries/active - Stop active timer
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
    })

    if (!activeTimer) {
      return NextResponse.json(
        { error: 'No active timer found' },
        { status: 404 }
      )
    }

    const endTime = new Date()
    const duration = Math.floor(
      (endTime.getTime() - new Date(activeTimer.startTime).getTime()) / 1000
    )

    const updatedEntry = await prisma.$transaction(async (tx) => {
      // Update the time entry
      const timeEntry = await tx.timeEntry.update({
        where: { id: activeTimer.id },
        data: {
          endTime,
          duration,
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

      // Update the todo's actualMinutes
      const durationInMinutes = Math.ceil(duration / 60)
      
      if (timeEntry.personalTodoId) {
        await tx.personalTodo.update({
          where: { id: timeEntry.personalTodoId },
          data: {
            actualMinutes: {
              increment: durationInMinutes,
            },
          },
        })
      } else if (timeEntry.teamTodoId) {
        await tx.teamTodo.update({
          where: { id: timeEntry.teamTodoId },
          data: {
            actualMinutes: {
              increment: durationInMinutes,
            },
          },
        })
      }

      return timeEntry
    })

    return NextResponse.json({
      data: {
        ...updatedEntry,
        todo: updatedEntry.personalTodo || updatedEntry.teamTodo,
        todoType: updatedEntry.personalTodo ? 'personal' : 'team',
      },
    })
  } catch (error) {
    console.error('Error stopping active timer:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}