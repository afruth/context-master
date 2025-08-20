# Hattrick Steptrading Application

A specialized web application designed to help Hattrick players track and analyze their steptrading profitability. Built with modern technologies to provide comprehensive player transaction management and profit analysis.

## What is Hattrick Steptrading?

Hattrick is a popular online football management game where players manage virtual football teams. Steptrading is a strategic approach to player trading where managers buy players, train them to improve their skills, and sell them at higher prices. This application helps players track their trading activities, calculate profits, and make data-driven decisions about player investments.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **UI Components**: shadcn/ui
- **Language**: TypeScript

## Features

- ✅ User authentication and registration
- ✅ Player database management
- ✅ Transaction tracking (buy/sell records)
- ✅ Profit/loss calculations per player
- ✅ Training progress monitoring
- ✅ Portfolio overview and analytics
- ✅ Market value predictions
- ✅ Historical transaction analysis
- ✅ Export capabilities for data analysis
- ✅ Responsive design for mobile and desktop

## Core Functionality

### Player Management
- Add and track players in your trading portfolio
- Record player attributes and skill levels
- Monitor training progress and skill improvements
- Track market value changes over time

### Transaction Tracking
- Record purchase transactions with detailed information
- Log sale transactions and calculate profits
- Track training costs and other expenses
- Categorize transactions by trading strategy

### Profit Analysis
- Calculate profit/loss per individual player
- Generate portfolio-wide performance reports
- Analyze profitability by player position or skill type
- Track return on investment (ROI) metrics

### Market Intelligence
- Monitor market trends for different player types
- Analyze optimal buying and selling times
- Track competitor trading patterns
- Generate market value predictions

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Basic understanding of Hattrick game mechanics

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-here-replace-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

3. Generate Prisma client:
```bash
npm run db:generate
```

4. Run database migrations:
```bash
npm run db:migrate
```

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application dashboard
│   ├── api/               # API routes for data management
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── players/          # Player management components
│   ├── transactions/     # Transaction tracking components
│   └── analytics/        # Analytics and reporting components
├── lib/                   # Utilities and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client singleton
│   ├── calculations.ts   # Profit calculation utilities
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript type definitions
│   ├── player.ts         # Player-related types
│   ├── transaction.ts    # Transaction types
│   └── analytics.ts      # Analytics types
└── middleware.ts          # Authentication middleware
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma client

## Database Schema

The application uses several core models for steptrading management:

### User Model
- User ID, email, username, password (hashed)
- Hattrick team information
- User preferences and settings

### Player Model
- Player details (name, age, position, nationality)
- Skill attributes and levels
- Current market value
- Training history

### Transaction Model
- Transaction type (buy/sell)
- Player reference
- Transaction amount and date
- Associated costs (training, etc.)
- Profit/loss calculations

### Portfolio Model
- User's current and historical players
- Performance metrics
- Trading strategy classifications

## Security Features

- Secure user authentication with NextAuth.js
- Password hashing with bcrypt
- JWT session management
- Protected API routes
- Data validation and sanitization
- CSRF protection

## Hattrick Integration

While this application doesn't directly integrate with Hattrick's API (due to game policies), it provides:
- Manual data entry forms optimized for Hattrick data
- Import capabilities for exported Hattrick data
- Terminology and calculations specific to Hattrick mechanics
- Templates for common Hattrick trading scenarios

## Deployment

This application can be deployed to any platform supporting Next.js:
- Vercel (recommended for ease of use)
- Netlify
- AWS Amplify
- Self-hosted with Node.js

For production deployment:
1. Use a production database (PostgreSQL recommended)
2. Set a strong AUTH_SECRET
3. Configure proper NEXTAUTH_URL
4. Enable HTTPS
5. Set up backup strategies for user data

## Contributing

Contributions are welcome! Please read our contributing guidelines and:
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Consider Hattrick game mechanics in feature design

## Disclaimer

This application is an independent tool created for Hattrick players and is not officially affiliated with or endorsed by Hattrick Ltd. All Hattrick-related trademarks belong to their respective owners.

## License

MIT