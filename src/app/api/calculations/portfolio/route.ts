import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { calculateCurrentProjectedProfit, calculateWeeksOwned, calculateSalaryCostForPeriod } from '@/lib/calculations'
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

// Validation schema for portfolio query parameters
const PortfolioQuerySchema = z.object({
  includeProjections: z.string().optional().default('true'),
  asOfDate: z.string().datetime().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = PortfolioQuerySchema.parse({
      includeProjections: searchParams.get('includeProjections') || 'true',
      asOfDate: searchParams.get('asOfDate') || undefined
    })

    const includeProjections = query.includeProjections === 'true'
    const asOfDate = query.asOfDate ? new Date(query.asOfDate) : new Date()

    // Get all players for the user
    const [ownedPlayers, soldPlayers, allTransactions] = await Promise.all([
      // Currently owned players
      prisma.player.findMany({
        where: {
          userId: session.user.id,
          currentStatus: 'OWNED'
        },
        include: {
          salaryHistory: {
            orderBy: {
              startDate: 'asc'
            }
          }
        },
        orderBy: {
          purchaseDate: 'desc'
        }
      }),
      
      // Previously sold players
      prisma.player.findMany({
        where: {
          userId: session.user.id,
          currentStatus: 'SOLD'
        },
        include: {
          saleTransactions: {
            orderBy: {
              saleDate: 'desc'
            },
            take: 1
          },
          salaryHistory: {
            orderBy: {
              startDate: 'asc'
            }
          }
        },
        orderBy: {
          purchaseDate: 'desc'
        }
      }),
      
      // All sale transactions for summary
      prisma.saleTransaction.findMany({
        where: {
          player: {
            userId: session.user.id
          }
        },
        include: {
          player: {
            select: {
              purchasePrice: true,
              purchaseDate: true
            }
          }
        }
      })
    ])

    // Calculate portfolio summary metrics
    const totalOwnedPlayers = ownedPlayers.length
    const totalSoldPlayers = soldPlayers.length
    const totalPlayers = totalOwnedPlayers + totalSoldPlayers

    // Calculate total investment (all purchased players)
    const totalInvestment = ownedPlayers.reduce((sum, player) => sum + player.purchasePrice, 0) +
                           soldPlayers.reduce((sum, player) => sum + player.purchasePrice, 0)

    // Calculate realized returns and profit from sold players
    const realizedReturns = allTransactions.reduce((sum, transaction) => {
      const netSaleValue = transaction.salePrice * (transaction.percentageKept / 100)
      return sum + netSaleValue
    }, 0)

    const realizedProfit = allTransactions.reduce((sum, transaction) => sum + transaction.profitLoss, 0)

    // Calculate current portfolio value and projections for owned players
    let currentPortfolioValue = 0
    let projectedTotalProfit = realizedProfit
    const playerProjections: any[] = []

    if (includeProjections) {
      for (const player of ownedPlayers) {
        try {
          // Calculate current holding period
          const weeksOwnedResult = calculateWeeksOwned({
            purchaseDate: player.purchaseDate,
            saleDate: asOfDate
          })

          // Calculate current salary costs
          const currentSalaryCost = calculateSalaryCostForPeriod(
            transformSalaryHistory(player.salaryHistory),
            player.purchaseDate,
            asOfDate
          )

          // Estimate current value (using purchase price + 10% as default projection)
          const estimatedCurrentValue = Math.round(player.purchasePrice * 1.1)
          currentPortfolioValue += estimatedCurrentValue

          // Calculate projected profit using current value as sale price
          const transformedPlayer = transformPrismaPlayer(player)
          const projectedProfit = calculateCurrentProjectedProfit({
            player: transformedPlayer,
            currentDate: asOfDate,
            projectedSaleValue: estimatedCurrentValue,
            salaryHistory: transformSalaryHistory(player.salaryHistory)
          })

          projectedTotalProfit += projectedProfit.projectedProfit

          playerProjections.push({
            playerId: player.id,
            playerName: player.name,
            position: player.position,
            purchasePrice: player.purchasePrice,
            purchaseDate: player.purchaseDate,
            weeksOwned: weeksOwnedResult.weeksOwned,
            currentSalaryCost: Math.round(currentSalaryCost),
            estimatedCurrentValue,
            projectedProfit: projectedProfit.projectedProfit,
            currentPercentageKept: projectedProfit.currentPercentageKept,
            confidenceLevel: projectedProfit.confidenceLevel
          })

        } catch (error) {
          console.error(`Error calculating projection for player ${player.id}:`, error)
          // Add player to portfolio value with purchase price as fallback
          currentPortfolioValue += player.purchasePrice
          
          playerProjections.push({
            playerId: player.id,
            playerName: player.name,
            position: player.position,
            purchasePrice: player.purchasePrice,
            purchaseDate: player.purchaseDate,
            estimatedCurrentValue: player.purchasePrice,
            projectedProfit: 0,
            error: 'Unable to calculate projection'
          })
        }
      }
    } else {
      // Simple portfolio value calculation without detailed projections
      currentPortfolioValue = ownedPlayers.reduce((sum, player) => sum + player.purchasePrice, 0)
    }

    // Calculate performance metrics
    const totalPortfolioValue = realizedReturns + currentPortfolioValue
    const totalProfit = realizedProfit + (projectedTotalProfit - realizedProfit)
    const overallProfitMargin = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0

    // Calculate average holding period for sold players
    const averageHoldingPeriod = soldPlayers.length > 0 
      ? soldPlayers.reduce((sum, player) => {
          const lastSale = player.saleTransactions[0]
          if (lastSale) {
            const weeksOwned = calculateWeeksOwned({
              purchaseDate: player.purchaseDate,
              saleDate: lastSale.saleDate
            }).weeksOwned
            return sum + weeksOwned
          }
          return sum
        }, 0) / soldPlayers.length
      : 0

    // Calculate success rate (profitable transactions vs total transactions)
    const profitableTransactions = allTransactions.filter(t => t.profitLoss > 0).length
    const successRate = allTransactions.length > 0 
      ? (profitableTransactions / allTransactions.length) * 100 
      : 0

    const response = {
      data: {
        summary: {
          totalPlayers,
          ownedPlayers: totalOwnedPlayers,
          soldPlayers: totalSoldPlayers,
          totalInvestment: Math.round(totalInvestment),
          realizedReturns: Math.round(realizedReturns),
          currentPortfolioValue: Math.round(currentPortfolioValue),
          totalPortfolioValue: Math.round(totalPortfolioValue),
          realizedProfit: Math.round(realizedProfit),
          projectedTotalProfit: Math.round(projectedTotalProfit),
          overallProfitMargin: Math.round(overallProfitMargin * 100) / 100,
          averageHoldingPeriod: Math.round(averageHoldingPeriod * 100) / 100,
          successRate: Math.round(successRate * 100) / 100,
          totalTransactions: allTransactions.length,
          profitableTransactions
        },
        breakdown: {
          owned: {
            count: totalOwnedPlayers,
            totalInvestment: Math.round(ownedPlayers.reduce((sum, p) => sum + p.purchasePrice, 0)),
            estimatedValue: Math.round(currentPortfolioValue),
            projectedProfit: Math.round(projectedTotalProfit - realizedProfit)
          },
          sold: {
            count: totalSoldPlayers,
            totalInvestment: Math.round(soldPlayers.reduce((sum, p) => sum + p.purchasePrice, 0)),
            totalReturns: Math.round(realizedReturns),
            totalProfit: Math.round(realizedProfit)
          }
        },
        ...(includeProjections && {
          playerProjections: playerProjections.sort((a, b) => b.projectedProfit - a.projectedProfit)
        }),
        asOfDate
      },
      message: 'Portfolio summary calculated successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error calculating portfolio summary:', error)
    
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