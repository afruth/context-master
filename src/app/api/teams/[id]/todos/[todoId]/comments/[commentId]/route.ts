import { NextRequest } from 'next/server'
import { updateCommentSchema } from '@/lib/validations'
import { 
  requireAuth, 
  requireTeamMembership,
  requireTeamRole,
  successResponse, 
  errorResponse,
  withErrorHandler,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string; todoId: string; commentId: string }>
}

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId, todoId, commentId } = await context.params
  const body = await request.json()
  
  // Verify team membership
  await requireTeamMembership(teamId, user.id)
  
  // Verify comment exists and get current data
  const currentComment = await prisma.todoComment.findFirst({
    where: {
      id: commentId,
      teamTodoId: todoId,
      teamTodo: {
        teamId,
        archivedAt: null,
      },
    },
  })
  
  if (!currentComment) {
    return errorResponse('Comment not found', 404)
  }
  
  // Only comment author can edit their own comments
  if (currentComment.userId !== user.id) {
    return errorResponse('You can only edit your own comments', 403)
  }
  
  const validatedData = updateCommentSchema.parse(body)
  
  const comment = await prisma.todoComment.update({
    where: { id: commentId },
    data: {
      content: validatedData.content,
      isEdited: true,
      editedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })
  
  return successResponse(comment, 'Comment updated successfully')
})

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId, todoId, commentId } = await context.params
  
  // Verify team membership
  const membership = await requireTeamMembership(teamId, user.id)
  
  // Verify comment exists and get current data
  const currentComment = await prisma.todoComment.findFirst({
    where: {
      id: commentId,
      teamTodoId: todoId,
      teamTodo: {
        teamId,
        archivedAt: null,
      },
    },
  })
  
  if (!currentComment) {
    return errorResponse('Comment not found', 404)
  }
  
  // Check permissions - user can delete if:
  // 1. They are the comment author, or
  // 2. They are team ADMIN/OWNER
  const canDelete = currentComment.userId === user.id ||
                    membership.role === 'ADMIN' ||
                    membership.role === 'OWNER'
  
  if (!canDelete) {
    return errorResponse('Insufficient permissions to delete this comment', 403)
  }
  
  await prisma.todoComment.delete({
    where: { id: commentId },
  })
  
  return successResponse(null, 'Comment deleted successfully')
})