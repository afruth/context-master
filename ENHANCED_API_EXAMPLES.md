# Enhanced API Endpoints - Usage Examples

## Enhanced Players Endpoint (`/api/players`)

### Advanced Filtering Examples

#### Text Search
```
GET /api/players?search=ronaldo
GET /api/players?search=brazil
GET /api/players?search=striker
```

#### Age Range Filtering
```
GET /api/players?ageMin=20&ageMax=25
```

#### Price Range Filtering
```
GET /api/players?priceMin=1000000&priceMax=5000000
```

#### Date Range Filtering
```
GET /api/players?purchaseDateFrom=2024-01-01&purchaseDateTo=2024-12-31
```

#### Skill Level Filtering
```
GET /api/players?scoringMin=15&scoringMax=20
GET /api/players?playmakingMin=10&defendingMin=12
```

#### Combined Filters
```
GET /api/players?status=OWNED&position=striker&ageMin=20&ageMax=25&scoringMin=15&sortBy=projectedProfit&sortOrder=desc
```

#### Sorting Options
```
GET /api/players?sortBy=name&sortOrder=asc
GET /api/players?sortBy=age&sortOrder=desc
GET /api/players?sortBy=purchasePrice&sortOrder=desc
GET /api/players?sortBy=projectedProfit&sortOrder=desc
```

#### Pagination
```
GET /api/players?page=2&limit=20
```

