# Database Schema - Collaborative Todo Application

This document defines the complete database schema for the collaborative todo application, including all models, relationships, indexes, and constraints.

## Schema Overview

The database is designed to support:
- **Multi-tenant architecture**: Personal and team contexts with proper data isolation
- **Role-based access control**: Flexible team permissions and ownership
- **Real-time collaboration**: Optimistic updates and activity tracking
- **Time tracking**: Comprehensive time management and reporting
- **Scalable design**: Efficient queries and proper indexing

## Core Models

### User Model

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String?   @unique
  password      String    // Hashed with bcryptjs
  name          String?
  image         String?
  emailVerified DateTime?
  
  // User preferences
  timezone      String    @default("UTC")
  theme         String    @default("system") // "light" | "dark" | "system"
  notifications Boolean   @default(true)
  language      String    @default("en")
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  // Relations
  sessions       Session[]
  personalTodos  PersonalTodo[]
  teamMembers    TeamMember[]
  teamInvitations TeamInvitation[]
  timeEntries    TimeEntry[]
  createdTeams   Team[]    @relation("TeamOwner")
  assignedTeamTodos TeamTodo[] @relation("TodoAssignee")
  createdTeamTodos TeamTodo[] @relation("TodoCreator")
  todoComments   TodoComment[]
  
  @@map("users")
}
```

### Session Model (NextAuth.js)

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("sessions")
}
```

## Team Management Models

### Team Model

```prisma
model Team {
  id          String   @id @default(cuid())
  name        String
  description String?
  slug        String   @unique // URL-friendly team identifier
  
  // Team settings
  isPublic    Boolean  @default(false)
  inviteCode  String?  @unique // Optional public invite code
  color       String?  @default("#06b6d4") // Team color for UI
  
  // Team configuration
  allowGuestInvites Boolean @default(false)
  requireApproval   Boolean @default(false)
  maxMembers       Int?    // Optional member limit
  
  // Ownership
  ownerId     String
  owner       User     @relation("TeamOwner", fields: [ownerId], references: [id])
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  archivedAt  DateTime? // For soft delete
  
  // Relations
  members     TeamMember[]
  todos       TeamTodo[]
  invitations TeamInvitation[]
  
  @@map("teams")
}
```

### TeamMember Model

```prisma
model TeamMember {
  id       String   @id @default(cuid())
  teamId   String
  userId   String
  role     TeamRole @default(MEMBER)
  
  // Membership metadata
  joinedAt   DateTime @default(now())
  updatedAt  DateTime @updatedAt
  lastActiveAt DateTime?
  invitedById String? // Who invited this member
  
  // Member settings
  notifications Boolean @default(true)
  emailDigest   Boolean @default(true)
  
  // Relations
  team     Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([teamId, userId])
  @@map("team_members")
}
```

### TeamRole Enum

```prisma
enum TeamRole {
  OWNER   // Full permissions, cannot be removed, can transfer ownership
  ADMIN   // Manage team, invite users, manage all todos, cannot remove owner
  MEMBER  // Create/edit own todos, view all team todos, basic participation
  VIEWER  // View team todos only, cannot create or edit
  
  @@map("team_roles")
}
```

### TeamInvitation Model

```prisma
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
  respondedAt DateTime?
  
  // Timestamps
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
  
  // Relations
  team      Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  inviter   User              @relation(fields: [inviterId], references: [id])
  
  @@unique([email, teamId]) // Prevent duplicate invitations
  @@map("team_invitations")
}
```

### InvitationStatus Enum

```prisma
enum InvitationStatus {
  PENDING   // Invitation sent, waiting for response
  ACCEPTED  // Invitation accepted, member joined
  DECLINED  // Invitation declined by recipient
  EXPIRED   // Invitation expired (automatically set)
  CANCELLED // Invitation cancelled by inviter
  
  @@map("invitation_statuses")
}
```

## Todo Management Models

### PersonalTodo Model

```prisma
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
  tags        String[]    // Array of tags for flexible organization
  color       String?     // Optional color coding
  
  // Metadata
  estimatedMinutes Int?    // Time estimate
  actualMinutes    Int?    // Calculated from time entries
  
  // Ownership
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  completedAt DateTime?
  archivedAt  DateTime?   // For soft delete
  
  // Relations
  timeEntries TimeEntry[]
  
  @@map("personal_todos")
}
```

### TeamTodo Model

