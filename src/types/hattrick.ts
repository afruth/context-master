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
  estimatedSaleValue?: number;
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

export interface SalaryBreakdown {
  salaryPeriod: SalaryHistory;
  periodStart: Date;
  periodEnd: Date;
  payments: number;
  cost: number;
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
  isMaximum: boolean; // true if at 95% cap
  daysToMaximum?: number; // days remaining to reach 95%
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
  daysOwned: number;
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
  MAX_PERCENTAGE_KEPT: 95;
  MIN_PERCENTAGE_KEPT: 85;
  SALARY_CALCULATION_DAY: 'friday';
  HATTRICK_COMMISSION: 3;
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
  estimatedSaleValue?: number;
  weeklyPay?: number;
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

// Enhanced API query parameter interfaces
export interface PlayerQueryParams {
  // Text search
  search?: string;
  
  // Filters
  status?: PlayerStatus;
  position?: string;
  ageMin?: number;
  ageMax?: number;
  priceMin?: number;
  priceMax?: number;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  
  // Skill level filters
  keeperMin?: number;
  keeperMax?: number;
  defendingMin?: number;
  defendingMax?: number;
  playmakingMin?: number;
  playmakingMax?: number;
  wingerMin?: number;
  wingerMax?: number;
  passingMin?: number;
  passingMax?: number;
  scoringMin?: number;
  scoringMax?: number;
  setPiecesMin?: number;
  setPiecesMax?: number;
  
  // Sorting
  sortBy?: 'name' | 'age' | 'position' | 'purchasePrice' | 'purchaseDate' | 'projectedProfit';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

export interface TransactionQueryParams {
  // Text search
  search?: string;
  
  // Filters
  playerId?: string;
  profitMin?: number;
  profitMax?: number;
  dateFrom?: string;
  dateTo?: string;
  
  // Sorting
  sortBy?: 'saleDate' | 'profitLoss' | 'salePrice' | 'playerName';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

export interface SearchParams {
  query: string;
  type?: 'players' | 'transactions' | 'all';
  limit?: number;
}

// Enhanced API response interfaces
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchResult {
  players: Player[];
  transactions: SaleTransaction[];
  totalResults: number;
}

export interface AnalyticsData {
  monthlyProfits: MonthlyProfitData[];
  positionStats: PositionStats[];
  ageGroupStats: AgeGroupStats[];
  profitTrends: ProfitTrendData[];
  summary: AnalyticsSummary;
  playerValueDistribution?: PlayerValueDistribution[];
}

export interface PlayerValueDistribution {
  range: string;
  min: number;
  max: number;
  count: number;
  totalValue: number;
}

export interface MonthlyProfitData {
  month: string;
  year: number;
  totalProfit: number;
  transactionCount: number;
  averageProfit: number;
}

export interface PositionStats {
  position: string;
  playerCount: number;
  totalProfit: number;
  averageProfit: number;
  averageHoldingPeriod: number;
  successRate: number;
}

export interface AgeGroupStats {
  ageGroup: string;
  playerCount: number;
  totalProfit: number;
  averageProfit: number;
  averageHoldingPeriod: number;
}

export interface ProfitTrendData {
  date: string;
  cumulativeProfit: number;
  monthlyProfit: number;
  transactionCount: number;
}

export interface AnalyticsSummary {
  totalPlayers: number;
  totalTransactions: number;
  totalProfit: number;
  averageProfit: number;
  profitMargin: number;
  averageHoldingPeriod: number;
  successRate: number;
}

// Skill Prediction interfaces
export interface SkillPredictionInput {
  skills: PlayerSkills;
  wage: number;
  age: PlayerAge;
  tsi?: number;
  form?: number;
  stamina?: number;
  currencyRate?: number; // Rate to convert to USD (default 1.0 for USD)
}

export interface SkillPredictionLevel {
  low: number;
  avg: number;
  high: number;
}

export interface WagePredictionLevel {
  low: string | number;
  avg: string | number;
  high: string | number;
}

export interface SkillPredictionDebug {
  originalWage: number;
  currencyRate: number;
  wageInUSD: number;
  adjustedWage: number;
  mainSkillIndex: number;
  wageBreakdown: Record<string, number>;
  conversionExplanation?: string;
}

export interface SkillPredictionResult {
  predictedMainSkill: string;
  predictedSkillLevel: SkillPredictionLevel;
  confidence: 'Low' | 'Medium' | 'High';
  wagePrediction: WagePredictionLevel;
  tsiPrediction?: SkillPredictionLevel;
  isDetectable: boolean;
  debugInfo?: SkillPredictionDebug;
}

export interface SkillCoefficients {
  a: number; // Base coefficient
  b: number; // Power coefficient  
  c: number; // Secondary skill multiplier
  d: number; // High wage multiplier
}

export interface NeuralNetworkWeights {
  meanp: number[];
  stdp: number[];
  meant: number;
  stdt: number;
  IW: number[][];
  LW: number[];
}