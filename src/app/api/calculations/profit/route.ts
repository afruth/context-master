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

// Validation schema for profit calculation request
const ProfitCalculationSchema = z.object({
  playerId: z.string().cuid(),
  hypotheticalSalePrice: z.number().positive().int(),
  hypotheticalSaleDate: z.string().datetime().optional(),
  customPercentageKept: z.number().min(0).max(95).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = ProfitCalculationSchema.parse(body)

    // Use provided sale date or current date
    const hypotheticalSaleDate = data.hypotheticalSaleDate 
      ? new Date(data.hypotheticalSaleDate)
      : new Date()

    // Verify player ownership
    const player = await prisma.player.findFirst({
      where: {
        id: data.playerId,
        userId: session.user.id,
        currentStatus: 'OWNED'
      },
      include: {
        salaryHistory: {
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found or not owned by user' },
        { status: 404 }
      )
    }

    // Validate hypothetical sale date
    if (hypotheticalSaleDate <= player.purchaseDate) {
      return NextResponse.json(
        { error: 'Hypothetical sale date must be after purchase date' },
        { status: 400 }
      )
    }

    // Calculate weeks owned for hypothetical sale
    const weeksOwnedResult = calculateWeeksOwned({
      purchaseDate: player.purchaseDate,
      saleDate: hypotheticalSaleDate
    })

    // Calculate percentage kept (use custom or calculate based on ownership time)
    let percentageKept = data.customPercentageKept
    if (percentageKept === undefined) {
      const percentageResult = calculatePercentageKept({
        daysOwned: weeksOwnedResult.daysOwned
      })
      percentageKept = percentageResult.percentageKept
    }

    // Calculate total salary cost for the hypothetical ownership period
    const totalSalaryCost = calculateSalaryCostForPeriod(
      transformSalaryHistory(player.salaryHistory),
      player.purchaseDate,
      hypotheticalSaleDate
    )

    // Calculate average weekly expenses
    const averageWeeklyExpenses = weeksOwnedResult.weeksOwned > 0 
      ? totalSalaryCost / weeksOwnedResult.weeksOwned 
      : 0

    // Calculate hypothetical profit using business logic
    const profitResult = calculateProfit({
      saleValue: data.hypotheticalSalePrice,
      percentageKept,
      weeklyExpenses: averageWeeklyExpenses,
      weeksOwned: weeksOwnedResult.weeksOwned,
      purchaseValue: player.purchasePrice
    })

    // Calculate additional metrics for comprehensive analysis
    const roi = player.purchasePrice > 0 
      ? (profitResult.profit / player.purchasePrice) * 100 
      : 0

    const profitPerWeek = weeksOwnedResult.weeksOwned > 0 
      ? profitResult.profit / weeksOwnedResult.weeksOwned 
      : 0

    // Get percentage progression info
    const percentageProgressResult = calculatePercentageKept({
      daysOwned: weeksOwnedResult.daysOwned
    })

    const response = {
      data: {
        playerId: player.id,
        playerName: player.name,
        purchasePrice: player.purchasePrice,
        purchaseDate: player.purchaseDate,
        hypotheticalSalePrice: data.hypotheticalSalePrice,
        hypotheticalSaleDate,
        calculation: {
          weeksOwned: weeksOwnedResult.weeksOwned,
          daysOwned: weeksOwnedResult.daysOwned,
          percentageKept,
          totalSalaryCost: Math.round(totalSalaryCost),
          averageWeeklyExpenses: Math.round(averageWeeklyExpenses),
          netSaleValue: profitResult.netSaleValue,
          profit: profitResult.profit,
          profitMargin: profitResult.profitMargin,
          roi: Math.round(roi * 100) / 100,
          profitPerWeek: Math.round(profitPerWeek * 100) / 100
        },
        percentageProgress: {
          current: percentageProgressResult.percentageKept,
          isMaximum: percentageProgressResult.isMaximum,
          weeksToMaximum: percentageProgressResult.weeksToMaximum
        },
        scenarios: {
          // Show what would happen if sold today vs at maximum percentage
          currentDate: {
            weeksOwned: calculateWeeksOwned({
              purchaseDate: player.purchaseDate,
              saleDate: new Date()
            }).weeksOwned,
            percentageKept: calculatePercentageKept({
              daysOwned: calculateWeeksOwned({
                purchaseDate: player.purchaseDate,
                saleDate: new Date()
              }).daysOwned
            }).percentageKept
          }
        }
      },
      message: 'Profit calculation completed'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error calculating profit:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    // Handle specific calculation errors
    if (error instanceof Error && error.message.includes('must be')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}