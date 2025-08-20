import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import type { 
  AnalyticsData, 
  MonthlyProfitData, 
  PositionStats, 
  AgeGroupStats, 
  ProfitTrendData,
  AnalyticsSummary 
} from '@/types/hattrick'

// Validation schema
const AnalyticsQuerySchema = z.object({
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  includeCurrent: z.string().transform((str) => str === 'true').default(() => false),
  includePortfolio: z.string().transform((str) => str === 'true').default(() => true)
})

/**
 * GET /api/analytics - Get comprehensive analytics and performance statistics
 * 
 * @param startDate - Start date for analytics period (optional)
 * @param endDate - End date for analytics period (optional)  
 * @param includeCurrent - Include currently owned players in some calculations (default: false)
 * @param includePortfolio - Include portfolio data in position stats and composition (default: true)
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
    const parsedQuery = AnalyticsQuerySchema.safeParse(queryParams)
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.issues },
        { status: 400 }
      )
    }

    const { startDate, endDate, includePortfolio } = parsedQuery.data

    // Build date filter for transactions
    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.saleDate = {}
      if (startDate) {
        dateFilter.saleDate.gte = startDate
      }
      if (endDate) {
        dateFilter.saleDate.lte = endDate
      }
    }

    // Fetch all transactions with player data
    const transactions = await prisma.saleTransaction.findMany({
      where: {
        player: {
          userId: session.user.id
        },
        ...dateFilter
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            position: true,
            nationality: true,
            ageYears: true,
            purchaseDate: true,
            purchasePrice: true
          }
        }
      },
      orderBy: {
        saleDate: 'asc'
      }
    })

    // Fetch all players for additional calculations
    const allPlayers = await prisma.player.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        saleTransactions: true,
        salaryHistory: {
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    })

    // Fetch currently owned players for portfolio analytics
    const ownedPlayers = includePortfolio ? await prisma.player.findMany({
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
      }
    }) : []

    // Calculate monthly profit aggregation
    const monthlyProfits: MonthlyProfitData[] = []
    const monthlyMap = new Map<string, { profit: number; count: number }>()

    transactions.forEach(transaction => {
      const date = new Date(transaction.saleDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { profit: 0, count: 0 })
      }
      
      const monthData = monthlyMap.get(monthKey)!
      monthData.profit += transaction.profitLoss
      monthData.count += 1
    })

    monthlyMap.forEach((data, monthKey) => {
      const [year, month] = monthKey.split('-')
      monthlyProfits.push({
        month: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' }),
        year: parseInt(year),
        totalProfit: data.profit,
        transactionCount: data.count,
        averageProfit: data.profit / data.count
      })
    })

    // Add current month with unrealized gains if includePortfolio is true
    if (includePortfolio && ownedPlayers.length > 0) {
      const currentDate = new Date()
      const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      
      // Only add if we don't already have data for current month
      if (!monthlyMap.has(currentMonthKey)) {
        const currentUnrealizedProfit = ownedPlayers.reduce((sum, player) => {
          const estimatedCurrentValue = Math.round(player.purchasePrice * 1.1)
          return sum + (estimatedCurrentValue - player.purchasePrice)
        }, 0)
        
        monthlyProfits.push({
          month: currentDate.toLocaleString('default', { month: 'long' }),
          year: currentDate.getFullYear(),
          totalProfit: currentUnrealizedProfit,
          transactionCount: ownedPlayers.length,
          averageProfit: currentUnrealizedProfit / ownedPlayers.length
        })
      }
    }

    // Calculate position-based performance statistics
    const positionMap = new Map<string, { 
      transactions: typeof transactions,
      ownedPlayers: typeof ownedPlayers,
      totalProfit: number,
      totalHoldingDays: number,
      unrealizedProfit: number
    }>()

    // Add data from completed transactions (sold players)
    transactions.forEach(transaction => {
      const position = transaction.player.position
      
      if (!positionMap.has(position)) {
        positionMap.set(position, { 
          transactions: [], 
          ownedPlayers: [],
          totalProfit: 0, 
          totalHoldingDays: 0,
          unrealizedProfit: 0
        })
      }
      
      const posData = positionMap.get(position)!
      posData.transactions.push(transaction)
      posData.totalProfit += transaction.profitLoss
      
      // Calculate holding period in days
      const purchaseDate = new Date(transaction.player.purchaseDate)
      const saleDate = new Date(transaction.saleDate)
      const holdingDays = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
      posData.totalHoldingDays += holdingDays
    })

    // Add data from currently owned players
    if (includePortfolio) {
      ownedPlayers.forEach(player => {
        const position = player.position
        
        if (!positionMap.has(position)) {
          positionMap.set(position, { 
            transactions: [], 
            ownedPlayers: [],
            totalProfit: 0, 
            totalHoldingDays: 0,
            unrealizedProfit: 0
          })
        }
        
        const posData = positionMap.get(position)!
        posData.ownedPlayers.push(player)
        
        // Calculate unrealized profit (simple estimation: 10% above purchase price)
        const estimatedCurrentValue = Math.round(player.purchasePrice * 1.1)
        const unrealizedProfit = estimatedCurrentValue - player.purchasePrice
        posData.unrealizedProfit += unrealizedProfit
        
        // Calculate holding period for owned players
        const purchaseDate = new Date(player.purchaseDate)
        const currentDate = new Date()
        const holdingDays = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        posData.totalHoldingDays += holdingDays
      })
    }

    const positionStats: PositionStats[] = []
    positionMap.forEach((data, position) => {
      const soldPlayerCount = data.transactions.length
      const ownedPlayerCount = data.ownedPlayers.length
      const totalPlayerCount = soldPlayerCount + ownedPlayerCount
      const successfulTrades = data.transactions.filter(t => t.profitLoss > 0).length
      
      // Total profit includes realized + unrealized
      const totalProfitWithUnrealized = data.totalProfit + data.unrealizedProfit
      
      positionStats.push({
        position,
        playerCount: includePortfolio ? totalPlayerCount : soldPlayerCount,
        totalProfit: includePortfolio ? totalProfitWithUnrealized : data.totalProfit,
        averageProfit: includePortfolio ? 
          (totalPlayerCount > 0 ? totalProfitWithUnrealized / totalPlayerCount : 0) :
          (soldPlayerCount > 0 ? data.totalProfit / soldPlayerCount : 0),
        averageHoldingPeriod: totalPlayerCount > 0 ? Math.floor(data.totalHoldingDays / totalPlayerCount) : 0,
        successRate: soldPlayerCount > 0 ? (successfulTrades / soldPlayerCount) * 100 : 0,
        // Add additional portfolio-specific data
        ...(includePortfolio && {
          soldPlayers: soldPlayerCount,
          ownedPlayers: ownedPlayerCount,
          realizedProfit: data.totalProfit,
          unrealizedProfit: data.unrealizedProfit
        })
      })
    })

    // Calculate age group analysis
    const ageGroupMap = new Map<string, {
      transactions: typeof transactions,
      ownedPlayers: typeof ownedPlayers,
      totalProfit: number,
      totalHoldingDays: number,
      unrealizedProfit: number
    }>()

    // Process sold players (transactions)
    transactions.forEach(transaction => {
      const age = transaction.player.ageYears
      let ageGroup: string
      
      if (age < 20) ageGroup = '15-19'
      else if (age < 25) ageGroup = '20-24'
      else if (age < 30) ageGroup = '25-29'
      else if (age < 35) ageGroup = '30-34'
      else ageGroup = '35+'
      
      if (!ageGroupMap.has(ageGroup)) {
        ageGroupMap.set(ageGroup, { 
          transactions: [], 
          ownedPlayers: [],
          totalProfit: 0, 
          totalHoldingDays: 0,
          unrealizedProfit: 0
        })
      }
      
      const ageData = ageGroupMap.get(ageGroup)!
      ageData.transactions.push(transaction)
      ageData.totalProfit += transaction.profitLoss
      
      // Calculate holding period in days
      const purchaseDate = new Date(transaction.player.purchaseDate)
      const saleDate = new Date(transaction.saleDate)
      const holdingDays = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
      ageData.totalHoldingDays += holdingDays
    })

    // Process owned players if includePortfolio is true
    if (includePortfolio) {
      ownedPlayers.forEach(player => {
        const age = player.ageYears
        let ageGroup: string
        
        if (age < 20) ageGroup = '15-19'
        else if (age < 25) ageGroup = '20-24'
        else if (age < 30) ageGroup = '25-29'
        else if (age < 35) ageGroup = '30-34'
        else ageGroup = '35+'
        
        if (!ageGroupMap.has(ageGroup)) {
          ageGroupMap.set(ageGroup, { 
            transactions: [], 
            ownedPlayers: [],
            totalProfit: 0, 
            totalHoldingDays: 0,
            unrealizedProfit: 0
          })
        }
        
        const ageData = ageGroupMap.get(ageGroup)!
        ageData.ownedPlayers.push(player)
        
        // Calculate unrealized profit (simple estimation: 10% above purchase price)
        const estimatedCurrentValue = Math.round(player.purchasePrice * 1.1)
        const unrealizedProfit = estimatedCurrentValue - player.purchasePrice
        ageData.unrealizedProfit += unrealizedProfit
        
        // Calculate holding period for owned players
        const purchaseDate = new Date(player.purchaseDate)
        const currentDate = new Date()
        const holdingDays = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        ageData.totalHoldingDays += holdingDays
      })
    }

    const ageGroupStats: AgeGroupStats[] = []
    ageGroupMap.forEach((data, ageGroup) => {
      const soldPlayerCount = data.transactions.length
      const ownedPlayerCount = data.ownedPlayers.length
      const totalPlayerCount = soldPlayerCount + ownedPlayerCount
      
      // Total profit includes realized + unrealized
      const totalProfitWithUnrealized = data.totalProfit + data.unrealizedProfit
      
      if (totalPlayerCount > 0) {
        ageGroupStats.push({
          ageGroup,
          playerCount: includePortfolio ? totalPlayerCount : soldPlayerCount,
          totalProfit: includePortfolio ? totalProfitWithUnrealized : data.totalProfit,
          averageProfit: includePortfolio ? 
            (totalProfitWithUnrealized / totalPlayerCount) :
            (soldPlayerCount > 0 ? data.totalProfit / soldPlayerCount : 0),
          averageHoldingPeriod: Math.floor(data.totalHoldingDays / totalPlayerCount)
        })
      }
    })

    // Calculate profit trends over time
    const profitTrends: ProfitTrendData[] = []
    let cumulativeProfit = 0
    
    // Group transactions by month for trend analysis
    const monthlyTrends = new Map<string, { profit: number; count: number }>()
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.saleDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyTrends.has(monthKey)) {
        monthlyTrends.set(monthKey, { profit: 0, count: 0 })
      }
      
      const monthData = monthlyTrends.get(monthKey)!
      monthData.profit += transaction.profitLoss
      monthData.count += 1
    })

    // Sort months and calculate cumulative profit
    const sortedMonths = Array.from(monthlyTrends.keys()).sort()
    sortedMonths.forEach(monthKey => {
      const data = monthlyTrends.get(monthKey)!
      cumulativeProfit += data.profit
      
      profitTrends.push({
        date: monthKey,
        cumulativeProfit,
        monthlyProfit: data.profit,
        transactionCount: data.count
      })
    })

    // Add current month with unrealized gains if includePortfolio is true
    if (includePortfolio && ownedPlayers.length > 0) {
      const currentDate = new Date()
      const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      
      // Only add if we don't already have data for current month
      if (!monthlyTrends.has(currentMonthKey)) {
        const currentUnrealizedProfit = ownedPlayers.reduce((sum, player) => {
          const estimatedCurrentValue = Math.round(player.purchasePrice * 1.1)
          return sum + (estimatedCurrentValue - player.purchasePrice)
        }, 0)
        
        cumulativeProfit += currentUnrealizedProfit
        
        profitTrends.push({
          date: currentMonthKey,
          cumulativeProfit,
          monthlyProfit: currentUnrealizedProfit,
          transactionCount: ownedPlayers.length
        })
      }
    }

    // Calculate summary statistics
    const totalTransactions = transactions.length
    const totalPlayers = allPlayers.length
    const ownedPlayersCount = ownedPlayers.length
    const realizedProfit = transactions.reduce((sum, t) => sum + t.profitLoss, 0)
    
    // Calculate unrealized profit from owned players
    const unrealizedProfit = includePortfolio ? ownedPlayers.reduce((sum, player) => {
      const estimatedCurrentValue = Math.round(player.purchasePrice * 1.1)
      return sum + (estimatedCurrentValue - player.purchasePrice)
    }, 0) : 0
    
    const totalProfit = realizedProfit + unrealizedProfit
    
    const totalInvestment = transactions.reduce((sum, t) => sum + t.player.purchasePrice, 0) +
                           (includePortfolio ? ownedPlayers.reduce((sum, p) => sum + p.purchasePrice, 0) : 0)
    const totalReturns = transactions.reduce((sum, t) => sum + t.salePrice, 0)
    const successfulTrades = transactions.filter(t => t.profitLoss > 0).length
    
    // Calculate average holding period
    const totalHoldingDays = transactions.reduce((sum, transaction) => {
      const purchaseDate = new Date(transaction.player.purchaseDate)
      const saleDate = new Date(transaction.saleDate)
      return sum + Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
    }, 0)

    const summary: AnalyticsSummary = {
      totalPlayers,
      totalTransactions,
      totalProfit,
      averageProfit: totalTransactions > 0 ? totalProfit / totalTransactions : 0,
      profitMargin: totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0,
      averageHoldingPeriod: totalTransactions > 0 ? Math.floor(totalHoldingDays / totalTransactions) : 0,
      successRate: totalTransactions > 0 ? (successfulTrades / totalTransactions) * 100 : 0,
      // Add portfolio-specific metrics when includePortfolio is true
      ...(includePortfolio && {
        ownedPlayers: ownedPlayersCount,
        realizedProfit,
        unrealizedProfit,
        totalInvestment,
        realizedProfitMargin: totalTransactions > 0 && totalInvestment > 0 ? 
          (realizedProfit / (totalInvestment - ownedPlayers.reduce((sum, p) => sum + p.purchasePrice, 0))) * 100 : 0,
        unrealizedProfitMargin: ownedPlayersCount > 0 && ownedPlayers.reduce((sum, p) => sum + p.purchasePrice, 0) > 0 ?
          (unrealizedProfit / ownedPlayers.reduce((sum, p) => sum + p.purchasePrice, 0)) * 100 : 0
      })
    }

    // Calculate player value distribution for better chart data
    const playerValueDistribution = []
    const valueRanges = [
      { range: '$0-5k', min: 0, max: 5000, count: 0, totalValue: 0 },
      { range: '$5k-10k', min: 5000, max: 10000, count: 0, totalValue: 0 },
      { range: '$10k-25k', min: 10000, max: 25000, count: 0, totalValue: 0 },
      { range: '$25k-50k', min: 25000, max: 50000, count: 0, totalValue: 0 },
      { range: '$50k+', min: 50000, max: Infinity, count: 0, totalValue: 0 }
    ]

    // Include sold player values
    transactions.forEach(transaction => {
      const value = transaction.player.purchasePrice
      const range = valueRanges.find(r => value >= r.min && value < r.max)
      if (range) {
        range.count += 1
        range.totalValue += value
      }
    })

    // Include owned player values if includePortfolio is true
    if (includePortfolio) {
      ownedPlayers.forEach(player => {
        const value = player.purchasePrice
        const range = valueRanges.find(r => value >= r.min && value < r.max)
        if (range) {
          range.count += 1
          range.totalValue += value
        }
      })
    }

    const analyticsData: AnalyticsData = {
      monthlyProfits,
      positionStats,
      ageGroupStats,
      profitTrends,
      summary,
      playerValueDistribution: valueRanges.filter(range => range.count > 0)
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics:', error)
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