# Hattrick Steptrading Application - Technical Requirements Document

## 1. System Overview and Purpose

### 1.1 Application Purpose
The Hattrick Steptrading Application is a specialized web-based tool designed to help Hattrick football managers track, analyze, and optimize their player trading activities. The system manages player purchases, sales, and profit/loss calculations according to Hattrick's unique game mechanics.

### 1.2 Core Objectives
- Track player acquisitions and sales with precise timing
- Calculate accurate profit/loss using Hattrick-specific formulas
- Manage salary expenses based on ownership duration
- Provide comprehensive reporting and analytics
- Support multiple trading strategies and scenarios

### 1.3 Target Users
- Primary: Hattrick team managers actively engaged in player trading
- Secondary: Hattrick communities and trading advisors

## 2. User Authentication Requirements

### 2.1 Authentication System
- **Method**: NextAuth.js integration with multiple providers
- **Supported Providers**: 
  - Email/Password authentication
  - OAuth providers (Google, GitHub)
  - Future: Hattrick OAuth integration (if available)

### 2.2 User Management
- **Registration**: Email verification required
- **Password Policy**: Minimum 8 characters, mixed case, numbers
- **Session Management**: 30-day remember me option
- **Account Recovery**: Email-based password reset

### 2.3 Authorization Levels
- **Standard User**: Full access to personal trading data
- **Admin**: System administration and user management
- **Future**: Team-based sharing capabilities

## 3. Player Management Features

### 3.1 Player Data Model
```typescript
interface Player {
  id: string
  name: string
  age: {
    years: number
    days: number
  }
  position: string
  nationality: string
  speciality?: string
  form: number
  stamina: number
  skills: {
    keeper?: number
    defending?: number
    playmaking?: number
    winger?: number
    passing?: number
    scoring?: number
    setPieces?: number
  }
  purchaseDetails: {
    date: Date
    price: number
    fromTeam?: string
    hattrickWeek: number
    hattrickSeason: number
  }
  currentStatus: 'owned' | 'sold' | 'transferred'
}
```

### 3.2 Player CRUD Operations
- **Create Player**: Add new player with complete details
- **Update Player**: Modify player information and skills
- **View Player**: Display comprehensive player profile
- **Delete Player**: Remove player record (with confirmation)
- **Bulk Import**: CSV/Excel import functionality

### 3.3 Player Search and Filtering
- **Search**: By name, position, nationality
- **Filter**: By age range, skill levels, purchase date
- **Sort**: By various criteria (age, purchase price, profit)

## 4. Transaction Management

### 4.1 Transaction Types
- **Purchase**: Player acquisition with full details
- **Sale**: Player sale with percentage calculation
- **Transfer**: Free transfer handling
- **Loan**: Future feature for loan transactions

### 4.2 Purchase Transaction Model
```typescript
interface PurchaseTransaction {
  id: string
  playerId: string
  purchaseDate: Date
  purchasePrice: number
  fromTeam?: string
  notes?: string
  hattrickWeek: number
  hattrickSeason: number
}
```

### 4.3 Sale Transaction Model
```typescript
interface SaleTransaction {
  id: string
  playerId: string
  saleDate: Date
  salePrice: number
  percentageKept: number // 0-93%
  toTeam?: string
  notes?: string
  hattrickWeek: number
  hattrickSeason: number
}
```

### 4.4 Transaction Rules
- **Maximum Percentage**: 93% on player sales
- **Minimum Percentage**: 0% (complete loss)
- **Date Validation**: Sale date must be after purchase date
- **Price Validation**: Positive values only

## 5. Profit/Loss Calculation Logic

### 5.1 Hattrick Time System
- **Hattrick Year**: 112 days (16 weeks)
- **Hattrick Week**: 7 days
- **Update Schedule**: Fridays (salary calculation day)

### 5.2 Core Profit Formula
```typescript
const calculateProfit = (
  saleValue: number,
  percentageKept: number,
  weeklyExpenses: number,
  weeksOwned: number,
  purchaseValue: number
): number => {
  const netSaleValue = saleValue * (percentageKept / 100)
  const totalSalaryCost = weeklyExpenses * weeksOwned
  return netSaleValue - totalSalaryCost - purchaseValue
}
```

### 5.3 Ownership Duration Calculation
```typescript
const calculateWeeksOwned = (
  purchaseDate: Date,
  saleDate: Date
): number => {
  const daysDifference = Math.floor(
    (saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  return Math.ceil(daysDifference / 7) // Round up to account for partial weeks
}
```

### 5.4 Salary Cost Calculation
- **Basis**: Weekly salary amount
- **Calculation Period**: From purchase Friday to sale Friday
- **Partial Weeks**: Count as full weeks (rounded up)
- **Salary Changes**: Track historical salary changes during ownership

### 5.5 Age Progression
```typescript
const calculateAgeProgression = (
  initialAge: { years: number, days: number },
  daysOwned: number
): { years: number, days: number } => {
  const totalDays = initialAge.days + daysOwned
  const additionalYears = Math.floor(totalDays / 112)
  const remainingDays = totalDays % 112
  
  return {
    years: initialAge.years + additionalYears,
    days: remainingDays
  }
}
```

## 6. Database Schema Requirements

### 6.1 Technology Stack
- **ORM**: Prisma
- **Database**: PostgreSQL (production), SQLite (development)
- **Migrations**: Prisma migrate

### 6.2 Core Tables

