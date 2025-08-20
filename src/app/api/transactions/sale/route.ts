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

// Validation schema for sale transaction
const CreateSaleTransactionSchema = z.object({
  playerId: z.string().cuid(),
  saleDate: z.string().datetime(),
  salePrice: z.number().positive().int(),
  percentageKept: z.number().min(0).max(93).optional(),
  toTeam: z.string().optional(),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = CreateSaleTransactionSchema.parse(body)

    const saleDate = new Date(data.saleDate)

    // Verify player ownership and get player with salary history
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

    // Validate sale date is after purchase date
    if (saleDate <= player.purchaseDate) {
      return NextResponse.json(
        { error: 'Sale date must be after purchase date' },
        { status: 400 }
      )
    }

    // Calculate weeks owned
    const weeksOwnedResult = calculateWeeksOwned({
      purchaseDate: player.purchaseDate,
      saleDate
    })

    // Calculate percentage kept (auto-calculate if not provided)
    let percentageKept = data.percentageKept
    if (percentageKept === undefined) {
      const percentageResult = calculatePercentageKept({
        weeksOwned: weeksOwnedResult.weeksOwned
      })
      percentageKept = percentageResult.percentageKept
    }

    // Calculate total salary cost for the ownership period
    const totalSalaryCost = calculateSalaryCostForPeriod(
      transformSalaryHistory(player.salaryHistory),
      player.purchaseDate,
      saleDate
    )

    // Calculate average weekly expenses for profit calculation
    const averageWeeklyExpenses = weeksOwnedResult.weeksOwned > 0 
      ? totalSalaryCost / weeksOwnedResult.weeksOwned 
      : 0

    // Calculate profit/loss using business logic
    const profitResult = calculateProfit({
      saleValue: data.salePrice,
      percentageKept,
      weeklyExpenses: averageWeeklyExpenses,
      weeksOwned: weeksOwnedResult.weeksOwned,
      purchaseValue: player.purchasePrice
    })

    // Execute sale transaction with database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the sale transaction record
      const saleTransaction = await tx.saleTransaction.create({
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
              purchasePrice: true,
              ageYears: true,
              ageDays: true
            }
          }
        }
      })

      // Update player status to SOLD
      await tx.player.update({
        where: { id: data.playerId },
        data: { 
          currentStatus: 'SOLD'
        }
      })

      // End any open salary history records at sale date
      await tx.salaryHistory.updateMany({
        where: {
          playerId: data.playerId,
          endDate: null
        },
        data: {
          endDate: saleDate
        }
      })

      return saleTransaction
    })

    // Return comprehensive response with calculated values
    return NextResponse.json({
      data: {
        transaction: result,
        calculations: {
          weeksOwned: weeksOwnedResult.weeksOwned,
          daysOwned: weeksOwnedResult.daysOwned,
          percentageKept,
          totalSalaryCost: Math.round(totalSalaryCost),
          profit: profitResult.profit,
          profitMargin: profitResult.profitMargin,
          netSaleValue: profitResult.netSaleValue
        }
      },
      message: 'Player sold successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error recording sale transaction:', error)
    
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