```prisma
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
  assignee    User?       @relation("TodoAssignee", fields: [assigneeId], references: [id])
  createdById String      // Who created the todo
  createdBy   User        @relation("TodoCreator", fields: [createdById], references: [id])
  
  // Organization
  category    String?
  tags        String[]    // Array of tags
  color       String?     // Optional color coding
  
  // Collaboration
  isTemplate  Boolean     @default(false)
  templateName String?    // If this is a template
  
  // Metadata
  estimatedMinutes Int?    // Time estimate
  actualMinutes    Int?    // Calculated from time entries
  
  // Timestamps
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  completedAt DateTime?
  archivedAt  DateTime?   // For soft delete
  
  // Relations
  timeEntries TimeEntry[]
  comments    TodoComment[]
  
  @@map("team_todos")
}
```

### TodoComment Model

```prisma
model TodoComment {
  id         String   @id @default(cuid())
  content    String   // Markdown supported
  teamTodoId String
  userId     String
  
  // Metadata
  isEdited   Boolean  @default(false)
  editedAt   DateTime?
  
  // Timestamps
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  // Relations
  teamTodo   TeamTodo @relation(fields: [teamTodoId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("todo_comments")
}
```

### TodoStatus Enum

```prisma
enum TodoStatus {
  TODO        // Not started
  IN_PROGRESS // Currently being worked on
  COMPLETED   // Finished successfully
  CANCELLED   // Cancelled or abandoned
  
  @@map("todo_statuses")
}
```

### Priority Enum

```prisma
enum Priority {
  LOW     // Nice to have
  MEDIUM  // Standard priority
  HIGH    // Important
  URGENT  // Critical, needs immediate attention
  
  @@map("priorities")
}
```

## Time Tracking Models

### TimeEntry Model

```prisma
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
  
  // Entry metadata
  isManual    Boolean   @default(false) // Manual entry vs timer-based
  source      String?   @default("web") // "web", "mobile", "api"
  
  // Billing (future feature)
  billable    Boolean   @default(false)
  hourlyRate  Decimal?  @db.Decimal(10, 2)
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@check(personalTodoId != null || teamTodoId != null) // Ensure exactly one todo type
  @@check(personalTodoId == null || teamTodoId == null) // Ensure not both
  @@map("time_entries")
}
```

## Database Indexes for Performance

```sql
-- User lookups and authentication
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_session_token ON sessions(session_token);
CREATE INDEX idx_session_user_id ON sessions(user_id);

-- Team membership queries
CREATE INDEX idx_team_member_user_id ON team_members(user_id);
CREATE INDEX idx_team_member_team_id ON team_members(team_id);
CREATE INDEX idx_team_member_role ON team_members(role);
CREATE INDEX idx_team_slug ON teams(slug);
CREATE INDEX idx_team_owner_id ON teams(owner_id);

-- Team invitations
CREATE INDEX idx_team_invitation_email ON team_invitations(email);
CREATE INDEX idx_team_invitation_token ON team_invitations(token);
CREATE INDEX idx_team_invitation_expires_at ON team_invitations(expires_at);
CREATE INDEX idx_team_invitation_status ON team_invitations(status);

-- Personal todo queries
CREATE INDEX idx_personal_todo_user_id ON personal_todos(user_id);
CREATE INDEX idx_personal_todo_status ON personal_todos(status);
CREATE INDEX idx_personal_todo_due_date ON personal_todos(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_personal_todo_created_at ON personal_todos(created_at);
CREATE INDEX idx_personal_todo_updated_at ON personal_todos(updated_at);

-- Team todo queries
CREATE INDEX idx_team_todo_team_id ON team_todos(team_id);
CREATE INDEX idx_team_todo_assignee_id ON team_todos(assignee_id);
CREATE INDEX idx_team_todo_created_by_id ON team_todos(created_by_id);
CREATE INDEX idx_team_todo_status ON team_todos(status);
CREATE INDEX idx_team_todo_due_date ON team_todos(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_team_todo_created_at ON team_todos(created_at);

-- Time tracking performance
CREATE INDEX idx_time_entry_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entry_personal_todo_id ON time_entries(personal_todo_id);
CREATE INDEX idx_time_entry_team_todo_id ON time_entries(team_todo_id);
CREATE INDEX idx_time_entry_start_time ON time_entries(start_time);
CREATE INDEX idx_time_entry_created_at ON time_entries(created_at);

-- Comment queries
CREATE INDEX idx_todo_comment_team_todo_id ON todo_comments(team_todo_id);
CREATE INDEX idx_todo_comment_user_id ON todo_comments(user_id);
CREATE INDEX idx_todo_comment_created_at ON todo_comments(created_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_personal_todo_user_status ON personal_todos(user_id, status);
CREATE INDEX idx_team_todo_team_status ON team_todos(team_id, status);
CREATE INDEX idx_team_todo_assignee_status ON team_todos(assignee_id, status);
CREATE INDEX idx_time_entry_user_date ON time_entries(user_id, start_time);
```

