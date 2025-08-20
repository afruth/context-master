# Hattrick Steptrading Application - Technical Refinement Document

## 1. Architecture Overview

### 1.1 High-Level Architecture
The Hattrick Steptrading Application is built on a modern full-stack architecture using Next.js 14 with App Router, providing both frontend and backend capabilities in a single application.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│ Next.js 14 App Router │ React 19 │ TypeScript │ Tailwind CSS   │
├─────────────────────────────────────────────────────────────────┤
│                      API Layer (Next.js API Routes)            │
├─────────────────────────────────────────────────────────────────┤
│ NextAuth.js Auth │ Business Logic │ Validation │ Error Handling │
├─────────────────────────────────────────────────────────────────┤
│                      Data Access Layer                         │
├─────────────────────────────────────────────────────────────────┤
│                    Prisma ORM │ SQLite Database                │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack
- **Frontend Framework**: Next.js 14 with App Router
- **Runtime**: React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with Radix UI components
- **Database**: SQLite with Prisma ORM v6.14.0
- **Authentication**: NextAuth.js v5.0 (beta)
- **Password Hashing**: bcryptjs
- **Component Architecture**: Class Variance Authority (CVA) for styling variants

### 1.3 File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── steptrading/   # Steptrading business logic endpoints
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   ├── ui/                # Base UI components (Radix + CVA)
│   └── steptrading/       # Business-specific components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Utility functions
└── types/                # TypeScript type definitions
```

## 2. Database Schema Design

### 2.1 Core Models
The database schema supports the steptrading calculation system with proper relationships and constraints.

```prisma
// User Management
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String?   @unique
  password      String    // bcrypt hashed
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Authentication
  sessions      Session[]
  
  // Business Logic
  portfolios    Portfolio[]
  calculations  Calculation[]
  
  @@index([email])
  @@index([username])
}

// Session Management
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([sessionToken])
  @@index([userId])
}

// Steptrading Core Models
model Portfolio {
  id          String      @id @default(cuid())
  name        String
  description String?
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  positions   Position[]
  calculations Calculation[]
  
  @@index([userId])
  @@index([userId, isActive])
}

model Position {
  id              String      @id @default(cuid())
  portfolioId     String
  portfolio       Portfolio   @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  playerName      String
  playerId        String?     // Hattrick player ID
  
  // Position Details
  currentValue    Decimal     @db.Decimal(15,2)  // Current market value
  purchasePrice   Decimal     @db.Decimal(15,2)  // Original purchase price
  purchaseDate    DateTime
  quantity        Int         @default(1)
  
  // Steptrading Configuration
  stepSize        Decimal     @db.Decimal(10,2)  // Step size for calculations
  targetProfit    Decimal?    @db.Decimal(5,2)   // Target profit percentage
  stopLoss        Decimal?    @db.Decimal(5,2)   // Stop loss percentage
  
  // Status
  isActive        Boolean     @default(true)
  positionType    PositionType @default(LONG)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  calculations    Calculation[]
  transactions    Transaction[]
  
  @@index([portfolioId])
  @@index([playerId])
  @@index([portfolioId, isActive])
}

model Calculation {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolioId     String?
  portfolio       Portfolio?  @relation(fields: [portfolioId], references: [id], onDelete: SetNull)
  positionId      String?
  position        Position?   @relation(fields: [positionId], references: [id], onDelete: SetNull)
  
  // Calculation Input
  inputData       Json        // Flexible input parameters
  calculationType CalculationType
  
  // Calculation Results
  results         Json        // Calculation output
  profitLoss      Decimal?    @db.Decimal(15,2)
  roi             Decimal?    @db.Decimal(5,4)   // Return on Investment
  
  // Metadata
  notes           String?
  isBookmarked    Boolean     @default(false)
  tags            String[]    // Array of tags for organization
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([userId])
  @@index([portfolioId])
  @@index([positionId])
  @@index([calculationType])
  @@index([createdAt])
}

