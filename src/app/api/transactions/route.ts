import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { calculateProfit, calculateWeeksOwned, calculatePercentageKept, calculateSalaryCostForPeriod } from '@/lib/calculations'
import type { SalaryHistory } from '@/types/hattrick'

// Helper function to transform Prisma data to our types
function transformSalaryHistory(prismaHistory: any[]): SalaryHistory[] {
  return prismaHistory.map(history => ({
    ...history,
    endDate: history.endDate ?? undefined
  }))
}

// Validation schemas
const CreateTransactionSchema = z.object({
  playerId: z.string().cuid(),
  saleDate: z.string().datetime(),
  salePrice: z.number().positive().int(),
  percentageKept: z.number().min(0).max(93),
  toTeam: z.string().optional(),
  notes: z.string().optional()
})

const GetTransactionsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  playerId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = GetTransactionsQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      playerId: searchParams.get('playerId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    })

    const page = parseInt(query.page)
    const limit = parseInt(query.limit)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      player: {
        userId: session.user.id
      }
    }

    if (query.playerId) {
      where.playerId = query.playerId
    }

    if (query.startDate || query.endDate) {
      where.saleDate = {}
      if (query.startDate) {
        where.saleDate.gte = new Date(query.startDate)
      }
      if (query.endDate) {
        where.saleDate.lte = new Date(query.endDate)
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.saleTransaction.findMany({
        where,
        include: {
          player: {
            select: {
              id: true,
              name: true,
              position: true,
              nationality: true,
              purchaseDate: true,
              purchasePrice: true
            }
          }
        },
        orderBy: {
          saleDate: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.saleTransaction.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = CreateTransactionSchema.parse(body)

    const saleDate = new Date(data.saleDate)

    // Verify player ownership
    const player = await prisma.player.findFirst({
      where: {
        id: data.playerId,
        userId: session.user.id,
        currentStatus: 'OWNED'
      },
      include: {
        salaryHistory: true
      }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found or not owned by user' },
        { status: 404 }
      )
    }

    // Calculate weeks owned
    const weeksOwnedResult = calculateWeeksOwned({
      purchaseDate: player.purchaseDate,
      saleDate
    })

    // Calculate percentage kept if not provided
    let percentageKept = data.percentageKept
    if (!percentageKept) {
      const percentageResult = calculatePercentageKept({
        weeksOwned: weeksOwnedResult.weeksOwned
      })
      percentageKept = percentageResult.percentageKept
    }

    // Calculate total salary cost
    const totalSalaryCost = calculateSalaryCostForPeriod(
      transformSalaryHistory(player.salaryHistory),
      player.purchaseDate,
      saleDate
    )

    // Calculate profit/loss
    const profitResult = calculateProfit({
      saleValue: data.salePrice,
      percentageKept,
      weeklyExpenses: totalSalaryCost / weeksOwnedResult.weeksOwned || 0,
      weeksOwned: weeksOwnedResult.weeksOwned,
      purchaseValue: player.purchasePrice
    })

    // Create transaction and update player status in a database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create sale transaction
      const transaction = await tx.saleTransaction.create({
        data: {
          playerId: data.playerId,
          saleDate,
          salePrice: data.salePrice,
          percentageKept: Math.round(percentageKept),
          toTeam: data.toTeam,
          notes: data.notes,
          profitLoss: profitResult.profit
        },
        include: {
          player: {
            select: {
              id: true,
              name: true,
              position: true,
              nationality: true,
              purchaseDate: true,
              purchasePrice: true
            }
          }
        }
      })

      // Update player status to SOLD
      await tx.player.update({
        where: { id: data.playerId },
        data: { currentStatus: 'SOLD' }
      })

      // End any open salary history records
      await tx.salaryHistory.updateMany({
        where: {
          playerId: data.playerId,
          endDate: null
        },
        data: {
          endDate: saleDate
        }
      })

      return transaction
    })

    return NextResponse.json({
      data: result,
      message: 'Transaction recorded successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating transaction:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}