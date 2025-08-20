import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import type { SearchParams, SearchResult, PlayerStatus } from '@/types/hattrick'

// Validation schema
const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['players', 'transactions', 'all']).default('all'),
  limit: z.string().transform(Number).refine(n => n >= 1 && n <= 50, 'Limit must be between 1 and 50').default(() => 10)
})

/**
 * GET /api/search - Global search across players and transactions with autocomplete functionality
 * 
 * @param query - Search query string (required)
 * @param type - Search type: 'players', 'transactions', 'all' (default: 'all')
 * @param limit - Maximum results per category (default: 10, max: 50)
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
    const parsedQuery = SearchQuerySchema.safeParse(queryParams)
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.issues },
        { status: 400 }
      )
    }

    const { query, type, limit } = parsedQuery.data

    const searchResult: SearchResult = {
      players: [],
      transactions: [],
      totalResults: 0
    }

    // Search players if requested
    if (type === 'players' || type === 'all') {
      const players = await prisma.player.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { nationality: { contains: query, mode: 'insensitive' } },
            { position: { contains: query, mode: 'insensitive' } },
            { speciality: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: {
          name: 'asc'
        },
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

      // Transform players to match our interface
      searchResult.players = players.map(player => ({
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
    }

    // Search transactions if requested
    if (type === 'transactions' || type === 'all') {
      const transactions = await prisma.saleTransaction.findMany({
        where: {
          player: {
            userId: session.user.id,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { position: { contains: query, mode: 'insensitive' } },
              { nationality: { contains: query, mode: 'insensitive' } }
            ]
          }
        },
        take: limit,
        orderBy: {
          saleDate: 'desc'
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

      // Transform transactions to match our interface
      searchResult.transactions = transactions.map(transaction => ({
        id: transaction.id,
        playerId: transaction.playerId,
        saleDate: transaction.saleDate,
        salePrice: transaction.salePrice,
        percentageKept: transaction.percentageKept,
        toTeam: transaction.toTeam || undefined,
        notes: transaction.notes || undefined,
        hattrickWeek: 0, // TODO: Calculate from date
        hattrickSeason: 0, // TODO: Calculate from date
        profitLoss: transaction.profitLoss
      }))
    }

    searchResult.totalResults = searchResult.players.length + searchResult.transactions.length

    return NextResponse.json(searchResult)
  } catch (error) {
    console.error('Error performing search:', error)
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