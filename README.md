# Context Master - Next.js Authentication App

A modern full-stack Next.js application with local authentication, built using the latest technologies.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **UI Components**: shadcn/ui
- **Language**: TypeScript

## Features

- ✅ Local authentication with email/password
- ✅ User registration and login
- ✅ Protected routes with middleware
- ✅ Modern, responsive UI with shadcn/ui components
- ✅ SQLite database for easy development
- ✅ Type-safe database queries with Prisma
- ✅ JWT-based session management
- ✅ Password hashing with bcrypt

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

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
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected dashboard
│   ├── api/               # API routes
│   └── page.tsx           # Home page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client singleton
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript type definitions
└── middleware.ts          # Auth middleware
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

## Authentication Flow

1. **Registration**: Users can create an account with email and password
2. **Login**: Users authenticate with credentials
3. **Session**: JWT tokens manage user sessions
4. **Protected Routes**: Middleware protects dashboard routes
5. **Logout**: Clear session and redirect to login

## Database Schema

The application uses a simple User model with authentication fields:
- User ID (CUID)
- Email (unique)
- Username (optional, unique)
- Password (hashed)
- Name (optional)
- Timestamps

## Security Features

- Password hashing with bcrypt
- JWT session tokens
- Protected API routes
- Secure environment variables
- CSRF protection via NextAuth

## Deployment

This application can be deployed to any platform that supports Next.js:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Self-hosted with Node.js

For production, consider:
1. Using a production database (PostgreSQL, MySQL)
2. Setting strong AUTH_SECRET
3. Configuring proper NEXTAUTH_URL
4. Enabling HTTPS

## License

MIT