### Response Format
```json
{
  "data": [
    {
      "id": "player_id",
      "name": "Player Name",
      "age": { "years": 23, "days": 45 },
      "position": "Striker",
      "nationality": "Brazil",
      "skills": {
        "scoring": 16,
        "passing": 12,
        ...
      },
      "purchaseDetails": {
        "date": "2024-01-15T00:00:00.000Z",
        "price": 2500000,
        "fromTeam": "Team Name"
      },
      "currentStatus": "OWNED",
      "saleTransactions": [],
      "salaryHistory": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

## Enhanced Transactions Endpoint (`/api/transactions`)

### Advanced Filtering Examples

#### Player Name Search
```
GET /api/transactions?search=ronaldo
```

#### Profit Range Filtering
```
GET /api/transactions?profitMin=100000&profitMax=1000000
GET /api/transactions?profitMax=0  // Only losses
GET /api/transactions?profitMin=0  // Only profits
```

#### Date Range Filtering
```
GET /api/transactions?dateFrom=2024-01-01&dateTo=2024-12-31
```

#### Player-specific Transactions
```
GET /api/transactions?playerId=specific_player_id
```

#### Sorting Options
```
GET /api/transactions?sortBy=profitLoss&sortOrder=desc
GET /api/transactions?sortBy=salePrice&sortOrder=desc
GET /api/transactions?sortBy=playerName&sortOrder=asc
```

### Response Format
```json
{
  "data": [
    {
      "id": "transaction_id",
      "playerId": "player_id",
      "saleDate": "2024-06-15T00:00:00.000Z",
      "salePrice": 3000000,
      "percentageKept": 85,
      "profitLoss": 500000,
      "player": {
        "id": "player_id",
        "name": "Player Name",
        "position": "Striker",
        "nationality": "Brazil",
        "purchaseDate": "2024-01-15T00:00:00.000Z",
        "purchasePrice": 2500000
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 23,
    "totalPages": 3
  }
}
```

## Search Endpoint (`/api/search`)

### Global Search Examples

#### Search All
```
GET /api/search?query=ronaldo
GET /api/search?query=brazil&limit=20
```

#### Search Players Only
```
GET /api/search?query=striker&type=players
```

#### Search Transactions Only
```
GET /api/search?query=profit&type=transactions
```

### Response Format
```json
{
  "players": [
    {
      "id": "player_id",
      "name": "Player Name",
      "position": "Striker",
      "nationality": "Brazil",
      ...
    }
  ],
  "transactions": [
    {
      "id": "transaction_id",
      "playerId": "player_id",
      "saleDate": "2024-06-15T00:00:00.000Z",
      "profitLoss": 500000,
      ...
    }
  ],
  "totalResults": 15
}
```

## Analytics Endpoint (`/api/analytics`)

### Analytics Examples

#### All-time Analytics
```
GET /api/analytics
```

#### Date Range Analytics
```
GET /api/analytics?startDate=2024-01-01&endDate=2024-12-31
```

#### Include Current Players
```
GET /api/analytics?includeCurrent=true
```

### Response Format
```json
{
  "monthlyProfits": [
    {
      "month": "January",
      "year": 2024,
      "totalProfit": 500000,
      "transactionCount": 5,
      "averageProfit": 100000
    }
  ],
  "positionStats": [
    {
      "position": "Striker",
      "playerCount": 15,
      "totalProfit": 2500000,
      "averageProfit": 166667,
      "averageHoldingPeriod": 120,
      "successRate": 80.0
    }
  ],
  "ageGroupStats": [
    {
      "ageGroup": "20-24",
      "playerCount": 20,
      "totalProfit": 3000000,
      "averageProfit": 150000,
      "averageHoldingPeriod": 95
    }
  ],
  "profitTrends": [
    {
      "date": "2024-01",
      "cumulativeProfit": 500000,
      "monthlyProfit": 500000,
      "transactionCount": 5
    }
  ],
  "summary": {
    "totalPlayers": 50,
    "totalTransactions": 30,
    "totalProfit": 5000000,
    "averageProfit": 166667,
    "profitMargin": 25.5,
    "averageHoldingPeriod": 105,
    "successRate": 75.0
  }
}
```

## Query Parameter Types

### Players Endpoint Parameters
- `search`: string - Text search across name, nationality, position
- `status`: 'OWNED' | 'SOLD' | 'TRANSFERRED' - Player status filter
- `position`: string - Position filter (partial match)
- `ageMin`, `ageMax`: number - Age range in years
- `priceMin`, `priceMax`: number - Purchase price range
- `purchaseDateFrom`, `purchaseDateTo`: ISO date string - Purchase date range
- `keeperMin`, `keeperMax`: number (0-20) - Goalkeeper skill range
- `defendingMin`, `defendingMax`: number (0-20) - Defending skill range
- `playmakingMin`, `playmakingMax`: number (0-20) - Playmaking skill range
- `wingerMin`, `wingerMax`: number (0-20) - Winger skill range
- `passingMin`, `passingMax`: number (0-20) - Passing skill range
- `scoringMin`, `scoringMax`: number (0-20) - Scoring skill range
- `setPiecesMin`, `setPiecesMax`: number (0-20) - Set pieces skill range
- `sortBy`: 'name' | 'age' | 'position' | 'purchasePrice' | 'purchaseDate' | 'projectedProfit'
- `sortOrder`: 'asc' | 'desc'
- `page`: number (min: 1) - Page number
- `limit`: number (1-100) - Items per page

### Transactions Endpoint Parameters
- `search`: string - Text search across player name
- `playerId`: string - Filter by specific player ID
- `profitMin`, `profitMax`: number - Profit/loss range
- `dateFrom`, `dateTo`: ISO date string - Sale date range
- `sortBy`: 'saleDate' | 'profitLoss' | 'salePrice' | 'playerName'
- `sortOrder`: 'asc' | 'desc'
- `page`: number (min: 1) - Page number
- `limit`: number (1-100) - Items per page

### Search Endpoint Parameters
- `query`: string (required) - Search query
- `type`: 'players' | 'transactions' | 'all' - Search scope
- `limit`: number (1-50) - Max results per category

### Analytics Endpoint Parameters
- `startDate`: ISO date string - Start date for analytics period
- `endDate`: ISO date string - End date for analytics period
- `includeCurrent`: boolean - Include current players in calculations

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": [] // Validation errors (development only)
}
```

Common HTTP status codes:
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (not authenticated)
- 404: Not Found (resource not found)
- 500: Internal Server Error

## Performance Notes

1. **Database Indexes**: Added indexes for common query fields (name, position, age, price, etc.)
2. **Pagination**: All list endpoints support pagination with configurable limits
3. **Efficient Queries**: Database-level filtering and sorting to minimize data transfer
4. **Skill Filters**: Direct database queries on skill columns for optimal performance
5. **Search Optimization**: Uses database `contains` with case-insensitive mode