# Player Management API Test Examples

These are example requests you can use to test the Player Management API endpoints:

## 1. Create a New Player

```bash
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Striker",
    "ageYears": 21,
    "ageDays": 45,
    "position": "Forward",
    "nationality": "England",
    "speciality": "Quick",
    "form": 8,
    "stamina": 9,
    "keeper": 1,
    "defending": 4,
    "playmaking": 7,
    "winger": 6,
    "passing": 8,
    "scoring": 12,
    "setPieces": 5,
    "purchaseDate": "2024-01-15T10:00:00Z",
    "purchasePrice": 250000,
    "fromTeam": "FC Example"
  }'
```

## 2. List All Players (with filtering)

```bash
# Basic list
curl -X GET "http://localhost:3000/api/players" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With filtering and sorting
curl -X GET "http://localhost:3000/api/players?status=OWNED&position=Forward&sortBy=purchaseDate&sortOrder=desc&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by purchase date range
curl -X GET "http://localhost:3000/api/players?purchaseDateFrom=2024-01-01&purchaseDateTo=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 3. Get Player Details

```bash
curl -X GET "http://localhost:3000/api/players/PLAYER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 4. Update Player

```bash
curl -X PUT "http://localhost:3000/api/players/PLAYER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "form": 9,
    "stamina": 10,
    "scoring": 13
  }'
```

## 5. Get Profit Projection

```bash
# Current projection
curl -X GET "http://localhost:3000/api/players/PLAYER_ID/profit-projection" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With custom projected sale value
curl -X GET "http://localhost:3000/api/players/PLAYER_ID/profit-projection?projectedSaleValue=350000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Future projection (8 weeks from now)
curl -X GET "http://localhost:3000/api/players/PLAYER_ID/profit-projection?futureWeeks=8&projectedSaleValue=400000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 6. Delete Player

```bash
curl -X DELETE "http://localhost:3000/api/players/PLAYER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Examples

### Successful Player Creation (201):
```json
{
  "data": {
    "id": "clk1234567890",
    "name": "John Striker",
    "age": {
      "years": 21,
      "days": 45
    },
    "position": "Forward",
    "nationality": "England",
    "speciality": "Quick",
    "form": 8,
    "stamina": 9,
    "skills": {
      "keeper": 1,
      "defending": 4,
      "playmaking": 7,
      "winger": 6,
      "passing": 8,
      "scoring": 12,
      "setPieces": 5
    },
    "purchaseDetails": {
      "date": "2024-01-15T10:00:00.000Z",
      "price": 250000,
      "fromTeam": "FC Example",
      "hattrickWeek": 0,
      "hattrickSeason": 0
    },
    "currentStatus": "OWNED",
    "userId": "user123",
    "createdAt": "2024-08-20T10:00:00.000Z",
    "updatedAt": "2024-08-20T10:00:00.000Z",
    "saleTransactions": [],
    "salaryHistory": []
  },
  "message": "Player created successfully"
}
```

### Error Response (400):
```json
{
  "error": "Invalid input data",
  "details": [
    {
      "code": "too_small",
      "minimum": 15,
      "type": "number",
      "inclusive": true,
      "message": "Age must be at least 15 years",
      "path": ["ageYears"]
    }
  ]
}
```

## Notes

- Replace `YOUR_JWT_TOKEN` with a valid JWT token from authentication
- Replace `PLAYER_ID` with actual player IDs from your database
- All requests require authentication
- The API includes comprehensive input validation and error handling
- Profit projections are only available for players with status "OWNED"