# System Architecture

## High-Level System Overview

The Collaborative Todo Application follows a modern full-stack architecture built on Next.js 14, leveraging server-side rendering, API routes, and real-time capabilities to deliver a seamless task management experience that scales from personal use to enterprise team collaboration.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Layer  │    │  Server Layer   │    │   Data Layer    │
│                 │    │                 │    │                 │
│ • React UI      │◄──►│ • Next.js 14    │◄──►│ • SQLite (dev)  │
│ • Tailwind CSS │    │ • API Routes    │    │ • PostgreSQL    │
│ • Radix UI      │    │ • Server Actions│    │   (production)  │
│ • Real-time     │    │ • NextAuth.js   │    │ • Prisma ORM    │
│   Updates       │    │ • Middleware    │    │ • Redis Cache   │
│                 │    │                 │    │   (future)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │ External Services│
                    │                 │
                    │ • Email Service │
                    │ • File Storage  │
                    │ • Analytics     │
                    │ • Monitoring    │
                    └─────────────────┘
```

### Architecture Principles

1. **Unified Context Model**: Seamless switching between personal and team workspaces
2. **Progressive Enhancement**: Core functionality works without JavaScript
3. **Type Safety**: End-to-end TypeScript for reliability and developer experience
4. **Performance First**: Server-side rendering with optimistic UI updates
5. **Security by Design**: Authentication-first architecture with proper authorization
6. **Scalable Data Model**: Designed to handle individual users to large enterprise teams

## Technology Stack Justification

### Frontend Stack

**Next.js 14 with App Router**
- **Server-Side Rendering**: Improves SEO and initial page load performance
- **Server Actions**: Eliminates need for separate API calls in many cases
- **App Router**: Modern routing with layouts, loading states, and error boundaries
- **Built-in Optimization**: Automatic code splitting, image optimization, and caching

**TypeScript**
- **Type Safety**: Prevents runtime errors and improves code reliability
- **Developer Experience**: Enhanced IDE support with autocomplete and refactoring
- **API Contract Enforcement**: Ensures consistency between frontend and backend
- **Scalability**: Easier codebase maintenance as the application grows

**Tailwind CSS + Radix UI**
- **Design System Consistency**: Utility-first approach ensures consistent styling
- **Accessibility**: Radix UI provides WCAG 2.1 AA compliant components out of the box
- **Performance**: Atomic CSS reduces bundle size through utility reuse
- **Developer Productivity**: Rapid prototyping and consistent component behavior

### Backend Stack

**Next.js API Routes**
- **Unified Codebase**: Single repository for frontend and backend reduces complexity
- **Server Actions**: Direct database operations without API overhead
- **Edge Runtime**: Improved performance for geographically distributed users
- **Built-in Middleware**: Request preprocessing and authentication handling

**Prisma ORM**
- **Type-Safe Database Access**: Generated TypeScript types prevent query errors
- **Migration Management**: Version-controlled schema changes with rollback support
- **Database Agnostic**: Easy transition from SQLite (development) to PostgreSQL (production)
- **Query Optimization**: Built-in query analysis and performance monitoring

**NextAuth.js v5**
- **Security Standards**: Industry-standard OAuth2 and JWT implementation
- **Provider Flexibility**: Support for email/password, Google, GitHub, and custom providers
- **Session Management**: Secure token handling with automatic refresh
- **Database Integration**: Seamless integration with Prisma models

### Database Choice

**SQLite → PostgreSQL Migration Path**
- **Development Simplicity**: SQLite requires no setup for local development
- **Production Scalability**: PostgreSQL handles concurrent users and complex queries
- **Feature Compatibility**: Prisma abstracts database differences during migration
- **Cost Efficiency**: SQLite for development, PostgreSQL only when scale demands

## Data Flow Architecture

### 1. User Authentication and Session Management

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Login     │───►│ NextAuth.js │───►│  Database   │───►│   Session   │
│   Request   │    │   Handler   │    │   Lookup    │    │   Creation  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                                                         │
       └─────────────────────────────────────────────────────────┘
                          Session Cookie Set
```

**Authentication Flow:**
1. User submits credentials via login form
2. NextAuth.js validates credentials against database
3. On success, JWT token is generated and stored as HTTP-only cookie
4. Subsequent requests include session cookie for authentication
5. Middleware validates session on protected routes

**Session Persistence:**
- JWT tokens stored as secure, HTTP-only cookies
- Session data cached in-memory for performance
- Automatic token refresh handles expiration
- Logout clears all session data and cookies

