import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { 
  generatePortfolioJSON, 
  generatePortfolioPDF,
  getExportFilename
} from '@/lib/export'
import type { 
  PortfolioSummary, 
  MonthlyProfitData,
  PositionStats
} from '@/types/hattrick'

const exportPortfolioQuerySchema = z.object({
  // Export format
  format: z.enum(['json', 'pdf']).default('json'),
  
  // Date range for analysis
  dateFrom: z.string().transform((str) => new Date(str)).optional(),
  dateTo: z.string().transform((str) => new Date(str)).optional()
})

/**
 * GET /api/export/portfolio - Export portfolio summary with analytics
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
    const parsedQuery = exportPortfolioQuerySchema.safeParse(queryParams)
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.issues },
        { status: 400 }
      )
    }

    const { format, dateFrom, dateTo } = parsedQuery.data

    // Build date filters for transactions
    const transactionDateFilter: any = {}
    if (dateFrom || dateTo) {
      if (dateFrom) transactionDateFilter.gte = dateFrom
      if (dateTo) transactionDateFilter.lte = dateTo
    }

    // Fetch all players for the user
    const [allPlayers, allTransactions] = await Promise.all([
      prisma.player.findMany({
        where: { userId: session.user.id },
        include: {
          saleTransactions: {
            where: Object.keys(transactionDateFilter).length > 0 
              ? { saleDate: transactionDateFilter }
              : undefined
          }
        }
      }),
      prisma.saleTransaction.findMany({
        where: {
          player: { userId: session.user.id },
          ...(Object.keys(transactionDateFilter).length > 0 
            ? { saleDate: transactionDateFilter }
            : {})
        },
        include: {
          player: {
            select: {
              name: true,
              position: true,
              nationality: true,
              purchaseDate: true,
              purchasePrice: true
            }
          }
        }
      })
    ])

    // Calculate portfolio summary
    const ownedPlayers = allPlayers.filter(p => p.currentStatus === 'OWNED')
    const soldPlayers = allPlayers.filter(p => p.currentStatus === 'SOLD')
    
    const totalInvestment = allPlayers.reduce((sum, p) => sum + p.purchasePrice, 0)
    const totalReturns = allTransactions.reduce((sum, t) => sum + t.salePrice, 0)
    const totalProfit = allTransactions.reduce((sum, t) => sum + t.profitLoss, 0)
    
    const profitMargin = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0
    
    // Calculate average holding period
    const holdingPeriods = allTransactions.map(t => {
      const purchaseDate = new Date(t.player.purchaseDate)
      const saleDate = new Date(t.saleDate)
      return Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    })
    const averageHoldingPeriod = holdingPeriods.length > 0 
      ? holdingPeriods.reduce((sum, period) => sum + period, 0) / holdingPeriods.length 
      : 0

    // Calculate success rate
    const successfulTransactions = allTransactions.filter(t => t.profitLoss > 0)
    const successRate = allTransactions.length > 0 
      ? (successfulTransactions.length / allTransactions.length) * 100 
      : 0

    const portfolioSummary: PortfolioSummary = {
      totalPlayers: allPlayers.length,
      ownedPlayers: ownedPlayers.length,
      soldPlayers: soldPlayers.length,
      totalInvestment,
      totalReturns,
      totalProfit,
      profitMargin,
      averageHoldingPeriod,
      successRate
    }

    // Calculate monthly performance
    const monthlyData: MonthlyProfitData[] = []
    const monthlyMap = new Map<string, { profit: number, count: number }>()

    allTransactions.forEach(transaction => {
      const date = new Date(transaction.saleDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { profit: 0, count: 0 })
      }
      
      const month = monthlyMap.get(monthKey)!
      month.profit += transaction.profitLoss
      month.count += 1
    })

    monthlyMap.forEach((data, monthKey) => {
      const [year, month] = monthKey.split('-')
      monthlyData.push({
        month: monthKey,
        year: parseInt(year),
        totalProfit: data.profit,
        transactionCount: data.count,
        averageProfit: data.profit / data.count
      })
    })

    // Sort monthly data by date
    monthlyData.sort((a, b) => a.month.localeCompare(b.month))

    // Calculate position statistics
    const positionMap = new Map<string, {
      playerCount: number,
      totalProfit: number,
      transactions: number,
      holdingPeriods: number[]
    }>()

    allTransactions.forEach(transaction => {
      const position = transaction.player.position
      
      if (!positionMap.has(position)) {
        positionMap.set(position, {
          playerCount: 0,
          totalProfit: 0,
          transactions: 0,
          holdingPeriods: []
        })
      }
      
      const posData = positionMap.get(position)!
      posData.totalProfit += transaction.profitLoss
      posData.transactions += 1
      
      const purchaseDate = new Date(transaction.player.purchaseDate)
      const saleDate = new Date(transaction.saleDate)
      const weeksOwned = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      posData.holdingPeriods.push(weeksOwned)
    })

    // Count unique players per position
    const positionPlayerCount = new Map<string, Set<string>>()
    allPlayers.forEach(player => {
      if (!positionPlayerCount.has(player.position)) {
        positionPlayerCount.set(player.position, new Set())
      }
      positionPlayerCount.get(player.position)!.add(player.id)
    })

    const positionStats: PositionStats[] = []
    positionMap.forEach((data, position) => {
      const playerCount = positionPlayerCount.get(position)?.size || 0
      const averageProfit = data.transactions > 0 ? data.totalProfit / data.transactions : 0
      const averageHoldingPeriod = data.holdingPeriods.length > 0 
        ? data.holdingPeriods.reduce((sum, period) => sum + period, 0) / data.holdingPeriods.length 
        : 0
      const successfulTransactions = allTransactions.filter(t => 
        t.player.position === position && t.profitLoss > 0
      ).length
      const successRate = data.transactions > 0 ? (successfulTransactions / data.transactions) * 100 : 0

      positionStats.push({
        position,
        playerCount,
        totalProfit: data.totalProfit,
        averageProfit,
        averageHoldingPeriod,
        successRate
      })
    })

    // Sort position stats by total profit descending
    positionStats.sort((a, b) => b.totalProfit - a.totalProfit)

    // Prepare export data
    const exportPortfolio = {
      ...portfolioSummary,
      exportDate: new Date().toISOString(),
      filterInfo: dateFrom || dateTo 
        ? `Date range: ${dateFrom?.toISOString().split('T')[0] || 'any'} to ${dateTo?.toISOString().split('T')[0] || 'any'}`
        : 'All transactions included'
    }

    // Build metadata
    const metadata = {
      userId: session.user.id,
      userEmail: session.user.email,
      dateRange: {
        from: dateFrom?.toISOString(),
        to: dateTo?.toISOString()
      },
      generatedAt: new Date().toISOString()
    }

    // Generate file based on format
    let fileBuffer: Buffer
    let contentType: string
    let filename: string

    switch (format) {
      case 'json':
        const jsonContent = generatePortfolioJSON(exportPortfolio, {
          ...metadata,
          monthlyData,
          positionStats,
          summary: portfolioSummary
        })
        fileBuffer = Buffer.from(jsonContent, 'utf8')
        contentType = 'application/json'
        filename = getExportFilename('portfolio', 'json')
        break
      
      case 'pdf':
        fileBuffer = generatePortfolioPDF(exportPortfolio, monthlyData, positionStats, metadata)
        contentType = 'application/pdf'
        filename = getExportFilename('portfolio', 'pdf')
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
    console.error('Error exporting portfolio:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}