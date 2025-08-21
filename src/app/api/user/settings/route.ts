import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getCurrencyByCode } from '@/lib/currencies'

// Validation schema for user settings updates
const UpdateUserSettingsSchema = z.object({
  currency: z.string().min(3).max(3, 'Currency code must be exactly 3 characters')
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
        currency: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      currency: user.currency
    })

  } catch (error) {
    console.error('Error fetching user settings:', error)
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
    const validationResult = UpdateUserSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { currency } = validationResult.data

    // Validate that the currency code exists in our supported currencies
    const currencyData = getCurrencyByCode(currency)
    if (!currencyData) {
      return NextResponse.json(
        { error: `Unsupported currency code: ${currency}` },
        { status: 400 }
      )
    }

    // Update the user settings
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        currency: currency
      },
      select: {
        currency: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      currency: updatedUser.currency,
      currencyData,
      message: 'Settings updated successfully',
      updatedAt: updatedUser.updatedAt
    })

  } catch (error) {
    console.error('Error updating user settings:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  // Allow partial updates using PATCH method
  return PUT(request)
}