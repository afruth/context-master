import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { 
  formatTransactionForCSV, 
  generateTransactionsCSV, 
  generateTransactionsJSON, 
  generateTransactionsPDF,
  getExportFilename,
  buildFilterInfo
} from '@/lib/export'

const exportTransactionsQuerySchema = z.object({
  // Export format
  format: z.enum(['csv', 'json', 'pdf']).default('csv'),
  
  // Same filters as main transactions API
  search: z.string().optional(),
  playerId: z.string().cuid().optional(),
  profitMin: z.string().transform(Number).optional(),
  profitMax: z.string().transform(Number).optional(),
  dateFrom: z.string().transform((str) => new Date(str)).optional(),
  dateTo: z.string().transform((str) => new Date(str)).optional(),
  
  // Sorting
  sortBy: z.enum(['saleDate', 'profitLoss', 'salePrice', 'playerName']).default('saleDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Export limits (no pagination for exports, but reasonable limits)
  limit: z.string().transform(Number).refine(n => n >= 1 && n <= 10000, 'Limit must be between 1 and 10000').default(() => 10000)
})

/**
 * GET /api/export/transactions - Export transactions data in CSV, JSON, or PDF format
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
    const parsedQuery = exportTransactionsQuerySchema.safeParse(queryParams)
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.issues },
        { status: 400 }
      )
    }

    const {
      format,
      search,
      playerId,
      profitMin,
      profitMax,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      limit
    } = parsedQuery.data

    // Build where clause (same as main transactions API)
    const where: any = {
      player: {
        userId: session.user.id
      }
    }

    // Text search across player name
    if (search) {
      where.player.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Player ID filter
    if (playerId) {
      where.playerId = playerId
    }

    // Profit range filter
    if (profitMin !== undefined || profitMax !== undefined) {
      where.profitLoss = {}
      if (profitMin !== undefined) {
        where.profitLoss.gte = profitMin
      }
      if (profitMax !== undefined) {
        where.profitLoss.lte = profitMax
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.saleDate = {}
      if (dateFrom) {
        where.saleDate.gte = dateFrom
      }
      if (dateTo) {
        where.saleDate.lte = dateTo
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sortBy === 'playerName') {
      orderBy.player = { name: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Fetch transactions with all related data
    const transactions = await prisma.saleTransaction.findMany({
      where,
      include: {
        player: {
          select: {
            id: true,
            name: true,
            position: true,
            nationality: true,
            purchaseDate: true,
            purchasePrice: true,
            fromTeam: true
          }
        }
      },
      orderBy,
      take: limit
    })

    // Format data for export
    const exportTransactions = transactions.map(formatTransactionForCSV)
    
    // Build metadata
    const metadata = {
      userId: session.user.id,
      userEmail: session.user.email,
      totalRecords: exportTransactions.length,
      filterInfo: buildFilterInfo(parsedQuery.data),
      summary: {
        totalProfit: transactions.reduce((sum, t) => sum + t.profitLoss, 0),
        averageProfit: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.profitLoss, 0) / transactions.length : 0,
        successRate: transactions.length > 0 ? (transactions.filter(t => t.profitLoss > 0).length / transactions.length) * 100 : 0,
        totalTransactions: transactions.length
      }
    }

    // Generate file based on format
    let fileBuffer: Buffer
    let contentType: string
    let filename: string

    switch (format) {
      case 'csv':
        fileBuffer = await generateTransactionsCSV(exportTransactions)
        contentType = 'text/csv'
        filename = getExportFilename('transactions', 'csv')
        break
      
      case 'json':
        const jsonContent = generateTransactionsJSON(exportTransactions, metadata)
        fileBuffer = Buffer.from(jsonContent, 'utf8')
        contentType = 'application/json'
        filename = getExportFilename('transactions', 'json')
        break
      
      case 'pdf':
        fileBuffer = generateTransactionsPDF(exportTransactions, metadata)
        contentType = 'application/pdf'
        filename = getExportFilename('transactions', 'pdf')
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
    console.error('Error exporting transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}