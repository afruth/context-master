import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { PlayerStatus, type CreatePlayerInput } from '@/types/hattrick'

// Validation schemas
const createPlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  ageYears: z.number().int().min(15, 'Age must be at least 15 years').max(45, 'Age must be less than 45 years'),
  ageDays: z.number().int().min(0, 'Age days must be at least 0').max(111, 'Age days must be less than 112'),
  position: z.string().min(1, 'Position is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  speciality: z.string().optional(),
  form: z.number().int().min(1, 'Form must be at least 1').max(20, 'Form must be less than or equal to 20'),
  stamina: z.number().int().min(1, 'Stamina must be at least 1').max(20, 'Stamina must be less than or equal to 20'),
  keeper: z.number().int().min(0).max(20).optional(),
  defending: z.number().int().min(0).max(20).optional(),
  playmaking: z.number().int().min(0).max(20).optional(),
  winger: z.number().int().min(0).max(20).optional(),
  passing: z.number().int().min(0).max(20).optional(),
  scoring: z.number().int().min(0).max(20).optional(),
  setPieces: z.number().int().min(0).max(20).optional(),
  purchaseDate: z.string().transform((str) => new Date(str)),
  purchasePrice: z.number().int().min(0, 'Purchase price must be positive'),
  fromTeam: z.string().optional()
})

const listPlayersQuerySchema = z.object({
  status: z.enum(['OWNED', 'SOLD', 'TRANSFERRED']).optional(),
  position: z.string().optional(),
  purchaseDateFrom: z.string().transform((str) => new Date(str)).optional(),
  purchaseDateTo: z.string().transform((str) => new Date(str)).optional(),
  sortBy: z.enum(['name', 'age', 'purchaseDate', 'purchasePrice', 'position']).default('purchaseDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().transform(Number).refine(n => n >= 1, 'Page must be at least 1').default(() => 1),
  limit: z.string().transform(Number).refine(n => n >= 1 && n <= 100, 'Limit must be between 1 and 100').default(() => 10)
})

/**
 * GET /api/players - List all players for the authenticated user with filtering/sorting
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
    const parsedQuery = listPlayersQuerySchema.safeParse(queryParams)
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.issues },
        { status: 400 }
      )
    }

    const { 
      status, 
      position, 
      purchaseDateFrom, 
      purchaseDateTo, 
      sortBy, 
      sortOrder, 
      page, 
      limit 
    } = parsedQuery.data

    // Build where clause
    const where: any = {
      userId: session.user.id
    }

    if (status) {
      where.currentStatus = status
    }

    if (position) {
      where.position = {
        contains: position,
        mode: 'insensitive'
      }
    }

    if (purchaseDateFrom || purchaseDateTo) {
      where.purchaseDate = {}
      if (purchaseDateFrom) {
        where.purchaseDate.gte = purchaseDateFrom
      }
      if (purchaseDateTo) {
        where.purchaseDate.lte = purchaseDateTo
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sortBy === 'age') {
      orderBy.ageYears = sortOrder
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    
    // Execute queries
    const [players, totalCount] = await Promise.all([
      prisma.player.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          saleTransactions: {
            select: {
              id: true,
              saleDate: true,
              salePrice: true,
              percentageKept: true,
              profitLoss: true
            }
          },
          salaryHistory: {
            select: {
              id: true,
              playerId: true,
              weeklyPay: true,
              startDate: true,
              endDate: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      }),
      prisma.player.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // Transform data to match our interface
    const transformedPlayers = players.map(player => ({
      id: player.id,
      name: player.name,
      age: {
        years: player.ageYears,
        days: player.ageDays
      },
      position: player.position,
      nationality: player.nationality,
      speciality: player.speciality || undefined,
      form: player.form,
      stamina: player.stamina,
      skills: {
        keeper: player.keeper || undefined,
        defending: player.defending || undefined,
        playmaking: player.playmaking || undefined,
        winger: player.winger || undefined,
        passing: player.passing || undefined,
        scoring: player.scoring || undefined,
        setPieces: player.setPieces || undefined
      },
      purchaseDetails: {
        date: player.purchaseDate,
        price: player.purchasePrice,
        fromTeam: player.fromTeam || undefined,
        hattrickWeek: 0, // TODO: Calculate from date
        hattrickSeason: 0 // TODO: Calculate from date
      },
      currentStatus: player.currentStatus as PlayerStatus,
      userId: player.userId,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
      saleTransactions: player.saleTransactions,
      salaryHistory: player.salaryHistory.map(sh => ({
        ...sh,
        endDate: sh.endDate || undefined,
        createdAt: sh.createdAt,
        updatedAt: sh.updatedAt
      }))
    }))

    return NextResponse.json({
      data: transformedPlayers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/players - Create a new player
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createPlayerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Create the player
    const player = await prisma.player.create({
      data: {
        name: data.name,
        ageYears: data.ageYears,
        ageDays: data.ageDays,
        position: data.position,
        nationality: data.nationality,
        speciality: data.speciality,
        form: data.form,
        stamina: data.stamina,
        keeper: data.keeper,
        defending: data.defending,
        playmaking: data.playmaking,
        winger: data.winger,
        passing: data.passing,
        scoring: data.scoring,
        setPieces: data.setPieces,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice,
        fromTeam: data.fromTeam,
        currentStatus: 'OWNED',
        userId: session.user.id
      },
      include: {
        saleTransactions: true,
        salaryHistory: true
      }
    })

    // Transform response to match our interface
    const transformedPlayer = {
      id: player.id,
      name: player.name,
      age: {
        years: player.ageYears,
        days: player.ageDays
      },
      position: player.position,
      nationality: player.nationality,
      speciality: player.speciality || undefined,
      form: player.form,
      stamina: player.stamina,
      skills: {
        keeper: player.keeper || undefined,
        defending: player.defending || undefined,
        playmaking: player.playmaking || undefined,
        winger: player.winger || undefined,
        passing: player.passing || undefined,
        scoring: player.scoring || undefined,
        setPieces: player.setPieces || undefined
      },
      purchaseDetails: {
        date: player.purchaseDate,
        price: player.purchasePrice,
        fromTeam: player.fromTeam || undefined,
        hattrickWeek: 0, // TODO: Calculate from date
        hattrickSeason: 0 // TODO: Calculate from date
      },
      currentStatus: player.currentStatus as PlayerStatus,
      userId: player.userId,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
      saleTransactions: player.saleTransactions,
      salaryHistory: player.salaryHistory.map(sh => ({
        ...sh,
        endDate: sh.endDate || undefined,
        createdAt: sh.createdAt,
        updatedAt: sh.updatedAt
      }))
    }

    return NextResponse.json(
      { 
        data: transformedPlayer,
        message: 'Player created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}