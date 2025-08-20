/**
 * Hattrick-specific business logic calculation utilities
 * 
 * This module implements all core Hattrick steptrading calculations according to
 * the game's unique mechanics and rules.
 */

import type {
  ProfitCalculationInput,
  ProfitCalculationResult,
  WeeksOwnedInput,
  WeeksOwnedResult,
  AgeProgressionInput,
  AgeProgressionResult,
  PercentageKeptInput,
  PercentageKeptResult,
  CurrentProjectedProfitInput,
  CurrentProjectedProfitResult,
  PlayerAge,
  HattrickConstants,
  SalaryHistory,
  Player
} from '@/types/hattrick';

// Hattrick-specific constants
const HATTRICK_CONSTANTS: HattrickConstants = {
  DAYS_PER_HATTRICK_YEAR: 112,
  WEEKS_PER_HATTRICK_YEAR: 16,
  DAYS_PER_WEEK: 7,
  MAX_PERCENTAGE_KEPT: 93,
  MIN_PERCENTAGE_KEPT: 0,
  SALARY_CALCULATION_DAY: 'friday'
};

/**
 * Calculate profit/loss for a completed player transaction
 * 
 * Uses the core Hattrick profit formula:
 * Profit = (Sale Value * Percentage Kept) - (Number of Weeks * Weekly Salary) - Purchase Value
 * 
 * @param input - Profit calculation parameters
 * @returns Detailed profit calculation result
 */
export function calculateProfit(input: ProfitCalculationInput): ProfitCalculationResult {
  const { saleValue, percentageKept, weeklyExpenses, weeksOwned, purchaseValue } = input;

  // Validate inputs
  if (saleValue < 0 || purchaseValue < 0 || weeklyExpenses < 0) {
    throw new Error('Financial values must be positive');
  }
  
  if (percentageKept < HATTRICK_CONSTANTS.MIN_PERCENTAGE_KEPT || 
      percentageKept > HATTRICK_CONSTANTS.MAX_PERCENTAGE_KEPT) {
    throw new Error(`Percentage kept must be between ${HATTRICK_CONSTANTS.MIN_PERCENTAGE_KEPT}% and ${HATTRICK_CONSTANTS.MAX_PERCENTAGE_KEPT}%`);
  }

  if (weeksOwned < 0) {
    throw new Error('Weeks owned must be positive');
  }

  // Core calculation
  const netSaleValue = saleValue * (percentageKept / 100);
  const totalSalaryCost = weeklyExpenses * weeksOwned;
  const profit = netSaleValue - totalSalaryCost - purchaseValue;
  
  // Calculate profit margin
  const profitMargin = purchaseValue > 0 ? (profit / purchaseValue) * 100 : 0;

  return {
    profit: Math.round(profit), // Round to nearest integer (Hattrick uses whole numbers)
    netSaleValue: Math.round(netSaleValue),
    totalSalaryCost: Math.round(totalSalaryCost),
    weeksOwned,
    profitMargin: Math.round(profitMargin * 100) / 100 // Round to 2 decimal places
  };
}

/**
 * Calculate the number of weeks a player was owned
 * 
 * Rounds up partial weeks as per Hattrick mechanics (you pay salary for any part of a week)
 * 
 * @param input - Purchase and sale date information
 * @returns Weeks owned calculation result
 */
export function calculateWeeksOwned(input: WeeksOwnedInput): WeeksOwnedResult {
  const { purchaseDate, saleDate } = input;

  // Validate dates
  if (saleDate <= purchaseDate) {
    throw new Error('Sale date must be after purchase date');
  }

  // Calculate difference in milliseconds
  const timeDifference = saleDate.getTime() - purchaseDate.getTime();
  const daysOwned = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  
  // Round up to account for partial weeks (Hattrick rule)
  const weeksOwned = Math.ceil(daysOwned / HATTRICK_CONSTANTS.DAYS_PER_WEEK);

  return {
    weeksOwned,
    daysOwned
  };
}

/**
 * Calculate player age progression using Hattrick's 112-day year system
 * 
 * @param input - Initial age and ownership duration
 * @returns Age progression calculation result
 */
