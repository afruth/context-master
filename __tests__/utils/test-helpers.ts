/**
 * Test utilities and helpers for Hattrick tests
 */

import type { Player, PlayerAge, SalaryHistory, ProfitCalculationInput } from '@/types/hattrick'

/**
 * Create a mock player for testing
 */
export function createMockPlayer(overrides: Partial<Player> = {}): Player {
  const basePlayer: Player = {
    id: 'test-player-1',
    name: 'Test Player',
    age: { years: 20, days: 0 },
    position: 'Midfielder',
    nationality: 'Sweden',
    speciality: null,
    form: 7,
    stamina: 7,
    skills: {
      keeper: null,
      defending: 5,
      playmaking: 8,
      winger: 6,
      passing: 7,
      scoring: 5,
      setPieces: 4
    },
    purchaseDetails: {
      date: new Date('2024-01-01'),
      price: 1000000,
      fromTeam: 'Test Team',
      hattrickWeek: 1,
      hattrickSeason: 95
    },
    status: 'OWNED',
    userId: 'test-user-1',
    salaryHistory: [
      {
        id: 'salary-1',
        playerId: 'test-player-1',
        weeklyPay: 50000,
        startDate: new Date('2024-01-01'),
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }

  return { ...basePlayer, ...overrides }
}

/**
 * Create mock salary history for testing
 */
export function createMockSalaryHistory(
  weeklyPay: number,
  startDate: Date,
  endDate?: Date
): SalaryHistory {
  return {
    id: `salary-${Date.now()}`,
    playerId: 'test-player-1',
    weeklyPay,
    startDate,
    endDate: endDate || null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

/**
 * Create mock profit calculation input
 */
export function createMockProfitInput(overrides: Partial<ProfitCalculationInput> = {}): ProfitCalculationInput {
  return {
    saleValue: 1200000,
    percentageKept: 93,
    weeklyExpenses: 50000,
    weeksOwned: 16,
    purchaseValue: 1000000,
    ...overrides
  }
}

/**
 * Create a date X weeks ago from now
 */
export function weeksAgo(weeks: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - (weeks * 7))
  return date
}

/**
 * Create a date X days ago from now
 */
export function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

/**
 * Create a date X weeks in the future from now
 */
export function weeksFromNow(weeks: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + (weeks * 7))
  return date
}

/**
 * Mock API response
 */
export function createMockApiResponse<T>(data: T, success = true) {
  return {
    data: success ? data : undefined,
    error: success ? undefined : 'Test error',
    message: success ? 'Success' : 'Error occurred'
  }
}

/**
 * Create a player age object
 */
export function createPlayerAge(years: number, days: number): PlayerAge {
  return { years, days }
}

/**
 * Constants for testing
 */
export const TEST_CONSTANTS = {
  HATTRICK_YEAR_DAYS: 112,
  HATTRICK_YEAR_WEEKS: 16,
  MAX_PERCENTAGE_KEPT: 93,
  MIN_PERCENTAGE_KEPT: 0
} as const