/**
 * API integration tests for calculation endpoints
 * Tests portfolio summary, profit projections, and calculation accuracy
 */

import { NextRequest } from 'next/server'
import { GET as getPortfolio } from '@/app/api/calculations/portfolio/route'
import { GET as getProfitProjection } from '@/app/api/players/[id]/profit-projection/route'
import { createMockPlayer } from '../utils/test-helpers'

// Mock Prisma client
const mockPrisma = {
  player: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  saleTransaction: {
    findMany: jest.fn(),
  },
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
  calculateCurrentProjectedProfit: jest.fn().mockReturnValue({
    projectedProfit: 150000,
    currentPercentageKept: 93,
    projectedSaleValue: 1300000,
    totalSalaryCostToDate: 400000,
    projectedNetSaleValue: 1209000,
    confidenceLevel: 'high'
  }),
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
  })
}))

describe('/api/calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/calculations/portfolio', () => {
    it('should return portfolio summary with current players', async () => {
      const currentPlayers = [
        createMockPlayer({
          id: 'player-1',
          name: 'Player 1',
          status: 'OWNED',
          purchaseDetails: { price: 1000000 }
        }),
        createMockPlayer({
          id: 'player-2',
          name: 'Player 2',
          status: 'OWNED',
          purchaseDetails: { price: 1500000 }
        })
      ]

      const soldTransactions = [
        {
          id: 'trans-1',
          profitLoss: 100000,
          salePrice: 1200000,
          player: { name: 'Sold Player 1' }
        },
        {
          id: 'trans-2',
          profitLoss: -50000,
          salePrice: 900000,
          player: { name: 'Sold Player 2' }
        }
      ]

      mockPrisma.player.findMany.mockResolvedValue(currentPlayers)
      mockPrisma.saleTransaction.findMany.mockResolvedValue(soldTransactions)

      const request = new NextRequest('http://localhost:3000/api/calculations/portfolio')
      const response = await getPortfolio(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toMatchObject({
        currentPortfolio: {
          totalPlayers: 2,
          totalInvestment: 2500000, // 1000000 + 1500000
          projectedTotalProfit: 300000 // 150000 * 2 (mocked)
        },
        realizedProfits: {
          totalTransactions: 2,
          totalProfit: 50000, // 100000 - 50000
          totalSalesValue: 2100000, // 1200000 + 900000
          averageProfit: 25000 // 50000 / 2
        },
        overallSummary: {
          totalInvestment: 2500000,
          realizedProfit: 50000,
          projectedProfit: 300000,
          totalPotentialProfit: 350000
        }
      })
    })

    it('should exclude projections when requested', async () => {
      mockPrisma.player.findMany.mockResolvedValue([])
      mockPrisma.saleTransaction.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/calculations/portfolio?includeProjections=false')
      const response = await getPortfolio(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.currentPortfolio.projectedTotalProfit).toBeUndefined()
      expect(data.data.overallSummary.projectedProfit).toBeUndefined()
      expect(data.data.overallSummary.totalPotentialProfit).toBeUndefined()
    })

    it('should handle empty portfolio', async () => {
      mockPrisma.player.findMany.mockResolvedValue([])
      mockPrisma.saleTransaction.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/calculations/portfolio')
      const response = await getPortfolio(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.currentPortfolio.totalPlayers).toBe(0)
      expect(data.data.realizedProfits.totalTransactions).toBe(0)
    })

    it('should calculate breakdown by position', async () => {
      const players = [
        createMockPlayer({
          id: 'player-1',
          position: 'Midfielder',
          purchaseDetails: { price: 1000000 }
        }),
        createMockPlayer({
          id: 'player-2',
          position: 'Forward',
          purchaseDetails: { price: 1500000 }
        }),
        createMockPlayer({
          id: 'player-3',
          position: 'Midfielder',
          purchaseDetails: { price: 800000 }
        })
      ]

      mockPrisma.player.findMany.mockResolvedValue(players)
      mockPrisma.saleTransaction.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/calculations/portfolio')
      const response = await getPortfolio(request)
      const data = await response.json()

      expect(data.data.breakdown.byPosition).toEqual({
        Midfielder: {
          count: 2,
          investment: 1800000, // 1000000 + 800000
          projectedProfit: 300000 // 150000 * 2 (mocked)
        },
        Forward: {
          count: 1,
          investment: 1500000,
          projectedProfit: 150000 // 150000 * 1 (mocked)
        }
      })
    })

    it('should calculate breakdown by age group', async () => {
      const players = [
        createMockPlayer({
          id: 'player-1',
          age: { years: 18, days: 0 },
          purchaseDetails: { price: 1000000 }
        }),
        createMockPlayer({
          id: 'player-2',
          age: { years: 23, days: 0 },
          purchaseDetails: { price: 1500000 }
        }),
        createMockPlayer({
          id: 'player-3',
          age: { years: 30, days: 0 },
          purchaseDetails: { price: 800000 }
        })
      ]

      mockPrisma.player.findMany.mockResolvedValue(players)
      mockPrisma.saleTransaction.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/calculations/portfolio')
      const response = await getPortfolio(request)
      const data = await response.json()

      expect(data.data.breakdown.byAgeGroup).toEqual({
        'Young (15-20)': {
          count: 1,
          investment: 1000000,
          projectedProfit: 150000
        },
        'Prime (21-28)': {
          count: 1,
          investment: 1500000,
          projectedProfit: 150000
        },
        'Veteran (29+)': {
          count: 1,
          investment: 800000,
          projectedProfit: 150000
        }
      })
    })

    it('should handle authentication errors', async () => {
      const mockAuth = require('@/lib/auth')
      mockAuth.auth.mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/calculations/portfolio')
      const response = await getPortfolio(request)

      expect(response.status).toBe(401)
    })

    it('should handle database errors', async () => {
      mockPrisma.player.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/calculations/portfolio')
      const response = await getPortfolio(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal Server Error')
    })
  })

  describe('GET /api/players/[id]/profit-projection', () => {
    it('should return profit projection for owned player', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED',
        purchaseDetails: {
          date: new Date('2024-01-01'),
          price: 1000000
        }
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)

      const request = new NextRequest('http://localhost:3000/api/players/player-1/profit-projection')
      const response = await getProfitProjection(
        request,
        { params: { id: 'player-1' } }
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toMatchObject({
        projectedProfit: 150000,
        currentPercentageKept: 93,
        projectedSaleValue: 1300000,
        totalSalaryCostToDate: 400000,
        projectedNetSaleValue: 1209000,
        confidenceLevel: 'high'
      })

      const mockCalculations = require('@/lib/calculations')
      expect(mockCalculations.calculateCurrentProjectedProfit).toHaveBeenCalledWith({
        player,
        salaryHistory: player.salaryHistory,
        currentDate: expect.any(Date)
      })
    })

    it('should handle custom projected sale value', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED'
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)

      const request = new NextRequest('http://localhost:3000/api/players/player-1/profit-projection?projectedSaleValue=1500000')
      await getProfitProjection(
        request,
        { params: { id: 'player-1' } }
      )

      const mockCalculations = require('@/lib/calculations')
      expect(mockCalculations.calculateCurrentProjectedProfit).toHaveBeenCalledWith({
        player,
        salaryHistory: player.salaryHistory,
        currentDate: expect.any(Date),
        projectedSaleValue: 1500000
      })
    })

    it('should return 404 for non-existent player', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/players/non-existent/profit-projection')
      const response = await getProfitProjection(
        request,
        { params: { id: 'non-existent' } }
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Player not found')
    })

    it('should return 400 for sold player', async () => {
      const soldPlayer = createMockPlayer({
        id: 'player-1',
        status: 'SOLD'
      })

      mockPrisma.player.findUnique.mockResolvedValue(soldPlayer)

      const request = new NextRequest('http://localhost:3000/api/players/player-1/profit-projection')
      const response = await getProfitProjection(
        request,
        { params: { id: 'player-1' } }
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Cannot project profit for sold player')
    })

    it('should validate projected sale value', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED'
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)

      const request = new NextRequest('http://localhost:3000/api/players/player-1/profit-projection?projectedSaleValue=-1000')
      const response = await getProfitProjection(
        request,
        { params: { id: 'player-1' } }
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Projected sale value must be positive')
    })

    it('should handle different confidence levels', async () => {
      const youngPlayer = createMockPlayer({
        id: 'player-1',
        status: 'OWNED',
        purchaseDetails: {
          date: new Date(), // Recently purchased
          price: 1000000
        }
      })

      // Mock low confidence for recently purchased player
      const mockCalculations = require('@/lib/calculations')
      mockCalculations.calculateCurrentProjectedProfit.mockReturnValueOnce({
        projectedProfit: 50000,
        currentPercentageKept: 23.25, // 4 weeks
        projectedSaleValue: 1100000,
        totalSalaryCostToDate: 200000,
        projectedNetSaleValue: 255750,
        confidenceLevel: 'low'
      })

      mockPrisma.player.findUnique.mockResolvedValue(youngPlayer)

      const request = new NextRequest('http://localhost:3000/api/players/player-1/profit-projection')
      const response = await getProfitProjection(
        request,
        { params: { id: 'player-1' } }
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.confidenceLevel).toBe('low')
    })
  })

  describe('Calculation Integration', () => {
    it('should use real calculation functions for profit projections', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED',
        purchaseDetails: {
          date: new Date('2024-01-01'),
          price: 1000000
        },
        salaryHistory: [
          {
            id: 'salary-1',
            playerId: 'player-1',
            weeklyPay: 50000,
            startDate: new Date('2024-01-01'),
            endDate: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)

      const request = new NextRequest('http://localhost:3000/api/players/player-1/profit-projection')
      await getProfitProjection(
        request,
        { params: { id: 'player-1' } }
      )

      const mockCalculations = require('@/lib/calculations')
      expect(mockCalculations.calculateCurrentProjectedProfit).toHaveBeenCalledWith({
        player,
        salaryHistory: player.salaryHistory,
        currentDate: expect.any(Date)
      })
    })

    it('should handle missing salary history gracefully', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED',
        salaryHistory: [] // No salary history
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)

      const request = new NextRequest('http://localhost:3000/api/players/player-1/profit-projection')
      const response = await getProfitProjection(
        request,
        { params: { id: 'player-1' } }
      )

      // Should still work with empty salary history
      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle calculation function errors', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED'
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)

      const mockCalculations = require('@/lib/calculations')
      mockCalculations.calculateCurrentProjectedProfit.mockImplementationOnce(() => {
        throw new Error('Calculation error')
      })

      const request = new NextRequest('http://localhost:3000/api/players/player-1/profit-projection')
      const response = await getProfitProjection(
        request,
        { params: { id: 'player-1' } }
      )

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal Server Error')
    })

    it('should handle invalid query parameters', async () => {
      const player = createMockPlayer({
        id: 'player-1',
        status: 'OWNED'
      })

      mockPrisma.player.findUnique.mockResolvedValue(player)

      const request = new NextRequest('http://localhost:3000/api/players/player-1/profit-projection?projectedSaleValue=invalid')
      const response = await getProfitProjection(
        request,
        { params: { id: 'player-1' } }
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('must be a valid number')
    })
  })
})