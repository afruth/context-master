import { NextRequest } from 'next/server'
import { updateTeamTodoSchema } from '@/lib/validations'
import { 
  requireAuth, 
  requireTeamMembership,
  requireTeamRole,
  successResponse, 
  errorResponse,
  withErrorHandler,
  serializeTags,
  deserializeTags,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string; todoId: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId, todoId } = await context.params
  
  // Verify team membership
  await requireTeamMembership(teamId, user.id)
  
  const todo = await prisma.teamTodo.findFirst({
    where: {
      id: todoId,
      teamId,
      archivedAt: null, // Only show non-archived todos
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      timeEntries: {
        select: {
          duration: true,
        },
      },
      comments: {
        select: {
          id: true,
        },
      },
    },
  })
  
  if (!todo) {
    return errorResponse('Team todo not found', 404)
  }
  
  // Transform todo and calculate summaries
  const totalTime = todo.timeEntries.reduce((acc, entry) => {
    return acc + (entry.duration ? Math.floor(entry.duration / 60) : 0)
  }, 0)
  
  const todoWithSummary = {
    ...todo,
    tags: deserializeTags(todo.tags),
    commentCount: todo.comments.length,
    timeEntries: {
      totalTime,
      entryCount: todo.timeEntries.length,
    },
  }
  
  return successResponse(todoWithSummary)
})

export const PATCH = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId, todoId } = await context.params
  const body = await request.json()
  
  // Verify team membership
  const membership = await requireTeamMembership(teamId, user.id)
  
  const validatedData = updateTeamTodoSchema.parse(body)
  
  // Get the current todo to check permissions
  const currentTodo = await prisma.teamTodo.findFirst({
    where: {
      id: todoId,
      teamId,
      archivedAt: null,
    },
  })
  
  if (!currentTodo) {
    return errorResponse('Team todo not found', 404)
  }
  
  // Check permissions - user can edit if:
  // 1. They are ADMIN/OWNER, or
  // 2. They are the assignee, or
  // 3. They created the todo (and are at least MEMBER)
  const canEdit = membership.role === 'ADMIN' || 
                  membership.role === 'OWNER' ||
                  currentTodo.assigneeId === user.id ||
                  (currentTodo.createdById === user.id && membership.role === 'MEMBER')
  
  if (!canEdit) {
    return errorResponse('Insufficient permissions to edit this todo', 403)
  }
  
  // Verify assignee is a team member if specified
  if (validatedData.assigneeId) {
    const assigneeIsMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: validatedData.assigneeId,
        },
      },
    })
    
    if (!assigneeIsMember) {
      return errorResponse('Assignee must be a team member', 400)
    }
  }
  
  // Prepare update data
  const updateData: any = {}
  
  if (validatedData.title !== undefined) updateData.title = validatedData.title
  if (validatedData.description !== undefined) updateData.description = validatedData.description
  if (validatedData.status !== undefined) updateData.status = validatedData.status
  if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
  if (validatedData.category !== undefined) updateData.category = validatedData.category
  if (validatedData.color !== undefined) updateData.color = validatedData.color
  if (validatedData.estimatedMinutes !== undefined) updateData.estimatedMinutes = validatedData.estimatedMinutes
  if (validatedData.assigneeId !== undefined) updateData.assigneeId = validatedData.assigneeId
  if (validatedData.tags !== undefined) updateData.tags = serializeTags(validatedData.tags)
  
  if (validatedData.dueDate !== undefined) {
    updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
  }
  
  // Set completion timestamp if status changed to completed
  if (validatedData.status === 'COMPLETED' && currentTodo.status !== 'COMPLETED') {
    updateData.completedAt = new Date()
  } else if (validatedData.status && validatedData.status !== 'COMPLETED' && currentTodo.status === 'COMPLETED') {
    updateData.completedAt = null
  }
  
  const todo = await prisma.teamTodo.update({
    where: { id: todoId },
    data: updateData,
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      timeEntries: {
        select: {
          duration: true,
        },
      },
      comments: {
        select: {
          id: true,
        },
      },
    },
  })
  
  // Transform todo and calculate summaries
  const totalTime = todo.timeEntries.reduce((acc, entry) => {
    return acc + (entry.duration ? Math.floor(entry.duration / 60) : 0)
  }, 0)
  
  const todoWithSummary = {
    ...todo,
    tags: deserializeTags(todo.tags),
    commentCount: todo.comments.length,
    timeEntries: {
      totalTime,
      entryCount: todo.timeEntries.length,
    },
  }
  
  return successResponse(todoWithSummary, 'Team todo updated successfully')
})

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId, todoId } = await context.params
  
  // Verify team membership
  const membership = await requireTeamMembership(teamId, user.id)
  
  // Get the current todo to check permissions
  const currentTodo = await prisma.teamTodo.findFirst({
    where: {
      id: todoId,
      teamId,
      archivedAt: null,
    },
  })
  
  if (!currentTodo) {
    return errorResponse('Team todo not found', 404)
  }
  
  // Check permissions - user can delete if:
  // 1. They are ADMIN/OWNER, or
  // 2. They created the todo (and are at least MEMBER)
  const canDelete = membership.role === 'ADMIN' || 
                    membership.role === 'OWNER' ||
                    (currentTodo.createdById === user.id && membership.role === 'MEMBER')
  
  if (!canDelete) {
    return errorResponse('Insufficient permissions to delete this todo', 403)
  }
  
  // Soft delete by archiving
  await prisma.teamTodo.update({
    where: { id: todoId },
    data: { archivedAt: new Date() },
  })
  
  return successResponse(null, 'Team todo deleted successfully')
})