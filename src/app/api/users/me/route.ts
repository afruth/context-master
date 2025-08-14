import { NextRequest } from 'next/server'
import { updateUserSchema } from '@/lib/validations'
import { 
  requireAuth, 
  successResponse, 
  errorResponse, 
  withErrorHandler 
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      image: true,
      timezone: true,
      theme: true,
      notifications: true,
      language: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      // Exclude password for security
    },
  })

  if (!userProfile) {
    return errorResponse('User not found', 404)
  }

  return successResponse(userProfile)
})

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  const body = await request.json()
  
  const validatedData = updateUserSchema.parse(body)
  
  // Check if username is taken by another user
  if (validatedData.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: validatedData.username,
        NOT: { id: user.id },
      },
    })
    
    if (existingUser) {
      return errorResponse('Username already taken', 409)
    }
  }
  
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...validatedData,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      image: true,
      timezone: true,
      theme: true,
      notifications: true,
      language: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
  })
  
  return successResponse(updatedUser, 'Profile updated successfully')
})