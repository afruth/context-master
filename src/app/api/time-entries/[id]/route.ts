import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateTimeEntrySchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/time-entries/[id] - Get specific time entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
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

    if (!timeEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Calculate duration if not stored and we have both times
    let calculatedDuration = timeEntry.duration
    if (!calculatedDuration && timeEntry.startTime && timeEntry.endTime) {
      calculatedDuration = Math.floor(
        (new Date(timeEntry.endTime).getTime() - new Date(timeEntry.startTime).getTime()) / 1000
      )
    }

    return NextResponse.json({
      data: {
        ...timeEntry,
        duration: calculatedDuration,
        todo: timeEntry.personalTodo || timeEntry.teamTodo,
        todoType: timeEntry.personalTodo ? 'personal' : 'team',
      },
    })
  } catch (error) {
    console.error('Error fetching time entry:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// PUT /api/time-entries/[id] - Update or stop time entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if time entry exists and belongs to user
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateTimeEntrySchema.parse(body)

    // Handle "stop timer" case
    if (validatedData.endTime && !existingEntry.endTime) {
      const endTime = new Date(validatedData.endTime)
      const startTime = new Date(existingEntry.startTime)
      
      if (endTime <= startTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }

      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      const updatedEntry = await prisma.$transaction(async (tx) => {
        // Update the time entry
        const timeEntry = await tx.timeEntry.update({
          where: { id: params.id },
          data: {
            endTime,
            duration,
            description: validatedData.description || existingEntry.description,
            billable: validatedData.billable ?? existingEntry.billable,
            hourlyRate: validatedData.hourlyRate ?? existingEntry.hourlyRate,
          },
          include: {
            personalTodo: true,
            teamTodo: true,
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
    }

    // Handle general updates
    const updateData: any = {}

    if (validatedData.startTime) {
      updateData.startTime = new Date(validatedData.startTime)
    }

    if (validatedData.endTime) {
      updateData.endTime = new Date(validatedData.endTime)
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
    }

    if (validatedData.isManual !== undefined) {
      updateData.isManual = validatedData.isManual
    }

    if (validatedData.billable !== undefined) {
      updateData.billable = validatedData.billable
    }

    if (validatedData.hourlyRate !== undefined) {
      updateData.hourlyRate = validatedData.hourlyRate
    }

    // Handle todo association changes
    if (validatedData.personalTodoId !== undefined) {
      if (validatedData.personalTodoId) {
        // Verify personal todo exists and belongs to user
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

      updateData.personalTodoId = validatedData.personalTodoId
      updateData.teamTodoId = null // Clear team todo if setting personal todo
    }

    if (validatedData.teamTodoId !== undefined) {
      if (validatedData.teamTodoId) {
        // Verify team todo exists and user has access
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

      updateData.teamTodoId = validatedData.teamTodoId
      updateData.personalTodoId = null // Clear personal todo if setting team todo
    }

    // Recalculate duration if both start and end times are being updated
    if ((updateData.startTime || updateData.endTime) && 
        (updateData.startTime || existingEntry.startTime) && 
        (updateData.endTime || existingEntry.endTime)) {
      const startTime = updateData.startTime || existingEntry.startTime
      const endTime = updateData.endTime || existingEntry.endTime
      
      if (endTime <= startTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }

      updateData.duration = Math.floor(
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
      )
    }

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: params.id },
      data: updateData,
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
        ...updatedEntry,
        todo: updatedEntry.personalTodo || updatedEntry.teamTodo,
        todoType: updatedEntry.personalTodo ? 'personal' : 'team',
      },
    })
  } catch (error) {
    console.error('Error updating time entry:', error)
    
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

// DELETE /api/time-entries/[id] - Delete time entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if time entry exists and belongs to user
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Delete the time entry and update todo actualMinutes if applicable
    await prisma.$transaction(async (tx) => {
      // If the entry has a duration, subtract it from the todo's actualMinutes
      if (existingEntry.duration) {
        const durationInMinutes = Math.ceil(existingEntry.duration / 60)
        
        if (existingEntry.personalTodoId) {
          await tx.personalTodo.update({
            where: { id: existingEntry.personalTodoId },
            data: {
              actualMinutes: {
                decrement: durationInMinutes,
              },
            },
          })
        } else if (existingEntry.teamTodoId) {
          await tx.teamTodo.update({
            where: { id: existingEntry.teamTodoId },
            data: {
              actualMinutes: {
                decrement: durationInMinutes,
              },
            },
          })
        }
      }

      // Delete the time entry
      await tx.timeEntry.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({
      data: { message: 'Time entry deleted successfully' },
    })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}