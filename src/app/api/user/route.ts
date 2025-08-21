import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for user profile updates
const UpdateUserSchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().email('Please enter a valid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
    .optional()
    .nullable()
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        currency: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate the input
    const validationResult = UpdateUserSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { name, email, username } = validationResult.data

    // Check if email is already taken by another user
    if (email) {
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email }
      })
      
      if (existingUserWithEmail && existingUserWithEmail.id !== session.user.id) {
        return NextResponse.json(
          { error: 'This email is already in use by another account' },
          { status: 409 }
        )
      }
    }

    // Check if username is already taken by another user
    if (username) {
      const existingUserWithUsername = await prisma.user.findUnique({
        where: { username }
      })
      
      if (existingUserWithUsername && existingUserWithUsername.id !== session.user.id) {
        return NextResponse.json(
          { error: 'This username is already taken' },
          { status: 409 }
        )
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email && { email }),
        ...(username !== undefined && { username })
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      ...updatedUser,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Error updating user profile:', error)
    
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('email')) {
        return NextResponse.json(
          { error: 'This email is already in use' },
          { status: 409 }
        )
      } else if (error.message.includes('username')) {
        return NextResponse.json(
          { error: 'This username is already taken' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}