#### Users Table
```sql
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  players       Player[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

#### Players Table
```sql
model Player {
  id                String              @id @default(cuid())
  name              String
  ageYears          Int
  ageDays           Int
  position          String
  nationality       String
  speciality        String?
  form              Int
  stamina           Int
  keeper            Int?
  defending         Int?
  playmaking        Int?
  winger            Int?
  passing           Int?
  scoring           Int?
  setPieces         Int?
  purchaseDate      DateTime
  purchasePrice     Int
  fromTeam          String?
  currentStatus     PlayerStatus        @default(OWNED)
  userId            String
  user              User                @relation(fields: [userId], references: [id])
  saleTransactions  SaleTransaction[]
  salaryHistory     SalaryHistory[]
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
}
```

#### Sale Transactions Table
```sql
model SaleTransaction {
  id             String   @id @default(cuid())
  playerId       String
  player         Player   @relation(fields: [playerId], references: [id])
  saleDate       DateTime
  salePrice      Int
  percentageKept Int
  toTeam         String?
  notes          String?
  profitLoss     Int      // Calculated and stored
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### Salary History Table
```sql
model SalaryHistory {
  id         String   @id @default(cuid())
  playerId   String
  player     Player   @relation(fields: [playerId], references: [id])
  weeklyPay  Int
  startDate  DateTime
  endDate    DateTime?
  createdAt  DateTime @default(now())
}
```

### 6.3 Enums
```sql
enum PlayerStatus {
  OWNED
  SOLD
  TRANSFERRED
}
```

## 7. Reporting and Analytics

### 7.1 Dashboard Requirements
- **Overview Cards**: Total players, total invested, current value, P&L
- **Recent Activity**: Latest purchases, sales, and transactions
- **Performance Metrics**: ROI, average holding period, success rate

### 7.2 Detailed Reports
- **Player Portfolio**: Current holdings with projected values
- **Transaction History**: Filterable transaction log
- **Profit/Loss Statement**: Detailed P&L breakdown
- **Age Analysis**: Player age distribution and trends

### 7.3 Analytics Features
- **Trend Analysis**: Performance over time
- **Position Analysis**: Profitability by position
- **Market Analysis**: Price trends and opportunities

### 7.4 Export Capabilities
- **CSV Export**: For external analysis
- **PDF Reports**: Formatted reports for sharing
- **Data Backup**: Complete data export

## 8. Security Requirements

### 8.1 Data Protection
- **Encryption**: All sensitive data encrypted at rest
- **Transmission**: HTTPS/TLS 1.3 for all communications
- **Session Security**: Secure session management

### 8.2 Input Validation
- **Server-side Validation**: All inputs validated on server
- **Sanitization**: XSS prevention through input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse

### 8.3 Access Control
- **User Isolation**: Users can only access their own data
- **Admin Controls**: Separate admin interface with audit logs
- **API Security**: JWT tokens for API authentication

### 8.4 Data Backup and Recovery
- **Regular Backups**: Daily automated backups
- **Data Retention**: Configurable data retention policies
- **Disaster Recovery**: Recovery procedures documented

## 9. Performance Requirements

### 9.1 Response Time Targets
- **Page Load**: < 2 seconds for initial load
- **API Responses**: < 500ms for standard operations
- **Complex Calculations**: < 1 second for profit/loss calculations
- **Search Results**: < 1 second for player searches

### 9.2 Scalability Requirements
- **Concurrent Users**: Support 100+ concurrent users
- **Data Volume**: Handle 10,000+ players per user
- **Database Performance**: Optimized queries with proper indexing

### 9.3 Caching Strategy
- **Server-side Caching**: Redis for session and calculation caching
- **Client-side Caching**: Browser caching for static assets
- **Database Caching**: Query result caching for expensive operations

### 9.4 Monitoring and Logging
- **Application Monitoring**: Error tracking and performance monitoring
- **User Analytics**: Usage patterns and feature adoption
- **System Health**: Infrastructure monitoring and alerts

## 10. Technical Implementation Notes

### 10.1 Frontend Requirements
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS with component library
- **State Management**: React Context API or Zustand
- **Forms**: React Hook Form with Zod validation

### 10.2 Backend Requirements
- **API**: Next.js API routes
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: NextAuth.js
- **Validation**: Zod schema validation

### 10.3 Development Standards
- **TypeScript**: Strict mode enabled
- **Code Quality**: ESLint and Prettier configuration
- **Testing**: Jest for unit tests, Playwright for E2E
- **Documentation**: JSDoc for complex functions

### 10.4 Deployment Requirements
- **Platform**: Vercel (preferred) or similar
- **Database**: PostgreSQL (Supabase, PlanetScale, or similar)
- **Environment**: Staging and production environments
- **CI/CD**: Automated testing and deployment pipeline

## 11. Future Enhancements

### 11.1 Phase 2 Features
- **Team Sharing**: Multi-user team management
- **Market Integration**: Real-time Hattrick market data
- **Advanced Analytics**: ML-powered insights
- **Mobile App**: React Native mobile application

### 11.2 Integration Possibilities
- **Hattrick API**: Direct integration with Hattrick systems
- **External Tools**: Integration with popular Hattrick tools
- **Data Import**: Import from existing spreadsheets or tools

This technical requirements document serves as the foundation for implementing the Hattrick Steptrading Application, ensuring all Hattrick-specific business rules and calculations are properly implemented while maintaining high standards for security, performance, and user experience.