## Database Constraints

### Foreign Key Constraints
```sql
-- Ensure referential integrity
ALTER TABLE team_members ADD CONSTRAINT fk_team_member_team 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
  
ALTER TABLE team_members ADD CONSTRAINT fk_team_member_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Prevent orphaned todos
ALTER TABLE personal_todos ADD CONSTRAINT fk_personal_todo_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  
ALTER TABLE team_todos ADD CONSTRAINT fk_team_todo_team 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
```

### Check Constraints
```sql
-- Ensure valid enum values
ALTER TABLE team_members ADD CONSTRAINT chk_team_role 
  CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER'));
  
ALTER TABLE personal_todos ADD CONSTRAINT chk_todo_status 
  CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));
  
ALTER TABLE personal_todos ADD CONSTRAINT chk_priority 
  CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'));

-- Ensure time entry logic
ALTER TABLE time_entries ADD CONSTRAINT chk_time_entry_todo 
  CHECK ((personal_todo_id IS NOT NULL AND team_todo_id IS NULL) OR 
         (personal_todo_id IS NULL AND team_todo_id IS NOT NULL));
         
ALTER TABLE time_entries ADD CONSTRAINT chk_time_entry_duration 
  CHECK (duration >= 0);

-- Ensure team ownership
ALTER TABLE teams ADD CONSTRAINT chk_team_max_members 
  CHECK (max_members IS NULL OR max_members > 0);
```

### Unique Constraints
```sql
-- Prevent duplicate team memberships
ALTER TABLE team_members ADD CONSTRAINT uk_team_member 
  UNIQUE (team_id, user_id);
  
-- Prevent duplicate invitations
ALTER TABLE team_invitations ADD CONSTRAINT uk_team_invitation 
  UNIQUE (email, team_id);
  
-- Ensure unique team slugs
ALTER TABLE teams ADD CONSTRAINT uk_team_slug UNIQUE (slug);

-- Ensure unique usernames and emails
ALTER TABLE users ADD CONSTRAINT uk_user_email UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT uk_user_username UNIQUE (username);
```

## Data Migration Strategy

### Phase 1: Initial Schema Setup
1. Create all base tables with required fields
2. Set up foreign key relationships
3. Add basic indexes for essential queries
4. Insert seed data for testing

### Phase 2: Enhanced Features
1. Add optional fields (color, templates, billing)
2. Create additional indexes for performance
3. Add check constraints for data integrity
4. Implement soft delete columns

### Phase 3: Optimization
1. Analyze query patterns and add specialized indexes
2. Partition large tables if needed
3. Add database triggers for calculated fields
4. Implement archiving strategy for old data

## Seed Data for Development

```typescript
// Basic seed data for development and testing
const seedData = {
  users: [
    {
      email: "admin@example.com",
      name: "Admin User",
      password: await bcrypt.hash("password123", 10)
    },
    {
      email: "user1@example.com", 
      name: "Test User 1",
      password: await bcrypt.hash("password123", 10)
    },
    {
      email: "user2@example.com",
      name: "Test User 2", 
      password: await bcrypt.hash("password123", 10)
    }
  ],
  teams: [
    {
      name: "Development Team",
      description: "Main development team",
      slug: "dev-team",
      ownerId: "admin-user-id"
    }
  ],
  personalTodos: [
    {
      title: "Set up development environment",
      description: "Install dependencies and configure local development",
      priority: "HIGH",
      userId: "admin-user-id"
    }
  ]
};
```

## Performance Considerations

### Query Optimization
- Use proper indexes for all frequently queried fields
- Implement pagination for large datasets
- Use database-level filtering instead of application filtering
- Cache frequently accessed static data

### Scaling Strategies
- **Read Replicas**: For high-read workloads
- **Connection Pooling**: To handle concurrent users
- **Data Partitioning**: For very large datasets
- **Caching Layer**: Redis for session and frequently accessed data

### Monitoring
- Track slow queries and optimize indexes
- Monitor database connection pool usage
- Set up alerts for performance degradation
- Regular database maintenance and vacuum operations

This schema provides a solid foundation for the collaborative todo application while being flexible enough to accommodate future features and optimized for performance.