model Transaction {
  id          String          @id @default(cuid())
  positionId  String
  position    Position        @relation(fields: [positionId], references: [id], onDelete: Cascade)
  
  // Transaction Details
  type        TransactionType
  quantity    Int
  price       Decimal         @db.Decimal(15,2)
  fee         Decimal?        @db.Decimal(10,2) // Transaction fees
  
  // Timing
  executedAt  DateTime
  createdAt   DateTime        @default(now())
  
  @@index([positionId])
  @@index([executedAt])
}

// Enums
enum PositionType {
  LONG
  SHORT
}

enum CalculationType {
  STEPTRADING_BASIC
  STEPTRADING_ADVANCED
  PROFIT_LOSS
  ROI_ANALYSIS
  RISK_ASSESSMENT
}

enum TransactionType {
  BUY
  SELL
  DIVIDEND
  FEE
}
```

### 2.2 Database Constraints & Indexes

**Primary Indexes:**
- All models have `id` as primary key with `cuid()` generation
- Unique constraints on `User.email`, `User.username`, `Session.sessionToken`

**Performance Indexes:**
- `User`: `[email]`, `[username]` for auth lookups
- `Session`: `[sessionToken]`, `[userId]` for session management
- `Portfolio`: `[userId]`, `[userId, isActive]` for user portfolio queries
- `Position`: `[portfolioId]`, `[playerId]`, `[portfolioId, isActive]`
- `Calculation`: `[userId]`, `[portfolioId]`, `[positionId]`, `[calculationType]`, `[createdAt]`
- `Transaction`: `[positionId]`, `[executedAt]`

**Data Integrity:**
- Cascading deletes: User deletion removes sessions, portfolios, calculations
- Portfolio deletion removes positions and calculations
- Position deletion removes transactions and calculations
- Soft deletes using `isActive` flags for business data

## 3. API Endpoint Specifications

### 3.1 API Structure
All API endpoints follow RESTful conventions with consistent request/response formats.

**Base URL:** `/api`
**Authentication:** JWT tokens via NextAuth.js sessions

### 3.2 Authentication Endpoints

#### POST /api/auth/register
```typescript
// Request
interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  username?: string;
}

// Response
interface RegisterResponse {
  data: {
    id: string;
    email: string;
    name?: string;
  };
  message: string;
}
```

#### NextAuth.js Routes
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handlers
- Supports credentials provider with email/password

### 3.3 Portfolio Management

#### GET /api/portfolios
```typescript
// Query Parameters
interface PortfolioQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

