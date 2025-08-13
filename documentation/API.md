# API Documentation

## API Architecture

### Technical Stack
- **Framework**: Next.js 14 App Router with API Routes
- **Authentication**: NextAuth.js v5 with JWT strategy
- **Database**: Prisma ORM with SQLite (dev) → PostgreSQL (production)
- **Validation**: Zod for request/response validation
- **Security**: bcryptjs for password hashing, CSRF protection
- **Session Management**: JWT tokens with HTTP-only cookies

### Base URL
```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

### Standard Response Format
All API endpoints follow a consistent JSON response format:

#### Success Response
```json
{
  "data": {},
  "message": "Optional success message"
}
```

#### Error Response
```json
{
  "error": "Error message",
  "details": {} // Only included in development environment
}
```

#### Paginated Response
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Optional success message"
}
```

## Authentication System

### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe" // Optional
}
```

**Validation Rules:**
- `email`: Valid email format, unique in database
- `password`: Minimum 8 characters, must contain letters and numbers
- `name`: Optional, max 100 characters

**Response (201):**
```json
{
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "cuid_user_id",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

**Error Responses:**
- `400`: Invalid input data or user already exists
- `500`: Internal server error

### NextAuth.js Endpoints
NextAuth.js automatically handles authentication routes:

#### POST /api/auth/signin
Handle user sign-in with credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### POST /api/auth/signout
Sign out the current user and invalidate session.

#### GET /api/auth/session
Get current user session information.

**Response (200):**
```json
{
  "user": {
    "id": "cuid_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://example.com/avatar.jpg"
  },
  "expires": "2024-09-13T10:30:00.000Z"
}
```

#### GET /api/auth/csrf
Get CSRF token for form submissions.

## User Management

### GET /api/users/profile
Get current user's profile information.

**Authentication:** Required

**Response (200):**
```json
{
  "data": {
    "id": "cuid_user_id",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "image": "https://example.com/avatar.jpg",
    "timezone": "UTC",
    "theme": "system", // "light", "dark", "system"
    "notifications": true,
    "createdAt": "2024-08-01T10:00:00.000Z",
    "updatedAt": "2024-08-13T15:30:00.000Z"
  }
}
```

### PATCH /api/users/profile
Update current user's profile.

**Authentication:** Required

**Request Body:**
```json
{
  "username": "newusername", // Optional, must be unique
  "name": "New Name", // Optional
  "timezone": "America/New_York", // Optional
  "theme": "dark", // Optional: "light", "dark", "system"
  "notifications": false // Optional
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "data": {
    // Updated user object
  }
}
```

### POST /api/users/change-password
Change user's password.

**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

## Team Management

### POST /api/teams
Create a new team.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Development Team",
  "description": "Frontend and backend developers", // Optional
  "isPublic": false // Optional, default false
}
```

**Response (201):**
```json
{
  "message": "Team created successfully",
  "data": {
    "id": "cuid_team_id",
    "name": "Development Team",
    "description": "Frontend and backend developers",
    "slug": "development-team-abc123",
    "isPublic": false,
    "ownerId": "cuid_user_id",
    "createdAt": "2024-08-13T10:00:00.000Z",
    "memberCount": 1
  }
}
```

### GET /api/teams
Get all teams the current user belongs to.

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20

**Response (200):**
```json
{
  "data": [
    {
      "id": "cuid_team_id",
      "name": "Development Team",
      "description": "Frontend and backend developers",
      "slug": "development-team-abc123",
      "isPublic": false,
      "role": "OWNER", // User's role in this team
      "memberCount": 5,
      "todoCount": 23,
      "createdAt": "2024-08-13T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### GET /api/teams/[teamId]
Get detailed information about a specific team.

**Authentication:** Required
**Authorization:** Must be a team member

**Response (200):**
```json
{
  "data": {
    "id": "cuid_team_id",
    "name": "Development Team",
    "description": "Frontend and backend developers",
    "slug": "development-team-abc123",
    "isPublic": false,
    "ownerId": "cuid_user_id",
    "createdAt": "2024-08-13T10:00:00.000Z",
    "updatedAt": "2024-08-13T15:30:00.000Z",
    "members": [
      {
        "id": "cuid_member_id",
        "userId": "cuid_user_id",
        "role": "OWNER",
        "joinedAt": "2024-08-13T10:00:00.000Z",
        "user": {
          "id": "cuid_user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "image": "https://example.com/avatar.jpg"
        }
      }
    ],
    "stats": {
      "totalTodos": 45,
      "completedTodos": 32,
      "activeTodos": 13,
      "totalTimeSpent": 1440 // minutes
    }
  }
}
```

### PATCH /api/teams/[teamId]
Update team information.

**Authentication:** Required
**Authorization:** Must be team OWNER or ADMIN

**Request Body:**
```json
{
  "name": "Updated Team Name", // Optional
  "description": "New team description", // Optional
  "isPublic": true // Optional
}
```

### DELETE /api/teams/[teamId]
Delete a team (only team owner).

**Authentication:** Required
**Authorization:** Must be team OWNER

**Response (200):**
```json
{
  "message": "Team deleted successfully"
}
```

### GET /api/teams/[teamId]/members
Get team members with pagination.

**Authentication:** Required
**Authorization:** Must be a team member

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20
- `role` (optional): Filter by role: "OWNER", "ADMIN", "MEMBER", "VIEWER"

**Response (200):**
```json
{
  "data": [
    {
      "id": "cuid_member_id",
      "userId": "cuid_user_id",
      "role": "ADMIN",
      "joinedAt": "2024-08-13T10:00:00.000Z",
      "user": {
        "id": "cuid_user_id",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "image": "https://example.com/avatar2.jpg"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### PATCH /api/teams/[teamId]/members/[userId]
Update a team member's role.

**Authentication:** Required
**Authorization:** Must be team OWNER or ADMIN (cannot modify owner)

**Request Body:**
```json
{
  "role": "ADMIN" // "OWNER", "ADMIN", "MEMBER", "VIEWER"
}
```

### DELETE /api/teams/[teamId]/members/[userId]
Remove a member from the team.

**Authentication:** Required
**Authorization:** Must be team OWNER or ADMIN, or user removing themselves

## Team Invitations

### POST /api/teams/[teamId]/invitations
Create a new team invitation.

**Authentication:** Required
**Authorization:** Must be team OWNER or ADMIN

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "MEMBER", // "ADMIN", "MEMBER", "VIEWER"
  "message": "Welcome to our development team!" // Optional
}
```

**Response (201):**
```json
{
  "message": "Invitation sent successfully",
  "data": {
    "id": "cuid_invitation_id",
    "email": "newmember@example.com",
    "role": "MEMBER",
    "status": "PENDING",
    "expiresAt": "2024-08-20T10:00:00.000Z",
    "createdAt": "2024-08-13T10:00:00.000Z"
  }
}
```

### GET /api/teams/[teamId]/invitations
Get pending invitations for a team.

**Authentication:** Required
**Authorization:** Must be team OWNER or ADMIN

**Response (200):**
```json
{
  "data": [
    {
      "id": "cuid_invitation_id",
      "email": "pending@example.com",
      "role": "MEMBER",
      "status": "PENDING",
      "message": "Join our team!",
      "expiresAt": "2024-08-20T10:00:00.000Z",
      "createdAt": "2024-08-13T10:00:00.000Z",
      "inviter": {
        "id": "cuid_user_id",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

### POST /api/invitations/[token]/accept
Accept a team invitation.

**Authentication:** Required

**Response (200):**
```json
{
  "message": "Invitation accepted successfully",
  "data": {
    "team": {
      "id": "cuid_team_id",
      "name": "Development Team",
      "slug": "development-team-abc123"
    },
    "role": "MEMBER"
  }
}
```

### POST /api/invitations/[token]/decline
Decline a team invitation.

**Authentication:** Required

**Response (200):**
```json
{
  "message": "Invitation declined"
}
```

### DELETE /api/teams/[teamId]/invitations/[invitationId]
Cancel a pending invitation.

**Authentication:** Required
**Authorization:** Must be team OWNER, ADMIN, or the original inviter

## Personal Todo Management

### POST /api/todos/personal
Create a new personal todo.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation with examples", // Optional, supports Markdown
  "priority": "HIGH", // "LOW", "MEDIUM", "HIGH", "URGENT"
  "dueDate": "2024-08-20T17:00:00.000Z", // Optional
  "category": "Work", // Optional
  "tags": ["documentation", "urgent"] // Optional, max 10 tags
}
```

**Response (201):**
```json
{
  "message": "Todo created successfully",
  "data": {
    "id": "cuid_todo_id",
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation with examples",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2024-08-20T17:00:00.000Z",
    "category": "Work",
    "tags": ["documentation", "urgent"],
    "userId": "cuid_user_id",
    "createdAt": "2024-08-13T10:00:00.000Z",
    "updatedAt": "2024-08-13T10:00:00.000Z",
    "completedAt": null
  }
}
```

### GET /api/todos/personal
Get personal todos with filtering and pagination.

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20, max 100
- `status` (optional): Filter by status: "TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"
- `priority` (optional): Filter by priority: "LOW", "MEDIUM", "HIGH", "URGENT"
- `category` (optional): Filter by category
- `tags` (optional): Filter by tags (comma-separated)
- `dueDate` (optional): Filter by due date range: "overdue", "today", "week", "month"
- `search` (optional): Search in title and description
- `sortBy` (optional): Sort by "createdAt", "updatedAt", "dueDate", "priority", default "updatedAt"
- `sortOrder` (optional): "asc" or "desc", default "desc"

**Response (200):**
```json
{
  "data": [
    {
      "id": "cuid_todo_id",
      "title": "Complete project documentation",
      "description": "Write comprehensive API documentation with examples",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2024-08-20T17:00:00.000Z",
      "category": "Work",
      "tags": ["documentation", "urgent"],
      "createdAt": "2024-08-13T10:00:00.000Z",
      "updatedAt": "2024-08-13T15:00:00.000Z",
      "completedAt": null,
      "timeEntries": {
        "totalTime": 120, // minutes
        "entryCount": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET /api/todos/personal/[todoId]
Get a specific personal todo.

**Authentication:** Required
**Authorization:** Must own the todo

**Response (200):**
```json
{
  "data": {
    "id": "cuid_todo_id",
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation with examples",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "dueDate": "2024-08-20T17:00:00.000Z",
    "category": "Work",
    "tags": ["documentation", "urgent"],
    "createdAt": "2024-08-13T10:00:00.000Z",
    "updatedAt": "2024-08-13T15:00:00.000Z",
    "completedAt": null,
    "timeEntries": [
      {
        "id": "cuid_entry_id",
        "startTime": "2024-08-13T14:00:00.000Z",
        "endTime": "2024-08-13T15:00:00.000Z",
        "duration": 3600, // seconds
        "description": "Initial documentation setup",
        "isManual": false,
        "createdAt": "2024-08-13T15:00:00.000Z"
      }
    ]
  }
}
```

### PATCH /api/todos/personal/[todoId]
Update a personal todo.

**Authentication:** Required
**Authorization:** Must own the todo

**Request Body:**
```json
{
  "title": "Updated title", // Optional
  "description": "Updated description", // Optional
  "status": "COMPLETED", // Optional
  "priority": "MEDIUM", // Optional
  "dueDate": "2024-08-25T17:00:00.000Z", // Optional
  "category": "Personal", // Optional
  "tags": ["updated", "completed"] // Optional
}
```

### DELETE /api/todos/personal/[todoId]
Delete a personal todo.

**Authentication:** Required
**Authorization:** Must own the todo

**Response (200):**
```json
{
  "message": "Todo deleted successfully"
}
```

## Team Todo Management

### POST /api/teams/[teamId]/todos
Create a new team todo.

**Authentication:** Required
**Authorization:** Must be team member with create permissions

**Request Body:**
```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication with refresh tokens", // Optional, supports Markdown
  "priority": "HIGH", // "LOW", "MEDIUM", "HIGH", "URGENT"
  "dueDate": "2024-08-25T17:00:00.000Z", // Optional
  "category": "Backend", // Optional
  "tags": ["authentication", "security"], // Optional, max 10 tags
  "assigneeId": "cuid_user_id" // Optional, must be team member
}
```

**Response (201):**
```json
{
  "message": "Team todo created successfully",
  "data": {
    "id": "cuid_todo_id",
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication with refresh tokens",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2024-08-25T17:00:00.000Z",
    "category": "Backend",
    "tags": ["authentication", "security"],
    "teamId": "cuid_team_id",
    "assigneeId": "cuid_user_id",
    "createdById": "cuid_creator_id",
    "createdAt": "2024-08-13T10:00:00.000Z",
    "updatedAt": "2024-08-13T10:00:00.000Z",
    "completedAt": null,
    "assignee": {
      "id": "cuid_user_id",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "image": "https://example.com/avatar.jpg"
    },
    "createdBy": {
      "id": "cuid_creator_id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### GET /api/teams/[teamId]/todos
Get team todos with filtering and pagination.

**Authentication:** Required
**Authorization:** Must be team member

**Query Parameters:**
Same as personal todos, plus:
- `assigneeId` (optional): Filter by assigned user
- `createdById` (optional): Filter by creator
- `unassigned` (optional): If "true", show only unassigned todos

**Response (200):**
```json
{
  "data": [
    {
      "id": "cuid_todo_id",
      "title": "Implement user authentication",
      "description": "Add JWT-based authentication with refresh tokens",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2024-08-25T17:00:00.000Z",
      "category": "Backend",
      "tags": ["authentication", "security"],
      "createdAt": "2024-08-13T10:00:00.000Z",
      "updatedAt": "2024-08-13T15:00:00.000Z",
      "completedAt": null,
      "assignee": {
        "id": "cuid_user_id",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "image": "https://example.com/avatar.jpg"
      },
      "createdBy": {
        "id": "cuid_creator_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "timeEntries": {
        "totalTime": 180, // minutes
        "entryCount": 2
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 23,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### PATCH /api/teams/[teamId]/todos/[todoId]
Update a team todo.

**Authentication:** Required
**Authorization:** Must be team member with appropriate permissions

**Permission Rules:**
- **OWNER/ADMIN**: Can edit any team todo
- **MEMBER**: Can edit todos they created or are assigned to
- **VIEWER**: Cannot edit any todos

### DELETE /api/teams/[teamId]/todos/[todoId]
Delete a team todo.

**Authentication:** Required
**Authorization:** Must be team OWNER/ADMIN or todo creator

## Time Tracking System

### POST /api/todos/personal/[todoId]/time-entries
Start or create a time entry for a personal todo.

**Authentication:** Required
**Authorization:** Must own the todo

**Request Body:**
```json
{
  "startTime": "2024-08-13T14:00:00.000Z",
  "endTime": "2024-08-13T16:30:00.000Z", // Optional for timer start
  "description": "Working on API documentation", // Optional
  "isManual": false // Optional, default false for timer-based entries
}
```

**Response (201):**
```json
{
  "message": "Time entry created successfully",
  "data": {
    "id": "cuid_entry_id",
    "startTime": "2024-08-13T14:00:00.000Z",
    "endTime": "2024-08-13T16:30:00.000Z",
    "duration": 9000, // seconds (2.5 hours)
    "description": "Working on API documentation",
    "isManual": false,
    "personalTodoId": "cuid_todo_id",
    "userId": "cuid_user_id",
    "createdAt": "2024-08-13T16:30:00.000Z",
    "updatedAt": "2024-08-13T16:30:00.000Z"
  }
}
```

### POST /api/teams/[teamId]/todos/[todoId]/time-entries
Create a time entry for a team todo.

**Authentication:** Required
**Authorization:** Must be team member

**Request/Response:** Same format as personal time entries

### GET /api/time-entries
Get time entries for the current user.

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20
- `todoType` (optional): "personal" or "team"
- `todoId` (optional): Filter by specific todo
- `teamId` (optional): Filter by team (for team time entries)
- `startDate` (optional): Filter entries after this date
- `endDate` (optional): Filter entries before this date
- `sortBy` (optional): "startTime", "duration", "createdAt", default "startTime"
- `sortOrder` (optional): "asc" or "desc", default "desc"

**Response (200):**
```json
{
  "data": [
    {
      "id": "cuid_entry_id",
      "startTime": "2024-08-13T14:00:00.000Z",
      "endTime": "2024-08-13T16:30:00.000Z",
      "duration": 9000, // seconds
      "description": "Working on API documentation",
      "isManual": false,
      "createdAt": "2024-08-13T16:30:00.000Z",
      "todo": {
        "id": "cuid_todo_id",
        "title": "Complete project documentation",
        "type": "personal" // or "team"
      },
      "team": { // Only present for team todos
        "id": "cuid_team_id",
        "name": "Development Team"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 125,
    "totalPages": 7,
    "hasNext": true,
    "hasPrev": false
  },
  "summary": {
    "totalTime": 45600, // Total time in seconds
    "totalEntries": 125,
    "averageSessionTime": 3648 // Average session length in seconds
  }
}
```

### PATCH /api/time-entries/[entryId]
Update a time entry.

**Authentication:** Required
**Authorization:** Must own the time entry

**Request Body:**
```json
{
  "endTime": "2024-08-13T17:00:00.000Z", // Optional
  "description": "Updated description", // Optional
  "isManual": true // Optional
}
```

### DELETE /api/time-entries/[entryId]
Delete a time entry.

**Authentication:** Required
**Authorization:** Must own the time entry

### GET /api/time-entries/active
Get currently active time entry (timer running).

**Authentication:** Required

**Response (200):**
```json
{
  "data": {
    "id": "cuid_entry_id",
    "startTime": "2024-08-13T16:00:00.000Z",
    "endTime": null, // null indicates timer is still running
    "description": "Working on authentication",
    "isManual": false,
    "todo": {
      "id": "cuid_todo_id",
      "title": "Implement user authentication",
      "type": "team"
    },
    "team": {
      "id": "cuid_team_id",
      "name": "Development Team"
    }
  }
}
```

**Response (204):** No active time entry

### POST /api/time-entries/[entryId]/stop
Stop an active timer.

**Authentication:** Required
**Authorization:** Must own the time entry

**Response (200):**
```json
{
  "message": "Timer stopped successfully",
  "data": {
    "id": "cuid_entry_id",
    "startTime": "2024-08-13T16:00:00.000Z",
    "endTime": "2024-08-13T18:00:00.000Z",
    "duration": 7200, // 2 hours in seconds
    "description": "Working on authentication",
    "isManual": false
  }
}
```

## Reports and Analytics

### GET /api/reports/personal
Get personal productivity reports.

**Authentication:** Required

**Query Parameters:**
- `period` (optional): "week", "month", "quarter", "year", default "month"
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date

**Response (200):**
```json
{
  "data": {
    "period": "month",
    "startDate": "2024-08-01T00:00:00.000Z",
    "endDate": "2024-08-31T23:59:59.999Z",
    "todos": {
      "total": 45,
      "completed": 32,
      "inProgress": 8,
      "todo": 3,
      "cancelled": 2,
      "completionRate": 71.1 // percentage
    },
    "timeTracking": {
      "totalTime": 86400, // seconds
      "totalSessions": 156,
      "averageSessionTime": 554, // seconds
      "workDays": 22,
      "averageTimePerDay": 3927 // seconds
    },
    "categories": [
      {
        "name": "Work",
        "todoCount": 28,
        "completedCount": 22,
        "totalTime": 64800 // seconds
      }
    ],
    "priorities": [
      {
        "priority": "HIGH",
        "todoCount": 12,
        "completedCount": 10,
        "totalTime": 25200
      }
    ],
    "dailyActivity": [
      {
        "date": "2024-08-01",
        "todosCompleted": 2,
        "timeSpent": 3600,
        "todosCreaated": 3
      }
    ]
  }
}
```

### GET /api/teams/[teamId]/reports
Get team productivity reports.

**Authentication:** Required
**Authorization:** Must be team member

**Response (200):**
```json
{
  "data": {
    "period": "month",
    "startDate": "2024-08-01T00:00:00.000Z",
    "endDate": "2024-08-31T23:59:59.999Z",
    "team": {
      "id": "cuid_team_id",
      "name": "Development Team",
      "memberCount": 5
    },
    "todos": {
      "total": 89,
      "completed": 67,
      "inProgress": 15,
      "todo": 6,
      "cancelled": 1,
      "completionRate": 75.3
    },
    "timeTracking": {
      "totalTime": 432000, // seconds
      "totalSessions": 234,
      "averageSessionTime": 1846,
      "workDays": 22,
      "averageTimePerDay": 19636
    },
    "members": [
      {
        "id": "cuid_user_id",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "ADMIN",
        "todos": {
          "total": 18,
          "completed": 15,
          "completionRate": 83.3
        },
        "timeTracking": {
          "totalTime": 86400,
          "sessionCount": 45
        }
      }
    ],
    "categories": [
      {
        "name": "Backend",
        "todoCount": 34,
        "completedCount": 28,
        "totalTime": 151200
      }
    ]
  }
}
```

## Error Handling

### HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created successfully
- `204 No Content`: Success with no response body
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Responses

#### Validation Error (422)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "code": "password_too_short"
    }
  ]
}
```

#### Authentication Error (401)
```json
{
  "error": "Authentication required",
  "details": {
    "message": "Please sign in to access this resource",
    "redirectUrl": "/login"
  }
}
```

#### Authorization Error (403)
```json
{
  "error": "Insufficient permissions",
  "details": {
    "required": "ADMIN",
    "current": "MEMBER"
  }
}
```

#### Rate Limit Error (429)
```json
{
  "error": "Rate limit exceeded",
  "details": {
    "limit": 100,
    "remaining": 0,
    "resetTime": "2024-08-13T17:00:00.000Z"
  }
}
```

## Rate Limiting

### Limits by Endpoint Type
- **Authentication**: 5 requests per minute per IP
- **User Management**: 30 requests per minute per user
- **Todo Operations**: 100 requests per minute per user
- **Team Management**: 20 requests per minute per user
- **Time Tracking**: 60 requests per minute per user
- **Reports**: 10 requests per minute per user

### Rate Limit Headers
All responses include rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1692031200
```

### Rate Limit Implementation
```typescript
// Middleware implementation example
export async function rateLimitMiddleware(
  request: Request,
  context: { userId?: string; ip: string }
) {
  const key = context.userId || context.ip;
  const limit = getRateLimitForEndpoint(request.url);
  
  const current = await redis.incr(`ratelimit:${key}:${getWindow()}`);
  
  if (current > limit) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        details: {
          limit,
          remaining: 0,
          resetTime: getResetTime()
        }
      }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': getResetTime().toString()
        }
      }
    );
  }
  
  return null; // Continue to handler
}
```

## Security Considerations

### Authentication Security
- JWT tokens stored as HTTP-only cookies
- CSRF protection enabled for all forms
- Session expiration: 30 days (configurable)
- Password hashing with bcryptjs (10 salt rounds)
- Failed login attempt tracking and temporary lockouts

### Input Validation
- All inputs validated with Zod schemas
- SQL injection protection via Prisma ORM
- XSS protection through output encoding
- File upload restrictions and validation
- Request size limits enforced

### Data Protection
- Personal todos are completely isolated per user
- Team data requires membership validation
- Sensitive information filtered from responses
- Database queries use parameterized statements
- Audit logs for sensitive operations

### API Security Headers
```typescript
// Security headers middleware
export function securityHeaders(response: Response) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  return response;
}
```

## Real-time Features (Future)

### WebSocket Events
While the current implementation uses optimistic UI updates and server actions, future versions will include WebSocket support for real-time collaboration:

#### Team Todo Updates
```typescript
// Future WebSocket event structure
interface TeamTodoUpdateEvent {
  type: 'todo_updated';
  teamId: string;
  todoId: string;
  data: {
    title?: string;
    status?: TodoStatus;
    assigneeId?: string;
    updatedBy: {
      id: string;
      name: string;
    };
  };
  timestamp: string;
}
```

#### Team Member Activity
```typescript
interface TeamMemberActivityEvent {
  type: 'member_activity';
  teamId: string;
  userId: string;
  activity: 'online' | 'offline' | 'working_on_todo';
  todoId?: string;
  timestamp: string;
}
```

### Implementation Plan
1. **Phase 1**: Server-sent events for notifications
2. **Phase 2**: WebSocket integration for real-time todo updates
3. **Phase 3**: Collaborative editing with conflict resolution
4. **Phase 4**: Real-time time tracking synchronization

## Testing the API

### Using curl
```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Create a personal todo (requires authentication)
curl -X POST http://localhost:3000/api/todos/personal \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{"title":"Test Todo","priority":"HIGH","dueDate":"2024-08-20T17:00:00.000Z"}'
```

### Postman Collection
A comprehensive Postman collection is available for testing all endpoints. Import the collection and set up environment variables:

```json
{
  "name": "Collaborative Todo API",
  "variables": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "authToken",
      "value": "{{session-token}}"
    }
  ]
}
```

## API Versioning (Future)

### Versioning Strategy
Future API versions will be implemented using URL path versioning:

```
/api/v1/todos/personal
/api/v2/todos/personal
```

### Backward Compatibility
- v1 will be maintained for 12 months after v2 release
- Deprecation warnings will be included in response headers
- Breaking changes will only be introduced in major versions

### Migration Guide
When new versions are released, comprehensive migration guides will be provided, including:
- Changed endpoints and parameters
- Updated response formats
- New authentication requirements
- Client library updates

This API documentation provides a complete reference for integrating with the Collaborative Todo Application. For additional support or questions, please refer to the project documentation or contact the development team.