export function calculateAgeProgression(input: AgeProgressionInput): AgeProgressionResult {
  const { initialAge, daysOwned } = input;

  // Validate inputs
  if (initialAge.years < 15 || initialAge.years > 45) {
    throw new Error('Player age must be between 15 and 45 years');
  }
  
  if (initialAge.days < 0 || initialAge.days >= HATTRICK_CONSTANTS.DAYS_PER_HATTRICK_YEAR) {
    throw new Error(`Days in age must be between 0 and ${HATTRICK_CONSTANTS.DAYS_PER_HATTRICK_YEAR - 1}`);
  }

  if (daysOwned < 0) {
    throw new Error('Days owned must be positive');
  }

  // Calculate total days including progression
  const totalDays = initialAge.days + daysOwned;
  const additionalYears = Math.floor(totalDays / HATTRICK_CONSTANTS.DAYS_PER_HATTRICK_YEAR);
  const remainingDays = totalDays % HATTRICK_CONSTANTS.DAYS_PER_HATTRICK_YEAR;

  const currentAge: PlayerAge = {
    years: initialAge.years + additionalYears,
    days: remainingDays
  };

  return {
    currentAge,
    yearsProgressed: additionalYears,
    daysProgressed: daysOwned
  };
}

/**
 * Calculate percentage kept based on ownership duration
 * 
 * In Hattrick, the percentage you keep from a sale increases with ownership time,
 * reaching a maximum of 93% after sufficient ownership period.
 * 
 * @param input - Ownership duration information
 * @returns Percentage kept calculation result
 */
export function calculatePercentageKept(input: PercentageKeptInput): PercentageKeptResult {
  const { weeksOwned } = input;

  if (weeksOwned < 0) {
    throw new Error('Weeks owned must be positive');
  }

  // Hattrick percentage calculation
  // The exact formula may vary, but generally increases over time to max 93%
  // This is a simplified model - actual Hattrick mechanics may be more complex
  let percentageKept: number;
  
  if (weeksOwned === 0) {
    percentageKept = HATTRICK_CONSTANTS.MIN_PERCENTAGE_KEPT;
  } else if (weeksOwned >= 16) {
    // Maximum percentage after 16 weeks (1 Hattrick year)
    percentageKept = HATTRICK_CONSTANTS.MAX_PERCENTAGE_KEPT;
  } else {
    // Linear progression from 0% to 93% over 16 weeks
    // In reality, this might follow a different curve
    percentageKept = (weeksOwned / 16) * HATTRICK_CONSTANTS.MAX_PERCENTAGE_KEPT;
  }

  const isMaximum = percentageKept >= HATTRICK_CONSTANTS.MAX_PERCENTAGE_KEPT;
  const weeksToMaximum = isMaximum ? 0 : Math.max(0, 16 - weeksOwned);

  return {
    percentageKept: Math.round(percentageKept * 100) / 100, // Round to 2 decimal places
    isMaximum,
    weeksToMaximum: isMaximum ? undefined : weeksToMaximum
  };
}

/**
 * Calculate current projected profit for owned players
 * 
 * Estimates potential profit based on current ownership duration and projected sale value
 * 
 * @param input - Player information and projection parameters
 * @returns Current projected profit calculation
 */
export function calculateCurrentProjectedProfit(
  input: CurrentProjectedProfitInput
): CurrentProjectedProfitResult {
  const { player, currentDate = new Date(), projectedSaleValue, salaryHistory } = input;

  // Calculate current ownership duration
  const weeksOwnedResult = calculateWeeksOwned({
    purchaseDate: player.purchaseDetails.date,
    saleDate: currentDate
  });

  // Calculate current percentage kept
  const percentageResult = calculatePercentageKept({
    weeksOwned: weeksOwnedResult.weeksOwned
  });

  // Calculate total salary cost to date
  const totalSalaryCostToDate = calculateSalaryCostForPeriod(
    salaryHistory,
    player.purchaseDetails.date,
    currentDate
  );

  // Use projected sale value or estimate based on purchase price + some growth
  const estimatedSaleValue = projectedSaleValue || (player.purchaseDetails.price * 1.1);
  
  // Calculate projected net sale value
  const projectedNetSaleValue = estimatedSaleValue * (percentageResult.percentageKept / 100);
  
  // Calculate projected profit
  const projectedProfit = projectedNetSaleValue - totalSalaryCostToDate - player.purchaseDetails.price;

  // Determine confidence level based on ownership duration and data quality
  let confidenceLevel: 'high' | 'medium' | 'low';
  if (weeksOwnedResult.weeksOwned >= 8 && projectedSaleValue) {
    confidenceLevel = 'high';
  } else if (weeksOwnedResult.weeksOwned >= 4 || projectedSaleValue) {
    confidenceLevel = 'medium';
  } else {
    confidenceLevel = 'low';
  }

  return {
    projectedProfit: Math.round(projectedProfit),
    currentPercentageKept: percentageResult.percentageKept,
    projectedSaleValue: Math.round(estimatedSaleValue),
    totalSalaryCostToDate: Math.round(totalSalaryCostToDate),
    projectedNetSaleValue: Math.round(projectedNetSaleValue),
    confidenceLevel
  };
}