// Response
interface PortfolioListResponse {
  data: Portfolio[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### POST /api/portfolios
```typescript
// Request
interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

// Response
interface PortfolioResponse {
  data: Portfolio;
  message: string;
}
```

#### GET /api/portfolios/[id]
#### PUT /api/portfolios/[id]
#### DELETE /api/portfolios/[id]

### 3.4 Position Management

#### GET /api/portfolios/[portfolioId]/positions
#### POST /api/portfolios/[portfolioId]/positions
```typescript
// Request
interface CreatePositionRequest {
  playerName: string;
  playerId?: string;
  currentValue: number;
  purchasePrice: number;
  purchaseDate: string;
  quantity: number;
  stepSize: number;
  targetProfit?: number;
  stopLoss?: number;
  positionType: 'LONG' | 'SHORT';
}
```

#### GET /api/positions/[id]
#### PUT /api/positions/[id]
#### DELETE /api/positions/[id]

### 3.5 Steptrading Calculations

#### POST /api/calculations/steptrading
```typescript
// Request
interface SteptradingCalculationRequest {
  positionId?: string;
  portfolioId?: string;
  calculationType: 'STEPTRADING_BASIC' | 'STEPTRADING_ADVANCED';
  inputData: {
    currentPrice: number;
    stepSize: number;
    targetSteps: number;
    riskTolerance?: number;
  };
  notes?: string;
  tags?: string[];
}

// Response
interface CalculationResponse {
  data: {
    id: string;
    calculationType: string;
    results: {
      steps: SteptradingStep[];
      totalProfit: number;
      totalRisk: number;
      roi: number;
      breakEvenPoint: number;
      recommendations: string[];
    };
    profitLoss: number;
    roi: number;
    createdAt: string;
  };
}

interface SteptradingStep {
  stepNumber: number;
  price: number;
  quantity: number;
  investment: number;
  cumulativeInvestment: number;
  breakEven: number;
  profit: number;
}
```

#### GET /api/calculations
#### GET /api/calculations/[id]
#### PUT /api/calculations/[id]
#### DELETE /api/calculations/[id]

### 3.6 Data Export

#### GET /api/export/portfolio/[portfolioId]
```typescript
// Query Parameters
interface ExportQuery {
  format: 'csv' | 'json' | 'xlsx';
  includeCalculations?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}
```

## 4. Authentication & Authorization Strategy

### 4.1 NextAuth.js Configuration
```typescript
// lib/auth.ts
export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Email/password validation
        // bcrypt password comparison
        // Return user object or null
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) { /* JWT customization */ },
    async session({ session, token }) { /* Session customization */ }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET
}
```

### 4.2 Route Protection
**Middleware Implementation:**
```typescript
// middleware.ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth()
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  // Protect API routes
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/auth/')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/portfolios/:path*',
    '/api/positions/:path*',
    '/api/calculations/:path*'
  ]
}
```

### 4.3 API Authentication Pattern
```typescript
// Standard API route authentication
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Route logic with userId = session.user.id
    return NextResponse.json({ data: result })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

### 4.4 Password Security
- **Hashing**: bcryptjs with default salt rounds (10)
- **Storage**: Never store plain text passwords
- **Validation**: Minimum 8 characters, complexity requirements
- **Sessions**: JWT-based with configurable expiration

## 5. Business Logic Implementation

### 5.1 Steptrading Calculation Engine

#### Core Algorithm
```typescript
interface SteptradingConfig {
  initialPrice: number;
  stepSize: number;
  targetSteps: number;
  riskTolerance: number;
  positionType: 'LONG' | 'SHORT';
}

interface SteptradingResult {
  steps: SteptradingStep[];
  totalInvestment: number;
  totalProfit: number;
  roi: number;
  breakEvenPoint: number;
  riskAnalysis: RiskAnalysis;
}

class SteptradingCalculator {
  static calculate(config: SteptradingConfig): SteptradingResult {
    const steps: SteptradingStep[] = [];
    let cumulativeInvestment = 0;
    
    for (let i = 1; i <= config.targetSteps; i++) {
      const stepPrice = this.calculateStepPrice(config.initialPrice, config.stepSize, i, config.positionType);
      const quantity = this.calculateQuantity(i, config.riskTolerance);
      const investment = stepPrice * quantity;
      cumulativeInvestment += investment;
      
      const step: SteptradingStep = {
        stepNumber: i,
        price: stepPrice,
        quantity: quantity,
        investment: investment,
        cumulativeInvestment: cumulativeInvestment,
        breakEven: this.calculateBreakEven(steps),
        profit: this.calculateStepProfit(stepPrice, config.initialPrice, quantity)
      };
      
      steps.push(step);
    }
    
    return {
      steps,
      totalInvestment: cumulativeInvestment,
      totalProfit: this.calculateTotalProfit(steps),
      roi: this.calculateROI(steps, cumulativeInvestment),
      breakEvenPoint: this.calculateOverallBreakEven(steps),
      riskAnalysis: this.analyzeRisk(steps, config)
    };
  }
  
  private static calculateStepPrice(initialPrice: number, stepSize: number, stepNumber: number, type: 'LONG' | 'SHORT'): number {
    if (type === 'LONG') {
      return initialPrice - (stepSize * stepNumber);
    } else {
      return initialPrice + (stepSize * stepNumber);
    }
  }
  
  private static calculateQuantity(stepNumber: number, riskTolerance: number): number {
    // Implement quantity scaling based on step and risk tolerance
    return Math.floor(riskTolerance * stepNumber);
  }
  
  // Additional calculation methods...
}
```

#### Advanced Calculations
```typescript
interface RiskAnalysis {
  maxDrawdown: number;
  valueAtRisk: number;
  expectedReturn: number;
  sharpeRatio: number;
  recommendations: string[];
}

class AdvancedCalculations {
  static calculateMaxDrawdown(steps: SteptradingStep[]): number {
    // Calculate maximum potential loss
  }
  
  static calculateValueAtRisk(steps: SteptradingStep[], confidenceLevel: number = 0.95): number {
    // VaR calculation for risk assessment
  }
  
  static generateRecommendations(analysis: RiskAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (analysis.maxDrawdown > 0.2) {
      recommendations.push("Consider reducing position sizes due to high drawdown risk");
    }
    
    if (analysis.sharpeRatio < 1.0) {
      recommendations.push("Risk-adjusted returns are below optimal threshold");
    }
    
    return recommendations;
  }
}
```

### 5.2 Financial Calculations
```typescript
class FinancialCalculations {
  static calculateROI(investment: number, currentValue: number): number {
    return ((currentValue - investment) / investment) * 100;
  }
  
  static calculateCompoundGrowth(principal: number, rate: number, time: number, frequency: number = 1): number {
    return principal * Math.pow(1 + (rate / frequency), frequency * time);
  }
  
  static calculateBreakEvenPrice(positions: Position[]): number {
    const totalCost = positions.reduce((sum, pos) => sum + (pos.purchasePrice * pos.quantity), 0);
    const totalQuantity = positions.reduce((sum, pos) => sum + pos.quantity, 0);
    return totalCost / totalQuantity;
  }
}
```

## 6. Data Validation Rules

### 6.1 Input Validation Schema
Using Zod for runtime type checking and validation:

```typescript
import { z } from 'zod';

// User Registration
export const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50).optional()
});

