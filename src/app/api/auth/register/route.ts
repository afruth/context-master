import { NextRequest } from 'next/server'
import { registerUserSchema } from '@/lib/validations'
import { 
  successResponse, 
  errorResponse, 
  withErrorHandler,
  checkRateLimit 
} from '@/lib/api-utils'
import { createUser, getUserByEmail } from '@/lib/utils'
import { prisma } from '@/lib/db'

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting for registration endpoint
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = checkRateLimit(`register:${ip}`, 5, 60000) // 5 requests per minute
  
  if (!rateLimit.allowed) {
    return errorResponse('Too many registration attempts. Please try again later.', 429)
  }
  
  const body = await request.json()
  const validatedData = registerUserSchema.parse(body)
  
  // Check if user already exists
  const existingUser = await getUserByEmail(validatedData.email)
  if (existingUser) {
    return errorResponse('User with this email already exists', 409)
  }
  
  // Check username uniqueness if provided
  if (validatedData.username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username: validatedData.username },
    })
    if (existingUsername) {
      return errorResponse('Username already taken', 409)
    }
  }
  
  const user = await createUser(
    validatedData.email, 
    validatedData.password, 
    validatedData.name
  )
  
  // Update user with additional fields if provided
  let updatedUser = user
  if (validatedData.username) {
    updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { username: validatedData.username },
    })
  }

  return successResponse(
    {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        username: updatedUser.username,
        createdAt: updatedUser.createdAt,
      },
    },
    'User registered successfully',
    201
  )
})