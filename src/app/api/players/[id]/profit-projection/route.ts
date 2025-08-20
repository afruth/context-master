import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { PlayerStatus } from '@/types/hattrick'
import { 
  calculateCurrentProjectedProfit,
  calculateWeeksOwned,
  calculatePercentageKept,
  calculateSalaryCostForPeriod
} from '@/lib/calculations'

// Validation schema for query parameters
const profitProjectionQuerySchema = z.object({
  projectedSaleValue: z.string().transform(Number).refine(n => n >= 0, 'Projected sale value must be positive').optional(),
  futureWeeks: z.string().transform(Number).refine(n => n >= 0 && n <= 52, 'Future weeks must be between 0 and 52').default(() => 0)
})

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/players/[id]/profit-projection - Calculate current profit projection for an owned player
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
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)
    
    // Parse and validate query parameters
    const parsedQuery = profitProjectionQuerySchema.safeParse(queryParams)
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.issues },
        { status: 400 }
      )
    }

    const { projectedSaleValue, futureWeeks } = parsedQuery.data

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

    // Only calculate projections for owned players
    if (player.currentStatus !== 'OWNED') {
      return NextResponse.json({ 
        error: 'Profit projections are only available for owned players' 
      }, { status: 400 })
    }

    const currentDate = new Date()
    const futureDate = new Date(currentDate.getTime() + (futureWeeks * 7 * 24 * 60 * 60 * 1000))

    // Calculate current ownership duration
    const currentWeeksOwned = calculateWeeksOwned({
      purchaseDate: player.purchaseDate,
      saleDate: currentDate
    })

    // Calculate future ownership duration
    const futureWeeksOwned = calculateWeeksOwned({
      purchaseDate: player.purchaseDate,
      saleDate: futureDate
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

    // Create player object for calculations
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

    // Calculate current projected profit
    const currentProjection = calculateCurrentProjectedProfit({
      player: playerForCalculation,
      currentDate,
      projectedSaleValue,
      salaryHistory
    })

    // Calculate future projected profit if futureWeeks > 0
    let futureProjection = null
    if (futureWeeks > 0) {
      // Get the latest salary for future cost calculation
      const latestSalary = salaryHistory.find(sh => !sh.endDate || sh.endDate > currentDate)
      const weeklyPay = latestSalary ? latestSalary.weeklyPay : 0

      // Calculate percentage kept for future sale
      const futurePercentageKept = calculatePercentageKept({
        weeksOwned: futureWeeksOwned.weeksOwned
      })

      // Calculate additional salary cost for future weeks
      const additionalSalaryCost = weeklyPay * futureWeeks

      // Calculate future net sale value
      const estimatedSaleValue = projectedSaleValue || (player.purchasePrice * 1.1)
      const futureNetSaleValue = estimatedSaleValue * (futurePercentageKept.percentageKept / 100)
      
      // Calculate future total salary cost
      const futureTotalSalaryCost = currentProjection.totalSalaryCostToDate + additionalSalaryCost
      
      // Calculate future projected profit
      const futureProjectedProfit = futureNetSaleValue - futureTotalSalaryCost - player.purchasePrice

      futureProjection = {
        projectedProfit: Math.round(futureProjectedProfit),
        percentageKept: futurePercentageKept.percentageKept,
        projectedSaleValue: Math.round(estimatedSaleValue),
        totalSalaryCost: Math.round(futureTotalSalaryCost),
        projectedNetSaleValue: Math.round(futureNetSaleValue),
        weeksOwned: futureWeeksOwned.weeksOwned,
        additionalSalaryCost: Math.round(additionalSalaryCost),
        weeklyPay,
        isMaximumPercentage: futurePercentageKept.isMaximum,
        weeksToMaximum: futurePercentageKept.weeksToMaximum
      }
    }

    // Calculate current percentage kept
    const currentPercentageKept = calculatePercentageKept({
      weeksOwned: currentWeeksOwned.weeksOwned
    })

    const response = {
      playerId: player.id,
      playerName: player.name,
      currentStatus: player.currentStatus,
      purchasePrice: player.purchasePrice,
      purchaseDate: player.purchaseDate,
      weeksOwned: currentWeeksOwned.weeksOwned,
      daysOwned: currentWeeksOwned.daysOwned,
      currentPercentageKept: currentPercentageKept.percentageKept,
      isMaximumPercentage: currentPercentageKept.isMaximum,
      weeksToMaximum: currentPercentageKept.weeksToMaximum,
      currentProjection,
      futureProjection,
      calculations: {
        currentWeeksOwned: currentWeeksOwned.weeksOwned,
        futureWeeksOwned: futureWeeks > 0 ? futureWeeksOwned.weeksOwned : null,
        salaryHistoryCount: salaryHistory.length,
        hasActiveSalary: salaryHistory.some(sh => !sh.endDate || sh.endDate > currentDate)
      }
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Error calculating profit projection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}