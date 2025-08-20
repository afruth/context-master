import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { PlayerStatus, type CreatePlayerInput, type PlayerQueryParams, type PaginatedResponse } from '@/types/hattrick'
import { calculateWeeksOwned, calculatePercentageKept, calculateProfit, calculateSalaryCostForPeriod } from '@/lib/calculations'

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
  fromTeam: z.string().optional(),
  estimatedSaleValue: z.number().int().min(0, 'Estimated sale value must be positive').optional(),
  weeklyPay: z.number().int().min(0, 'Weekly pay must be positive').optional()
})

const listPlayersQuerySchema = z.object({
  // Text search
  search: z.string().optional(),
  
  // Filters
  status: z.enum(['OWNED', 'SOLD', 'TRANSFERRED']).optional(),
  position: z.string().optional(),
  ageMin: z.string().transform(Number).optional(),
  ageMax: z.string().transform(Number).optional(),
  priceMin: z.string().transform(Number).optional(),
  priceMax: z.string().transform(Number).optional(),
  purchaseDateFrom: z.string().transform((str) => new Date(str)).optional(),
  purchaseDateTo: z.string().transform((str) => new Date(str)).optional(),
  
  // Skill level filters
  keeperMin: z.string().transform(Number).optional(),
  keeperMax: z.string().transform(Number).optional(),
  defendingMin: z.string().transform(Number).optional(),
  defendingMax: z.string().transform(Number).optional(),
  playmakingMin: z.string().transform(Number).optional(),
  playmakingMax: z.string().transform(Number).optional(),
  wingerMin: z.string().transform(Number).optional(),
  wingerMax: z.string().transform(Number).optional(),
  passingMin: z.string().transform(Number).optional(),
  passingMax: z.string().transform(Number).optional(),
  scoringMin: z.string().transform(Number).optional(),
  scoringMax: z.string().transform(Number).optional(),
  setPiecesMin: z.string().transform(Number).optional(),
  setPiecesMax: z.string().transform(Number).optional(),
  
  // Sorting
  sortBy: z.enum(['name', 'age', 'position', 'purchasePrice', 'purchaseDate', 'projectedProfit']).default('purchaseDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Pagination
  page: z.string().transform(Number).refine(n => n >= 1, 'Page must be at least 1').default(() => 1),
  limit: z.string().transform(Number).refine(n => n >= 1 && n <= 100, 'Limit must be between 1 and 100').default(() => 10)
})

/**
 * GET /api/players - List all players for the authenticated user with advanced filtering, searching, and sorting
 * 
 * @param search - Text search across player name, nationality, position
 * @param status - Filter by player status (OWNED, SOLD, TRANSFERRED)
 * @param position - Filter by position (partial match)
 * @param ageMin - Minimum age in years
 * @param ageMax - Maximum age in years
 * @param priceMin - Minimum purchase price
 * @param priceMax - Maximum purchase price
 * @param purchaseDateFrom - Start date for purchase date range
 * @param purchaseDateTo - End date for purchase date range
 * @param keeperMin/Max - Skill level range filters for all skills
 * @param sortBy - Sort by: name, age, position, purchasePrice, purchaseDate, projectedProfit
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
    const parsedQuery = listPlayersQuerySchema.safeParse(queryParams)
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.issues },
        { status: 400 }
      )
    }

    const { 
      search,
      status, 
      position,
      ageMin,
      ageMax,
      priceMin,
      priceMax,
      purchaseDateFrom, 
      purchaseDateTo,
      keeperMin,
      keeperMax,
      defendingMin,
      defendingMax,
      playmakingMin,
      playmakingMax,
      wingerMin,
      wingerMax,
      passingMin,
      passingMax,
      scoringMin,
      scoringMax,
      setPiecesMin,
      setPiecesMax,
      sortBy, 
      sortOrder, 
      page, 
      limit 
    } = parsedQuery.data

    // Build where clause
    const where: any = {
      userId: session.user.id
    }

    // Text search across multiple fields
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nationality: { contains: search } },
        { position: { contains: search } }
      ]
    }

    // Status filter
    if (status) {
      where.currentStatus = status
    }

    // Position filter
    if (position) {
      where.position = {
        contains: position
      }
    }

    // Age range filter
    if (ageMin !== undefined || ageMax !== undefined) {
      where.ageYears = {}
      if (ageMin !== undefined) {
        where.ageYears.gte = ageMin
      }
      if (ageMax !== undefined) {
        where.ageYears.lte = ageMax
      }
    }

    // Price range filter
    if (priceMin !== undefined || priceMax !== undefined) {
      where.purchasePrice = {}
      if (priceMin !== undefined) {
        where.purchasePrice.gte = priceMin
      }
      if (priceMax !== undefined) {
        where.purchasePrice.lte = priceMax
      }
    }

    // Purchase date range filter
    if (purchaseDateFrom || purchaseDateTo) {
      where.purchaseDate = {}
      if (purchaseDateFrom) {
        where.purchaseDate.gte = purchaseDateFrom
      }
      if (purchaseDateTo) {
        where.purchaseDate.lte = purchaseDateTo
      }
    }

    // Skill level filters
    if (keeperMin !== undefined || keeperMax !== undefined) {
      where.keeper = {}
      if (keeperMin !== undefined) where.keeper.gte = keeperMin
      if (keeperMax !== undefined) where.keeper.lte = keeperMax
    }

    if (defendingMin !== undefined || defendingMax !== undefined) {
      where.defending = {}
      if (defendingMin !== undefined) where.defending.gte = defendingMin
      if (defendingMax !== undefined) where.defending.lte = defendingMax
    }

    if (playmakingMin !== undefined || playmakingMax !== undefined) {
      where.playmaking = {}
      if (playmakingMin !== undefined) where.playmaking.gte = playmakingMin
      if (playmakingMax !== undefined) where.playmaking.lte = playmakingMax
    }

    if (wingerMin !== undefined || wingerMax !== undefined) {
      where.winger = {}
      if (wingerMin !== undefined) where.winger.gte = wingerMin
      if (wingerMax !== undefined) where.winger.lte = wingerMax
    }

    if (passingMin !== undefined || passingMax !== undefined) {
      where.passing = {}
      if (passingMin !== undefined) where.passing.gte = passingMin
      if (passingMax !== undefined) where.passing.lte = passingMax
    }

    if (scoringMin !== undefined || scoringMax !== undefined) {
      where.scoring = {}
      if (scoringMin !== undefined) where.scoring.gte = scoringMin
      if (scoringMax !== undefined) where.scoring.lte = scoringMax
    }

    if (setPiecesMin !== undefined || setPiecesMax !== undefined) {
      where.setPieces = {}
      if (setPiecesMin !== undefined) where.setPieces.gte = setPiecesMin
      if (setPiecesMax !== undefined) where.setPieces.lte = setPiecesMax
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sortBy === 'age') {
      orderBy.ageYears = sortOrder
    } else if (sortBy === 'projectedProfit') {
      // For projected profit, we'll need to sort after data transformation
      orderBy.purchaseDate = sortOrder // Fallback sort
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

    // Transform data to match our interface with calculations
    const transformedPlayers = players.map(player => {
      const currentDate = new Date()
      
      // Calculate weeks owned
      const weeksOwnedResult = calculateWeeksOwned({
        purchaseDate: player.purchaseDate,
        saleDate: player.currentStatus === 'SOLD' 
          ? (player.saleTransactions[0]?.saleDate || currentDate)
          : currentDate
      })

      // Calculate total salary cost
      const totalSalaryCost = calculateSalaryCostForPeriod(
        player.salaryHistory.map(sh => ({
          ...sh,
          endDate: sh.endDate || undefined
        })),
        player.purchaseDate,
        player.currentStatus === 'SOLD' 
          ? (player.saleTransactions[0]?.saleDate || currentDate)
          : currentDate
      )

      // Calculate projected profit for owned players
      let estimatedProfit: number | undefined
      let currentValue: number | undefined
      let totalProfit: number | undefined
      let profitMargin: number | undefined

      if (player.currentStatus === 'OWNED') {
        // For owned players, calculate estimated profit using current percentage kept
        const percentageResult = calculatePercentageKept({
          daysOwned: weeksOwnedResult.daysOwned
        })
        
        // Use estimated sale value if provided, otherwise estimate as purchase price + 10%
        currentValue = player.estimatedSaleValue || Math.round(player.purchasePrice * 1.1)
        
        const profitResult = calculateProfit({
          saleValue: currentValue,
          percentageKept: percentageResult.percentageKept,
          weeklyExpenses: totalSalaryCost / (weeksOwnedResult.weeksOwned || 1),
          weeksOwned: weeksOwnedResult.weeksOwned,
          purchaseValue: player.purchasePrice
        })
        
        estimatedProfit = profitResult.profit
      } else if (player.currentStatus === 'SOLD' && player.saleTransactions.length > 0) {
        // For sold players, use actual profit from sale transaction
        totalProfit = player.saleTransactions[0].profitLoss
        profitMargin = player.purchasePrice > 0 
          ? (totalProfit / player.purchasePrice) * 100 
          : 0
      }

      return {
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
        estimatedSaleValue: player.estimatedSaleValue || undefined,
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
        })),
        // Calculated fields
        weeksOwned: weeksOwnedResult.weeksOwned,
        estimatedProfit,
        currentValue,
        totalProfit,
        profitMargin
      }
    })

    // Sort by projected profit if requested (after data transformation)
    if (sortBy === 'projectedProfit') {
      transformedPlayers.sort((a, b) => {
        // Calculate simple projected profit (this could be enhanced with proper calculation)
        const profitA = a.saleTransactions.reduce((sum, t) => sum + t.profitLoss, 0)
        const profitB = b.saleTransactions.reduce((sum, t) => sum + t.profitLoss, 0)
        return sortOrder === 'asc' ? profitA - profitB : profitB - profitA
      })
    }

    const response: PaginatedResponse<typeof transformedPlayers[0]> = {
      data: transformedPlayers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    }

    return NextResponse.json(response)
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
        estimatedSaleValue: data.estimatedSaleValue,
        currentStatus: 'OWNED',
        userId: session.user.id
      },
      include: {
        saleTransactions: true,
        salaryHistory: true
      }
    })

    // Create initial salary history entry if weeklyPay is provided
    if (data.weeklyPay && data.weeklyPay > 0) {
      await prisma.salaryHistory.create({
        data: {
          playerId: player.id,
          weeklyPay: data.weeklyPay,
          startDate: data.purchaseDate, // Use purchase date as salary start date
          // endDate is null for current salary
        }
      })
    }

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
      estimatedSaleValue: player.estimatedSaleValue || undefined,
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