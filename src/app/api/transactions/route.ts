import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { calculateProfit, calculateWeeksOwned, calculatePercentageKept, calculateSalaryCostForPeriod } from '@/lib/calculations'
import type { SalaryHistory, TransactionQueryParams, PaginatedResponse } from '@/types/hattrick'

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
  // Text search
  search: z.string().optional(),
  
  // Filters
  playerId: z.string().cuid().optional(),
  profitMin: z.string().transform(Number).optional(),
  profitMax: z.string().transform(Number).optional(),
  dateFrom: z.string().transform((str) => new Date(str)).optional(),
  dateTo: z.string().transform((str) => new Date(str)).optional(),
  
  // Sorting
  sortBy: z.enum(['saleDate', 'profitLoss', 'salePrice', 'playerName']).default('saleDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Pagination
  page: z.string().transform(Number).refine(n => n >= 1, 'Page must be at least 1').default(() => 1),
  limit: z.string().transform(Number).refine(n => n >= 1 && n <= 100, 'Limit must be between 1 and 100').default(() => 10)
})

/**
 * GET /api/transactions - List all transactions for the authenticated user with advanced filtering, searching, and sorting
 * 
 * @param search - Text search across player name
 * @param playerId - Filter by specific player ID
 * @param profitMin - Minimum profit/loss value
 * @param profitMax - Maximum profit/loss value
 * @param dateFrom - Start date for transaction date range
 * @param dateTo - End date for transaction date range
 * @param sortBy - Sort by: saleDate, profitLoss, salePrice, playerName
 * @param sortOrder - Sort order: asc, desc
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)
    
    // Parse and validate query parameters
    const parsedQuery = GetTransactionsQuerySchema.safeParse(queryParams)
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.issues },
        { status: 400 }
      )
    }

    const {
      search,
      playerId,
      profitMin,
      profitMax,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      page,
      limit
    } = parsedQuery.data

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      player: {
        userId: session.user.id
      }
    }

    // Text search across player name
    if (search) {
      where.player.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Player ID filter
    if (playerId) {
      where.playerId = playerId
    }

    // Profit range filter
    if (profitMin !== undefined || profitMax !== undefined) {
      where.profitLoss = {}
      if (profitMin !== undefined) {
        where.profitLoss.gte = profitMin
      }
      if (profitMax !== undefined) {
        where.profitLoss.lte = profitMax
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.saleDate = {}
      if (dateFrom) {
        where.saleDate.gte = dateFrom
      }
      if (dateTo) {
        where.saleDate.lte = dateTo
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sortBy === 'playerName') {
      orderBy.player = { name: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
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
        orderBy,
        skip,
        take: limit
      }),
      prisma.saleTransaction.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<typeof transactions[0]> = {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return NextResponse.json(response)
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