// Portfolio Creation
export const portfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required').max(100),
  description: z.string().max(500).optional()
});

// Position Creation
export const positionSchema = z.object({
  playerName: z.string().min(1, 'Player name is required').max(100),
  playerId: z.string().max(50).optional(),
  currentValue: z.number().positive('Current value must be positive').max(999999999.99),
  purchasePrice: z.number().positive('Purchase price must be positive').max(999999999.99),
  purchaseDate: z.string().datetime('Invalid date format'),
  quantity: z.number().int().positive('Quantity must be a positive integer').max(1000000),
  stepSize: z.number().positive('Step size must be positive').max(999999.99),
  targetProfit: z.number().min(0.01).max(100).optional(), // 0.01% to 100%
  stopLoss: z.number().min(0.01).max(100).optional(),
  positionType: z.enum(['LONG', 'SHORT'])
});

// Steptrading Calculation
export const steptradingCalculationSchema = z.object({
  positionId: z.string().cuid().optional(),
  portfolioId: z.string().cuid().optional(),
  calculationType: z.enum(['STEPTRADING_BASIC', 'STEPTRADING_ADVANCED']),
  inputData: z.object({
    currentPrice: z.number().positive('Current price must be positive'),
    stepSize: z.number().positive('Step size must be positive'),
    targetSteps: z.number().int().min(1).max(50),
    riskTolerance: z.number().min(0.01).max(1).optional()
  }),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional()
});
```

### 6.2 Server-Side Validation
```typescript
// API route validation pattern
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = positionSchema.parse(body);
    
    // Additional business logic validation
    if (validatedData.targetProfit && validatedData.stopLoss && 
        validatedData.targetProfit <= validatedData.stopLoss) {
      return NextResponse.json(
        { error: 'Target profit must be greater than stop loss' },
        { status: 400 }
      );
    }
    
    // Process validated data
    const result = await createPosition(validatedData);
    return NextResponse.json({ data: result });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### 6.3 Client-Side Validation
```typescript
// React Hook Form with Zod resolver
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface PositionFormProps {
  onSubmit: (data: PositionFormData) => void;
}

export function PositionForm({ onSubmit }: PositionFormProps) {
  const form = useForm<z.infer<typeof positionSchema>>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      playerName: '',
      quantity: 1,
      positionType: 'LONG'
    }
  });
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Form fields with validation */}
    </form>
  );
}
```

## 7. Performance Optimizations

