/**
 * API integration tests for transaction endpoints
 * Tests sale recording, profit calculation integration, and data validation
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/transactions/route'
import { POST as recordSale } from '@/app/api/transactions/sale/route'
import { createMockPlayer } from '../utils/test-helpers'

// Mock Prisma client
const mockPrisma = {
  player: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  saleTransaction: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
}

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma
}))

// Mock authentication
jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: 'test-user-1', email: 'test@example.com' }
  })
}))

// Mock calculations
jest.mock('@/lib/calculations', () => ({
  calculateProfit: jest.fn().mockReturnValue({
    profit: 100000,
    netSaleValue: 1116000,
    totalSalaryCost: 800000,
    weeksOwned: 16,
    profitMargin: 10
  }),
  calculateWeeksOwned: jest.fn().mockReturnValue({
    weeksOwned: 16,
    daysOwned: 112
  }),
  calculatePercentageKept: jest.fn().mockReturnValue({
    percentageKept: 93,
    isMaximum: true
  })
}))

describe('/api/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/transactions', () => {
    it('should return transactions with pagination', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          playerId: 'player-1',
          saleDate: new Date('2024-01-15'),
          salePrice: 1200000,
          percentageKept: 93,
          profitLoss: 100000,
          player: {
            name: 'Test Player',
            position: 'Midfielder'
          }
        }
      ]

      mockPrisma.saleTransaction.findMany.mockResolvedValue(mockTransactions)
      mockPrisma.saleTransaction.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/transactions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      })
    })

    it('should filter by player ID', async () => {
      mockPrisma.saleTransaction.findMany.mockResolvedValue([])
      mockPrisma.saleTransaction.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/transactions?playerId=player-1')
      await GET(request)

      expect(mockPrisma.saleTransaction.findMany).toHaveBeenCalledWith({
        where: {
          player: { userId: 'test-user-1' },
          playerId: 'player-1'
        },
        include: {
          player: {
            select: {
              name: true,
              position: true,
              nationality: true
            }
          }
        },
        orderBy: { saleDate: 'desc' },
        take: 20,
        skip: 0
      })
    })

    it('should filter by date range', async () => {
      mockPrisma.saleTransaction.findMany.mockResolvedValue([])
      mockPrisma.saleTransaction.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/transactions?startDate=2024-01-01&endDate=2024-12-31')
      await GET(request)

      expect(mockPrisma.saleTransaction.findMany).toHaveBeenCalledWith({
        where: {
          player: { userId: 'test-user-1' },
          saleDate: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31')
          }
        },
        include: {
          player: {
            select: {
              name: true,
              position: true,
              nationality: true
            }
          }
        },
        orderBy: { saleDate: 'desc' },
        take: 20,
        skip: 0
      })
    })

    it('should handle authentication errors', async () => {
      const mockAuth = require('@/lib/auth')
      mockAuth.auth.mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/transactions')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/transactions/sale', () => {
    it('should record a sale transaction', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED',
        purchaseDetails: {
          date: new Date('2024-01-01'),
          price: 1000000,
          fromTeam: 'Test Team'
        }
      })

      const saleData = {
        playerId: 'player-1',
        saleDate: '2024-01-15',
        salePrice: 1200000,
        percentageKept: 93,
        toTeam: 'Buyer Team',
        notes: 'Good sale'
      }

      const createdTransaction = {
        id: 'trans-1',
        playerId: 'player-1',
        saleDate: new Date('2024-01-15'),
        salePrice: 1200000,
        percentageKept: 93,
        profitLoss: 100000,
        toTeam: 'Buyer Team',
        notes: 'Good sale'
      }

      mockPrisma.player.findUnique.mockResolvedValue(player)
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        // Mock the transaction operations
        const [saleTransaction, updatedPlayer] = await Promise.all([
          Promise.resolve(createdTransaction),
          Promise.resolve({ ...player, status: 'SOLD' })
        ])
        return [saleTransaction, updatedPlayer]
      })

      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: JSON.stringify(saleData)
      })

      const response = await recordSale(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.profitLoss).toBe(100000)
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should validate required fields', async () => {
      const invalidSaleData = {
        playerId: 'player-1',
        // Missing saleDate and salePrice
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: JSON.stringify(invalidSaleData)
      })

      const response = await recordSale(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('validation')
    })

    it('should return 404 for non-existent player', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null)

      const saleData = {
        playerId: 'non-existent',
        saleDate: '2024-01-15',
        salePrice: 1200000,
        percentageKept: 93
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: JSON.stringify(saleData)
      })

      const response = await recordSale(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Player not found')
    })

    it('should prevent selling already sold players', async () => {
      const soldPlayer = createMockPlayer({
        id: 'player-1',
        status: 'SOLD'
      })

      mockPrisma.player.findUnique.mockResolvedValue(soldPlayer)

      const saleData = {
        playerId: 'player-1',
        saleDate: '2024-01-15',
        salePrice: 1200000,
        percentageKept: 93
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: JSON.stringify(saleData)
      })

      const response = await recordSale(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Player is already sold')
    })

    it('should validate sale date is not before purchase date', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED',
        purchaseDetails: {
          date: new Date('2024-01-15'),
          price: 1000000,
          fromTeam: 'Test Team'
        }
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)

      const saleData = {
        playerId: 'player-1',
        saleDate: '2024-01-10', // Before purchase date
        salePrice: 1200000,
        percentageKept: 93
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: JSON.stringify(saleData)
      })

      const response = await recordSale(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Sale date cannot be before purchase date')
    })

    it('should validate sale date is not in the future', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED'
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      const saleData = {
        playerId: 'player-1',
        saleDate: futureDate.toISOString().split('T')[0],
        salePrice: 1200000,
        percentageKept: 93
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: JSON.stringify(saleData)
      })

      const response = await recordSale(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Sale date cannot be in the future')
    })

    it('should validate percentage kept range', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED'
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)

      const saleData = {
        playerId: 'player-1',
        saleDate: '2024-01-15',
        salePrice: 1200000,
        percentageKept: 100 // Invalid percentage
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: JSON.stringify(saleData)
      })

      const response = await recordSale(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Percentage kept must be between 0 and 93')
    })

    it('should validate sale price is positive', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED'
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)

      const saleData = {
        playerId: 'player-1',
        saleDate: '2024-01-15',
        salePrice: -1000, // Invalid price
        percentageKept: 93
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: JSON.stringify(saleData)
      })

      const response = await recordSale(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Sale price must be positive')
    })

    it('should handle database transaction errors', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED'
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'))

      const saleData = {
        playerId: 'player-1',
        saleDate: '2024-01-15',
        salePrice: 1200000,
        percentageKept: 93
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: JSON.stringify(saleData)
      })

      const response = await recordSale(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal Server Error')
    })

    it('should calculate profit using calculation functions', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED',
        purchaseDetails: {
          date: new Date('2024-01-01'),
          price: 1000000,
          fromTeam: 'Test Team'
        }
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)
      mockPrisma.$transaction.mockImplementation(async () => [
        { id: 'trans-1', profitLoss: 100000 },
        { ...player, status: 'SOLD' }
      ])

      const saleData = {
        playerId: 'player-1',
        saleDate: '2024-01-15',
        salePrice: 1200000,
        percentageKept: 93
      }

      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: JSON.stringify(saleData)
      })

      await recordSale(request)

      const mockCalculations = require('@/lib/calculations')
      expect(mockCalculations.calculateWeeksOwned).toHaveBeenCalledWith({
        purchaseDate: player.purchaseDetails.date,
        saleDate: new Date(saleData.saleDate)
      })
      expect(mockCalculations.calculateProfit).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await recordSale(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/sale', {
        method: 'POST',
        body: ''
      })

      const response = await recordSale(request)

      expect(response.status).toBe(400)
    })

    it('should handle database connection errors', async () => {
      mockPrisma.saleTransaction.findMany.mockRejectedValue(new Error('Connection failed'))

      const request = new NextRequest('http://localhost:3000/api/transactions')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal Server Error')
    })
  })
})