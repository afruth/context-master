# Context Master - Collaborative Todo Application

A comprehensive full-stack collaborative todo and time tracking application built with Next.js 15, featuring team management, personal todos, time tracking, and detailed analytics.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **UI Components**: shadcn/ui
- **Language**: TypeScript

## Features

### 🔐 Authentication & Security
- ✅ Local authentication with email/password
- ✅ User registration and login
- ✅ Protected routes with middleware
- ✅ JWT-based session management
- ✅ Password hashing with bcrypt
- ✅ Role-based team permissions

### 📋 Todo Management
- ✅ Personal todos with categories, priorities, and due dates
- ✅ Team todos with assignments and collaboration
- ✅ Rich markdown descriptions and comments
- ✅ Todo templates for common tasks
- ✅ Bulk operations and filtering

### 👥 Team Collaboration
- ✅ Multi-team support with role-based access (Owner, Admin, Member, Viewer)
- ✅ Team invitations with expiration and approval workflows
- ✅ Real-time commenting and collaboration
- ✅ Team-specific todo assignments and tracking

### ⏰ Time Tracking
- ✅ Built-in timer with start/stop functionality
- ✅ Manual time entry support
- ✅ Billable hours tracking with hourly rates
- ✅ Time entry categorization and descriptions
- ✅ Historical time tracking with analytics

### 📊 Reports & Analytics
- ✅ Personal productivity dashboards
- ✅ Team performance analytics
- ✅ Time tracking reports with charts
- ✅ Export functionality (CSV, PDF)
- ✅ Completion rate metrics and insights

### 🎨 Modern UI/UX
- ✅ Modern, responsive UI with shadcn/ui components
- ✅ Dark/light theme support
- ✅ Consistent header and navigation across all pages
- ✅ Real-time updates and notifications
- ✅ Mobile-friendly responsive design

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

5. Seed the database with demo data:
```bash
npm run db:seed
```

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 🌱 Demo Data & Sample Accounts

The application comes with comprehensive demo data including 6 sample users, 5 teams, 40 todos, 30 time entries, and realistic collaboration examples.

**Sample Login Credentials** (password: `password123`):
- `admin@contextmaster.com` - Sarah Chen (Admin)
- `alice.johnson@contextmaster.com` - Alice Johnson (Frontend Dev)  
- `bob.smith@contextmaster.com` - Bob Smith (Designer)
- `carol.davis@contextmaster.com` - Carol Davis (Marketing)
- `david.wilson@contextmaster.com` - David Wilson (DevOps)
- `emma.garcia@contextmaster.com` - Emma Garcia (QA)

**Demo Data Includes:**
- **6 Users** across different departments and timezones
- **5 Teams** (Frontend, Backend/DevOps, Design, Marketing, QA)
- **20 Personal Todos** with varied statuses and priorities
- **20 Team Todos** with realistic assignments and collaboration
- **25 Comments** showing team interactions
- **30 Time Entries** with billable hours and realistic work patterns
- **5 Team Invitations** in various states (pending, declined)

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

### Development
- `npm run dev` - Start development server with cache clearing
- `npm run dev:fresh` - Start development server with full cache clear
- `npm run build` - Build for production
- `npm run build:fresh` - Clean build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types

### Database Management
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with comprehensive demo data
- `npm run db:seed:reset` - Reset database and reseed
- `npm run db:seed:dev` - Direct seeding for development
- `npm run db:health` - Check database health

### Cache Management
- `npm run clean` - Remove all cache files and rebuild dependencies
- `npm run clean:cache` - Remove Next.js cache files only

## Authentication Flow

1. **Registration**: Users can create an account with email and password
2. **Login**: Users authenticate with credentials
3. **Session**: JWT tokens manage user sessions
4. **Protected Routes**: Middleware protects dashboard routes
5. **Logout**: Clear session and redirect to login

## Database Schema

The application uses a comprehensive relational schema supporting collaborative features:

### Core Models
- **Users** - User accounts with authentication, preferences, and profile information
- **Teams** - Team/organization management with settings and ownership
- **TeamMembers** - Role-based team memberships (Owner, Admin, Member, Viewer)
- **TeamInvitations** - Team invitation workflow with expiration and status tracking

### Todo Management
- **PersonalTodos** - Individual user todos with categories, priorities, and time tracking
- **TeamTodos** - Collaborative todos with assignments, templates, and team context
- **TodoComments** - Rich commenting system for team collaboration

### Time Tracking
- **TimeEntries** - Comprehensive time tracking with billable hours, rates, and categorization

### Key Features
- CUID-based primary keys for all models
- Proper foreign key relationships and cascading deletes  
- Audit timestamps (createdAt, updatedAt) on all models
- Soft delete support with archivedAt fields
- JSON fields for flexible metadata (tags, settings)
- Timezone-aware datetime handling

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