### 7.1 Database Query Optimization
```typescript
// Efficient query patterns
class OptimizedQueries {
  // Use select to limit returned fields
  static async getUserPortfolios(userId: string) {
    return prisma.portfolio.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: { positions: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
  
  // Use include for necessary relations only
  static async getPortfolioWithPositions(portfolioId: string) {
    return prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        positions: {
          where: { isActive: true },
          select: {
            id: true,
            playerName: true,
            currentValue: true,
            purchasePrice: true,
            quantity: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { calculations: true }
        }
      }
    });
  }
  
  // Implement pagination for large datasets
  static async getPaginatedCalculations(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    
    const [calculations, total] = await Promise.all([
      prisma.calculation.findMany({
        where: { userId },
        skip,
        take: limit,
        select: {
          id: true,
          calculationType: true,
          profitLoss: true,
          roi: true,
          createdAt: true,
          portfolio: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.calculation.count({
        where: { userId }
      })
    ]);
    
    return {
      data: calculations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
```

### 7.2 Caching Strategy
```typescript
// Redis caching for expensive calculations
import Redis from 'ioredis';

class CacheManager {
  private static redis = new Redis(process.env.REDIS_URL);
  
  static async getCachedCalculation(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(`calc:${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
  
  static async setCachedCalculation(key: string, data: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.setex(`calc:${key}`, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache write failed:', error);
    }
  }
  
  static generateCacheKey(params: any): string {
    return Buffer.from(JSON.stringify(params)).toString('base64');
  }
}

// Usage in calculation endpoint
export async function POST(request: NextRequest) {
  const body = await request.json();
  const cacheKey = CacheManager.generateCacheKey(body.inputData);
  
  // Check cache first
  let result = await CacheManager.getCachedCalculation(cacheKey);
  
  if (!result) {
    // Perform calculation
    result = SteptradingCalculator.calculate(body.inputData);
    
    // Cache result
    await CacheManager.setCachedCalculation(cacheKey, result);
  }
  
  return NextResponse.json({ data: result });
}
```

### 7.3 Frontend Performance
```typescript
// React optimizations
import { memo, useMemo, useCallback } from 'react';

// Memoized calculation component
export const CalculationResults = memo(function CalculationResults({
  steps,
  totalInvestment,
  roi
}: CalculationResultsProps) {
  const formattedResults = useMemo(() => ({
    formattedInvestment: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(totalInvestment),
    formattedRoi: `${roi.toFixed(2)}%`
  }), [totalInvestment, roi]);
  
  return (
    <div>
      <p>Total Investment: {formattedResults.formattedInvestment}</p>
      <p>ROI: {formattedResults.formattedRoi}</p>
    </div>
  );
});

// Optimized data fetching with SWR
import useSWR from 'swr';

export function usePortfolios() {
  const { data, error, mutate } = useSWR('/api/portfolios', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000 // 1 minute
  });
  
  return {
    portfolios: data?.data || [],
    isLoading: !error && !data,
    error,
    mutate
  };
}
```

## 8. Error Handling Strategies

### 8.1 Global Error Handling
```typescript
// Global error boundary
'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Sentry, LogRocket, etc.
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="btn-primary"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 8.2 API Error Standards
```typescript
// Standardized error responses
interface APIError {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  path: string;
}

class APIErrorHandler {
  static handle(error: unknown, request: NextRequest): NextResponse {
    console.error('API Error:', error);
    
    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        })),
        timestamp: new Date().toISOString(),
        path: request.nextUrl.pathname
      } as APIError, { status: 400 });
    }
    
    // Database errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({
          error: 'Resource already exists',
          code: 'DUPLICATE_ERROR',
          timestamp: new Date().toISOString(),
          path: request.nextUrl.pathname
        } as APIError, { status: 409 });
      }
      
      if (error.code === 'P2025') {
        return NextResponse.json({
          error: 'Resource not found',
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
          path: request.nextUrl.pathname
        } as APIError, { status: 404 });
      }
    }
    
    // Default server error
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: request.nextUrl.pathname
    } as APIError, { status: 500 });
  }
}
```

### 8.3 Client Error Handling
```typescript
// React Query error handling
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useCreatePortfolio() {
  return useMutation({
    mutationFn: createPortfolio,
    onError: (error: APIError) => {
      if (error.code === 'VALIDATION_ERROR') {
        error.details?.forEach((detail: any) => {
          toast.error(`${detail.field}: ${detail.message}`);
        });
      } else {
        toast.error(error.error || 'Failed to create portfolio');
      }
    },
    onSuccess: () => {
      toast.success('Portfolio created successfully');
    }
  });
}
```