### 2. Personal vs Team Context Switching

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Context   │───►│   Route     │───►│    Data     │
│  Selection  │    │  Handler    │    │  Filtering  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐            │
       │            │ Permission  │            │
       └───────────►│   Check     │◄───────────┘
                    └─────────────┘
```

**Context Management:**
- URL-based context switching (`/personal` vs `/teams/[teamId]`)
- Middleware enforces context permissions before page render
- Server components filter data based on current context
- Client-side navigation maintains context state

**Authorization Model:**
- Personal context: User can only access their own data
- Team context: Role-based access (Owner > Admin > Member > Viewer)
- Cross-context protection: Personal data never exposed to team context
- API endpoints validate context permissions on every request

### 3. Todo CRUD Operations with Authorization

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───►│    API      │───►│   Auth      │───►│  Database   │
│   Request   │    │   Route     │    │   Check     │    │  Operation  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   ▼                   ▼                   │
       │            ┌─────────────┐    ┌─────────────┐            │
       └───────────►│   Validation│───►│   Business  │◄───────────┘
                    │    Layer    │    │    Logic    │
                    └─────────────┘    └─────────────┘
```

**Create Todo Flow:**
1. Client submits todo creation request
2. API route validates user session and permissions
3. Input validation ensures data integrity
4. Business logic determines context (personal/team)
5. Database transaction creates todo with proper relationships
6. Response includes created todo with updated UI state

**Update/Delete Operations:**
- Ownership validation: Users can only modify their own personal todos
- Team permission check: Team todos require appropriate role permissions
- Optimistic UI updates provide immediate feedback
- Server validation ensures data consistency
- Rollback mechanism handles failed operations

### 4. Team Invitation Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Create    │───►│   Generate  │───►│    Send     │───►│   Track     │
│ Invitation  │    │    Token    │    │   Email     │    │   Status    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Permission  │    │ Expiration  │    │ Email Queue │    │ Notification│
│    Check    │    │    Timer    │    │  Processing │    │   System    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Invitation Creation:**
1. Team owner/admin creates invitation with email and role
2. System generates secure invitation token with expiration
3. Email sent to invitee with invitation link
4. Invitation stored in database with pending status

**Invitation Acceptance:**
1. Invitee clicks invitation link
2. Token validation ensures invitation is valid and not expired
3. User registration/login if not authenticated
4. Team membership created with specified role
5. Invitation status updated to accepted
6. Welcome email and in-app notification sent

### 5. Time Tracking System

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Start    │───►│   Active    │───►│    Stop     │───►│    Save     │
│    Timer    │    │   Session   │    │   Timer     │    │   Entry     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Client     │    │ Heartbeat   │    │ Duration    │    │ Validation  │
│  Storage    │    │   Sync      │    │ Calculation │    │   Logic     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Timer Implementation:**
- Client-side timer with localStorage persistence
- Periodic server sync prevents data loss
- Server validation ensures reasonable time entries
- Manual time entry as alternative to timer
- Concurrent session prevention per user

**Data Collection:**
- Time entries linked to specific todos
- User attribution for team time tracking
- Start time, end time, and calculated duration
- Optional description and categorization
- Aggregation for reporting and billing

## Database Schema Design

### Core Models

