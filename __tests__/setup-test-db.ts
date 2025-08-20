/**
 * Test database setup and utilities
 * Provides isolated test database environment
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { existsSync, unlinkSync } from 'fs'
import path from 'path'

const TEST_DB_PATH = path.join(process.cwd(), 'test.db')

let prisma: PrismaClient

/**
 * Setup test database for integration tests
 */
export async function setupTestDatabase(): Promise<PrismaClient> {
  // Remove existing test database
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH)
  }

  // Create fresh test database
  process.env.DATABASE_URL = `file:${TEST_DB_PATH}`
  
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // Run migrations to create tables
  try {
    execSync('npx prisma db push --force-reset', { 
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` }
    })
  } catch (error) {
    console.error('Failed to setup test database:', error)
    throw error
  }

  return prisma
}

/**
 * Cleanup test database
 */
export async function teardownTestDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
  }

  // Remove test database file
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH)
  }
}

/**
 * Clear all data from test database while keeping schema
 */
export async function clearTestDatabase(): Promise<void> {
  if (!prisma) {
    throw new Error('Test database not initialized')
  }

  // Clear tables in correct order (respecting foreign key constraints)
  await prisma.saleTransaction.deleteMany()
  await prisma.salaryHistory.deleteMany()
  await prisma.player.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
}

/**
 * Seed test database with sample data
 */
export async function seedTestDatabase(): Promise<{
  users: any[]
  players: any[]
  salaryHistory: any[]
  saleTransactions: any[]
}> {
  if (!prisma) {
    throw new Error('Test database not initialized')
  }

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'test1@example.com',
        password: 'hashedpassword123',
        name: 'Test User 1'
      }
    }),
    prisma.user.create({
      data: {
        email: 'test2@example.com',
        password: 'hashedpassword456',
        name: 'Test User 2'
      }
    })
  ])

  // Create test players
  const players = await Promise.all([
    prisma.player.create({
      data: {
        name: 'Test Player 1',
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
        currentStatus: 'OWNED',
        userId: users[0].id
      }
    }),
    prisma.player.create({
      data: {
        name: 'Test Player 2',
        ageYears: 22,
        ageDays: 30,
        position: 'Forward',
        nationality: 'Brazil',
        form: 8,
        stamina: 8,
        scoring: 12,
        passing: 6,
        setPieces: 7,
        purchaseDate: new Date('2024-02-01'),
        purchasePrice: 1500000,
        currentStatus: 'SOLD',
        userId: users[0].id
      }
    }),
    prisma.player.create({
      data: {
        name: 'Test Player 3',
        ageYears: 25,
        ageDays: 0,
        position: 'Defender',
        nationality: 'Germany',
        form: 6,
        stamina: 7,
        defending: 10,
        passing: 5,
        setPieces: 3,
        purchaseDate: new Date('2024-03-01'),
        purchasePrice: 800000,
        currentStatus: 'OWNED',
        userId: users[1].id
      }
    })
  ])

  // Create salary history
  const salaryHistory = await Promise.all([
    prisma.salaryHistory.create({
      data: {
        playerId: players[0].id,
        weeklyPay: 50000,
        startDate: new Date('2024-01-01')
      }
    }),
    prisma.salaryHistory.create({
      data: {
        playerId: players[1].id,
        weeklyPay: 60000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-06-01')
      }
    }),
    prisma.salaryHistory.create({
      data: {
        playerId: players[2].id,
        weeklyPay: 40000,
        startDate: new Date('2024-03-01')
      }
    })
  ])

  // Create sale transactions
  const saleTransactions = await Promise.all([
    prisma.saleTransaction.create({
      data: {
        playerId: players[1].id,
        saleDate: new Date('2024-06-01'),
        salePrice: 1800000,
        percentageKept: 93,
        profitLoss: 240000,
        toTeam: 'Buyer Team FC',
        notes: 'Excellent sale'
      }
    })
  ])

  return {
    users,
    players,
    salaryHistory,
    saleTransactions
  }
}

/**
 * Get test database instance
 */
export function getTestDatabase(): PrismaClient {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.')
  }
  return prisma
}

/**
 * Create test user with basic data
 */
export async function createTestUser(overrides: Partial<{
  email: string
  password: string
  name: string
}> = {}): Promise<any> {
  const userData = {
    email: 'test@example.com',
    password: 'hashedpassword123',
    name: 'Test User',
    ...overrides
  }

  return await prisma.user.create({
    data: userData
  })
}

/**
 * Create test player with basic data
 */
export async function createTestPlayer(
  userId: string,
  overrides: Partial<any> = {}
): Promise<any> {
  const playerData = {
    name: 'Test Player',
    ageYears: 20,
    ageDays: 0,
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
    purchaseDate: new Date(),
    purchasePrice: 1000000,
    currentStatus: 'OWNED',
    userId,
    ...overrides
  }

  return await prisma.player.create({
    data: playerData,
    include: {
      salaryHistory: true
    }
  })
}