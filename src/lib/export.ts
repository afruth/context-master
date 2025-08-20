/**
 * Export utilities for generating CSV, JSON, and PDF files
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { 
  PlayerWithCalculations, 
  SaleTransaction, 
  PortfolioSummary,
  PositionStats,
  MonthlyProfitData
} from '@/types/hattrick'

// Types for export data
export interface ExportPlayer {
  id: string
  name: string
  age: string
  position: string
  nationality: string
  speciality?: string
  form: number
  stamina: number
  keeper?: number
  defending?: number
  playmaking?: number
  winger?: number
  passing?: number
  scoring?: number
  setPieces?: number
  purchaseDate: string
  purchasePrice: number
  fromTeam?: string
  currentStatus: string
  totalProfit?: number
  weeksOwned?: number
  projectedProfit?: number
}

export interface ExportTransaction {
  id: string
  playerName: string
  position: string
  nationality: string
  saleDate: string
  salePrice: number
  percentageKept: number
  toTeam?: string
  profitLoss: number
  purchasePrice: number
  purchaseDate: string
  weeksOwned: number
}

export interface ExportPortfolio {
  totalPlayers: number
  ownedPlayers: number
  soldPlayers: number
  totalInvestment: number
  totalReturns: number
  totalProfit: number
  profitMargin: number
  averageHoldingPeriod: number
  successRate: number
  exportDate: string
  filterInfo?: string
}

// CSV Export Functions
export function formatPlayerForCSV(player: PlayerWithCalculations): ExportPlayer {
  return {
    id: player.id,
    name: player.name,
    age: `${player.age.years}y ${player.age.days}d`,
    position: player.position,
    nationality: player.nationality,
    speciality: player.speciality,
    form: player.form,
    stamina: player.stamina,
    keeper: player.skills.keeper,
    defending: player.skills.defending,
    playmaking: player.skills.playmaking,
    winger: player.skills.winger,
    passing: player.skills.passing,
    scoring: player.skills.scoring,
    setPieces: player.skills.setPieces,
    purchaseDate: player.purchaseDetails.date.toISOString().split('T')[0],
    purchasePrice: player.purchaseDetails.price,
    fromTeam: player.purchaseDetails.fromTeam,
    currentStatus: player.currentStatus,
    totalProfit: player.totalProfit,
    weeksOwned: player.weeksOwned,
    projectedProfit: player.estimatedProfit
  }
}

export function formatTransactionForCSV(transaction: any): ExportTransaction {
  const saleDate = new Date(transaction.saleDate)
  const purchaseDate = new Date(transaction.player.purchaseDate)
  const weeksOwned = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (7 * 24 * 60 * 60 * 1000))

  return {
    id: transaction.id,
    playerName: transaction.player.name,
    position: transaction.player.position,
    nationality: transaction.player.nationality,
    saleDate: saleDate.toISOString().split('T')[0],
    salePrice: transaction.salePrice,
    percentageKept: transaction.percentageKept,
    toTeam: transaction.toTeam,
    profitLoss: transaction.profitLoss,
    purchasePrice: transaction.player.purchasePrice,
    purchaseDate: purchaseDate.toISOString().split('T')[0],
    weeksOwned
  }
}

export async function generatePlayersCSV(players: ExportPlayer[]): Promise<Buffer> {
  const headers = [
    'Player Name', 'Age', 'Position', 'Nationality', 'Speciality', 'Form', 'Stamina',
    'Keeper', 'Defending', 'Playmaking', 'Winger', 'Passing', 'Scoring', 'Set Pieces',
    'Purchase Date', 'Purchase Price', 'From Team', 'Status', 'Total Profit', 'Weeks Owned', 'Projected Profit'
  ]

  const records = players.map(player => [
    player.name,
    player.age,
    player.position,
    player.nationality,
    player.speciality || '',
    player.form,
    player.stamina,
    player.keeper || '',
    player.defending || '',
    player.playmaking || '',
    player.winger || '',
    player.passing || '',
    player.scoring || '',
    player.setPieces || '',
    player.purchaseDate,
    player.purchasePrice,
    player.fromTeam || '',
    player.currentStatus,
    player.totalProfit || '',
    player.weeksOwned || '',
    player.projectedProfit || ''
  ])

  // Convert to CSV format
  const csvRows = [headers, ...records].map(row => 
    row.map(field => {
      const str = String(field)
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  ).join('\n')

  return Buffer.from(csvRows, 'utf8')
}

export async function generateTransactionsCSV(transactions: ExportTransaction[]): Promise<Buffer> {
  const headers = [
    'Player Name', 'Position', 'Nationality', 'Purchase Date', 'Purchase Price',
    'Sale Date', 'Sale Price', 'Percentage Kept (%)', 'Sold To Team', 'Weeks Owned', 'Profit/Loss'
  ]

  const records = transactions.map(transaction => [
    transaction.playerName,
    transaction.position,
    transaction.nationality,
    transaction.purchaseDate,
    transaction.purchasePrice,
    transaction.saleDate,
    transaction.salePrice,
    transaction.percentageKept,
    transaction.toTeam || '',
    transaction.weeksOwned,
    transaction.profitLoss
  ])

  // Convert to CSV format
  const csvRows = [headers, ...records].map(row => 
    row.map(field => {
      const str = String(field)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  ).join('\n')

  return Buffer.from(csvRows, 'utf8')
}

// JSON Export Functions
export function generatePlayersJSON(players: ExportPlayer[], metadata: any): string {
  return JSON.stringify({
    metadata: {
      exportDate: new Date().toISOString(),
      exportType: 'players',
      totalRecords: players.length,
      ...metadata
    },
    data: players
  }, null, 2)
}

export function generateTransactionsJSON(transactions: ExportTransaction[], metadata: any): string {
  return JSON.stringify({
    metadata: {
      exportDate: new Date().toISOString(),
      exportType: 'transactions',
      totalRecords: transactions.length,
      ...metadata
    },
    data: transactions
  }, null, 2)
}

export function generatePortfolioJSON(portfolio: ExportPortfolio, metadata: any): string {
  return JSON.stringify({
    metadata: {
      exportDate: new Date().toISOString(),
      exportType: 'portfolio',
      ...metadata
    },
    data: portfolio
  }, null, 2)
}

// PDF Export Functions
export function generatePlayersPDF(players: ExportPlayer[], metadata: any): Buffer {
  const doc = new jsPDF()
  
  // Title and metadata
  doc.setFontSize(20)
  doc.text('Hattrick Players Report', 20, 20)
  
  doc.setFontSize(12)
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 35)
  doc.text(`Total Players: ${players.length}`, 20, 45)
  
  if (metadata.filterInfo) {
    doc.text(`Filters Applied: ${metadata.filterInfo}`, 20, 55)
  }

  // Prepare table data
  const tableColumns = [
    'Name', 'Age', 'Position', 'Nationality', 'Purchase Price', 
    'Status', 'Total Profit', 'Weeks Owned'
  ]
  
  const tableRows = players.map(player => [
    player.name,
    player.age,
    player.position,
    player.nationality,
    player.purchasePrice.toLocaleString(),
    player.currentStatus,
    player.totalProfit ? player.totalProfit.toLocaleString() : '-',
    player.weeksOwned ? player.weeksOwned.toString() : '-'
  ])

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: metadata.filterInfo ? 65 : 55,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      4: { halign: 'right' }, // Purchase Price
      6: { halign: 'right' }, // Total Profit
      7: { halign: 'center' }  // Weeks Owned
    }
  })

  return Buffer.from(doc.output('arraybuffer'))
}

export function generateTransactionsPDF(transactions: ExportTransaction[], metadata: any): Buffer {
  const doc = new jsPDF()
  
  // Title and metadata
  doc.setFontSize(20)
  doc.text('Hattrick Transactions Report', 20, 20)
  
  doc.setFontSize(12)
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 35)
  doc.text(`Total Transactions: ${transactions.length}`, 20, 45)
  
  if (metadata.filterInfo) {
    doc.text(`Filters Applied: ${metadata.filterInfo}`, 20, 55)
  }

  // Calculate summary stats
  const totalProfit = transactions.reduce((sum, t) => sum + t.profitLoss, 0)
  const avgProfit = totalProfit / transactions.length
  const successRate = (transactions.filter(t => t.profitLoss > 0).length / transactions.length) * 100

  doc.text(`Total Profit: ${totalProfit.toLocaleString()}`, 20, 65)
  doc.text(`Average Profit: ${avgProfit.toLocaleString()}`, 20, 75)
  doc.text(`Success Rate: ${successRate.toFixed(1)}%`, 20, 85)

  // Prepare table data
  const tableColumns = [
    'Player', 'Position', 'Purchase', 'Sale', 'Weeks', 'Profit/Loss'
  ]
  
  const tableRows = transactions.map(transaction => [
    transaction.playerName,
    transaction.position,
    transaction.purchasePrice.toLocaleString(),
    transaction.salePrice.toLocaleString(),
    transaction.weeksOwned.toString(),
    transaction.profitLoss.toLocaleString()
  ])

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 95,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      2: { halign: 'right' }, // Purchase
      3: { halign: 'right' }, // Sale
      4: { halign: 'center' }, // Weeks
      5: { halign: 'right' }   // Profit/Loss
    }
  })

  return Buffer.from(doc.output('arraybuffer'))
}

export function generatePortfolioPDF(
  portfolio: ExportPortfolio, 
  monthlyData: MonthlyProfitData[],
  positionStats: PositionStats[],
  metadata: any
): Buffer {
  const doc = new jsPDF()
  
  // Title and metadata
  doc.setFontSize(20)
  doc.text('Hattrick Portfolio Report', 20, 20)
  
  doc.setFontSize(12)
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 35)
  
  // Portfolio Summary
  doc.setFontSize(14)
  doc.text('Portfolio Summary', 20, 55)
  
  doc.setFontSize(10)
  const summaryY = 70
  doc.text(`Total Players: ${portfolio.totalPlayers}`, 20, summaryY)
  doc.text(`Owned Players: ${portfolio.ownedPlayers}`, 20, summaryY + 10)
  doc.text(`Sold Players: ${portfolio.soldPlayers}`, 20, summaryY + 20)
  doc.text(`Total Investment: ${portfolio.totalInvestment.toLocaleString()}`, 20, summaryY + 30)
  doc.text(`Total Returns: ${portfolio.totalReturns.toLocaleString()}`, 20, summaryY + 40)
  doc.text(`Total Profit: ${portfolio.totalProfit.toLocaleString()}`, 20, summaryY + 50)
  doc.text(`Profit Margin: ${portfolio.profitMargin.toFixed(2)}%`, 20, summaryY + 60)
  doc.text(`Average Holding Period: ${portfolio.averageHoldingPeriod.toFixed(1)} weeks`, 20, summaryY + 70)
  doc.text(`Success Rate: ${portfolio.successRate.toFixed(1)}%`, 20, summaryY + 80)

  // Position Performance Table
  if (positionStats.length > 0) {
    doc.setFontSize(14)
    doc.text('Performance by Position', 20, summaryY + 100)

    const positionColumns = ['Position', 'Players', 'Total Profit', 'Avg Profit', 'Success Rate']
    const positionRows = positionStats.map(stat => [
      stat.position,
      stat.playerCount.toString(),
      stat.totalProfit.toLocaleString(),
      stat.averageProfit.toLocaleString(),
      `${stat.successRate.toFixed(1)}%`
    ])

    autoTable(doc, {
      head: [positionColumns],
      body: positionRows,
      startY: summaryY + 110,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center' }
      }
    })
  }

  return Buffer.from(doc.output('arraybuffer'))
}

// Utility functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function getExportFilename(type: 'players' | 'transactions' | 'portfolio', format: 'csv' | 'json' | 'pdf'): string {
  const timestamp = new Date().toISOString().split('T')[0]
  return `hattrick-${type}-${timestamp}.${format}`
}

export function buildFilterInfo(params: any): string {
  const filters: string[] = []
  
  if (params.search) filters.push(`Search: "${params.search}"`)
  if (params.status) filters.push(`Status: ${params.status}`)
  if (params.position) filters.push(`Position: ${params.position}`)
  if (params.ageMin || params.ageMax) {
    filters.push(`Age: ${params.ageMin || 'any'} - ${params.ageMax || 'any'}`)
  }
  if (params.priceMin || params.priceMax) {
    filters.push(`Price: ${params.priceMin || 0} - ${params.priceMax || 'unlimited'}`)
  }
  if (params.dateFrom || params.dateTo) {
    filters.push(`Date: ${params.dateFrom || 'any'} - ${params.dateTo || 'any'}`)
  }
  
  return filters.length > 0 ? filters.join(', ') : 'No filters applied'
}