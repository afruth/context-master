import { NextRequest } from 'next/server'
import { bulkTodoOperationSchema } from '@/lib/validations'
import { 
  requireAuth, 
  successResponse, 
  withErrorHandler 
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { BulkOperationResult } from '@/types/api'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  const body = await request.json()
  
  const { operation, todoIds } = bulkTodoOperationSchema.parse(body)
  
  // Verify all todos belong to the user
  const userTodos = await prisma.personalTodo.findMany({
    where: {
      id: { in: todoIds },
      userId: user.id,
      archivedAt: null, // Only operate on non-archived todos
    },
    select: { id: true },
  })
  
  const validTodoIds = userTodos.map(todo => todo.id)
  const failedIds = todoIds.filter(id => !validTodoIds.includes(id))
  
  let processed = 0
  const errors: string[] = []
  
  if (validTodoIds.length > 0) {
    try {
      switch (operation) {
        case 'complete':
          const { count: completedCount } = await prisma.personalTodo.updateMany({
            where: {
              id: { in: validTodoIds },
              status: { not: 'COMPLETED' }, // Only update incomplete todos
            },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              updatedAt: new Date(),
            },
          })
          processed = completedCount
          break
          
        case 'delete':
        case 'archive':
          const { count: archivedCount } = await prisma.personalTodo.updateMany({
            where: {
              id: { in: validTodoIds },
            },
            data: {
              archivedAt: new Date(),
              updatedAt: new Date(),
            },
          })
          processed = archivedCount
          break
          
        default:
          throw new Error('Invalid operation')
      }
    } catch (error) {
      errors.push(`Bulk ${operation} operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  // Add errors for invalid todo IDs
  failedIds.forEach(id => {
    errors.push(`Todo ${id} not found or not owned by user`)
  })
  
  const result: BulkOperationResult = {
    processed,
    failed: failedIds.length,
  }
  
  if (errors.length > 0) {
    result.errors = errors
  }
  
  return successResponse(result, 'Bulk operation completed')
})