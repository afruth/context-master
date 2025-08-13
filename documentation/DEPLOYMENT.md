# Deployment Guide

## Overview
This guide covers deployment procedures for a Next.js 14 collaborative to-do application with TypeScript, Prisma ORM (SQLite), NextAuth.js authentication, and Tailwind CSS.

## Table of Contents
- [Development Environment Setup](#development-environment-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Production Deployment](#production-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Scaling Considerations](#scaling-considerations)

---

## Development Environment Setup

### Prerequisites
- **Node.js**: Version 18.17 or higher
- **npm**: Version 9 or higher (comes with Node.js)
- **Git**: For version control
- **SQLite**: Database (included with most systems)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd context_master
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Initialize the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database (development)
   npm run db:push
   
   # Seed the database (if seed file exists)
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Verify installation**
   - Open http://localhost:3000
   - Test authentication flows
   - Check database with `npm run db:studio`

### Database Initialization

#### First-time Setup
```bash
# Generate Prisma client
npx prisma generate

# Create and apply initial migration
npx prisma migrate dev --name init

# Seed database with initial data
npm run db:seed
```

#### Development Workflow
```bash
# After schema changes
npm run db:push          # Quick development sync
# OR
npm run db:migrate       # Create migration files

# Reset database (if needed)
npx prisma migrate reset
```

### Seed Data Setup

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create demo users
  const hashedPassword = await bcrypt.hash('demo123', 10)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      username: 'demo',
      password: hashedPassword,
      name: 'Demo User',
    },
  })

  console.log('Seeded user:', demoUser)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## Environment Variables

### Complete Variable List

#### Authentication
```env
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars

# For production, generate with: openssl rand -base64 32
AUTH_SECRET=your-super-secret-key-min-32-chars
```

#### Database
```env
# SQLite (Development)
DATABASE_URL="file:./dev.db"

# PostgreSQL (Production)
# DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

#### Application
```env
# Environment
NODE_ENV=development
# NODE_ENV=production

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Optional Services
```env
# Email Service (for password reset)
EMAIL_SERVER_USER=username
EMAIL_SERVER_PASSWORD=password
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_FROM=noreply@example.com

# File Upload (if using cloud storage)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Error Tracking
SENTRY_DSN=your-sentry-dsn
```

### Security Best Practices

1. **Environment File Management**
   - Never commit `.env*` files to version control
   - Use `.env.example` as a template
   - Use different secrets for each environment

2. **Secret Generation**
   ```bash
   # Generate secure random secrets
   openssl rand -base64 32
   
   # Or using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **Environment-Specific Configs**
   ```env
   # .env.local (development)
   NEXTAUTH_URL=http://localhost:3000
   DATABASE_URL="file:./dev.db"
   
   # .env.production (production)
   NEXTAUTH_URL=https://yourapp.com
   DATABASE_URL="postgresql://..."
   ```

### Environment Validation
Create `src/lib/env.ts`:
```typescript
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  DATABASE_URL: z.string(),
})

export const env = envSchema.parse(process.env)
```

---

## Database Setup

### Migration Strategy

#### Development
```bash
# Create migration after schema changes
npx prisma migrate dev --name descriptive_name

# Reset database (destroys data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

#### Production
```bash
# Deploy migrations to production
npx prisma migrate deploy

# Generate client after deployment
npx prisma generate
```

### Backup Procedures

#### SQLite Backup
```bash
# Manual backup
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db

# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp prisma/dev.db "backups/backup_${DATE}.db"
find backups/ -name "backup_*.db" -mtime +7 -delete
```

#### PostgreSQL Backup
```bash
# Database dump
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240113.sql
```

### Database Monitoring
```bash
# Check database size
du -h prisma/dev.db

# View database schema
npx prisma db pull
npx prisma format
```

---

## Production Deployment

### Build Optimization

