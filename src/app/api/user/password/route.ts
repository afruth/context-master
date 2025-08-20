import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/utils'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Validation schema for password change
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate the input
    const validationResult = ChangePasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validationResult.data

    // Get the current user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        email: true
      }
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update the password in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedNewPassword
      }
    })

    return NextResponse.json({
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}