```typescript
// User Account Management
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String?   @unique
  password      String    // Hashed with bcryptjs
  name          String?
  image         String?
  emailVerified DateTime?
  
  // Personal preferences
  timezone      String    @default("UTC")
  theme         String    @default("system") // light, dark, system
  notifications Boolean   @default(true)
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  sessions      Session[]
  personalTodos PersonalTodo[]
  teamMembers   TeamMember[]
  teamInvitations TeamInvitation[]
  timeEntries   TimeEntry[]
  createdTeams  Team[]    @relation("TeamOwner")
}

// NextAuth.js Session Management
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// Team Structure
model Team {
  id          String   @id @default(cuid())
  name        String
  description String?
  slug        String   @unique // URL-friendly team identifier
  
  // Team settings
  isPublic    Boolean  @default(false)
  inviteCode  String?  @unique // Optional public invite code
  
  // Ownership
  ownerId     String
  owner       User     @relation("TeamOwner", fields: [ownerId], references: [id])
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  members     TeamMember[]
  todos       TeamTodo[]
  invitations TeamInvitation[]
}

// Team Membership with Roles
model TeamMember {
  id       String   @id @default(cuid())
  teamId   String
  userId   String
  role     TeamRole @default(MEMBER)
  
  // Membership metadata
  joinedAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  team     Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([teamId, userId])
}

enum TeamRole {
  OWNER   // Full permissions, cannot be removed
  ADMIN   // Manage team, invite users, manage all todos
  MEMBER  // Create/edit own todos, view all team todos
  VIEWER  // View team todos only
}

// Team Invitation System
model TeamInvitation {
  id        String            @id @default(cuid())
  email     String
  teamId    String
  inviterId String
  role      TeamRole          @default(MEMBER)
  token     String            @unique
  status    InvitationStatus  @default(PENDING)
  
  // Invitation metadata
  message   String?           // Optional personal message
  expiresAt DateTime
  
  // Timestamps
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
  
  // Relations
  team      Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  inviter   User              @relation(fields: [inviterId], references: [id])
  
  @@unique([email, teamId])
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
  CANCELLED
}

// Personal Todo Management
model PersonalTodo {
  id          String      @id @default(cuid())
  title       String
  description String?     // Rich markdown content
  
  // Todo properties
  status      TodoStatus  @default(TODO)
  priority    Priority    @default(MEDIUM)
  dueDate     DateTime?
  
  // Organization
  category    String?
  tags        String[]    // Array of tags
  
  // Ownership
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  completedAt DateTime?
  
  // Relations
  timeEntries TimeEntry[]
}

// Team Todo Management
model TeamTodo {
  id          String      @id @default(cuid())
  title       String
  description String?     // Rich markdown content
  
  // Todo properties
  status      TodoStatus  @default(TODO)
  priority    Priority    @default(MEDIUM)
  dueDate     DateTime?
  
  // Team context
  teamId      String
  team        Team        @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  // Assignment
  assigneeId  String?     // Optional assignment
  assignee    User?       @relation(fields: [assigneeId], references: [id])
  createdById String      // Who created the todo
  createdBy   User        @relation("TodoCreator", fields: [createdById], references: [id])
  
  // Organization
  category    String?
  tags        String[]    // Array of tags
  
  // Timestamps
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  completedAt DateTime?
  
  // Relations
  timeEntries TimeEntry[]
}

enum TodoStatus {
  TODO
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

// Time Tracking System
model TimeEntry {
  id          String    @id @default(cuid())
  
  // Time data
  startTime   DateTime
  endTime     DateTime?
  duration    Int?      // Calculated duration in seconds
  description String?
  
  // Context - can be personal or team todo
  personalTodoId String?
  personalTodo   PersonalTodo? @relation(fields: [personalTodoId], references: [id], onDelete: Cascade)
  teamTodoId     String?
  teamTodo       TeamTodo?     @relation(fields: [teamTodoId], references: [id], onDelete: Cascade)
  
  // User tracking
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Entry type
  isManual    Boolean   @default(false) // Manual entry vs timer-based
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@check((personalTodoId != null) != (teamTodoId != null)) // Ensure exactly one todo type
}
```

### Indexes for Performance

```sql
-- User lookups
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_user_username ON User(username);

-- Team membership queries
CREATE INDEX idx_team_member_user ON TeamMember(userId);
CREATE INDEX idx_team_member_team ON TeamMember(teamId);

-- Todo queries
CREATE INDEX idx_personal_todo_user_status ON PersonalTodo(userId, status);
CREATE INDEX idx_team_todo_team_status ON TeamTodo(teamId, status);
CREATE INDEX idx_team_todo_assignee ON TeamTodo(assigneeId);
CREATE INDEX idx_todo_due_date ON PersonalTodo(dueDate) WHERE dueDate IS NOT NULL;
CREATE INDEX idx_team_todo_due_date ON TeamTodo(dueDate) WHERE dueDate IS NOT NULL;

-- Time tracking performance
CREATE INDEX idx_time_entry_user ON TimeEntry(userId);
CREATE INDEX idx_time_entry_personal_todo ON TimeEntry(personalTodoId);
CREATE INDEX idx_time_entry_team_todo ON TimeEntry(teamTodoId);
CREATE INDEX idx_time_entry_start_time ON TimeEntry(startTime);

-- Invitation management
CREATE INDEX idx_invitation_email ON TeamInvitation(email);
CREATE INDEX idx_invitation_token ON TeamInvitation(token);
CREATE INDEX idx_invitation_expires ON TeamInvitation(expiresAt);
```

## Security Architecture

### Authentication Layer

