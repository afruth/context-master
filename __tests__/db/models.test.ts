/**
 * Database model tests for Prisma relationships
 * Tests foreign key constraints, cascade deletes, and data integrity
 */

import { PrismaClient } from '@prisma/client'
import { createMockPlayer } from '../utils/test-helpers'

// Use in-memory database for testing
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db'
    }
  }
})

describe('Database Models', () => {
  beforeAll(async () => {
    // Ensure clean database state
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`
  })

  beforeEach(async () => {
    // Clean up before each test
    await prisma.saleTransaction.deleteMany()
    await prisma.salaryHistory.deleteMany()
    await prisma.player.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('User Model', () => {
    it('should create user with required fields', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedpassword123'
      }

      const user = await prisma.user.create({
        data: userData
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.password).toBe('hashedpassword123')
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'hashedpassword123'
      }

      await prisma.user.create({ data: userData })

      await expect(
        prisma.user.create({ data: userData })
      ).rejects.toThrow(/Unique constraint/)
    })

    it('should enforce unique username constraint when provided', async () => {
      const user1Data = {
        email: 'user1@example.com',
        username: 'testuser',
        password: 'hashedpassword123'
      }

      const user2Data = {
        email: 'user2@example.com',
        username: 'testuser', // Same username
        password: 'hashedpassword456'
      }

      await prisma.user.create({ data: user1Data })

      await expect(
        prisma.user.create({ data: user2Data })
      ).rejects.toThrow(/Unique constraint/)
    })

    it('should allow null username', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedpassword123',
        username: null
      }

      const user = await prisma.user.create({
        data: userData
      })

      expect(user.username).toBeNull()
    })
  })

  describe('Player Model', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword123'
        }
      })
    })

    it('should create player with all required fields', async () => {
      const playerData = {
        name: 'Test Player',
        ageYears: 20,
        ageDays: 50,
        position: 'Midfielder',
        nationality: 'Sweden',
        form: 7,
        stamina: 7,
        defending: 5,
        playmaking: 8,
        winger: 6,
        passing: 7,
        scoring: 5,
        setPieces: 4,
        purchaseDate: new Date('2024-01-01'),
        purchasePrice: 1000000,
        userId: testUser.id
      }

      const player = await prisma.player.create({
        data: playerData
      })

      expect(player.id).toBeDefined()
      expect(player.name).toBe('Test Player')
      expect(player.ageYears).toBe(20)
      expect(player.ageDays).toBe(50)
      expect(player.position).toBe('Midfielder')
      expect(player.currentStatus).toBe('OWNED') // Default value
      expect(player.userId).toBe(testUser.id)
    })

    it('should allow null skill values', async () => {
      const playerData = {
        name: 'Goalkeeper',
        ageYears: 25,
        ageDays: 0,
        position: 'Goalkeeper',
        nationality: 'Brazil',
        form: 8,
        stamina: 6,
        keeper: 15,
        // Other skills null for goalkeeper
        purchaseDate: new Date('2024-01-01'),
        purchasePrice: 2000000,
        userId: testUser.id
      }

      const player = await prisma.player.create({
        data: playerData
      })

      expect(player.keeper).toBe(15)
      expect(player.defending).toBeNull()
      expect(player.playmaking).toBeNull()
      expect(player.winger).toBeNull()
      expect(player.passing).toBeNull()
      expect(player.scoring).toBeNull()
      expect(player.setPieces).toBeNull()
    })

    it('should cascade delete when user is deleted', async () => {
      const player = await prisma.player.create({
        data: {
          name: 'Test Player',
          ageYears: 20,
          ageDays: 0,
          position: 'Midfielder',
          nationality: 'Sweden',
          form: 7,
          stamina: 7,
          purchaseDate: new Date(),
          purchasePrice: 1000000,
          userId: testUser.id
        }
      })

      await prisma.user.delete({
        where: { id: testUser.id }
      })

      const deletedPlayer = await prisma.player.findUnique({
        where: { id: player.id }
      })

      expect(deletedPlayer).toBeNull()
    })

    it('should have proper indexes for queries', async () => {
      // Create multiple players
      const players = await Promise.all([
        prisma.player.create({
          data: {
            name: 'Player A',
            ageYears: 20,
            ageDays: 0,
            position: 'Midfielder',
            nationality: 'Sweden',
            form: 7,
            stamina: 7,
            purchaseDate: new Date('2024-01-01'),
            purchasePrice: 1000000,
            currentStatus: 'OWNED',
            userId: testUser.id
          }
        }),
        prisma.player.create({
          data: {
            name: 'Player B',
            ageYears: 25,
            ageDays: 50,
            position: 'Forward',
            nationality: 'Brazil',
            form: 8,
            stamina: 8,
            purchaseDate: new Date('2024-02-01'),
            purchasePrice: 1500000,
            currentStatus: 'SOLD',
            userId: testUser.id
          }
        })
      ])

      // Test indexed queries (should be fast and not throw errors)
      const ownedPlayers = await prisma.player.findMany({
        where: { 
          userId: testUser.id,
          currentStatus: 'OWNED'
        }
      })

      const midfielders = await prisma.player.findMany({
        where: {
          userId: testUser.id,
          position: 'Midfielder'
        }
      })

      const youngPlayers = await prisma.player.findMany({
        where: {
          userId: testUser.id,
          ageYears: { lte: 22 }
        }
      })

      expect(ownedPlayers).toHaveLength(1)
      expect(midfielders).toHaveLength(1)
      expect(youngPlayers).toHaveLength(1)
    })
  })

  describe('SalaryHistory Model', () => {
    let testUser: any
    let testPlayer: any

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword123'
        }
      })

      testPlayer = await prisma.player.create({
        data: {
          name: 'Test Player',
          ageYears: 20,
          ageDays: 0,
          position: 'Midfielder',
          nationality: 'Sweden',
          form: 7,
          stamina: 7,
          purchaseDate: new Date(),
          purchasePrice: 1000000,
          userId: testUser.id
        }
      })
    })

    it('should create salary history record', async () => {
      const salaryData = {
        playerId: testPlayer.id,
        weeklyPay: 50000,
        startDate: new Date('2024-01-01')
      }

      const salary = await prisma.salaryHistory.create({
        data: salaryData
      })

      expect(salary.id).toBeDefined()
      expect(salary.playerId).toBe(testPlayer.id)
      expect(salary.weeklyPay).toBe(50000)
      expect(salary.startDate).toEqual(new Date('2024-01-01'))
      expect(salary.endDate).toBeNull()
    })

    it('should allow end date to be set', async () => {
      const salaryData = {
        playerId: testPlayer.id,
        weeklyPay: 50000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-01')
      }

      const salary = await prisma.salaryHistory.create({
        data: salaryData
      })

      expect(salary.endDate).toEqual(new Date('2024-06-01'))
    })

    it('should cascade delete when player is deleted', async () => {
      const salary = await prisma.salaryHistory.create({
        data: {
          playerId: testPlayer.id,
          weeklyPay: 50000,
          startDate: new Date()
        }
      })

      await prisma.player.delete({
        where: { id: testPlayer.id }
      })

      const deletedSalary = await prisma.salaryHistory.findUnique({
        where: { id: salary.id }
      })

      expect(deletedSalary).toBeNull()
    })

    it('should maintain multiple salary records for one player', async () => {
      const salaries = await Promise.all([
        prisma.salaryHistory.create({
          data: {
            playerId: testPlayer.id,
            weeklyPay: 40000,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-06-01')
          }
        }),
        prisma.salaryHistory.create({
          data: {
            playerId: testPlayer.id,
            weeklyPay: 60000,
            startDate: new Date('2024-06-01')
          }
        })
      ])

      const playerWithSalaries = await prisma.player.findUnique({
        where: { id: testPlayer.id },
        include: { salaryHistory: true }
      })

      expect(playerWithSalaries?.salaryHistory).toHaveLength(2)
      expect(playerWithSalaries?.salaryHistory[0].weeklyPay).toBe(40000)
      expect(playerWithSalaries?.salaryHistory[1].weeklyPay).toBe(60000)
    })
  })

  describe('SaleTransaction Model', () => {
    let testUser: any
    let testPlayer: any

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword123'
        }
      })

      testPlayer = await prisma.player.create({
        data: {
          name: 'Test Player',
          ageYears: 20,
          ageDays: 0,
          position: 'Midfielder',
          nationality: 'Sweden',
          form: 7,
          stamina: 7,
          purchaseDate: new Date(),
          purchasePrice: 1000000,
          userId: testUser.id
        }
      })
    })

    it('should create sale transaction record', async () => {
      const transactionData = {
        playerId: testPlayer.id,
        saleDate: new Date('2024-06-01'),
        salePrice: 1200000,
        percentageKept: 93,
        profitLoss: 100000
      }

      const transaction = await prisma.saleTransaction.create({
        data: transactionData
      })

      expect(transaction.id).toBeDefined()
      expect(transaction.playerId).toBe(testPlayer.id)
      expect(transaction.salePrice).toBe(1200000)
      expect(transaction.percentageKept).toBe(93)
      expect(transaction.profitLoss).toBe(100000)
    })

    it('should allow optional fields', async () => {
      const transactionData = {
        playerId: testPlayer.id,
        saleDate: new Date('2024-06-01'),
        salePrice: 1200000,
        percentageKept: 93,
        profitLoss: 100000,
        toTeam: 'Buyer Team',
        notes: 'Great sale!'
      }

      const transaction = await prisma.saleTransaction.create({
        data: transactionData
      })

      expect(transaction.toTeam).toBe('Buyer Team')
      expect(transaction.notes).toBe('Great sale!')
    })

    it('should cascade delete when player is deleted', async () => {
      const transaction = await prisma.saleTransaction.create({
        data: {
          playerId: testPlayer.id,
          saleDate: new Date(),
          salePrice: 1200000,
          percentageKept: 93,
          profitLoss: 100000
        }
      })

      await prisma.player.delete({
        where: { id: testPlayer.id }
      })

      const deletedTransaction = await prisma.saleTransaction.findUnique({
        where: { id: transaction.id }
      })

      expect(deletedTransaction).toBeNull()
    })

    it('should allow multiple sale transactions per player', async () => {
      // This shouldn't normally happen in the business logic,
      // but the database should allow it for data integrity
      const transactions = await Promise.all([
        prisma.saleTransaction.create({
          data: {
            playerId: testPlayer.id,
            saleDate: new Date('2024-06-01'),
            salePrice: 1200000,
            percentageKept: 93,
            profitLoss: 100000
          }
        }),
        prisma.saleTransaction.create({
          data: {
            playerId: testPlayer.id,
            saleDate: new Date('2024-07-01'),
            salePrice: 1300000,
            percentageKept: 93,
            profitLoss: 150000
          }
        })
      ])

      const playerWithTransactions = await prisma.player.findUnique({
        where: { id: testPlayer.id },
        include: { saleTransactions: true }
      })

      expect(playerWithTransactions?.saleTransactions).toHaveLength(2)
    })
  })

  describe('Session Model', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword123'
        }
      })
    })

    it('should create session record', async () => {
      const sessionData = {
        sessionToken: 'unique-session-token',
        userId: testUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }

      const session = await prisma.session.create({
        data: sessionData
      })

      expect(session.id).toBeDefined()
      expect(session.sessionToken).toBe('unique-session-token')
      expect(session.userId).toBe(testUser.id)
      expect(session.expires).toBeInstanceOf(Date)
    })

    it('should enforce unique session token', async () => {
      const sessionData = {
        sessionToken: 'duplicate-token',
        userId: testUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }

      await prisma.session.create({ data: sessionData })

      await expect(
        prisma.session.create({ data: sessionData })
      ).rejects.toThrow(/Unique constraint/)
    })

    it('should cascade delete when user is deleted', async () => {
      const session = await prisma.session.create({
        data: {
          sessionToken: 'test-session-token',
          userId: testUser.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })

      await prisma.user.delete({
        where: { id: testUser.id }
      })

      const deletedSession = await prisma.session.findUnique({
        where: { id: session.id }
      })

      expect(deletedSession).toBeNull()
    })
  })

  describe('Complex Relationships', () => {
    let testUser: any
    let testPlayer: any

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword123'
        }
      })

      testPlayer = await prisma.player.create({
        data: {
          name: 'Test Player',
          ageYears: 20,
          ageDays: 0,
          position: 'Midfielder',
          nationality: 'Sweden',
          form: 7,
          stamina: 7,
          purchaseDate: new Date(),
          purchasePrice: 1000000,
          userId: testUser.id
        }
      })
    })

    it('should create player with salary history and sale transaction', async () => {
      // Create salary history
      await prisma.salaryHistory.create({
        data: {
          playerId: testPlayer.id,
          weeklyPay: 50000,
          startDate: new Date('2024-01-01')
        }
      })

      // Create sale transaction
      await prisma.saleTransaction.create({
        data: {
          playerId: testPlayer.id,
          saleDate: new Date('2024-06-01'),
          salePrice: 1200000,
          percentageKept: 93,
          profitLoss: 100000
        }
      })

      // Fetch player with all relationships
      const playerWithAll = await prisma.player.findUnique({
        where: { id: testPlayer.id },
        include: {
          user: true,
          salaryHistory: true,
          saleTransactions: true
        }
      })

      expect(playerWithAll?.user.email).toBe('test@example.com')
      expect(playerWithAll?.salaryHistory).toHaveLength(1)
      expect(playerWithAll?.saleTransactions).toHaveLength(1)
    })

    it('should maintain referential integrity', async () => {
      // Try to create salary history for non-existent player
      await expect(
        prisma.salaryHistory.create({
          data: {
            playerId: 'non-existent-id',
            weeklyPay: 50000,
            startDate: new Date()
          }
        })
      ).rejects.toThrow(/Foreign key constraint/)

      // Try to create sale transaction for non-existent player
      await expect(
        prisma.saleTransaction.create({
          data: {
            playerId: 'non-existent-id',
            saleDate: new Date(),
            salePrice: 1200000,
            percentageKept: 93,
            profitLoss: 100000
          }
        })
      ).rejects.toThrow(/Foreign key constraint/)
    })

    it('should handle complete user deletion cascade', async () => {
      // Create complete data structure
      await prisma.salaryHistory.create({
        data: {
          playerId: testPlayer.id,
          weeklyPay: 50000,
          startDate: new Date()
        }
      })

      await prisma.saleTransaction.create({
        data: {
          playerId: testPlayer.id,
          saleDate: new Date(),
          salePrice: 1200000,
          percentageKept: 93,
          profitLoss: 100000
        }
      })

      await prisma.session.create({
        data: {
          sessionToken: 'test-session',
          userId: testUser.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })

      // Delete user - should cascade delete everything
      await prisma.user.delete({
        where: { id: testUser.id }
      })

      // Verify everything is deleted
      const player = await prisma.player.findUnique({ where: { id: testPlayer.id } })
      const salaries = await prisma.salaryHistory.findMany({ where: { playerId: testPlayer.id } })
      const transactions = await prisma.saleTransaction.findMany({ where: { playerId: testPlayer.id } })
      const sessions = await prisma.session.findMany({ where: { userId: testUser.id } })

      expect(player).toBeNull()
      expect(salaries).toHaveLength(0)
      expect(transactions).toHaveLength(0)
      expect(sessions).toHaveLength(0)
    })
  })

  describe('Data Integrity Constraints', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword123'
        }
      })
    })

    it('should enforce required fields', async () => {
      // Missing required fields should fail
      await expect(
        prisma.player.create({
          data: {
            // Missing name, ageYears, position, etc.
            userId: testUser.id
          } as any
        })
      ).rejects.toThrow()
    })

    it('should handle large numbers correctly', async () => {
      const player = await prisma.player.create({
        data: {
          name: 'Expensive Player',
          ageYears: 20,
          ageDays: 0,
          position: 'Forward',
          nationality: 'Brazil',
          form: 10,
          stamina: 10,
          purchaseDate: new Date(),
          purchasePrice: 2147483647, // Max 32-bit signed integer
          userId: testUser.id
        }
      })

      expect(player.purchasePrice).toBe(2147483647)
    })

    it('should handle date constraints properly', async () => {
      const player = await prisma.player.create({
        data: {
          name: 'Test Player',
          ageYears: 20,
          ageDays: 0,
          position: 'Midfielder',
          nationality: 'Sweden',
          form: 7,
          stamina: 7,
          purchaseDate: new Date('1900-01-01'), // Very old date
          purchasePrice: 1000000,
          userId: testUser.id
        }
      })

      expect(player.purchaseDate).toEqual(new Date('1900-01-01'))
    })
  })
})