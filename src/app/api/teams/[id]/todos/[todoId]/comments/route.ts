import { NextRequest } from 'next/server'
import { createCommentSchema } from '@/lib/validations'
import { 
  requireAuth, 
  requireTeamMembership,
  successResponse, 
  paginatedResponse,
  errorResponse,
  withErrorHandler,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string; todoId: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId, todoId } = await context.params
  const { searchParams } = new URL(request.url)
  
  // Verify team membership
  await requireTeamMembership(teamId, user.id)
  
  // Verify todo exists and belongs to team
  const todo = await prisma.teamTodo.findFirst({
    where: {
      id: todoId,
      teamId,
      archivedAt: null,
    },
  })
  
  if (!todo) {
    return errorResponse('Team todo not found', 404)
  }
  
  // Parse pagination parameters
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const skip = (page - 1) * limit
  
  // Fetch comments with pagination
  const [comments, total] = await Promise.all([
    prisma.todoComment.findMany({
      where: { teamTodoId: todoId },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' }, // Show oldest first for conversations
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
    }),
    prisma.todoComment.count({ where: { teamTodoId: todoId } }),
  ])
  
  return paginatedResponse(comments, {
    page,
    limit,
    total,
  })
})

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId, todoId } = await context.params
  const body = await request.json()
  
  // Verify team membership
  await requireTeamMembership(teamId, user.id)
  
  // Verify todo exists and belongs to team
  const todo = await prisma.teamTodo.findFirst({
    where: {
      id: todoId,
      teamId,
      archivedAt: null,
    },
  })
  
  if (!todo) {
    return errorResponse('Team todo not found', 404)
  }
  
  const validatedData = createCommentSchema.parse(body)
  
  const comment = await prisma.todoComment.create({
    data: {
      content: validatedData.content,
      teamTodoId: todoId,
      userId: user.id,
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
  
  return successResponse(comment, 'Comment added successfully', 201)
})