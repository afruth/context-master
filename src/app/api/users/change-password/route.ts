import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { 
  requireAuth, 
  successResponse, 
  errorResponse, 
  withErrorHandler 
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'Password must contain at least one letter and one number'
    ),
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  const body = await request.json()
  
  const validatedData = changePasswordSchema.parse(body)
  
  // Get user's current password hash
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  })
  
  if (!currentUser || !currentUser.password) {
    return errorResponse('User not found', 404)
  }
  
  // Verify current password
  const currentPasswordValid = await bcrypt.compare(
    validatedData.currentPassword,
    currentUser.password
  )
  
  if (!currentPasswordValid) {
    return errorResponse('Current password is incorrect', 400)
  }
  
  // Hash new password
  const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 10)
  
  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedNewPassword,
      updatedAt: new Date(),
    },
  })
  
  return successResponse(null, 'Password changed successfully')
})