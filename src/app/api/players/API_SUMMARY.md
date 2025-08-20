# Player Management API Endpoints

This document provides an overview of the comprehensive Player Management API endpoints created for the Hattrick steptrading application.

## Endpoints Overview

### 1. `/api/players` - Main Players Endpoint

#### GET - List All Players
**URL:** `GET /api/players`

**Authentication:** Required (JWT token)

**Query Parameters:**
- `status` (optional): Filter by player status (`OWNED`, `SOLD`, `TRANSFERRED`)
- `position` (optional): Filter by player position (case-insensitive contains)
- `purchaseDateFrom` (optional): Filter players purchased after this date (ISO string)
- `purchaseDateTo` (optional): Filter players purchased before this date (ISO string)
- `sortBy` (optional): Sort field (`name`, `age`, `purchaseDate`, `purchasePrice`, `position`) - default: `purchaseDate`
- `sortOrder` (optional): Sort order (`asc`, `desc`) - default: `desc`
- `page` (optional): Page number (min: 1) - default: `1`
- `limit` (optional): Items per page (1-100) - default: `10`

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "age": { "years": number, "days": number },
      "position": "string",
      "nationality": "string",
      "speciality": "string?",
      "form": number,
      "stamina": number,
      "skills": {
        "keeper": number?,
        "defending": number?,
        "playmaking": number?,
        "winger": number?,
        "passing": number?,
        "scoring": number?,
        "setPieces": number?
      },
      "purchaseDetails": {
        "date": "ISO string",
        "price": number,
        "fromTeam": "string?",
        "hattrickWeek": number,
        "hattrickSeason": number
      },
      "currentStatus": "OWNED" | "SOLD" | "TRANSFERRED",
      "userId": "string",
      "createdAt": "ISO string",
      "updatedAt": "ISO string",
      "saleTransactions": [...],
      "salaryHistory": [...]
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

#### POST - Create New Player
**URL:** `POST /api/players`

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "name": "string",
  "ageYears": number,
  "ageDays": number,
  "position": "string",
  "nationality": "string",
  "speciality": "string?",
  "form": number,
  "stamina": number,
  "keeper": number?,
  "defending": number?,
  "playmaking": number?,
  "winger": number?,
  "passing": number?,
  "scoring": number?,
  "setPieces": number?,
  "purchaseDate": "ISO string",
  "purchasePrice": number,
  "fromTeam": "string?"
}
```

**Validation Rules:**
- `name`: 1-100 characters
- `ageYears`: 15-45 years
- `ageDays`: 0-111 days
- Skills: 0-20 for all skill values
- `form` and `stamina`: 1-20
- `purchasePrice`: >= 0

### 2. `/api/players/[id]` - Individual Player Endpoint

#### GET - Get Player Details
**URL:** `GET /api/players/[id]`

**Authentication:** Required (JWT token)

**Response:** Returns detailed player information including:
- Basic player data
- Calculated current age (with progression)
- Ownership duration (weeks/days)
- Age progression data
- Projected profit (for owned players)
- Sale transactions and salary history

#### PUT - Update Player
**URL:** `PUT /api/players/[id]`

**Authentication:** Required (JWT token)

**Request Body:** Partial player object (any field from creation can be updated)

#### DELETE - Delete Player
**URL:** `DELETE /api/players/[id]`

**Authentication:** Required (JWT token)

**Response:** Confirmation message

### 3. `/api/players/[id]/profit-projection` - Profit Projection Endpoint

#### GET - Calculate Profit Projection
**URL:** `GET /api/players/[id]/profit-projection`

**Authentication:** Required (JWT token)

**Query Parameters:**
- `projectedSaleValue` (optional): Custom projected sale value
- `futureWeeks` (optional): Calculate projection for X weeks in the future (0-52) - default: `0`

**Response:**
```json
{
  "data": {
    "playerId": "string",
    "playerName": "string",
    "currentStatus": "OWNED",
    "purchasePrice": number,
    "purchaseDate": "ISO string",
    "weeksOwned": number,
    "daysOwned": number,
    "currentPercentageKept": number,
    "isMaximumPercentage": boolean,
    "weeksToMaximum": number?,
    "currentProjection": {
      "projectedProfit": number,
      "currentPercentageKept": number,
      "projectedSaleValue": number,
      "totalSalaryCostToDate": number,
      "projectedNetSaleValue": number,
      "confidenceLevel": "high" | "medium" | "low"
    },
    "futureProjection": {
      "projectedProfit": number,
      "percentageKept": number,
      "projectedSaleValue": number,
      "totalSalaryCost": number,
      "projectedNetSaleValue": number,
      "weeksOwned": number,
      "additionalSalaryCost": number,
      "weeklyPay": number,
      "isMaximumPercentage": boolean,
      "weeksToMaximum": number?
    } | null,
    "calculations": {
      "currentWeeksOwned": number,
      "futureWeeksOwned": number?,
      "salaryHistoryCount": number,
      "hasActiveSalary": boolean
    }
  }
}
```

## Security Features

1. **Authentication**: All endpoints require valid JWT session
2. **Authorization**: Users can only access their own players
3. **Input Validation**: Comprehensive Zod schema validation
4. **Error Handling**: Consistent error responses with appropriate HTTP status codes
5. **SQL Injection Protection**: Prisma ORM provides protection

## Error Responses

All endpoints return consistent error format:
```json
{
  "error": "Error message",
  "details": "Additional details (development only)"
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created successfully
- `400`: Bad request (validation errors)
- `401`: Unauthorized
- `404`: Not found
- `500`: Internal server error

## Integration with Hattrick Calculations

The API integrates with `/src/lib/calculations.ts` for:
- Profit/loss calculations
- Weeks owned calculations
- Age progression with Hattrick's 112-day year system
- Percentage kept calculations (0-93% cap)
- Current projected profit with confidence levels

## Database Integration

Uses Prisma ORM with SQLite database:
- Proper relationships and cascading deletes
- Indexes for performance optimization
- Transaction safety for data integrity
- Type-safe database operations

## Performance Considerations

- Pagination for large datasets
- Database-level filtering and sorting
- Optimized queries with minimal N+1 problems
- Calculated fields computed efficiently