import { NextRequest } from 'next/server'
import { createTeamTodoSchema, personalTodoQuerySchema } from '@/lib/validations'
import { 
  requireAuth, 
  requireTeamMembership,
  requireTeamRole,
  successResponse, 
  paginatedResponse,
  errorResponse,
  withErrorHandler,
  serializeTags,
  deserializeTags,
  buildWhereClause,
  buildOrderByClause,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { TeamTodoSummary } from '@/types/api'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId } = await context.params
  const { searchParams } = new URL(request.url)
  
  // Verify team membership
  await requireTeamMembership(teamId, user.id)
  
  const query = personalTodoQuerySchema.parse(Object.fromEntries(searchParams))
  const assigneeId = searchParams.get('assigneeId')
  const createdById = searchParams.get('createdById')
  const unassigned = searchParams.get('unassigned') === 'true'
  
  // Build where clause for filtering
  const where = buildWhereClause({
    teamId,
    status: query.status,
    priority: query.priority,
    category: query.category,
    archivedAt: null, // Only show non-archived todos
  })
  
  // Add assignment filtering
  if (unassigned) {
    where.assigneeId = null
  } else if (assigneeId) {
    where.assigneeId = assigneeId
  }
  
  if (createdById) {
    where.createdById = createdById
  }
  
  // Add date filtering
  if (query.dueBefore || query.dueAfter) {
    where.dueDate = {}
    if (query.dueBefore) where.dueDate.lte = new Date(query.dueBefore)
    if (query.dueAfter) where.dueDate.gte = new Date(query.dueAfter)
  }
  
  // Add search functionality
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ]
  }
  
  // Calculate pagination
  const skip = (query.page - 1) * query.limit
  
  // Execute query with pagination
  const [todos, total] = await Promise.all([
    prisma.teamTodo.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: buildOrderByClause(query.sortBy, query.sortOrder),
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
    }),
    prisma.teamTodo.count({ where }),
  ])
  
  // Transform todos and calculate summaries
  const todosWithSummary: TeamTodoSummary[] = todos.map(todo => {
    const totalTime = todo.timeEntries.reduce((acc, entry) => {
      return acc + (entry.duration ? Math.floor(entry.duration / 60) : 0)
    }, 0)
    
    const tags = deserializeTags(todo.tags)
    
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      status: todo.status,
      priority: todo.priority,
      dueDate: todo.dueDate,
      teamId: todo.teamId,
      assigneeId: todo.assigneeId,
      createdById: todo.createdById,
      category: todo.category,
      tags,
      color: todo.color,
      isTemplate: todo.isTemplate,
      templateName: todo.templateName,
      estimatedMinutes: todo.estimatedMinutes,
      actualMinutes: todo.actualMinutes,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
      completedAt: todo.completedAt,
      archivedAt: todo.archivedAt,
      assignee: todo.assignee,
      createdBy: todo.createdBy,
      commentCount: todo.comments.length,
      timeEntries: {
        totalTime,
        entryCount: todo.timeEntries.length,
      },
    }
  })
  
  return paginatedResponse(todosWithSummary, {
    page: query.page,
    limit: query.limit,
    total,
  })
})

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId } = await context.params
  const body = await request.json()
  
  // Verify user has member+ permissions
  const membership = await requireTeamRole(teamId, user.id, 'MEMBER')
  
  const validatedData = createTeamTodoSchema.parse(body)
  
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
  
  const todo = await prisma.teamTodo.create({
    data: {
      title: validatedData.title,
      description: validatedData.description,
      priority: validatedData.priority || 'MEDIUM',
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      category: validatedData.category,
      tags: serializeTags(validatedData.tags),
      color: validatedData.color,
      estimatedMinutes: validatedData.estimatedMinutes,
      teamId,
      assigneeId: validatedData.assigneeId,
      createdById: user.id,
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
      timeEntries: true,
      comments: true,
    },
  })
  
  const todoWithParsedTags = {
    ...todo,
    tags: deserializeTags(todo.tags),
  }
  
  return successResponse(todoWithParsedTags, 'Team todo created successfully', 201)
})