/**
 * Calculate total salary cost for a specific period
 * 
 * @param salaryHistory - Historical salary data
 * @param startDate - Start of period
 * @param endDate - End of period
 * @returns Total salary cost for the period
 */
export function calculateSalaryCostForPeriod(
  salaryHistory: SalaryHistory[],
  startDate: Date,
  endDate: Date
): number {
  if (endDate <= startDate) {
    return 0;
  }

  let totalCost = 0;
  
  // Sort salary history by start date
  const sortedHistory = [...salaryHistory].sort((a, b) => 
    a.startDate.getTime() - b.startDate.getTime()
  );

  for (const salaryPeriod of sortedHistory) {
    const periodStart = new Date(Math.max(salaryPeriod.startDate.getTime(), startDate.getTime()));
    const periodEnd = new Date(Math.min(
      salaryPeriod.endDate?.getTime() || endDate.getTime(),
      endDate.getTime()
    ));

    if (periodStart < periodEnd) {
      const weeksInPeriod = calculateWeeksOwned({
        purchaseDate: periodStart,
        saleDate: periodEnd
      }).weeksOwned;

      totalCost += salaryPeriod.weeklyPay * weeksInPeriod;
    }
  }

  return totalCost;
}

/**
 * Convert player age from years and days to total days
 * 
 * @param age - Player age object
 * @returns Total days since "birth"
 */
export function convertAgeToDays(age: PlayerAge): number {
  return (age.years * HATTRICK_CONSTANTS.DAYS_PER_HATTRICK_YEAR) + age.days;
}

/**
 * Convert total days to player age object
 * 
 * @param totalDays - Total days since "birth"
 * @returns Player age object
 */
export function convertDaysToAge(totalDays: number): PlayerAge {
  const years = Math.floor(totalDays / HATTRICK_CONSTANTS.DAYS_PER_HATTRICK_YEAR);
  const days = totalDays % HATTRICK_CONSTANTS.DAYS_PER_HATTRICK_YEAR;
  
  return { years, days };
}

/**
 * Calculate the next Friday (Hattrick salary day) from a given date
 * 
 * @param date - Reference date
 * @returns Next Friday date
 */
export function getNextSalaryDay(date: Date): Date {
  const nextFriday = new Date(date);
  const daysUntilFriday = (5 - date.getDay() + 7) % 7;
  
  if (daysUntilFriday === 0 && date.getDay() === 5) {
    // If today is Friday, return today
    return nextFriday;
  }
  
  nextFriday.setDate(date.getDate() + (daysUntilFriday || 7));
  return nextFriday;
}

/**
 * Round financial values to appropriate precision for Hattrick
 * 
 * @param value - Financial value to round
 * @returns Rounded value (whole number for Hattrick currency)
 */
export function roundFinancialValue(value: number): number {
  return Math.round(value);
}

/**
 * Calculate Return on Investment (ROI) percentage
 * 
 * @param profit - Profit amount
 * @param investment - Initial investment amount
 * @returns ROI as a percentage
 */
export function calculateROI(profit: number, investment: number): number {
  if (investment <= 0) {
    return 0;
  }
  
  return Math.round((profit / investment) * 10000) / 100; // Round to 2 decimal places
}