## 9. Testing Approach

### 9.1 Testing Strategy
- **Unit Tests**: Core business logic (calculation engine)
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Critical user flows
- **Component Tests**: React component behavior

### 9.2 Test Structure
```typescript
// Unit tests for calculation engine
import { SteptradingCalculator } from '@/lib/calculations';

describe('SteptradingCalculator', () => {
  describe('calculate', () => {
    it('should calculate correct steps for LONG position', () => {
      const config = {
        initialPrice: 100,
        stepSize: 5,
        targetSteps: 3,
        riskTolerance: 1,
        positionType: 'LONG' as const
      };
      
      const result = SteptradingCalculator.calculate(config);
      
      expect(result.steps).toHaveLength(3);
      expect(result.steps[0].price).toBe(95);
      expect(result.steps[1].price).toBe(90);
      expect(result.steps[2].price).toBe(85);
    });
    
    it('should handle edge cases gracefully', () => {
      const config = {
        initialPrice: 0.01,
        stepSize: 0.001,
        targetSteps: 1,
        riskTolerance: 0.1,
        positionType: 'LONG' as const
      };
      
      expect(() => SteptradingCalculator.calculate(config)).not.toThrow();
    });
  });
});

// API integration tests
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '@/app/api/portfolios/route';

describe('/api/portfolios', () => {
  it('GET returns user portfolios', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer mock-token'
          }
        });
        
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toBeInstanceOf(Array);
      }
    });
  });
});

// Component tests
import { render, screen, fireEvent } from '@testing-library/react';
import { PositionForm } from '@/components/position-form';

describe('PositionForm', () => {
  it('validates required fields', async () => {
    const onSubmit = jest.fn();
    render(<PositionForm onSubmit={onSubmit} />);
    
    fireEvent.click(screen.getByText('Create Position'));
    
    expect(await screen.findByText('Player name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

### 9.3 Test Configuration
```json
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

## 10. Deployment Considerations

### 10.1 Environment Configuration
```bash
# .env.example
# Database
DATABASE_URL="file:./dev.db"

# Authentication
AUTH_SECRET="your-super-secret-jwt-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: External services
REDIS_URL="redis://localhost:6379"
SENTRY_DSN="your-sentry-dsn"

# Hattrick API (if integrating)
HATTRICK_API_KEY="your-api-key"
HATTRICK_API_SECRET="your-api-secret"
```

### 10.2 Production Optimizations
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons']
  },
  
  // Compression
  compress: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
```

### 10.3 Database Migration Strategy
```bash
# Development migrations
npm run db:migrate

# Production deployment
npm run build
npm run db:push  # For SQLite, or proper migrations for PostgreSQL
npm start
```

### 10.4 Monitoring and Logging
```typescript
// lib/monitoring.ts
export function logError(error: Error, context?: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service
    console.error('Production Error:', error, context);
  } else {
    console.error('Development Error:', error, context);
  }
}

export function logPerformance(operation: string, duration: number) {
  if (duration > 1000) { // Log slow operations
    console.warn(`Slow operation detected: ${operation} took ${duration}ms`);
  }
}
```

### 10.5 Security Checklist
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Authentication tokens properly managed
- [ ] Sensitive data not logged
- [ ] CORS properly configured
- [ ] SQL injection prevention (Prisma handles this)

## Implementation Priority

### Phase 1: Core Foundation
1. Database schema implementation
2. Authentication system
3. Basic CRUD APIs for portfolios/positions
4. Core steptrading calculation engine

### Phase 2: Business Logic
1. Advanced calculation features
2. Risk analysis implementation
3. Data validation and error handling
4. Performance optimizations

### Phase 3: User Experience
1. Frontend components
2. Data visualization
3. Export functionality
4. Testing implementation

### Phase 4: Production Ready
1. Security hardening
2. Performance monitoring
3. Deployment optimization
4. Documentation completion

This technical refinement document provides a comprehensive foundation for building the Hattrick Steptrading Application with proper architecture, security, and scalability considerations.