#### Next.js Configuration
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static optimization
  output: 'standalone',
  
  // Optimize images
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Compress responses
  compress: true,
  
  // Reduce bundle size
  experimental: {
    optimizeCss: true,
  },
  
  // Environment-specific configs
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error'],
      },
    },
  }),
};

export default nextConfig;
```

#### Build Commands
```bash
# Production build
npm run build

# Start production server
npm start

# Check build size
npm run build -- --analyze
```

### Deployment Platforms

#### Vercel (Recommended)
1. **Setup**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **Configuration** (`vercel.json`)
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install",
     "framework": "nextjs",
     "env": {
       "NEXTAUTH_SECRET": "@nextauth-secret",
       "DATABASE_URL": "@database-url"
     }
   }
   ```

3. **Environment Variables**
   - Set in Vercel dashboard
   - Use different values for preview/production

#### Railway
1. **Setup**
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   ```

2. **Configuration**
   ```toml
   # railway.toml
   [build]
   builder = "nixpacks"
   buildCommand = "npm run build"

   [deploy]
   startCommand = "npm start"
   restartPolicyType = "on_failure"

   [[services]]
   name = "web"
   ```

#### Netlify
1. **Configuration** (`netlify.toml`)
   ```toml
   [build]
   command = "npm run build"
   publish = ".next"

   [[plugins]]
   package = "@netlify/plugin-nextjs"

   [build.environment]
   NODE_VERSION = "18"
   ```

#### Digital Ocean App Platform
1. **Configuration** (`.do/app.yaml`)
   ```yaml
   name: context-master
   services:
   - name: web
     source_dir: /
     github:
       branch: main
       deploy_on_push: true
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
   ```

### Database Hosting Options

#### SQLite (Development/Small Scale)
- **Pros**: Simple, no setup required, good for development
- **Cons**: Not suitable for multiple instances, limited concurrent writes
- **Use case**: Development, single-instance deployments

#### PostgreSQL (Recommended for Production)
1. **Neon** (Serverless PostgreSQL)
   ```env
   DATABASE_URL="postgresql://user:pass@ep-example.us-east-1.aws.neon.tech/dbname?sslmode=require"
   ```

2. **Supabase** (PostgreSQL + Additional Features)
   ```env
   DATABASE_URL="postgresql://postgres:pass@db.project.supabase.co:5432/postgres?schema=public"
   ```

3. **PlanetScale** (MySQL-compatible)
   ```env
   DATABASE_URL="mysql://user:pass@gateway01.region.psdb.cloud/database?sslaccept=strict"
   ```

#### Migration from SQLite to PostgreSQL
```bash
# 1. Update schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# 2. Install PostgreSQL client
npm install @prisma/client

# 3. Reset migrations
npx prisma migrate reset

# 4. Create new migration
npx prisma migrate dev --name init

