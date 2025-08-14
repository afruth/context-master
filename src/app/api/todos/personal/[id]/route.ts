import { NextRequest } from 'next/server'
import { updatePersonalTodoSchema } from '@/lib/validations'
import { 
  requireAuth, 
  requirePersonalTodoOwnership,
  successResponse, 
  errorResponse, 
  withErrorHandler,
  serializeTags,
  deserializeTags,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { PersonalTodoWithTimeEntries } from '@/types/api'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id } = await context.params
  
  // Verify ownership and get todo
  await requirePersonalTodoOwnership(id, user.id)
  
  const todo = await prisma.personalTodo.findUnique({
    where: { id },
    include: {
      timeEntries: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  
  if (!todo) {
    return errorResponse('Todo not found', 404)
  }
  
  const todoWithParsedTags: PersonalTodoWithTimeEntries = {
    ...todo,
    tags: deserializeTags(todo.tags),
  }
  
  return successResponse(todoWithParsedTags)
})

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id } = await context.params
  const body = await request.json()
  
  // Verify ownership
  await requirePersonalTodoOwnership(id, user.id)
  
  const validatedData = updatePersonalTodoSchema.parse(body)
  
  // Prepare update data
  const updateData: any = {
    ...validatedData,
    updatedAt: new Date(),
  }
  
  // Handle due date conversion
  if (validatedData.dueDate !== undefined) {
    updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
  }
  
  // Handle tags serialization
  if (validatedData.tags !== undefined) {
    updateData.tags = serializeTags(validatedData.tags)
  }
  
  // Handle completion status
  if (validatedData.status === 'COMPLETED') {
    updateData.completedAt = new Date()
  } else if (validatedData.status && validatedData.status !== 'COMPLETED') {
    updateData.completedAt = null
  }
  
  const updatedTodo = await prisma.personalTodo.update({
    where: { id },
    data: updateData,
    include: {
      timeEntries: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  
  const todoWithParsedTags: PersonalTodoWithTimeEntries = {
    ...updatedTodo,
    tags: deserializeTags(updatedTodo.tags),
  }
  
  return successResponse(todoWithParsedTags, 'Todo updated successfully')
})

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id } = await context.params
  
  // Verify ownership
  await requirePersonalTodoOwnership(id, user.id)
  
  // Soft delete by setting archivedAt
  await prisma.personalTodo.update({
    where: { id },
    data: {
      archivedAt: new Date(),
      updatedAt: new Date(),
    },
  })
  
  return successResponse(null, 'Todo deleted successfully')
})