**NextAuth.js Integration Pattern:**
```typescript
// /src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user || !await bcrypt.compare(credentials.password, user.password)) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
};
```

### Authorization Model

**Role-Based Access Control (RBAC):**

1. **Personal Context Authorization:**
   - Users can only access their own personal todos
   - No sharing or visibility to other users
   - Time entries linked to personal todos are private

2. **Team Context Authorization:**
   - **OWNER**: Full team management, cannot be removed, can delete team
   - **ADMIN**: Invite/remove members, manage all todos, cannot remove owner
   - **MEMBER**: Create/edit own todos, view all team todos, basic participation
   - **VIEWER**: Read-only access to team todos, cannot create or edit

3. **Data Isolation:**
   - Personal todos are completely isolated from team contexts
   - Team data is filtered by membership before any operation
   - Cross-team data leakage prevented by middleware validation

### Security Middleware

```typescript
// /src/middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getServerSession({ req: request, ...authOptions });
  
  // Protect all /api routes except public endpoints
  if (request.nextUrl.pathname.startsWith('/api')) {
    if (!session && !isPublicEndpoint(request.nextUrl.pathname)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }
  
  // Team context validation
  if (request.nextUrl.pathname.startsWith('/teams/')) {
    const teamId = request.nextUrl.pathname.split('/')[2];
    const hasAccess = await validateTeamAccess(session?.user.id, teamId);
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### API Security Patterns

**Request Validation:**
```typescript
// Standard API route security pattern
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const validation = createTodoSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ 
      error: 'Invalid input', 
      details: validation.error.errors 
    }, { status: 400 });
  }
  
  // Business logic with proper authorization checks
  const result = await createTodo({
    ...validation.data,
    userId: session.user.id,
  });
  
  return NextResponse.json({ data: result });
}
```

### Data Validation & Sanitization

**Input Validation with Zod:**
```typescript
// /src/lib/validations/todo.ts
export const createTodoSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.coerce.date().optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10),
  teamId: z.string().cuid().optional(), // For team todos
});
```

## Performance Considerations

### Database Optimization

**Query Optimization Strategies:**

1. **Selective Data Loading:**
   ```typescript
   // Only load necessary fields
   const todos = await prisma.personalTodo.findMany({
     where: { userId },
     select: {
       id: true,
       title: true,
       status: true,
       dueDate: true,
       priority: true,
       updatedAt: true,
     },
     orderBy: { updatedAt: 'desc' },
   });
   ```

2. **Pagination Implementation:**
   ```typescript
   const ITEMS_PER_PAGE = 20;
   
   const todos = await prisma.personalTodo.findMany({
     where: { userId },
     skip: (page - 1) * ITEMS_PER_PAGE,
     take: ITEMS_PER_PAGE,
     orderBy: { createdAt: 'desc' },
   });
   ```

3. **Efficient Team Queries:**
   ```typescript
   // Pre-validate team membership to avoid unauthorized queries
   const teamMember = await prisma.teamMember.findUnique({
     where: {
       teamId_userId: {
         teamId: params.teamId,
         userId: session.user.id,
       },
     },
   });
   
   if (!teamMember) {
     throw new Error('Unauthorized');
   }
   ```

### Caching Strategies

**Next.js Built-in Caching:**
```typescript
// Server component with caching
export default async function TodoList({ userId }: { userId: string }) {
  const todos = await getTodos(userId);
  return (
    <div>
      {todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
    </div>
  );
}

// Cached data fetching function
async function getTodos(userId: string) {
  return await prisma.personalTodo.findMany({
    where: { userId },
    // Next.js 14 automatically caches this query
    cache: 'force-cache',
    next: {
      revalidate: 300, // Revalidate every 5 minutes
      tags: [`user-todos-${userId}`],
    },
  });
}
```

**Redis Integration (Future Enhancement):**
```typescript
// Session and frequently accessed data caching
const redis = new Redis(process.env.REDIS_URL);

export async function getCachedUser(userId: string) {
  const cached = await redis.get(`user:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  await redis.setex(`user:${userId}`, 300, JSON.stringify(user));
  return user;
}
```

### Real-time Update Mechanisms

**Server Actions for Immediate Updates:**
```typescript
// /src/app/actions/todo-actions.ts
'use server';

export async function createTodo(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  
  const todo = await prisma.personalTodo.create({
    data: {
      title: formData.get('title') as string,
      userId: session.user.id,
    },
  });
  
  // Revalidate relevant pages
  revalidateTag(`user-todos-${session.user.id}`);
  
  return todo;
}
```

**Optimistic UI Updates:**
```typescript
// Client-side optimistic updates
export function useTodoMutation() {
  const router = useRouter();
  
  return useMutation({
    mutationFn: createTodo,
    onMutate: async (newTodo) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries(['todos']);
      
      // Optimistically update cache
      queryClient.setQueryData(['todos'], (old) => [
        ...old,
        { ...newTodo, id: 'temp-' + Date.now(), status: 'TODO' },
      ]);
    },
    onError: (err, newTodo, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(['todos'], context.previousTodos);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['todos']);
    },
  });
}
```

### Image and Asset Optimization

**Next.js Image Component:**
```typescript
import Image from 'next/image';

export function UserAvatar({ user }: { user: User }) {
  return (
    <Image
      src={user.image || '/default-avatar.png'}
      alt={user.name || 'User'}
      width={40}
      height={40}
      className="rounded-full"
      loading="lazy"
    />
  );
}
```

## Scalability Planning

### Database Scaling Strategy

**Phase 1: SQLite to PostgreSQL Migration**
```typescript
// Database configuration for different environments
const databaseUrl = {
  development: 'file:./dev.db',
  test: 'file:./test.db',
  production: process.env.DATABASE_URL, // PostgreSQL
};

// Prisma schema adaptation
datasource db {
  provider = env("NODE_ENV") === "production" ? "postgresql" : "sqlite"
  url      = env("DATABASE_URL")
}
```

**Phase 2: Read Replicas and Connection Pooling**
```typescript
// Production database configuration
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pooling for high concurrency
export const readReplica = new PrismaClient({
  datasources: {
    db: {
      url: process.env.READ_REPLICA_URL,
    },
  },
});
```

### Horizontal Scaling Architecture

**Microservices Extraction Points:**

1. **Authentication Service**: Extract NextAuth.js to dedicated service
2. **Notification Service**: Email and push notification handling
3. **File Upload Service**: Handle file attachments and images
4. **Analytics Service**: Usage tracking and reporting
5. **Search Service**: Full-text search with Elasticsearch

**API Gateway Pattern:**
```typescript
// Future API gateway integration
export async function apiHandler(request: Request) {
  const service = determineService(request.url);
  
  switch (service) {
    case 'auth':
      return await authService(request);
    case 'todos':
      return await todoService(request);
    case 'teams':
      return await teamService(request);
    case 'notifications':
      return await notificationService(request);
    default:
      return new Response('Service not found', { status: 404 });
  }
}
```

### Performance Monitoring

**Metrics to Track:**
- API response times by endpoint
- Database query performance
- User session duration
- Feature adoption rates
- Error rates and types
- Cache hit/miss ratios

**Monitoring Implementation:**
```typescript
// Performance monitoring middleware
export async function withMetrics(handler: Function) {
  return async function (request: Request) {
    const start = Date.now();
    const endpoint = request.url;
    
    try {
      const response = await handler(request);
      
      // Log success metrics
      analytics.track('api_request', {
        endpoint,
        duration: Date.now() - start,
        status: response.status,
      });
      
      return response;
    } catch (error) {
      // Log error metrics
      analytics.track('api_error', {
        endpoint,
        duration: Date.now() - start,
        error: error.message,
      });
      
      throw error;
    }
  };
}
```

### Future Technical Enhancements

**Real-time Collaboration with WebSockets:**
```typescript
// Future WebSocket integration for real-time updates
export class CollaborationService {
  private wss: WebSocketServer;
  
  broadcastTeamUpdate(teamId: string, update: TeamUpdate) {
    const teamSockets = this.getTeamSockets(teamId);
    teamSockets.forEach(socket => {
      socket.send(JSON.stringify({
        type: 'team_update',
        data: update,
      }));
    });
  }
}
```

**Search and Analytics:**
```typescript
// Integration with Elasticsearch for advanced search
export async function searchTodos(query: string, userId: string) {
  const results = await elasticsearch.search({
    index: 'todos',
    body: {
      query: {
        bool: {
          must: [
            { match: { content: query } },
            { term: { userId } },
          ],
        },
      },
    },
  });
  
  return results.hits.hits.map(hit => hit._source);
}
```

This architecture document provides a comprehensive foundation for building a scalable, secure, and maintainable collaborative todo application that can grow from individual use to enterprise-scale deployment while maintaining performance and user experience standards.