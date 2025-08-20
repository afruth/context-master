import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { calculateCurrentProjectedProfit, calculateWeeksOwned, calculatePercentageKept, calculateSalaryCostForPeriod } from '@/lib/calculations'
import type { SalaryHistory } from '@/types/hattrick'

// Helper function to transform Prisma data to our types
function transformSalaryHistory(prismaHistory: any[]): SalaryHistory[] {
  return prismaHistory.map(history => ({
    ...history,
    endDate: history.endDate ?? undefined
  }))
}

// Helper function to transform Prisma player data to our Player type
function transformPrismaPlayer(prismaPlayer: any) {
  return {
    id: prismaPlayer.id,
    name: prismaPlayer.name,
    age: { years: prismaPlayer.ageYears, days: prismaPlayer.ageDays },
    position: prismaPlayer.position,
    nationality: prismaPlayer.nationality,
    speciality: prismaPlayer.speciality ?? undefined,
    form: prismaPlayer.form,
    stamina: prismaPlayer.stamina,
    skills: {
      keeper: prismaPlayer.keeper ?? undefined,
      defending: prismaPlayer.defending ?? undefined,
      playmaking: prismaPlayer.playmaking ?? undefined,
      winger: prismaPlayer.winger ?? undefined,
      passing: prismaPlayer.passing ?? undefined,
      scoring: prismaPlayer.scoring ?? undefined,
      setPieces: prismaPlayer.setPieces ?? undefined
    },
    purchaseDetails: {
      date: prismaPlayer.purchaseDate,
      price: prismaPlayer.purchasePrice,
      fromTeam: prismaPlayer.fromTeam ?? undefined,
      hattrickWeek: 1, // Would need proper calculation
      hattrickSeason: 1 // Would need proper calculation
    },
    currentStatus: prismaPlayer.currentStatus as any,
    userId: prismaPlayer.userId,
    createdAt: prismaPlayer.createdAt,
    updatedAt: prismaPlayer.updatedAt
  }
}

// Validation schema for projection query parameters
const ProjectionQuerySchema = z.object({
  projectedSaleValue: z.string().optional(),
  projectionDate: z.string().datetime().optional(),
  includeScenarios: z.string().optional().default('true')
})