# 5. Deploy to production
npx prisma migrate deploy
```

### CDN Configuration

#### Vercel (Built-in CDN)
- Automatic global CDN
- Edge functions support
- Image optimization

#### Cloudflare
1. **Setup**
   - Point domain to origin server
   - Enable CDN caching
   - Configure cache rules

2. **Cache Rules**
   ```
   Static assets (/_next/static/*): Cache everything
   API routes (/api/*): Bypass cache
   Pages: Cache with short TTL
   ```

---

## CI/CD Pipeline

### GitHub Actions

#### Basic Workflow (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      # Deploy to Vercel
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### Advanced Workflow with Database Migrations
```yaml
name: Advanced Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma db push
      - run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - run: npm run build
      
      # Deploy to platform
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Automated Testing

#### Test Setup
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "e2e": "playwright test",
    "e2e:headed": "playwright test --headed"
  }
}
```

#### Test Configuration (`jest.config.js`)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
}

module.exports = createJestConfig(customJestConfig)
```

### Build Process

#### Pre-build Checks
```bash
#!/bin/bash
# scripts/pre-build.sh

echo "Running pre-build checks..."

# Type checking
npm run typecheck

# Linting
npm run lint

# Tests
npm run test

# Database validation
npx prisma validate

echo "Pre-build checks passed!"
```

#### Build Script
```bash
#!/bin/bash
# scripts/build.sh

echo "Starting build process..."

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build application
npm run build

# Post-build validation
if [ ! -d ".next" ]; then
  echo "Build failed - .next directory not found"
  exit 1
fi

echo "Build completed successfully!"
```

---

## Monitoring and Logging

### Application Monitoring

#### Performance Monitoring with Vercel Analytics
```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### Custom Metrics
```typescript
// src/lib/metrics.ts
export function trackEvent(name: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, properties)
  }
}

// Usage
trackEvent('todo_created', { category: 'user_action' })
```

### Error Tracking

#### Sentry Integration
```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

```javascript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

#### Error Boundary
```tsx
// src/components/ErrorBoundary.tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

### Performance Metrics

#### Web Vitals Tracking
```typescript
// src/app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```

#### Custom Performance Monitoring
```typescript
// src/lib/performance.ts
export function measurePerformance(name: string, fn: () => Promise<any>) {
  return async (...args: any[]) => {
    const start = performance.now()
    try {
      const result = await fn.apply(this, args)
      const duration = performance.now() - start
      
      // Log to monitoring service
      console.log(`${name} took ${duration}ms`)
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`${name} failed after ${duration}ms`, error)
      throw error
    }
  }
}
```

### User Analytics

#### Google Analytics 4
```typescript
// src/lib/gtag.ts
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

export const event = (action: string, parameters: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, parameters)
  }
}
```

#### Usage Tracking
```typescript
// src/hooks/useAnalytics.ts
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { event, pageview } from '@/lib/gtag'

export function useAnalytics() {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      pageview(url)
    }

    // Track initial page load
    pageview(window.location.pathname)

    // Track route changes
    router.events?.on('routeChangeComplete', handleRouteChange)
    
    return () => {
      router.events?.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  return {
    trackEvent: event,
    trackPageView: pageview,
  }
}
```

---

## Backup and Recovery

### Database Backup Strategy

#### Automated Backup Script
```bash
#!/bin/bash
# scripts/backup-db.sh

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup based on database type
if [[ $DATABASE_URL == sqlite* ]] || [[ $DATABASE_URL == file* ]]; then
  # SQLite backup
  DB_FILE=$(echo $DATABASE_URL | sed 's/file://')
  cp "$DB_FILE" "$BACKUP_DIR/backup_${DATE}.db"
  echo "SQLite backup created: backup_${DATE}.db"
elif [[ $DATABASE_URL == postgres* ]]; then
  # PostgreSQL backup
  pg_dump "$DATABASE_URL" > "$BACKUP_DIR/backup_${DATE}.sql"
  echo "PostgreSQL backup created: backup_${DATE}.sql"
fi

# Cleanup old backups
find $BACKUP_DIR -name "backup_*" -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully"
```

#### Automated Backup with Cron
```bash
# Add to crontab (crontab -e)
# Daily backup at 2 AM
0 2 * * * /path/to/your/app/scripts/backup-db.sh >> /var/log/backup.log 2>&1

# Weekly backup (Sundays at 3 AM)
0 3 * * 0 /path/to/your/app/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

### Disaster Recovery Plan

#### Recovery Procedures
```bash
#!/bin/bash
# scripts/restore-db.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# Confirm restoration
read -p "This will replace the current database. Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Restore based on database type
if [[ $DATABASE_URL == sqlite* ]] || [[ $DATABASE_URL == file* ]]; then
  # SQLite restore
  DB_FILE=$(echo $DATABASE_URL | sed 's/file://')
  cp "$BACKUP_FILE" "$DB_FILE"
  echo "SQLite database restored from $BACKUP_FILE"
elif [[ $DATABASE_URL == postgres* ]]; then
  # PostgreSQL restore
  psql "$DATABASE_URL" < "$BACKUP_FILE"
  echo "PostgreSQL database restored from $BACKUP_FILE"
fi

# Regenerate Prisma client
npx prisma generate

echo "Database restoration completed"
```

#### Backup Verification
```bash
#!/bin/bash
# scripts/verify-backup.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# Verify backup integrity
if [[ $BACKUP_FILE == *.db ]]; then
  # SQLite verification
  sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" | grep -q "ok"
  if [ $? -eq 0 ]; then
    echo "SQLite backup verified: $BACKUP_FILE"
  else
    echo "SQLite backup corrupted: $BACKUP_FILE"
    exit 1
  fi
elif [[ $BACKUP_FILE == *.sql ]]; then
  # PostgreSQL verification (basic syntax check)
  if grep -q "PostgreSQL database dump" "$BACKUP_FILE"; then
    echo "PostgreSQL backup verified: $BACKUP_FILE"
  else
    echo "PostgreSQL backup may be corrupted: $BACKUP_FILE"
    exit 1
  fi
fi
```

### Data Retention Policies

#### Backup Retention Schedule
- **Hourly**: Keep for 24 hours (development only)
- **Daily**: Keep for 30 days
- **Weekly**: Keep for 12 weeks
- **Monthly**: Keep for 12 months
- **Yearly**: Keep indefinitely (compliance)

#### Implementation
```bash
#!/bin/bash
# scripts/cleanup-backups.sh

BACKUP_DIR="./backups"

# Remove hourly backups older than 24 hours
find $BACKUP_DIR -name "*hourly*" -mtime +1 -delete

# Remove daily backups older than 30 days
find $BACKUP_DIR -name "*daily*" -mtime +30 -delete

# Remove weekly backups older than 84 days (12 weeks)
find $BACKUP_DIR -name "*weekly*" -mtime +84 -delete

# Remove monthly backups older than 365 days
find $BACKUP_DIR -name "*monthly*" -mtime +365 -delete

# Yearly backups are kept indefinitely

echo "Backup cleanup completed"
```

---

## Scaling Considerations

### Database Migration Path

#### From SQLite to PostgreSQL

1. **Update Dependencies**
   ```bash
   npm install pg @types/pg
   ```

2. **Update Prisma Schema**
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   
   model User {
     id            String    @id @default(cuid())
     email         String    @unique
     username      String?   @unique
     password      String
     name          String?
     image         String?
     emailVerified DateTime?
     createdAt     DateTime  @default(now()) @db.Timestamptz(6)
     updatedAt     DateTime  @updatedAt @db.Timestamptz(6)
     
     sessions      Session[]
   }
   
   model Session {
     id           String   @id @default(cuid())
     sessionToken String   @unique
     userId       String
     expires      DateTime @db.Timestamptz(6)
     user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     
     createdAt    DateTime @default(now()) @db.Timestamptz(6)
     updatedAt    DateTime @updatedAt @db.Timestamptz(6)
   }
   ```

3. **Data Migration Script**
   ```typescript
   // scripts/migrate-sqlite-to-postgres.ts
   import { PrismaClient as SQLitePrismaClient } from '@prisma/client'
   import { PrismaClient as PostgresPrismaClient } from '@prisma/client'
   
   const sqliteClient = new SQLitePrismaClient({
     datasources: {
       db: {
         url: 'file:./dev.db'
       }
     }
   })
   
   const postgresClient = new PostgresPrismaClient({
     datasources: {
       db: {
         url: process.env.POSTGRES_DATABASE_URL
       }
     }
   })
   
   async function migrate() {
     // Migrate Users
     const users = await sqliteClient.user.findMany()
     for (const user of users) {
       await postgresClient.user.create({
         data: user
       })
     }
   
     // Migrate Sessions
     const sessions = await sqliteClient.session.findMany()
     for (const session of sessions) {
       await postgresClient.session.create({
         data: session
       })
     }
   
     console.log('Migration completed')
   }
   
   migrate()
     .catch(console.error)
     .finally(() => {
       sqliteClient.$disconnect()
       postgresClient.$disconnect()
     })
   ```

### Caching Implementation

#### Redis Caching
```bash
npm install redis @types/redis
```

```typescript
// src/lib/redis.ts
import Redis from 'redis'

const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

redis.on('error', (err) => console.error('Redis error:', err))

export { redis }
```

#### API Route Caching
```typescript
// src/app/api/users/route.ts
import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'

export async function GET() {
  const cacheKey = 'users:all'
  
  // Check cache first
  const cached = await redis.get(cacheKey)
  if (cached) {
    return NextResponse.json(JSON.parse(cached))
  }
  
  // Fetch from database
  const users = await prisma.user.findMany()
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(users))
  
  return NextResponse.json(users)
}
```

#### Edge Caching with Next.js
```typescript
// src/app/api/todos/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const todos = await prisma.todo.findMany()
  
  const response = NextResponse.json(todos)
  
  // Cache at the edge for 60 seconds
  response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate')
  
  return response
}
```

### Load Balancing

#### Application Load Balancing
```nginx
# nginx.conf
upstream nextjs_app {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Database Connection Pooling
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=20&pool_timeout=20"
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### Horizontal Scaling with Docker
```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app1:
    build: .
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
      - NEXTAUTH_SECRET=secret
    depends_on:
      - postgres
      - redis
    
  app2:
    build: .
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
      - NEXTAUTH_SECRET=secret
    depends_on:
      - postgres
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app1
      - app2

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=contextmaster
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Performance Optimization

#### Database Optimization
```prisma
// Add indexes for frequently queried fields
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String?   @unique
  password      String
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  
  @@index([email])
  @@index([createdAt])
}
```

#### API Optimization
```typescript
// src/lib/api-utils.ts
export function withPagination<T>(
  data: T[],
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit
  const paginatedData = data.slice(offset, offset + limit)
  
  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit)
    }
  }
}
```

```typescript
// src/app/api/users/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  
  const users = await prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true
      // Don't select password
    }
  })
  
  const total = await prisma.user.count()
  
  return NextResponse.json({
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
}
```

---

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
npx prisma db pull

# Reset database (caution: data loss)
npx prisma migrate reset

# Fix Prisma client issues
rm -rf node_modules/.prisma
npx prisma generate
```

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Authentication Issues
```bash
# Verify environment variables
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL

# Check session storage
npx prisma studio
```

### Performance Issues
```bash
# Analyze bundle size
npm run build -- --analyze

# Check for memory leaks
node --inspect npm start

# Profile database queries
# Enable Prisma query logging
DATABASE_URL="file:./dev.db?connection_limit=1&pool_timeout=20"
```

### Monitoring Commands
```bash
# Check application logs
docker logs container_name

# Monitor resource usage
htop

# Check database performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

---

## Security Checklist

### Pre-deployment Security Review

- [ ] Environment variables are not exposed in client-side code
- [ ] Database credentials are stored securely
- [ ] NEXTAUTH_SECRET is properly generated and secure
- [ ] HTTPS is enforced in production
- [ ] CORS policies are properly configured
- [ ] Input validation is implemented for all API routes
- [ ] SQL injection protection is in place (Prisma provides this)
- [ ] Password hashing is implemented (bcryptjs)
- [ ] Session management is secure
- [ ] Error messages don't expose sensitive information
- [ ] Dependencies are up to date and vulnerability-free
- [ ] Content Security Policy is configured
- [ ] Rate limiting is implemented for API routes

### Production Security Headers
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ]
  }
}
```

---

This deployment guide provides comprehensive coverage of all aspects needed to successfully deploy and maintain the collaborative to-do application. Regular reviews and updates of this document are recommended as the application evolves and new requirements emerge.