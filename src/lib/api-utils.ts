import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ZodError } from 'zod'

// Standard API response types
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  statusCode?: number
  details?: any
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Success response helper
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: ApiResponse<T> = { data }
  if (message) response.message = message
  return NextResponse.json(response, { status })
}

// Paginated response helper
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
  message?: string
): NextResponse {
  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const response: PaginatedResponse<T> = {
    data,
    pagination: {
      ...pagination,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  }
  if (message) response.message = message
  return NextResponse.json(response)
}

// Error response helper
export function errorResponse(
  error: string,
  status: number = 500,
  details?: any
): NextResponse {
  const response: ApiResponse = { 
    error,
    statusCode: status,
  }
  
  // Only include details in development
  if (process.env.NODE_ENV === 'development' && details) {
    response.details = details
  }
  
  return NextResponse.json(response, { status })
}

// Validation error response helper
export function validationErrorResponse(zodError: ZodError): NextResponse {
  const errors = zodError.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }))
  
  return NextResponse.json({
    error: 'Validation failed',
    statusCode: 422,
    details: {
      errors,
      message: 'Please check the form data and try again.'
    }
  }, { status: 422 })
}

// Authentication middleware
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }
  return session.user
}

// Authorization helpers
export async function requireTeamMembership(teamId: string, userId: string) {
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    include: {
      team: true,
    },
  })
  
  if (!membership) {
    throw new Error('Team access forbidden')
  }
  
  return membership
}

export async function requireTeamRole(
  teamId: string,
  userId: string,
  minimumRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
) {
  const membership = await requireTeamMembership(teamId, userId)
  
  const roleHierarchy = {
    VIEWER: 0,
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3,
  }
  
  if (roleHierarchy[membership.role] < roleHierarchy[minimumRole]) {
    throw new Error('Insufficient permissions')
  }
  
  return membership
}

// Resource ownership verification
export async function requirePersonalTodoOwnership(todoId: string, userId: string) {
  const todo = await prisma.personalTodo.findUnique({
    where: { id: todoId },
  })
  
  if (!todo) {
    throw new Error('Todo not found')
  }
  
  if (todo.userId !== userId) {
    throw new Error('Todo access forbidden')
  }
  
  return todo
}

export async function requireTeamTodoAccess(todoId: string, userId: string) {
  const todo = await prisma.teamTodo.findUnique({
    where: { id: todoId },
    include: {
      team: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  })
  
  if (!todo) {
    throw new Error('Todo not found')
  }
  
  if (todo.team.members.length === 0) {
    throw new Error('Todo access forbidden')
  }
  
  return todo
}

// Utility function to generate team slug
export function generateTeamSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}

// Utility function to handle JSON arrays in SQLite
export function serializeTags(tags?: string[]): string | null {
  if (!tags || tags.length === 0) return null
  return JSON.stringify(tags)
}

export function deserializeTags(tagsJson?: string | null): string[] {
  if (!tagsJson) return []
  try {
    const tags = JSON.parse(tagsJson)
    return Array.isArray(tags) ? tags : []
  } catch {
    return []
  }
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)
  
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs
    rateLimitMap.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: limit - 1, resetTime }
  }
  
  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime }
}

// Error handler wrapper for API routes
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof ZodError) {
        return validationErrorResponse(error)
      }
      
      const message = error instanceof Error ? error.message : 'Internal server error'
      
      // Map common error messages to status codes
      if (message.includes('not found')) return errorResponse(message, 404)
      if (message.includes('forbidden') || message.includes('access')) return errorResponse(message, 403)
      if (message.includes('Authentication required')) return errorResponse(message, 401)
      if (message.includes('already exists')) return errorResponse(message, 409)
      if (message.includes('Validation failed')) return errorResponse(message, 422)
      
      return errorResponse('Internal server error', 500, error)
    }
  }
}

// Database query helpers
export function buildWhereClause(filters: Record<string, any>) {
  const where: Record<string, any> = {}
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'search') {
        where.OR = [
          { title: { contains: value, mode: 'insensitive' } },
          { description: { contains: value, mode: 'insensitive' } },
        ]
      } else if (key === 'tags' && Array.isArray(value)) {
        // For SQLite compatibility, we'll do tag filtering in the application layer
        // This would be handled post-query
      } else {
        where[key] = value
      }
    }
  })
  
  return where
}

export function buildOrderByClause(sortBy?: string, sortOrder?: 'asc' | 'desc') {
  if (!sortBy) return {}
  return { [sortBy]: sortOrder || 'desc' }
}