import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { PlayerStatus } from '@/types/hattrick'
import { 
  calculateCurrentProjectedProfit,
  calculateWeeksOwned,
  calculateAgeProgression
} from '@/lib/calculations'

// Validation schemas
const updatePlayerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  ageYears: z.number().int().min(15).max(45).optional(),
  ageDays: z.number().int().min(0).max(111).optional(),
  position: z.string().min(1).optional(),
  nationality: z.string().min(1).optional(),
  speciality: z.string().optional(),
  form: z.number().int().min(1).max(20).optional(),
  stamina: z.number().int().min(1).max(20).optional(),
  keeper: z.number().int().min(0).max(20).optional(),
  defending: z.number().int().min(0).max(20).optional(),
  playmaking: z.number().int().min(0).max(20).optional(),
  winger: z.number().int().min(0).max(20).optional(),
  passing: z.number().int().min(0).max(20).optional(),
  scoring: z.number().int().min(0).max(20).optional(),
  setPieces: z.number().int().min(0).max(20).optional(),
  purchaseDate: z.string().transform((str) => new Date(str)).optional(),
  purchasePrice: z.number().int().min(0).optional(),
  fromTeam: z.string().optional(),
  currentStatus: z.enum(['OWNED', 'SOLD', 'TRANSFERRED']).optional()
})

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/players/[id] - Get player details with calculated projections
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Fetch player with all related data
    const player = await prisma.player.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        saleTransactions: {
          orderBy: { saleDate: 'desc' }
        },
        salaryHistory: {
          orderBy: { startDate: 'desc' }
        }
      }
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Calculate additional data
    const currentDate = new Date()
    const weeksOwned = calculateWeeksOwned({
      purchaseDate: player.purchaseDate,
      saleDate: currentDate
    })

    const ageProgression = calculateAgeProgression({
      initialAge: { years: player.ageYears, days: player.ageDays },
      daysOwned: weeksOwned.daysOwned
    })

    // Transform salary history for calculations
    const salaryHistory = player.salaryHistory.map(sh => ({
      id: sh.id,
      playerId: sh.playerId,
      weeklyPay: sh.weeklyPay,
      startDate: sh.startDate,
      endDate: sh.endDate || undefined,
      createdAt: sh.createdAt,
      updatedAt: sh.updatedAt
    }))

    // Calculate projected profit if player is still owned
    let projectedProfit = null
    if (player.currentStatus === 'OWNED') {
      const playerForCalculation = {
        id: player.id,
        name: player.name,
        age: { years: player.ageYears, days: player.ageDays },
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
        updatedAt: player.updatedAt
      }

      try {
        projectedProfit = calculateCurrentProjectedProfit({
          player: playerForCalculation,
          currentDate,
          salaryHistory
        })
      } catch (error) {
        console.warn('Could not calculate projected profit:', error)
      }
    }

    // Transform response
    const transformedPlayer = {
      id: player.id,
      name: player.name,
      age: ageProgression.currentAge,
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
      salaryHistory,
      // Additional calculated fields
      weeksOwned: weeksOwned.weeksOwned,
      daysOwned: weeksOwned.daysOwned,
      currentAge: ageProgression.currentAge,
      ageProgression,
      projectedProfit
    }

    return NextResponse.json({ data: transformedPlayer })
  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/players/[id] - Update player information
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const validationResult = updatePlayerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if player exists and belongs to user
    const existingPlayer = await prisma.player.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingPlayer) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Update player
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.ageYears !== undefined && { ageYears: data.ageYears }),
        ...(data.ageDays !== undefined && { ageDays: data.ageDays }),
        ...(data.position && { position: data.position }),
        ...(data.nationality && { nationality: data.nationality }),
        ...(data.speciality !== undefined && { speciality: data.speciality }),
        ...(data.form !== undefined && { form: data.form }),
        ...(data.stamina !== undefined && { stamina: data.stamina }),
        ...(data.keeper !== undefined && { keeper: data.keeper }),
        ...(data.defending !== undefined && { defending: data.defending }),
        ...(data.playmaking !== undefined && { playmaking: data.playmaking }),
        ...(data.winger !== undefined && { winger: data.winger }),
        ...(data.passing !== undefined && { passing: data.passing }),
        ...(data.scoring !== undefined && { scoring: data.scoring }),
        ...(data.setPieces !== undefined && { setPieces: data.setPieces }),
        ...(data.purchaseDate && { purchaseDate: data.purchaseDate }),
        ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
        ...(data.fromTeam !== undefined && { fromTeam: data.fromTeam }),
        ...(data.currentStatus && { currentStatus: data.currentStatus })
      },
      include: {
        saleTransactions: true,
        salaryHistory: true
      }
    })

    // Transform response
    const transformedPlayer = {
      id: updatedPlayer.id,
      name: updatedPlayer.name,
      age: {
        years: updatedPlayer.ageYears,
        days: updatedPlayer.ageDays
      },
      position: updatedPlayer.position,
      nationality: updatedPlayer.nationality,
      speciality: updatedPlayer.speciality || undefined,
      form: updatedPlayer.form,
      stamina: updatedPlayer.stamina,
      skills: {
        keeper: updatedPlayer.keeper || undefined,
        defending: updatedPlayer.defending || undefined,
        playmaking: updatedPlayer.playmaking || undefined,
        winger: updatedPlayer.winger || undefined,
        passing: updatedPlayer.passing || undefined,
        scoring: updatedPlayer.scoring || undefined,
        setPieces: updatedPlayer.setPieces || undefined
      },
      purchaseDetails: {
        date: updatedPlayer.purchaseDate,
        price: updatedPlayer.purchasePrice,
        fromTeam: updatedPlayer.fromTeam || undefined,
        hattrickWeek: 0, // TODO: Calculate from date
        hattrickSeason: 0 // TODO: Calculate from date
      },
      currentStatus: updatedPlayer.currentStatus as PlayerStatus,
      userId: updatedPlayer.userId,
      createdAt: updatedPlayer.createdAt,
      updatedAt: updatedPlayer.updatedAt,
      saleTransactions: updatedPlayer.saleTransactions,
      salaryHistory: updatedPlayer.salaryHistory.map(sh => ({
        ...sh,
        endDate: sh.endDate || undefined,
        createdAt: sh.createdAt,
        updatedAt: sh.updatedAt
      }))
    }

    return NextResponse.json({
      data: transformedPlayer,
      message: 'Player updated successfully'
    })
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/players/[id] - Delete player
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if player exists and belongs to user
    const existingPlayer = await prisma.player.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingPlayer) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Delete player (cascade will handle related records)
    await prisma.player.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Player deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting player:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}