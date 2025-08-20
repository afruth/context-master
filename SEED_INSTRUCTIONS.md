# Database Seeding Instructions

## Overview

The seed script creates comprehensive test data for the Hattrick player management application, including realistic player data, transactions, and salary histories.

## What the Seed Script Creates

### Users (3 test users)
- **test@hattrick.com** / password: `password123`
- **demo@hattrick.com** / password: `demo123`  
- **trader@hattrick.com** / password: `trader123`

### Players (30 total)
- **Realistic Hattrick Data**: Ages 17-35 with proper day progression (112-day years)
- **Position Distribution**: Goalkeepers, Defenders, Midfielders, Attackers
- **Skills**: Position-appropriate skill distributions (keeper: 8-16, outfield: 2-12)
- **Specialties**: Quick, Powerful, Technical, Head, Unpredictable, Support (some players have none)
- **Purchase Prices**: Range from 50,000 to 5,000,000 LEI based on skills and age
- **Purchase Dates**: Spread over the last 2 years
- **Status Mix**: 70% owned players, 30% sold players

### Sale Transactions (for sold players)
- **Realistic Sale Prices**: Based on training progression and market fluctuations
- **Percentage Kept**: 30%-93% based on ownership duration (with some variation)
- **Profit/Loss Calculation**: Uses actual calculation functions from the app
- **Mix of Outcomes**: Both profitable and loss-making transactions

### Salary History
- **Position-Based Salaries**: 1,000-50,000 LEI/week based on skills and position
- **Salary Changes**: 30% of players have salary adjustments during ownership
- **Realistic Progression**: Salaries can increase (training) or decrease (age/form)

## Running the Seed Script

### Prerequisites

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

3. **Ensure Database is Ready**:
   ```bash
   npm run db:push
   ```

### Execute Seeding

```bash
npm run db:seed
```

### Alternative Methods

If the npm script doesn't work, you can run directly:

```bash
# Using tsx (recommended)
npx tsx prisma/seed.ts

# Using ts-node
npx ts-node prisma/seed.ts

# Using ts-node with ESM support
npx ts-node --esm prisma/seed.ts
```

## What to Expect

The script will:

1. **Clear existing data** (users, players, transactions, salary history)
2. **Create test users** with hashed passwords
3. **Generate realistic players** with proper Hattrick mechanics
4. **Create salary histories** with position-appropriate wages
5. **Generate sale transactions** for sold players with calculated profits/losses

### Sample Output

```
Starting database seeding...
Clearing existing data...
Creating test users...
Created user: test@hattrick.com
Created user: demo@hattrick.com
Created user: trader@hattrick.com
Creating players...
Created player: Marcus Lindqvist (MID) - OWNED
Created player: Erik Johansson (ATT) - SOLD
...
Creating salary history...
Created salary history for Marcus Lindqvist: 12500 LEI/week
...
Creating sale transactions...
Created sale transaction for Erik Johansson: 850000 LEI (+125000 profit)
...

=== SEEDING COMPLETED ===
Users created: 3
Total players: 30
- Owned: 21
- Sold: 9
Sale transactions: 9
Salary history records: 35
Profitable transactions: 6/9
Average profit per transaction: 45000 LEI
```

## Troubleshooting

### Common Issues

1. **TypeScript/Module Errors**:
   ```bash
   npm install tsx@latest --save-dev
   npm run db:generate
   ```

2. **Database Connection Issues**:
   ```bash
   npm run db:push
   ```

3. **Permission Errors**:
   ```bash
   chmod +x prisma/seed.ts
   ```

### Verifying Results

After seeding, you can verify the data:

```bash
# Open Prisma Studio to browse data
npm run db:studio

# Check player count
npx prisma db execute --url="file:./dev.db" --stdin <<< "SELECT COUNT(*) as total_players FROM Player;"
```

## Data Characteristics

### Player Age Distribution
- **17-22 years**: Young prospects with high growth potential
- **23-28 years**: Prime age players with balanced skills
- **29-35 years**: Experienced players with mature skills

### Financial Ranges
- **Purchase Prices**: 50,000 - 5,000,000 LEI
- **Weekly Salaries**: 1,000 - 50,000 LEI
- **Transaction Profits**: -500,000 to +800,000 LEI

### Position Breakdown
- **Goalkeepers**: High keeper skill (8-16), lower outfield skills
- **Defenders**: Strong defending and passing
- **Midfielders**: Balanced playmaking, passing, and winger skills
- **Attackers**: High scoring and moderate passing skills

This seed data provides a realistic foundation for testing all aspects of the Hattrick player management application.