// Route parameters schema
const RouteParamsSchema = z.object({
  playerId: z.string().cuid()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate route parameters
    const resolvedParams = await params
    const { playerId } = RouteParamsSchema.parse(resolvedParams)

    const { searchParams } = new URL(request.url)
    const query = ProjectionQuerySchema.parse({
      projectedSaleValue: searchParams.get('projectedSaleValue') || undefined,
      projectionDate: searchParams.get('projectionDate') || undefined,
      includeScenarios: searchParams.get('includeScenarios') || 'true'
    })

    const projectionDate = query.projectionDate ? new Date(query.projectionDate) : new Date()
    const projectedSaleValue = query.projectedSaleValue ? parseInt(query.projectedSaleValue) : undefined
    const includeScenarios = query.includeScenarios === 'true'

    // Get player with salary history
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
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

    // Validate projection date
    if (projectionDate < player.purchaseDate) {
      return NextResponse.json(
        { error: 'Projection date cannot be before purchase date' },
        { status: 400 }
      )
    }

    // Calculate current ownership metrics
    const weeksOwnedResult = calculateWeeksOwned({
      purchaseDate: player.purchaseDate,
      saleDate: projectionDate
    })

    const percentageResult = calculatePercentageKept({
      weeksOwned: weeksOwnedResult.weeksOwned
    })

    // Calculate total salary cost to projection date
    const totalSalaryCost = calculateSalaryCostForPeriod(
      transformSalaryHistory(player.salaryHistory),
      player.purchaseDate,
      projectionDate
    )

    // Use provided sale value or estimate based on purchase price
    const estimatedSaleValue = projectedSaleValue || Math.round(player.purchasePrice * 1.15)

    // Calculate projected profit using the calculations module
    const transformedPlayer = transformPrismaPlayer(player)
    const projectedProfit = calculateCurrentProjectedProfit({
      player: transformedPlayer,
      currentDate: projectionDate,
      projectedSaleValue: estimatedSaleValue,
      salaryHistory: transformSalaryHistory(player.salaryHistory)
    })

    // Calculate additional projection metrics
    const roi = player.purchasePrice > 0 
      ? (projectedProfit.projectedProfit / player.purchasePrice) * 100 
      : 0

    const profitPerWeek = weeksOwnedResult.weeksOwned > 0 
      ? projectedProfit.projectedProfit / weeksOwnedResult.weeksOwned 
      : 0

    // Build base response
    const baseProjection = {
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      nationality: player.nationality,
      purchaseDate: player.purchaseDate,
      purchasePrice: player.purchasePrice,
      projectionDate,
      ownership: {
        weeksOwned: weeksOwnedResult.weeksOwned,
        daysOwned: weeksOwnedResult.daysOwned,
        currentPercentageKept: percentageResult.percentageKept,
        isAtMaxPercentage: percentageResult.isMaximum,
        weeksToMaxPercentage: percentageResult.weeksToMaximum
      },
      costs: {
        totalSalaryCost: Math.round(totalSalaryCost),
        averageWeeklyCost: weeksOwnedResult.weeksOwned > 0 
          ? Math.round(totalSalaryCost / weeksOwnedResult.weeksOwned) 
          : 0
      },
      projection: {
        estimatedSaleValue,
        projectedNetSaleValue: projectedProfit.projectedNetSaleValue,
        projectedProfit: projectedProfit.projectedProfit,
        roi: Math.round(roi * 100) / 100,
        profitPerWeek: Math.round(profitPerWeek * 100) / 100,
        confidenceLevel: projectedProfit.confidenceLevel
      }
    }

    // Generate scenario analysis if requested
    let scenarios: any[] = []
    if (includeScenarios) {
      const scenarioValues = [
        { label: 'Conservative (-10%)', multiplier: 0.9 },
        { label: 'Current Estimate', multiplier: 1.0 },
        { label: 'Optimistic (+15%)', multiplier: 1.15 },
        { label: 'Best Case (+30%)', multiplier: 1.3 }
      ]

      for (const scenario of scenarioValues) {
        const scenarioSaleValue = Math.round(estimatedSaleValue * scenario.multiplier)
        
        try {
          const scenarioProjection = calculateCurrentProjectedProfit({
            player: transformedPlayer,
            currentDate: projectionDate,
            projectedSaleValue: scenarioSaleValue,
            salaryHistory: transformSalaryHistory(player.salaryHistory)
          })

          const scenarioRoi = player.purchasePrice > 0 
            ? (scenarioProjection.projectedProfit / player.purchasePrice) * 100 
            : 0

          scenarios.push({
            scenario: scenario.label,
            saleValue: scenarioSaleValue,
            netSaleValue: scenarioProjection.projectedNetSaleValue,
            profit: scenarioProjection.projectedProfit,
            roi: Math.round(scenarioRoi * 100) / 100
          })
        } catch (error) {
          console.error(`Error calculating scenario ${scenario.label}:`, error)
        }
      }

      // Add time-based scenarios (sell now vs wait for max percentage)
      if (!percentageResult.isMaximum && percentageResult.weeksToMaximum) {
        const maxPercentageDate = new Date(projectionDate)
        maxPercentageDate.setDate(maxPercentageDate.getDate() + (percentageResult.weeksToMaximum * 7))
        
        try {
          const maxPercentageWeeksOwned = calculateWeeksOwned({
            purchaseDate: player.purchaseDate,
            saleDate: maxPercentageDate
          }).weeksOwned

          const maxPercentageSalaryCost = calculateSalaryCostForPeriod(
            transformSalaryHistory(player.salaryHistory),
            player.purchaseDate,
            maxPercentageDate
          )

          const maxPercentageProjection = calculateCurrentProjectedProfit({
            player: transformedPlayer,
            currentDate: maxPercentageDate,
            projectedSaleValue: estimatedSaleValue,
            salaryHistory: transformSalaryHistory(player.salaryHistory)
          })

          scenarios.push({
            scenario: 'Wait for Max % (93%)',
            saleDate: maxPercentageDate,
            weeksOwned: maxPercentageWeeksOwned,
            percentageKept: 93,
            additionalSalaryCost: Math.round(maxPercentageSalaryCost - totalSalaryCost),
            saleValue: estimatedSaleValue,
            netSaleValue: maxPercentageProjection.projectedNetSaleValue,
            profit: maxPercentageProjection.projectedProfit,
            roi: player.purchasePrice > 0 
              ? Math.round((maxPercentageProjection.projectedProfit / player.purchasePrice) * 10000) / 100
              : 0
          })
        } catch (error) {
          console.error('Error calculating max percentage scenario:', error)
        }
      }
    }

    const response = {
      data: {
        ...baseProjection,
        ...(includeScenarios && { scenarios })
      },
      message: 'Player projection calculated successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error calculating player projection:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
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