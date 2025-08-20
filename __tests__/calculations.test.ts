/**
 * Unit tests for Hattrick calculation functions
 * Tests the core business logic for profit calculations, age progression, and ownership tracking
 */

import {
  calculateProfit,
  calculateWeeksOwned,
  calculateAgeProgression,
  calculatePercentageKept,
  calculateCurrentProjectedProfit,
  calculateSalaryCostForPeriod,
  convertAgeToDays,
  convertDaysToAge,
  getNextSalaryDay,
  roundFinancialValue,
  calculateROI
} from '@/lib/calculations'

import {
  createMockPlayer,
  createMockProfitInput,
  createMockSalaryHistory,
  createPlayerAge,
  weeksAgo,
  daysAgo,
  TEST_CONSTANTS
} from './utils/test-helpers'

describe('Profit Calculation Functions', () => {
  describe('calculateProfit', () => {
    it('should calculate profit correctly for a profitable sale', () => {
      const input = createMockProfitInput({
        saleValue: 1200000,
        percentageKept: 93,
        weeklyExpenses: 50000,
        weeksOwned: 16,
        purchaseValue: 1000000
      })

      const result = calculateProfit(input)

      expect(result.netSaleValue).toBe(1116000) // 1200000 * 0.93
      expect(result.totalSalaryCost).toBe(800000) // 50000 * 16
      expect(result.profit).toBe(-684000) // 1116000 - 800000 - 1000000
      expect(result.weeksOwned).toBe(16)
      expect(result.profitMargin).toBe(-68.4) // (-684000 / 1000000) * 100
    })

    it('should calculate loss correctly for an unprofitable sale', () => {
      const input = createMockProfitInput({
        saleValue: 800000,
        percentageKept: 50,
        weeklyExpenses: 60000,
        weeksOwned: 20,
        purchaseValue: 1000000
      })

      const result = calculateProfit(input)

      expect(result.netSaleValue).toBe(400000) // 800000 * 0.5
      expect(result.totalSalaryCost).toBe(1200000) // 60000 * 20
      expect(result.profit).toBe(-1800000) // 400000 - 1200000 - 1000000
      expect(result.profitMargin).toBe(-180) // (-1800000 / 1000000) * 100
    })

    it('should handle edge case with zero weeks owned', () => {
      const input = createMockProfitInput({
        saleValue: 1100000,
        percentageKept: 0,
        weeklyExpenses: 50000,
        weeksOwned: 0,
        purchaseValue: 1000000
      })

      const result = calculateProfit(input)

      expect(result.netSaleValue).toBe(0) // 1100000 * 0
      expect(result.totalSalaryCost).toBe(0) // 50000 * 0
      expect(result.profit).toBe(-1000000) // 0 - 0 - 1000000
    })

    it('should throw error for negative values', () => {
      expect(() => calculateProfit(createMockProfitInput({ saleValue: -1000 })))
        .toThrow('Financial values must be positive')
      
      expect(() => calculateProfit(createMockProfitInput({ purchaseValue: -1000 })))
        .toThrow('Financial values must be positive')
      
      expect(() => calculateProfit(createMockProfitInput({ weeklyExpenses: -1000 })))
        .toThrow('Financial values must be positive')
    })

    it('should throw error for invalid percentage kept', () => {
      expect(() => calculateProfit(createMockProfitInput({ percentageKept: -10 })))
        .toThrow('Percentage kept must be between 0% and 93%')
      
      expect(() => calculateProfit(createMockProfitInput({ percentageKept: 100 })))
        .toThrow('Percentage kept must be between 0% and 93%')
    })

    it('should throw error for negative weeks owned', () => {
      expect(() => calculateProfit(createMockProfitInput({ weeksOwned: -5 })))
        .toThrow('Weeks owned must be positive')
    })
  })

  describe('calculateWeeksOwned', () => {
    it('should calculate weeks owned correctly for exact weeks', () => {
      const purchaseDate = new Date('2024-01-01')
      const saleDate = new Date('2024-01-29') // 28 days = 4 weeks

      const result = calculateWeeksOwned({ purchaseDate, saleDate })

      expect(result.daysOwned).toBe(28)
      expect(result.weeksOwned).toBe(4)
    })

    it('should round up partial weeks', () => {
      const purchaseDate = new Date('2024-01-01')
      const saleDate = new Date('2024-01-09') // 8 days = 1.14 weeks -> rounds up to 2

      const result = calculateWeeksOwned({ purchaseDate, saleDate })

      expect(result.daysOwned).toBe(8)
      expect(result.weeksOwned).toBe(2) // Rounds up as per Hattrick rules
    })

    it('should handle same day ownership', () => {
      const date = new Date('2024-01-01')
      
      const result = calculateWeeksOwned({ 
        purchaseDate: date, 
        saleDate: new Date(date.getTime() + 1000) // 1 second later
      })

      expect(result.daysOwned).toBe(0)
      expect(result.weeksOwned).toBe(0)
    })

    it('should throw error when sale date is before purchase date', () => {
      const purchaseDate = new Date('2024-01-15')
      const saleDate = new Date('2024-01-10')

      expect(() => calculateWeeksOwned({ purchaseDate, saleDate }))
        .toThrow('Sale date must be after purchase date')
    })
  })

  describe('calculateAgeProgression', () => {
    it('should calculate age progression correctly within same year', () => {
      const initialAge = createPlayerAge(20, 50)
      const daysOwned = 30

      const result = calculateAgeProgression({ initialAge, daysOwned })

      expect(result.currentAge.years).toBe(20)
      expect(result.currentAge.days).toBe(80)
      expect(result.yearsProgressed).toBe(0)
      expect(result.daysProgressed).toBe(30)
    })

    it('should calculate age progression across year boundary', () => {
      const initialAge = createPlayerAge(20, 100)
      const daysOwned = 30 // Will cross into next year (112 days per year)

      const result = calculateAgeProgression({ initialAge, daysOwned })

      expect(result.currentAge.years).toBe(21)
      expect(result.currentAge.days).toBe(18) // (100 + 30) - 112 = 18
      expect(result.yearsProgressed).toBe(1)
      expect(result.daysProgressed).toBe(30)
    })

    it('should handle multiple year progression', () => {
      const initialAge = createPlayerAge(18, 0)
      const daysOwned = 224 // Exactly 2 Hattrick years

      const result = calculateAgeProgression({ initialAge, daysOwned })

      expect(result.currentAge.years).toBe(20)
      expect(result.currentAge.days).toBe(0)
      expect(result.yearsProgressed).toBe(2)
      expect(result.daysProgressed).toBe(224)
    })

    it('should throw error for invalid age', () => {
      expect(() => calculateAgeProgression({ 
        initialAge: createPlayerAge(14, 0), 
        daysOwned: 10 
      })).toThrow('Player age must be between 15 and 45 years')

      expect(() => calculateAgeProgression({ 
        initialAge: createPlayerAge(46, 0), 
        daysOwned: 10 
      })).toThrow('Player age must be between 15 and 45 years')
    })

    it('should throw error for invalid days in age', () => {
      expect(() => calculateAgeProgression({ 
        initialAge: createPlayerAge(20, -1), 
        daysOwned: 10 
      })).toThrow('Days in age must be between 0 and 111')

      expect(() => calculateAgeProgression({ 
        initialAge: createPlayerAge(20, 112), 
        daysOwned: 10 
      })).toThrow('Days in age must be between 0 and 111')
    })

    it('should throw error for negative days owned', () => {
      expect(() => calculateAgeProgression({ 
        initialAge: createPlayerAge(20, 0), 
        daysOwned: -5 
      })).toThrow('Days owned must be positive')
    })
  })

  describe('calculatePercentageKept', () => {
    it('should return 0% for immediate sale', () => {
      const result = calculatePercentageKept({ weeksOwned: 0 })

      expect(result.percentageKept).toBe(0)
      expect(result.isMaximum).toBe(false)
      expect(result.weeksToMaximum).toBe(16)
    })

    it('should return maximum percentage after 16 weeks', () => {
      const result = calculatePercentageKept({ weeksOwned: 16 })

      expect(result.percentageKept).toBe(93)
      expect(result.isMaximum).toBe(true)
      expect(result.weeksToMaximum).toBeUndefined()
    })

    it('should calculate linear progression correctly', () => {
      const result = calculatePercentageKept({ weeksOwned: 8 })

      expect(result.percentageKept).toBe(46.5) // (8/16) * 93 = 46.5
      expect(result.isMaximum).toBe(false)
      expect(result.weeksToMaximum).toBe(8)
    })

    it('should maintain maximum percentage beyond 16 weeks', () => {
      const result = calculatePercentageKept({ weeksOwned: 25 })

      expect(result.percentageKept).toBe(93)
      expect(result.isMaximum).toBe(true)
      expect(result.weeksToMaximum).toBeUndefined()
    })

    it('should throw error for negative weeks owned', () => {
      expect(() => calculatePercentageKept({ weeksOwned: -1 }))
        .toThrow('Weeks owned must be positive')
    })
  })

  describe('calculateCurrentProjectedProfit', () => {
    it('should calculate projected profit for owned player', () => {
      const player = createMockPlayer({
        purchaseDetails: {
          date: weeksAgo(8),
          price: 1000000,
          fromTeam: 'Test Team'
        }
      })

      const result = calculateCurrentProjectedProfit({
        player,
        projectedSaleValue: 1300000,
        salaryHistory: player.salaryHistory
      })

      expect(result.currentPercentageKept).toBe(46.5) // 8 weeks = 46.5%
      expect(result.projectedSaleValue).toBe(1300000)
      expect(result.projectedNetSaleValue).toBe(604500) // 1300000 * 0.465
      expect(result.totalSalaryCostToDate).toBe(400000) // 50000 * 8 weeks
      expect(result.projectedProfit).toBe(-795500) // 604500 - 400000 - 1000000
      expect(result.confidenceLevel).toBe('high') // 8 weeks + projected value = high confidence
    })

    it('should estimate sale value when not provided', () => {
      const player = createMockPlayer({
        purchaseDetails: {
          date: weeksAgo(16),
          price: 1000000,
          fromTeam: 'Test Team'
        }
      })

      const result = calculateCurrentProjectedProfit({
        player,
        salaryHistory: player.salaryHistory
      })

      expect(result.projectedSaleValue).toBe(1100000) // 1000000 * 1.1 (default estimation)
      expect(result.currentPercentageKept).toBe(93) // 16 weeks = maximum
      expect(result.confidenceLevel).toBe('medium') // 16 weeks but no projected value = medium
    })

    it('should have high confidence with long ownership and projected value', () => {
      const player = createMockPlayer({
        purchaseDetails: {
          date: weeksAgo(10),
          price: 1000000,
          fromTeam: 'Test Team'
        }
      })

      const result = calculateCurrentProjectedProfit({
        player,
        projectedSaleValue: 1200000,
        salaryHistory: player.salaryHistory
      })

      expect(result.confidenceLevel).toBe('high') // 10 weeks + projected value
    })
  })

  describe('calculateSalaryCostForPeriod', () => {
    it('should calculate salary cost for single period', () => {
      const salaryHistory = [
        createMockSalaryHistory(50000, weeksAgo(8), undefined)
      ]

      const totalCost = calculateSalaryCostForPeriod(
        salaryHistory,
        weeksAgo(8),
        new Date()
      )

      expect(totalCost).toBe(400000) // 50000 * 8 weeks
    })

    it('should calculate salary cost across multiple periods', () => {
      const salaryHistory = [
        createMockSalaryHistory(40000, weeksAgo(12), weeksAgo(6)),
        createMockSalaryHistory(60000, weeksAgo(6), undefined)
      ]

      const totalCost = calculateSalaryCostForPeriod(
        salaryHistory,
        weeksAgo(12),
        new Date()
      )

      expect(totalCost).toBe(600000) // (40000 * 6) + (60000 * 6)
    })

    it('should handle overlapping periods correctly', () => {
      const salaryHistory = [
        createMockSalaryHistory(50000, weeksAgo(10), weeksAgo(5))
      ]

      const totalCost = calculateSalaryCostForPeriod(
        salaryHistory,
        weeksAgo(8),
        weeksAgo(2)
      )

      expect(totalCost).toBe(150000) // 50000 * 3 weeks (week 8 to week 5)
    })

    it('should return 0 for invalid date range', () => {
      const salaryHistory = [createMockSalaryHistory(50000, weeksAgo(4), undefined)]

      const totalCost = calculateSalaryCostForPeriod(
        salaryHistory,
        new Date(),
        weeksAgo(4)
      )

      expect(totalCost).toBe(0)
    })
  })

  describe('Age conversion functions', () => {
    it('should convert age to days correctly', () => {
      const age = createPlayerAge(20, 50)
      const totalDays = convertAgeToDays(age)

      expect(totalDays).toBe(2290) // (20 * 112) + 50
    })

    it('should convert days to age correctly', () => {
      const totalDays = 2290 // 20 years, 50 days
      const age = convertDaysToAge(totalDays)

      expect(age.years).toBe(20)
      expect(age.days).toBe(50)
    })

    it('should handle exact year boundaries', () => {
      const totalDays = 2240 // Exactly 20 years
      const age = convertDaysToAge(totalDays)

      expect(age.years).toBe(20)
      expect(age.days).toBe(0)
    })
  })

  describe('Utility functions', () => {
    describe('getNextSalaryDay', () => {
      it('should return next Friday', () => {
        const monday = new Date('2024-01-01') // Monday
        const nextFriday = getNextSalaryDay(monday)

        expect(nextFriday.getDay()).toBe(5) // Friday
        expect(nextFriday.getDate()).toBe(5) // January 5th
      })

      it('should return same day if already Friday', () => {
        const friday = new Date('2024-01-05') // Friday
        const nextFriday = getNextSalaryDay(friday)

        expect(nextFriday.getDay()).toBe(5) // Friday
        expect(nextFriday.getDate()).toBe(5) // Same day
      })
    })

    describe('roundFinancialValue', () => {
      it('should round to nearest integer', () => {
        expect(roundFinancialValue(1234.56)).toBe(1235)
        expect(roundFinancialValue(1234.4)).toBe(1234)
        expect(roundFinancialValue(1234.5)).toBe(1235)
      })

      it('should handle negative values', () => {
        expect(roundFinancialValue(-1234.56)).toBe(-1235)
        expect(roundFinancialValue(-1234.4)).toBe(-1234)
      })
    })

    describe('calculateROI', () => {
      it('should calculate ROI correctly', () => {
        expect(calculateROI(100000, 1000000)).toBe(10) // 10% ROI
        expect(calculateROI(-200000, 1000000)).toBe(-20) // -20% ROI
        expect(calculateROI(500000, 1000000)).toBe(50) // 50% ROI
      })

      it('should handle zero investment', () => {
        expect(calculateROI(100000, 0)).toBe(0)
      })

      it('should handle negative investment', () => {
        expect(calculateROI(100000, -1000000)).toBe(0)
      })

      it('should round to 2 decimal places', () => {
        expect(calculateROI(123456, 1000000)).toBe(12.35) // 12.3456% -> 12.35%
      })
    })
  })
})