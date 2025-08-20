/**
 * API integration tests for players endpoints
 * Tests CRUD operations, filtering, searching, and error handling
 */

import { createMocks } from 'node-mocks-http'
import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from '@/app/api/players/route'
import { GET as getPlayerById, PUT, DELETE } from '@/app/api/players/[id]/route'
import { createMockPlayer } from '../utils/test-helpers'

// Mock Prisma client
const mockPrisma = {
  player: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  }
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

describe('/api/players', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/players', () => {
    it('should return players with default pagination', async () => {
      const mockPlayers = [
        createMockPlayer({ id: '1', name: 'Player 1' }),
        createMockPlayer({ id: '2', name: 'Player 2' })
      ]

      mockPrisma.player.findMany.mockResolvedValue(mockPlayers)
      mockPrisma.player.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/players')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1
      })
    })

    it('should handle pagination parameters', async () => {
      const mockPlayers = [createMockPlayer()]
      mockPrisma.player.findMany.mockResolvedValue(mockPlayers)
      mockPrisma.player.count.mockResolvedValue(50)

      const request = new NextRequest('http://localhost:3000/api/players?page=2&limit=10')
      await GET(request)

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-1' },
        include: { salaryHistory: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 10 // page 2, skip first 10
      })
    })

    it('should filter by status', async () => {
      mockPrisma.player.findMany.mockResolvedValue([])
      mockPrisma.player.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/players?status=OWNED')
      await GET(request)

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'test-user-1',
          currentStatus: 'OWNED'
        },
        include: { salaryHistory: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0
      })
    })

    it('should filter by position', async () => {
      mockPrisma.player.findMany.mockResolvedValue([])
      mockPrisma.player.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/players?position=Midfielder')
      await GET(request)

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'test-user-1',
          position: 'Midfielder'
        },
        include: { salaryHistory: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0
      })
    })

    it('should handle sorting', async () => {
      mockPrisma.player.findMany.mockResolvedValue([])
      mockPrisma.player.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/players?sortBy=name&sortOrder=asc')
      await GET(request)

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-1' },
        include: { salaryHistory: true },
        orderBy: { name: 'asc' },
        take: 20,
        skip: 0
      })
    })

    it('should handle authentication errors', async () => {
      const mockAuth = require('@/lib/auth')
      mockAuth.auth.mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/players')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle database errors', async () => {
      mockPrisma.player.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/players')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal Server Error')
    })
  })

  describe('POST /api/players', () => {
    it('should create a new player', async () => {
      const newPlayerData = {
        name: 'New Player',
        ageYears: 20,
        ageDays: 0,
        position: 'Midfielder',
        nationality: 'Sweden',
        form: 7,
        stamina: 7,
        skills: {
          defending: 5,
          playmaking: 8,
          winger: 6,
          passing: 7,
          scoring: 5,
          setPieces: 4
        },
        purchaseDate: '2024-01-01',
        purchasePrice: 1000000,
        fromTeam: 'Test Team',
        weeklyPay: 50000
      }

      const createdPlayer = createMockPlayer(newPlayerData)
      mockPrisma.player.create.mockResolvedValue(createdPlayer)

      const request = new NextRequest('http://localhost:3000/api/players', {
        method: 'POST',
        body: JSON.stringify(newPlayerData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.name).toBe('New Player')
      expect(mockPrisma.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Player',
          userId: 'test-user-1',
          purchaseDate: new Date('2024-01-01'),
          salaryHistory: {
            create: {
              weeklyPay: 50000,
              startDate: new Date('2024-01-01')
            }
          }
        }),
        include: { salaryHistory: true }
      })
    })

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Missing required field
        position: 'Midfielder'
      }

      const request = new NextRequest('http://localhost:3000/api/players', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('validation')
    })

    it('should handle duplicate player names', async () => {
      const playerData = {
        name: 'Duplicate Player',
        ageYears: 20,
        ageDays: 0,
        position: 'Forward'
      }

      mockPrisma.player.create.mockRejectedValue({
        code: 'P2002', // Prisma unique constraint error
        meta: { target: ['name'] }
      })

      const request = new NextRequest('http://localhost:3000/api/players', {
        method: 'POST',
        body: JSON.stringify(playerData)
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toContain('Player with this name already exists')
    })
  })

  describe('GET /api/players/[id]', () => {
    it('should return player by ID', async () => {
      const player = createMockPlayer({ id: 'player-1' })
      mockPrisma.player.findUnique.mockResolvedValue(player)

      const response = await getPlayerById(
        new NextRequest('http://localhost:3000/api/players/player-1'),
        { params: { id: 'player-1' } }
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.id).toBe('player-1')
      expect(mockPrisma.player.findUnique).toHaveBeenCalledWith({
        where: { 
          id: 'player-1',
          userId: 'test-user-1'
        },
        include: { 
          salaryHistory: true,
          saleTransactions: true
        }
      })
    })

    it('should return 404 for non-existent player', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null)

      const response = await getPlayerById(
        new NextRequest('http://localhost:3000/api/players/non-existent'),
        { params: { id: 'non-existent' } }
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Player not found')
    })
  })

  describe('PUT /api/players/[id]', () => {
    it('should update player', async () => {
      const updateData = {
        name: 'Updated Player',
        form: 8
      }

      const existingPlayer = createMockPlayer({ id: 'player-1' })
      const updatedPlayer = { ...existingPlayer, ...updateData }

      mockPrisma.player.findUnique.mockResolvedValue(existingPlayer)
      mockPrisma.player.update.mockResolvedValue(updatedPlayer)

      const request = new NextRequest('http://localhost:3000/api/players/player-1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(
        request,
        { params: { id: 'player-1' } }
      )

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name).toBe('Updated Player')
      expect(mockPrisma.player.update).toHaveBeenCalledWith({
        where: { id: 'player-1' },
        data: updateData,
        include: { salaryHistory: true }
      })
    })

    it('should return 404 for non-existent player', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/players/non-existent', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' })
      })

      const response = await PUT(
        request,
        { params: { id: 'non-existent' } }
      )

      expect(response.status).toBe(404)
    })

    it('should prevent updating sold players', async () => {
      const soldPlayer = createMockPlayer({ 
        id: 'player-1', 
        status: 'SOLD' 
      })
      mockPrisma.player.findUnique.mockResolvedValue(soldPlayer)

      const request = new NextRequest('http://localhost:3000/api/players/player-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' })
      })

      const response = await PUT(
        request,
        { params: { id: 'player-1' } }
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Cannot update sold player')
    })
  })

  describe('DELETE /api/players/[id]', () => {
    it('should delete player', async () => {
      const player = createMockPlayer({ id: 'player-1' })
      mockPrisma.player.findUnique.mockResolvedValue(player)
      mockPrisma.player.delete.mockResolvedValue(player)

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/players/player-1'),
        { params: { id: 'player-1' } }
      )

      expect(response.status).toBe(200)
      expect(mockPrisma.player.delete).toHaveBeenCalledWith({
        where: { id: 'player-1' }
      })
    })

    it('should return 404 for non-existent player', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null)

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/players/non-existent'),
        { params: { id: 'non-existent' } }
      )

      expect(response.status).toBe(404)
    })

    it('should prevent deleting sold players', async () => {
      const soldPlayer = createMockPlayer({ 
        id: 'player-1', 
        status: 'SOLD' 
      })
      mockPrisma.player.findUnique.mockResolvedValue(soldPlayer)

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/players/player-1'),
        { params: { id: 'player-1' } }
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Cannot delete sold player')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/players', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle database connection errors', async () => {
      mockPrisma.player.findMany.mockRejectedValue(new Error('Connection failed'))

      const request = new NextRequest('http://localhost:3000/api/players')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal Server Error')
    })

    it('should validate age constraints', async () => {
      const invalidPlayerData = {
        name: 'Too Young Player',
        ageYears: 14, // Too young
        ageDays: 0,
        position: 'Midfielder'
      }

      const request = new NextRequest('http://localhost:3000/api/players', {
        method: 'POST',
        body: JSON.stringify(invalidPlayerData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Age must be between 15 and 45')
    })

    it('should validate skill values', async () => {
      const invalidPlayerData = {
        name: 'Invalid Skills Player',
        ageYears: 20,
        ageDays: 0,
        position: 'Midfielder',
        skills: {
          playmaking: 25 // Invalid skill level
        }
      }

      const request = new NextRequest('http://localhost:3000/api/players', {
        method: 'POST',
        body: JSON.stringify(invalidPlayerData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Skill values must be between 0 and 20')
    })
  })
})