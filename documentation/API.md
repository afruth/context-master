# API Documentation

## API Architecture
- **Framework**: Next.js API Routes
- **Authentication**: NextAuth.js with JWT tokens
- **Database**: Prisma ORM with SQLite
- **Validation**: Zod schemas for runtime type validation
- **Error Handling**: Standardized error responses with proper HTTP status codes
- **Security**: bcryptjs password hashing, input sanitization, and user-scoped data access

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}
```

**Response:**
```typescript
interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}
```

**Example:**
```json
// Request
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

// Response (201 Created)
{
  "message": "User created successfully",
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### NextAuth.js Endpoints
- `/api/auth/[...nextauth]` - NextAuth.js authentication handlers
  - `POST /api/auth/signin` - User login
  - `POST /api/auth/signout` - User logout
  - `GET /api/auth/session` - Get current session
  - `GET /api/auth/csrf` - CSRF token

## Player Management Endpoints

### GET /api/players
Retrieve user's players with optional filtering and pagination.

**Query Parameters:**
```typescript
interface PlayersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'owned' | 'sold' | 'all';
  sortBy?: 'name' | 'purchaseDate' | 'currentValue' | 'profit';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface PlayersResponse {
  data: Player[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  position: string;
  skill: number;
  form: number;
  experience: number;
  leadership: number;
  purchasePrice: number;
  purchaseDate: string;
  currentValue?: number;
  status: 'owned' | 'sold';
  estimatedProfit?: number;
  createdAt: string;
  updatedAt: string;
}
```

### POST /api/players
Create a new player record.

**Request Body:**
```typescript
interface CreatePlayerRequest {
  name: string;
  age: number;
  nationality: string;
  position: string;
  skill: number;
  form?: number;
  experience?: number;
  leadership?: number;
  purchasePrice: number;
  purchaseDate: string;
  notes?: string;
}
```

### GET /api/players/[id]
Retrieve a specific player with transaction history.

**Response:**
```typescript
interface PlayerDetailResponse {
  data: Player & {
    transactions: Transaction[];
    totalProfit: number;
    profitMargin: number;
  };
}
```

### PUT /api/players/[id]
Update a player's information.

### DELETE /api/players/[id]
Soft delete a player (marks as inactive).

## Transaction Endpoints

### GET /api/transactions
Retrieve user's transactions with filtering and pagination.

**Query Parameters:**
```typescript
interface TransactionsQuery {
  page?: number;
  limit?: number;
  type?: 'purchase' | 'sale' | 'all';
  playerId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'amount' | 'profit';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface TransactionsResponse {
  data: Transaction[];
  pagination: PaginationInfo;
  summary: {
    totalPurchases: number;
    totalSales: number;
    totalProfit: number;
    profitMargin: number;
  };
}

interface Transaction {
  id: string;
  type: 'purchase' | 'sale';
  playerId: string;
  playerName: string;
  amount: number;
  date: string;
  profit?: number;
  profitMargin?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### POST /api/transactions
Record a new transaction (purchase or sale).

**Request Body:**
```typescript
interface CreateTransactionRequest {
  type: 'purchase' | 'sale';
  playerId: string;
  amount: number;
  date: string;
  notes?: string;
}
```

**Response:**
```typescript
interface CreateTransactionResponse {
  data: Transaction & {
    calculatedProfit?: number;
    updatedPlayerStatus?: string;
  };
  message: string;
}
```

### GET /api/transactions/[id]
Retrieve a specific transaction with related calculations.

### PUT /api/transactions/[id]
Update a transaction (creates correction entry for audit trail).

### DELETE /api/transactions/[id]
Soft delete a transaction (marks as cancelled).

## Calculation Endpoints

### GET /api/calculations/profit-loss
Calculate comprehensive profit/loss analysis.

**Query Parameters:**
```typescript
interface ProfitLossQuery {
  startDate?: string;
  endDate?: string;
  playerId?: string;
  groupBy?: 'month' | 'quarter' | 'year';
}
```

**Response:**
```typescript
interface ProfitLossResponse {
  data: {
    totalInvestment: number;
    totalReturns: number;
    totalProfit: number;
    profitMargin: number;
    activePlayers: number;
    soldPlayers: number;
    avgProfitPerPlayer: number;
    breakdownByPeriod?: PeriodBreakdown[];
    topPerformers: PlayerProfit[];
  };
}

interface PeriodBreakdown {
  period: string;
  investment: number;
  returns: number;
  profit: number;
  margin: number;
}

interface PlayerProfit {
  playerId: string;
  playerName: string;
  profit: number;
  margin: number;
  transactions: number;
}
```

### GET /api/calculations/projections
Calculate projected values and potential profits.

**Response:**
```typescript
interface ProjectionsResponse {
  data: {
    portfolioValue: number;
    projectedValue: number;
    potentialProfit: number;
    playerProjections: PlayerProjection[];
  };
}

interface PlayerProjection {
  playerId: string;
  playerName: string;
  currentValue: number;
  projectedValue: number;
  potentialProfit: number;
  confidence: 'high' | 'medium' | 'low';
}
```

### POST /api/calculations/bulk-update
Trigger bulk recalculation of player values and profits.

**Request Body:**
```typescript
interface BulkUpdateRequest {
  playerIds?: string[];
  updateMarketValues?: boolean;
  recalculateProfits?: boolean;
}
```

## Reporting Endpoints

### GET /api/reports/summary
Generate comprehensive trading summary report.

**Query Parameters:**
```typescript
interface SummaryReportQuery {
  period?: 'week' | 'month' | 'quarter' | 'year' | 'all';
  startDate?: string;
  endDate?: string;
}
```

**Response:**
```typescript
interface SummaryReportResponse {
  data: {
    period: string;
    overview: {
      totalInvestment: number;
      totalReturns: number;
      totalProfit: number;
      profitMargin: number;
      transactionCount: number;
    };
    performance: {
      bestMonth: MonthlyPerformance;
      worstMonth: MonthlyPerformance;
      avgMonthlyProfit: number;
      profitTrend: TrendData[];
    };
    players: {
      mostProfitable: PlayerSummary[];
      leastProfitable: PlayerSummary[];
      quickestSales: PlayerSummary[];
    };
  };
}
```

### GET /api/reports/export
Export trading data in various formats.

**Query Parameters:**
```typescript
interface ExportQuery {
  format: 'csv' | 'xlsx' | 'json';
  type: 'transactions' | 'players' | 'summary';
  startDate?: string;
  endDate?: string;
}
```

**Response:** File download with appropriate content-type headers.

### GET /api/reports/tax
Generate tax reporting data.

**Response:**
```typescript
interface TaxReportResponse {
  data: {
    taxYear: number;
    totalCapitalGains: number;
    totalCapitalLosses: number;
    netCapitalGain: number;
    transactions: TaxTransaction[];
  };
}

interface TaxTransaction {
  playerId: string;
  playerName: string;
  purchaseDate: string;
  saleDate: string;
  purchasePrice: number;
  salePrice: number;
  capitalGain: number;
  holdingPeriod: number;
}
```

## API Standards

### Request Format
- **Content-Type**: `application/json`
- **Authentication**: Bearer token in Authorization header
- **Validation**: All inputs validated with Zod schemas

### Response Format
All API responses follow a consistent structure:

```typescript
// Success Response
interface SuccessResponse<T> {
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Error Response
interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

### HTTP Status Codes
- `200` - OK (successful GET, PUT)
- `201` - Created (successful POST)
- `204` - No Content (successful DELETE)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

### Error Handling
```typescript
// Validation Error (400)
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}

// Authentication Error (401)
{
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}

// Not Found Error (404)
{
  "error": "Player not found",
  "code": "PLAYER_NOT_FOUND"
}
```

## Rate Limiting
- **General Endpoints**: 100 requests per minute per user
- **Authentication Endpoints**: 5 requests per minute per IP
- **Calculation Endpoints**: 20 requests per minute per user
- **Export Endpoints**: 5 requests per hour per user

Rate limit headers included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Time when rate limit resets

## Security

### Authentication Flow
1. User registers via `/api/auth/register`
2. User logs in via NextAuth.js endpoints
3. JWT token issued and stored in httpOnly cookie
4. Token validated on each protected API request
5. User data scoped to authenticated user

### Data Protection
- **Input Validation**: All inputs validated with Zod schemas
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Prevention**: Input sanitization and CSP headers
- **CSRF Protection**: NextAuth.js CSRF tokens
- **Data Encryption**: Sensitive data encrypted at rest

### API Security Headers
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```