import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { 
  formatPlayerForCSV, 
  generatePlayersCSV, 
  generatePlayersJSON, 
  generatePlayersPDF,
  getExportFilename,
  buildFilterInfo
} from '@/lib/export'
import type { PlayerWithCalculations } from '@/types/hattrick'

const exportPlayersQuerySchema = z.object({
  // Export format
  format: z.enum(['csv', 'json', 'pdf']).default('csv'),
  
  // Same filters as main players API
  search: z.string().optional(),
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
  
  // Export limits (no pagination for exports, but reasonable limits)
  limit: z.string().transform(Number).refine(n => n >= 1 && n <= 10000, 'Limit must be between 1 and 10000').default(() => 10000)
})

/**
 * GET /api/export/players - Export players data in CSV, JSON, or PDF format
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
    const parsedQuery = exportPlayersQuerySchema.safeParse(queryParams)
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.issues },
        { status: 400 }
      )
    }

    const { 
      format,
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
      limit 
    } = parsedQuery.data

    // Build where clause (same as main players API)
    const where: any = {
      userId: session.user.id
    }

    // Text search across multiple fields
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nationality: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Status filter
    if (status) {
      where.currentStatus = status
    }

    // Position filter
    if (position) {
      where.position = {
        contains: position,
        mode: 'insensitive'
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
      orderBy.purchaseDate = sortOrder // Fallback sort
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Fetch players with all related data
    const players = await prisma.player.findMany({
      where,
      orderBy,
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
    })

    // Transform data to include calculations
    const playersWithCalculations: PlayerWithCalculations[] = players.map(player => {
      // Calculate total profit from all sales
      const totalProfit = player.saleTransactions.reduce((sum, t) => sum + t.profitLoss, 0)
      
      // Calculate weeks owned (for sold players) or weeks owned to date (for owned players)
      const purchaseDate = new Date(player.purchaseDate)
      const endDate = player.currentStatus === 'SOLD' && player.saleTransactions.length > 0 
        ? new Date(player.saleTransactions[0].saleDate)
        : new Date()
      const weeksOwned = Math.floor((endDate.getTime() - purchaseDate.getTime()) / (7 * 24 * 60 * 60 * 1000))

      // Simple projected profit estimation (could be enhanced)
      const estimatedProfit = player.currentStatus === 'OWNED' ? totalProfit : undefined

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
          hattrickWeek: 0,
          hattrickSeason: 0
        },
        currentStatus: player.currentStatus as any,
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
        totalProfit: totalProfit !== 0 ? totalProfit : undefined,
        weeksOwned,
        estimatedProfit
      }
    })

    // Sort by projected profit if requested (after data transformation)
    if (sortBy === 'projectedProfit') {
      playersWithCalculations.sort((a, b) => {
        const profitA = a.totalProfit || a.estimatedProfit || 0
        const profitB = b.totalProfit || b.estimatedProfit || 0
        return sortOrder === 'asc' ? profitA - profitB : profitB - profitA
      })
    }

    // Format data for export
    const exportPlayers = playersWithCalculations.map(formatPlayerForCSV)
    
    // Build metadata
    const metadata = {
      userId: session.user.id,
      userEmail: session.user.email,
      totalRecords: exportPlayers.length,
      filterInfo: buildFilterInfo(parsedQuery.data)
    }

    // Generate file based on format
    let fileBuffer: Buffer
    let contentType: string
    let filename: string

    switch (format) {
      case 'csv':
        fileBuffer = await generatePlayersCSV(exportPlayers)
        contentType = 'text/csv'
        filename = getExportFilename('players', 'csv')
        break
      
      case 'json':
        const jsonContent = generatePlayersJSON(exportPlayers, metadata)
        fileBuffer = Buffer.from(jsonContent, 'utf8')
        contentType = 'application/json'
        filename = getExportFilename('players', 'json')
        break
      
      case 'pdf':
        fileBuffer = generatePlayersPDF(exportPlayers, metadata)
        contentType = 'application/pdf'
        filename = getExportFilename('players', 'pdf')
        break
      
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Return file
    return new NextResponse(fileBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error exporting players:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}