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
  MAX_PERCENTAGE_KEPT: 95,
  MIN_PERCENTAGE_KEPT: 85, // Minimum at day 0 (100% - 12% - 3%)
  SALARY_CALCULATION_DAY: 'friday',
  HATTRICK_COMMISSION: 3 // Fixed 3% commission Hattrick takes
};

// Official Hattrick transfer fee table (base fee before 3% commission)
const TRANSFER_FEE_TABLE = new Map([
  [0, 12.00],
  [1, 10.45],
  [2, 9.95],
  [3, 9.59],
  [4, 9.30],
  [5, 9.05],
  [6, 8.83],
  [7, 8.62],   // 1 week
  [14, 7.55],  // 2 weeks
  [21, 6.76],  // 3 weeks
  [28, 6.12],  // 4 weeks
  [35, 5.57],  // 5 weeks
  [42, 5.09],  // 6 weeks
  [49, 4.65],  // 7 weeks
  [56, 4.24],  // 8 weeks
  [63, 3.87],  // 9 weeks
  [70, 3.52],  // 10 weeks
  [77, 3.19],  // 11 weeks
  [84, 2.88],  // 12 weeks
  [91, 2.58],  // 13 weeks
  [98, 2.30],  // 14 weeks
  [105, 2.03], // 15 weeks
  [112, 2.00], // 16+ weeks (minimum fee)
]);

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
 * Calculate percentage kept based on ownership duration using official Hattrick transfer fee table
 * 
 * Hattrick uses a transfer fee table based on days owned, with the formula:
 * Percentage Kept = 100% - Base Transfer Fee% - 3% Hattrick Commission
 * 
 * @param input - Ownership duration information (in days)
 * @returns Percentage kept calculation result
 */
export function calculatePercentageKept(input: PercentageKeptInput): PercentageKeptResult {
  const { daysOwned } = input;

  if (daysOwned < 0) {
    throw new Error('Days owned must be positive');
  }

  // Get base transfer fee from official Hattrick table
  const baseFee = getTransferFeeFromTable(daysOwned);
  
  // Calculate percentage kept: 100% - base fee - 3% commission
  const percentageKept = 100 - baseFee - HATTRICK_CONSTANTS.HATTRICK_COMMISSION;

  const isMaximum = percentageKept >= HATTRICK_CONSTANTS.MAX_PERCENTAGE_KEPT;
  const daysToMaximum = isMaximum ? 0 : Math.max(0, 112 - daysOwned); // 16 weeks = 112 days

  return {
    percentageKept: Math.round(percentageKept * 100) / 100, // Round to 2 decimal places
    isMaximum,
    daysToMaximum: isMaximum ? undefined : daysToMaximum
  };
}

/**
 * Get transfer fee percentage from the official Hattrick table
 * 
 * @param daysOwned - Number of days the player has been owned
 * @returns Base transfer fee percentage
 */
