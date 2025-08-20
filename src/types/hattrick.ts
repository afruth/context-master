/**
 * Hattrick-specific TypeScript interfaces and types
 * Based on the technical requirements document
 */

// Core Player interfaces
export interface PlayerAge {
  years: number;
  days: number;
}

export interface PlayerSkills {
  keeper?: number;
  defending?: number;
  playmaking?: number;
  winger?: number;
  passing?: number;
  scoring?: number;
  setPieces?: number;
}

export interface PurchaseDetails {
  date: Date;
  price: number;
  fromTeam?: string;
  hattrickWeek: number;
  hattrickSeason: number;
}

export interface Player {
  id: string;
  name: string;
  age: PlayerAge;
  position: string;
  nationality: string;
  speciality?: string;
  form: number;
  stamina: number;
  skills: PlayerSkills;
  purchaseDetails: PurchaseDetails;
  currentStatus: PlayerStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseTransaction {
  id: string;
  playerId: string;
  purchaseDate: Date;
  purchasePrice: number;
  fromTeam?: string;
  notes?: string;
  hattrickWeek: number;
  hattrickSeason: number;
}

export interface SaleTransaction {
  id: string;
  playerId: string;
  saleDate: Date;
  salePrice: number;
  percentageKept: number; // 0-93%
  toTeam?: string;
  notes?: string;
  hattrickWeek: number;
  hattrickSeason: number;
  profitLoss: number;
}

export interface SalaryHistory {
  id: string;
  playerId: string;
  weeklyPay: number;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export type PlayerStatus = 'OWNED' | 'SOLD' | 'TRANSFERRED';

export type TransactionType = 'purchase' | 'sale' | 'transfer';

// Calculation result interfaces
export interface ProfitCalculationResult {
  profit: number;
  netSaleValue: number;
  totalSalaryCost: number;
  weeksOwned: number;
  profitMargin: number;
}

export interface WeeksOwnedResult {
  weeksOwned: number;
  daysOwned: number;
}

export interface AgeProgressionResult {
  currentAge: PlayerAge;
  ageAtSale?: PlayerAge;
  yearsProgressed: number;
  daysProgressed: number;
}

export interface PercentageKeptResult {
  percentageKept: number;
  isMaximum: boolean; // true if at 93% cap
  weeksToMaximum?: number; // weeks remaining to reach 93%
}

export interface CurrentProjectedProfitResult {
  projectedProfit: number;
  currentPercentageKept: number;
  projectedSaleValue: number;
  totalSalaryCostToDate: number;
  projectedNetSaleValue: number;
  confidenceLevel: 'high' | 'medium' | 'low';
}

// Utility calculation input interfaces
export interface ProfitCalculationInput {
  saleValue: number;
  percentageKept: number;
  weeklyExpenses: number;
  weeksOwned: number;
  purchaseValue: number;
}

export interface WeeksOwnedInput {
  purchaseDate: Date;
  saleDate: Date;
}

export interface AgeProgressionInput {
  initialAge: PlayerAge;
  daysOwned: number;
}

export interface PercentageKeptInput {
  weeksOwned: number;
}

export interface CurrentProjectedProfitInput {
  player: Player;
  currentDate?: Date;
  projectedSaleValue?: number;
  salaryHistory: SalaryHistory[];
}

// Extended player interfaces with calculated fields
export interface PlayerWithCalculations extends Player {
  totalProfit?: number;
  profitMargin?: number;
  currentValue?: number;
  estimatedProfit?: number;
  weeksOwned?: number;
  currentAge?: PlayerAge;
  saleTransactions: SaleTransaction[];
  salaryHistory: SalaryHistory[];
}

export interface PlayerSummary {
  playerId: string;
  playerName: string;
  profit: number;
  margin: number;
  transactions: number;
  position: string;
  weeksOwned: number;
}

export interface PlayerProjection {
  playerId: string;
  playerName: string;
  currentValue: number;
  projectedValue: number;
  potentialProfit: number;
  confidence: 'high' | 'medium' | 'low';
  weeksToMaxPercentage: number;
}

// Portfolio and reporting interfaces
export interface PortfolioSummary {
  totalPlayers: number;
  ownedPlayers: number;
  soldPlayers: number;
  totalInvestment: number;
  totalReturns: number;
  totalProfit: number;
  profitMargin: number;
  averageHoldingPeriod: number;
  successRate: number;
}

export interface PeriodBreakdown {
  period: string;
  investment: number;
  returns: number;
  profit: number;
  margin: number;
  transactionCount: number;
}

export interface MonthlyPerformance {
  month: string;
  profit: number;
  transactionCount: number;
  averageHoldingPeriod: number;
}

export interface TrendData {
  date: string;
  value: number;
  cumulative?: number;
}

// Hattrick-specific constants as types
export type HattrickConstants = {
  DAYS_PER_HATTRICK_YEAR: 112;
  WEEKS_PER_HATTRICK_YEAR: 16;
  DAYS_PER_WEEK: 7;
  MAX_PERCENTAGE_KEPT: 93;
  MIN_PERCENTAGE_KEPT: 0;
  SALARY_CALCULATION_DAY: 'friday';
};

// Export validation schemas types (to be used with Zod)
export interface CreatePlayerInput {
  name: string;
  ageYears: number;
  ageDays: number;
  position: string;
  nationality: string;
  speciality?: string;
  form: number;
  stamina: number;
  keeper?: number;
  defending?: number;
  playmaking?: number;
  winger?: number;
  passing?: number;
  scoring?: number;
  setPieces?: number;
  purchaseDate: Date;
  purchasePrice: number;
  fromTeam?: string;
}

export interface UpdatePlayerInput extends Partial<CreatePlayerInput> {
  id: string;
}

export interface CreateSaleTransactionInput {
  playerId: string;
  saleDate: Date;
  salePrice: number;
  percentageKept: number;
  toTeam?: string;
  notes?: string;
}

export interface CreateSalaryHistoryInput {
  playerId: string;
  weeklyPay: number;
  startDate: Date;
  endDate?: Date;
}

// Market analysis types
export interface MarketTrend {
  position: string;
  averagePrice: number;
  priceChange: number;
  volume: number;
  period: string;
}

export interface PriceHistory {
  date: Date;
  averagePrice: number;
  transactionCount: number;
  highPrice: number;
  lowPrice: number;
}