# System Architecture

## High-Level Overview

Hattrick Steptrading is a sophisticated player trading management system designed for Hattrick football managers. The application enables users to track player acquisitions, manage sales, calculate profits/losses, and analyze trading performance over time.

### Core System Components:
- **User Management**: Secure authentication and profile management
- **Player Database**: Comprehensive player information and market data
- **Transaction Engine**: Purchase and sale transaction recording
- **Financial Calculator**: Real-time profit/loss calculations and projections
- **Reporting System**: Advanced analytics and export capabilities
- **Market Intelligence**: Price tracking and trend analysis

## Technology Stack
- **Frontend**: Next.js 14 with App Router
- **Backend**: Next.js API Routes with TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with JWT tokens
- **Styling**: Tailwind CSS + Radix UI
- **Language**: TypeScript with strict typing
- **Security**: bcryptjs for password hashing
- **Validation**: Zod for runtime type validation
- **Date Handling**: date-fns for financial calculations

## Data Flow

### Primary Data Flow Patterns:

1. **Player Acquisition Flow**:
   ```
   User Input → Validation → Player Creation/Update → Transaction Record → Profit Calculation → UI Update
   ```

2. **Sales Transaction Flow**:
   ```
   Sale Input → Player Lookup → Transaction Validation → Profit Calculation → Portfolio Update → Reporting
   ```

3. **Financial Analysis Flow**:
   ```
   Raw Transactions → Aggregation Engine → Profit Calculations → Performance Metrics → Dashboard/Reports
   ```

4. **Market Data Flow**:
   ```
   External APIs → Data Normalization → Price Analysis → Trend Calculations → Market Intelligence
   ```

## Key Architectural Decisions

### 1. Monolithic Next.js Architecture
- **Decision**: Single Next.js application with API routes
- **Rationale**: Simplifies deployment, reduces complexity for MVP, enables full-stack TypeScript
- **Trade-offs**: Limited independent scaling, but suitable for expected user base

### 2. SQLite with Prisma ORM
- **Decision**: SQLite for development/small-scale deployment
- **Rationale**: Zero-config database, excellent for prototyping and small-scale deployments
- **Migration Path**: Easy migration to PostgreSQL for production scaling

### 3. Server-Side Financial Calculations
- **Decision**: All profit/loss calculations performed server-side
- **Rationale**: Ensures data integrity, prevents client-side manipulation, centralized business logic
- **Implementation**: Dedicated calculation services with transaction atomicity

### 4. Immutable Transaction Records
- **Decision**: Transaction records are immutable once created
- **Rationale**: Maintains financial audit trail, prevents data corruption
- **Implementation**: Soft deletes and correction transactions for modifications

### 5. Real-time Profit Tracking
- **Decision**: Calculate profits on-demand rather than pre-computed aggregates
- **Rationale**: Ensures accuracy, handles complex scenarios (partial sales, multiple purchases)
- **Performance**: Optimized queries with proper indexing

## Security Architecture

### Authentication & Authorization
- **Primary Auth**: NextAuth.js with credentials provider
- **Session Management**: JWT tokens with secure httpOnly cookies
- **Password Security**: bcryptjs with salt rounds for password hashing
- **Route Protection**: Middleware-based authentication for API routes

### Data Protection
- **Input Validation**: Zod schemas for all API endpoints
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **Data Sanitization**: Server-side validation and sanitization
- **Sensitive Data**: Environment variables for all secrets and API keys

### Financial Data Security
- **Transaction Integrity**: Database transactions for multi-table operations
- **Audit Trail**: Immutable transaction records with timestamps
- **Data Encryption**: Sensitive financial data encrypted at rest
- **Access Control**: User-scoped data access with proper authorization

## Performance Considerations

### Database Optimization
- **Indexing Strategy**: 
  - User-scoped queries: Composite indexes on (userId, createdAt)
  - Player lookups: Indexes on playerId and external IDs
  - Financial queries: Indexes on transaction dates and amounts
  
- **Query Optimization**:
  - Batch operations for bulk calculations
  - Pagination for large datasets
  - Selective field fetching to reduce payload size

### Calculation Performance
- **Profit Calculations**: 
  - Optimized algorithms for FIFO/LIFO cost basis calculations
  - Caching of frequently accessed aggregations
  - Async processing for complex portfolio analysis

- **Memory Management**:
  - Streaming for large dataset exports
  - Pagination for transaction histories
  - Efficient data structures for calculations

### Frontend Performance
- **Data Fetching**:
  - SWR for client-side caching
  - Optimistic updates for immediate UI feedback
  - Incremental data loading for large portfolios

- **Rendering Optimization**:
  - Server-side rendering for initial page loads
  - Client-side caching for calculated values
  - Virtual scrolling for large transaction lists

### Scalability Considerations
- **Horizontal Scaling**: Stateless API design for easy horizontal scaling
- **Database Migration**: Architecture supports migration to PostgreSQL/MySQL
- **Caching Layer**: Redis integration ready for production scaling
- **Background Jobs**: Queue system for heavy calculations and reports