function getTransferFeeFromTable(daysOwned: number): number {
  // Handle cases beyond the table (16+ weeks)
  if (daysOwned >= 112) {
    return 2.00; // Minimum fee for 16+ weeks
  }

  // Get exact match from table
  if (TRANSFER_FEE_TABLE.has(daysOwned)) {
    return TRANSFER_FEE_TABLE.get(daysOwned)!;
  }

  // Interpolate for days not in the table (between week markers)
  const sortedDays = Array.from(TRANSFER_FEE_TABLE.keys()).sort((a, b) => a - b);
  
  // Find the two closest points for interpolation
  let lowerDay = 0;
  let upperDay = 112;
  
  for (let i = 0; i < sortedDays.length - 1; i++) {
    if (daysOwned > sortedDays[i] && daysOwned < sortedDays[i + 1]) {
      lowerDay = sortedDays[i];
      upperDay = sortedDays[i + 1];
      break;
    }
  }

  const lowerFee = TRANSFER_FEE_TABLE.get(lowerDay)!;
  const upperFee = TRANSFER_FEE_TABLE.get(upperDay)!;
  
  // Linear interpolation
  const ratio = (daysOwned - lowerDay) / (upperDay - lowerDay);
  const interpolatedFee = lowerFee + (upperFee - lowerFee) * ratio;
  
  return Math.round(interpolatedFee * 100) / 100; // Round to 2 decimal places
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

  // Calculate current percentage kept (using days)
  const percentageResult = calculatePercentageKept({
    daysOwned: weeksOwnedResult.daysOwned
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
 * Calculate total salary cost for a specific period using Hattrick Friday-based rules
 * 
 * @param salaryHistory - Historical salary data
 * @param startDate - Start of period (purchase date)
 * @param endDate - End of period (sale date or current date)
 * @returns Total salary cost for the period
 */
export function calculateSalaryCostForPeriod(
  salaryHistory: SalaryHistory[],
  startDate: Date,
  endDate: Date
): number {
  if (endDate <= startDate || salaryHistory.length === 0) {
    return 0;
  }

  // Use the new Friday-based calculation
  const result = calculateSalaryPayments(startDate, endDate, salaryHistory);
  return result.totalCost;
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
 * Calculate salary payments based on Hattrick rules
 * - One payment on purchase day (immediate)
 * - One payment every Friday the player is on the team
 * 
 * @param purchaseDate - Date player was purchased
 * @param endDate - End date (sale date or current date)
 * @param salaryHistory - Historical salary data
 * @returns Total payments, cost, and breakdown
 */
export function calculateSalaryPayments(
  purchaseDate: Date,
  endDate: Date,
  salaryHistory: SalaryHistory[]
): { totalPayments: number; totalCost: number; breakdown: SalaryBreakdown[] } {
  if (endDate <= purchaseDate) {
    return { totalPayments: 0, totalCost: 0, breakdown: [] };
  }

  const breakdown: SalaryBreakdown[] = [];
  let totalPayments = 0;
  let totalCost = 0;

  // Sort salary history by start date
  const sortedHistory = [...salaryHistory].sort((a, b) => 
    a.startDate.getTime() - b.startDate.getTime()
  );

  for (const salaryPeriod of sortedHistory) {
    const periodStart = new Date(Math.max(salaryPeriod.startDate.getTime(), purchaseDate.getTime()));
    const periodEnd = new Date(Math.min(
      salaryPeriod.endDate?.getTime() || endDate.getTime(),
      endDate.getTime()
    ));

    if (periodStart < periodEnd) {
      const payments = countSalaryPayments(periodStart, periodEnd, purchaseDate);
      const cost = payments * salaryPeriod.weeklyPay;
      
      breakdown.push({
        salaryPeriod,
        periodStart,
        periodEnd,
        payments,
        cost
      });

      totalPayments += payments;
      totalCost += cost;
    }
  }

  return { totalPayments, totalCost, breakdown };
}

/**
 * Count salary payments for a specific period based on Hattrick rules
 * 
 * @param startDate - Period start date
 * @param endDate - Period end date
 * @param purchaseDate - Original purchase date (for immediate payment)
 * @returns Number of salary payments
 */
export function countSalaryPayments(
  startDate: Date,
  endDate: Date,
  purchaseDate: Date
): number {
  if (endDate <= startDate) {
    return 0;
  }

  let payments = 0;

  // Count immediate payment on purchase day (if within this period)
  if (startDate.getTime() <= purchaseDate.getTime() && purchaseDate.getTime() < endDate.getTime()) {
    payments += 1;
  }

  // Count all Fridays in the period
  let currentDate = new Date(startDate);
  
  // Find first Friday on or after startDate
  const daysUntilFriday = (5 - currentDate.getDay() + 7) % 7;
  if (daysUntilFriday > 0) {
    currentDate.setDate(currentDate.getDate() + daysUntilFriday);
  }

  // Count all Fridays until endDate
  while (currentDate < endDate) {
    // Only count Friday if it's not the purchase day (to avoid double counting)
    if (currentDate.getTime() !== purchaseDate.getTime()) {
      payments += 1;
    }
    currentDate.setDate(currentDate.getDate() + 7); // Next Friday
  }

  return payments;
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