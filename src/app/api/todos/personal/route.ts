import { NextRequest } from 'next/server'
import { 
  createPersonalTodoSchema, 
  personalTodoQuerySchema 
} from '@/lib/validations'
import { 
  requireAuth, 
  successResponse, 
  paginatedResponse,
  withErrorHandler,
  serializeTags,
  deserializeTags,
  buildWhereClause,
  buildOrderByClause,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { PersonalTodoSummary } from '@/types/api'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  const { searchParams } = new URL(request.url)
  
  const query = personalTodoQuerySchema.parse(Object.fromEntries(searchParams))
  
  // Build where clause for filtering
  const where = buildWhereClause({
    userId: user.id,
    status: query.status,
    priority: query.priority,
    category: query.category,
    archivedAt: null, // Only show non-archived todos
  })
  
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
    prisma.personalTodo.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: buildOrderByClause(query.sortBy, query.sortOrder),
      include: {
        timeEntries: {
          select: {
            duration: true,
          },
        },
      },
    }),
    prisma.personalTodo.count({ where }),
  ])
  
  // Transform todos and calculate time summaries
  const todosWithSummary: PersonalTodoSummary[] = todos.map(todo => {
    const totalTime = todo.timeEntries.reduce((acc, entry) => {
      return acc + (entry.duration ? Math.floor(entry.duration / 60) : 0)
    }, 0)
    
    const tags = deserializeTags(todo.tags)
    
    // Filter by tags if specified
    const queryTags = query.tags?.split(',').map(t => t.trim()).filter(Boolean) || []
    const hasMatchingTag = queryTags.length === 0 || 
      queryTags.some(tag => tags.some(todoTag => 
        todoTag.toLowerCase().includes(tag.toLowerCase())
      ))
    
    return {
      ...todo,
      tags,
      timeEntries: {
        totalTime,
        entryCount: todo.timeEntries.length,
      },
      hasMatchingTag,
    }
  }).filter(todo => (todo as any).hasMatchingTag)
  
  // Remove the temporary hasMatchingTag property
  const finalTodos = todosWithSummary.map(({ hasMatchingTag, ...todo }) => todo)
  
  return paginatedResponse(finalTodos, {
    page: query.page,
    limit: query.limit,
    total: finalTodos.length, // Adjusted for tag filtering
  })
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  const body = await request.json()
  
  const validatedData = createPersonalTodoSchema.parse(body)
  
  const todo = await prisma.personalTodo.create({
    data: {
      title: validatedData.title,
      description: validatedData.description,
      priority: validatedData.priority || 'MEDIUM',
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      category: validatedData.category,
      tags: serializeTags(validatedData.tags),
      color: validatedData.color,
      estimatedMinutes: validatedData.estimatedMinutes,
      userId: user.id,
    },
    include: {
      timeEntries: true,
    },
  })
  
  return successResponse(
    {
      ...todo,
      tags: deserializeTags(todo.tags),
    },
    'Todo created successfully',
    201
  )
})