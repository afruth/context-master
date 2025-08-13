# API Endpoints - Collaborative Todo Application

This document specifies all API endpoints for the collaborative todo application, including request/response formats, authentication requirements, and error handling.

## API Design Principles

### RESTful Design
- Use standard HTTP methods (GET, POST, PUT, DELETE)
- Resource-based URLs with consistent naming
- Proper HTTP status codes for responses
- Consistent error response format

### Authentication & Authorization
- All protected endpoints require valid JWT token
- Role-based access control for team operations
- Proper data isolation between personal and team contexts
- Rate limiting on sensitive operations

### Response Format
All responses follow a consistent structure:

```typescript
// Success Response
{
  data: any,
  message?: string,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// Error Response
{
  error: string,
  message: string,
  statusCode: number,
  details?: any // Only in development
}
```

## Authentication Endpoints

### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```typescript
{
  email: string,
  password: string,
  name?: string,
  username?: string
}
```

**Response (201):**
```typescript
{
  data: {
    user: {
      id: string,
      email: string,
      name: string | null,
      username: string | null,
      createdAt: string
    }
  },
  message: "User registered successfully"
}
```

**Errors:**
- `400` - Invalid input data
- `409` - Email or username already exists
- `422` - Password requirements not met

---

### POST `/api/auth/login`
Handled by NextAuth.js credentials provider

### POST `/api/auth/logout`
Handled by NextAuth.js signOut

### GET `/api/auth/session`
Handled by NextAuth.js session endpoint

---

## User Management Endpoints

### GET `/api/users/me`
Get current user profile information.

**Authentication:** Required

**Response (200):**
```typescript
{
  data: {
    id: string,
    email: string,
    name: string | null,
    username: string | null,
    image: string | null,
    timezone: string,
    theme: "light" | "dark" | "system",
    notifications: boolean,
    language: string,
    createdAt: string,
    lastLoginAt: string | null
  }
}
```

---

### PUT `/api/users/me`
Update current user profile.

**Authentication:** Required

**Request Body:**
```typescript
{
  name?: string,
  username?: string,
  timezone?: string,
  theme?: "light" | "dark" | "system",
  notifications?: boolean,
  language?: string
}
```

**Response (200):**
```typescript
{
  data: {
    // Updated user object
  },
  message: "Profile updated successfully"
}
```

**Errors:**
- `400` - Invalid input data
- `409` - Username already taken

---

## Personal Todo Endpoints

### GET `/api/todos/personal`
Get personal todos with filtering and pagination.

**Authentication:** Required

**Query Parameters:**
- `page?: number` (default: 1)
- `limit?: number` (default: 20, max: 100)
- `status?: TodoStatus`
- `priority?: Priority`
- `category?: string`
- `tags?: string[]` (comma-separated)
- `search?: string`
- `dueBefore?: string` (ISO date)
- `dueAfter?: string` (ISO date)
- `sortBy?: "createdAt" | "updatedAt" | "dueDate" | "priority"`
- `sortOrder?: "asc" | "desc"`

**Response (200):**
```typescript
{
  data: {
    id: string,
    title: string,
    description: string | null,
    status: TodoStatus,
    priority: Priority,
    dueDate: string | null,
    category: string | null,
    tags: string[],
    color: string | null,
    estimatedMinutes: number | null,
    actualMinutes: number | null,
    createdAt: string,
    updatedAt: string,
    completedAt: string | null
  }[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

---

### POST `/api/todos/personal`
Create a new personal todo.

**Authentication:** Required

**Request Body:**
```typescript
{
  title: string,
  description?: string,
  priority?: Priority,
  dueDate?: string, // ISO date
  category?: string,
  tags?: string[],
  color?: string,
  estimatedMinutes?: number
}
```

**Response (201):**
```typescript
{
  data: {
    // Complete todo object
  },
  message: "Todo created successfully"
}
```

**Errors:**
- `400` - Invalid input data
- `422` - Title required

---

### GET `/api/todos/personal/[id]`
Get a specific personal todo by ID.

**Authentication:** Required
**Authorization:** Must own the todo

**Response (200):**
```typescript
{
  data: {
    // Complete todo object with time entries
    timeEntries: {
      id: string,
      startTime: string,
      endTime: string | null,
      duration: number | null,
      description: string | null,
      createdAt: string
    }[]
  }
}
```

**Errors:**
- `403` - Not authorized to view this todo
- `404` - Todo not found

---

### PUT `/api/todos/personal/[id]`
Update a personal todo.

**Authentication:** Required
**Authorization:** Must own the todo

**Request Body:**
```typescript
{
  title?: string,
  description?: string,
  status?: TodoStatus,
  priority?: Priority,
  dueDate?: string | null,
  category?: string | null,
  tags?: string[],
  color?: string | null,
  estimatedMinutes?: number | null
}
```

**Response (200):**
```typescript
{
  data: {
    // Updated todo object
  },
  message: "Todo updated successfully"
}
```

---

### DELETE `/api/todos/personal/[id]`
Delete a personal todo.

**Authentication:** Required
**Authorization:** Must own the todo

**Response (200):**
```typescript
{
  message: "Todo deleted successfully"
}
```

---

### POST `/api/todos/personal/bulk`
Bulk operations on personal todos.

**Authentication:** Required

**Request Body:**
```typescript
{
  operation: "complete" | "delete" | "archive",
  todoIds: string[]
}
```

**Response (200):**
```typescript
{
  data: {
    processed: number,
    failed: number,
    errors?: string[]
  },
  message: "Bulk operation completed"
}
```

---

## Team Management Endpoints

### GET `/api/teams`
Get all teams the user is a member of.

**Authentication:** Required

**Response (200):**
```typescript
{
  data: {
    id: string,
    name: string,
    description: string | null,
    slug: string,
    color: string | null,
    isPublic: boolean,
    ownerId: string,
    role: TeamRole, // User's role in this team
    memberCount: number,
    createdAt: string,
    lastActivity: string // Latest todo update
  }[]
}
```

---

### POST `/api/teams`
Create a new team.

**Authentication:** Required

**Request Body:**
```typescript
{
  name: string,
  description?: string,
  isPublic?: boolean,
  color?: string,
  allowGuestInvites?: boolean,
  requireApproval?: boolean,
  maxMembers?: number
}
```

**Response (201):**
```typescript
{
  data: {
    // Complete team object
    slug: string, // Auto-generated from name
    role: "OWNER" // Creator's role
  },
  message: "Team created successfully"
}
```

**Errors:**
- `400` - Invalid input data
- `409` - Team name/slug already exists
- `422` - Name required

---

### GET `/api/teams/[id]`
Get team details and basic member information.

**Authentication:** Required
**Authorization:** Must be team member

**Response (200):**
```typescript
{
  data: {
    id: string,
    name: string,
    description: string | null,
    slug: string,
    color: string | null,
    isPublic: boolean,
    allowGuestInvites: boolean,
    requireApproval: boolean,
    maxMembers: number | null,
    ownerId: string,
    owner: {
      id: string,
      name: string,
      email: string,
      image: string | null
    },
    memberCount: number,
    todoStats: {
      total: number,
      completed: number,
      inProgress: number,
      overdue: number
    },
    userRole: TeamRole,
    createdAt: string,
    updatedAt: string
  }
}
```

---

### PUT `/api/teams/[id]`
Update team settings.

**Authentication:** Required
**Authorization:** Must be team owner or admin

**Request Body:**
```typescript
{
  name?: string,
  description?: string,
  color?: string,
  allowGuestInvites?: boolean,
  requireApproval?: boolean,
  maxMembers?: number
}
```

**Response (200):**
```typescript
{
  data: {
    // Updated team object
  },
  message: "Team updated successfully"
}
```

---

### DELETE `/api/teams/[id]`
Delete a team (only owner).

**Authentication:** Required
**Authorization:** Must be team owner

**Response (200):**
```typescript
{
  message: "Team deleted successfully"
}
```

**Note:** This is a soft delete that archives the team and all associated data.

---

## Team Member Management Endpoints

### GET `/api/teams/[id]/members`
Get team members with roles and activity.

**Authentication:** Required
**Authorization:** Must be team member

**Query Parameters:**
- `page?: number`
- `limit?: number`
- `role?: TeamRole`
- `search?: string`

**Response (200):**
```typescript
{
  data: {
    id: string,
    userId: string,
    user: {
      id: string,
      name: string,
      email: string,
      image: string | null,
      username: string | null
    },
    role: TeamRole,
    joinedAt: string,
    lastActiveAt: string | null,
    notifications: boolean,
    todoStats: {
      assigned: number,
      completed: number,
      overdue: number
    }
  }[],
  pagination: PaginationObject
}
```

---

### PUT `/api/teams/[id]/members/[userId]`
Update team member role or settings.

**Authentication:** Required
**Authorization:** Must be admin or owner, cannot modify owner

**Request Body:**
```typescript
{
  role?: TeamRole,
  notifications?: boolean
}
```

**Response (200):**
```typescript
{
  data: {
    // Updated member object
  },
  message: "Member updated successfully"
}
```

---

### DELETE `/api/teams/[id]/members/[userId]`
Remove team member.

**Authentication:** Required
**Authorization:** Must be admin/owner or removing self

**Response (200):**
```typescript
{
  message: "Member removed successfully"
}
```

---

## Team Invitation Endpoints

### GET `/api/teams/[id]/invitations`
Get team invitations (pending, sent, etc.).

**Authentication:** Required
**Authorization:** Must be team admin or owner

**Query Parameters:**
- `status?: InvitationStatus`
- `page?: number`
- `limit?: number`

**Response (200):**
```typescript
{
  data: {
    id: string,
    email: string,
    role: TeamRole,
    status: InvitationStatus,
    message: string | null,
    inviter: {
      id: string,
      name: string,
      email: string
    },
    createdAt: string,
    expiresAt: string,
    respondedAt: string | null
  }[],
  pagination: PaginationObject
}
```

---

### POST `/api/teams/[id]/invitations`
Send team invitation.

**Authentication:** Required
**Authorization:** Must be team admin or owner

**Request Body:**
```typescript
{
  email: string,
  role?: TeamRole,
  message?: string
}
```

**Response (201):**
```typescript
{
  data: {
    id: string,
    token: string,
    expiresAt: string
  },
  message: "Invitation sent successfully"
}
```

**Errors:**
- `400` - Invalid email or role
- `409` - User already member or invitation exists
- `422` - Team at member limit

---

### DELETE `/api/teams/[id]/invitations/[invitationId]`
Cancel team invitation.

**Authentication:** Required
**Authorization:** Must be team admin/owner or invitation sender

**Response (200):**
```typescript
{
  message: "Invitation cancelled"
}
```

---

### POST `/api/invitations/[token]/accept`
Accept team invitation using token.

**Authentication:** Required

**Response (200):**
```typescript
{
  data: {
    team: {
      id: string,
      name: string,
      slug: string
    },
    role: TeamRole
  },
  message: "Invitation accepted successfully"
}
```

**Errors:**
- `400` - Invalid or expired token
- `409` - Already a team member

---

### POST `/api/invitations/[token]/decline`
Decline team invitation.

**Authentication:** Optional (can work with email verification)

**Response (200):**
```typescript
{
  message: "Invitation declined"
}
```

---

## Team Todo Endpoints

### GET `/api/teams/[id]/todos`
Get team todos with filtering and assignment info.

**Authentication:** Required
**Authorization:** Must be team member

**Query Parameters:**
- `page?: number`
- `limit?: number`
- `status?: TodoStatus`
- `priority?: Priority`
- `assigneeId?: string`
- `createdById?: string`
- `category?: string`
- `tags?: string[]`
- `search?: string`
- `dueBefore?: string`
- `dueAfter?: string`
- `sortBy?: string`
- `sortOrder?: "asc" | "desc"`

**Response (200):**
```typescript
{
  data: {
    id: string,
    title: string,
    description: string | null,
    status: TodoStatus,
    priority: Priority,
    dueDate: string | null,
    category: string | null,
    tags: string[],
    color: string | null,
    estimatedMinutes: number | null,
    actualMinutes: number | null,
    assignee: {
      id: string,
      name: string,
      email: string,
      image: string | null
    } | null,
    createdBy: {
      id: string,
      name: string,
      email: string,
      image: string | null
    },
    commentCount: number,
    createdAt: string,
    updatedAt: string,
    completedAt: string | null
  }[],
  pagination: PaginationObject
}
```

---

### POST `/api/teams/[id]/todos`
Create team todo.

**Authentication:** Required
**Authorization:** Must be team member with create permissions

**Request Body:**
```typescript
{
  title: string,
  description?: string,
  priority?: Priority,
  dueDate?: string,
  category?: string,
  tags?: string[],
  color?: string,
  assigneeId?: string,
  estimatedMinutes?: number
}
```

**Response (201):**
```typescript
{
  data: {
    // Complete todo object with assignee info
  },
  message: "Team todo created successfully"
}
```

---

### GET `/api/teams/[id]/todos/[todoId]`
Get specific team todo with full details.

**Authentication:** Required
**Authorization:** Must be team member

**Response (200):**
```typescript
{
  data: {
    // Complete todo object
    comments: {
      id: string,
      content: string,
      user: {
        id: string,
        name: string,
        image: string | null
      },
      isEdited: boolean,
      createdAt: string,
      editedAt: string | null
    }[],
    timeEntries: {
      id: string,
      startTime: string,
      endTime: string | null,
      duration: number | null,
      description: string | null,
      user: {
        id: string,
        name: string
      },
      createdAt: string
    }[]
  }
}
```

---

### PUT `/api/teams/[id]/todos/[todoId]`
Update team todo.

**Authentication:** Required
**Authorization:** Must be team member with edit permissions

**Request Body:**
```typescript
{
  title?: string,
  description?: string,
  status?: TodoStatus,
  priority?: Priority,
  dueDate?: string | null,
  category?: string | null,
  tags?: string[],
  color?: string | null,
  assigneeId?: string | null,
  estimatedMinutes?: number | null
}
```

**Response (200):**
```typescript
{
  data: {
    // Updated todo object
  },
  message: "Todo updated successfully"
}
```

---

### DELETE `/api/teams/[id]/todos/[todoId]`
Delete team todo.

**Authentication:** Required
**Authorization:** Must be todo creator, assignee, or team admin/owner

**Response (200):**
```typescript
{
  message: "Todo deleted successfully"
}
```

---

## Todo Comments Endpoints

### GET `/api/teams/[id]/todos/[todoId]/comments`
Get todo comments with pagination.

**Authentication:** Required
**Authorization:** Must be team member

**Response (200):**
```typescript
{
  data: {
    // Comment objects as shown above
  }[],
  pagination: PaginationObject
}
```

---

### POST `/api/teams/[id]/todos/[todoId]/comments`
Add comment to team todo.

**Authentication:** Required
**Authorization:** Must be team member

**Request Body:**
```typescript
{
  content: string
}
```

**Response (201):**
```typescript
{
  data: {
    // Complete comment object
  },
  message: "Comment added successfully"
}
```

---

### PUT `/api/teams/[id]/todos/[todoId]/comments/[commentId]`
Edit todo comment.

**Authentication:** Required
**Authorization:** Must be comment author

**Request Body:**
```typescript
{
  content: string
}
```

**Response (200):**
```typescript
{
  data: {
    // Updated comment object
  },
  message: "Comment updated successfully"
}
```

---

### DELETE `/api/teams/[id]/todos/[todoId]/comments/[commentId]`
Delete todo comment.

**Authentication:** Required
**Authorization:** Must be comment author or team admin/owner

**Response (200):**
```typescript
{
  message: "Comment deleted successfully"
}
```

---

## Time Tracking Endpoints

### GET `/api/time-entries`
Get time entries for the current user.

**Authentication:** Required

**Query Parameters:**
- `page?: number`
- `limit?: number`
- `todoId?: string` (personal or team todo)
- `startDate?: string`
- `endDate?: string`
- `isRunning?: boolean`

**Response (200):**
```typescript
{
  data: {
    id: string,
    startTime: string,
    endTime: string | null,
    duration: number | null,
    description: string | null,
    isManual: boolean,
    billable: boolean,
    hourlyRate: number | null,
    todo: {
      id: string,
      title: string,
      type: "personal" | "team",
      team?: {
        id: string,
        name: string
      }
    },
    createdAt: string,
    updatedAt: string
  }[],
  pagination: PaginationObject
}
```

---

### POST `/api/time-entries`
Start time tracking or create manual entry.

**Authentication:** Required

**Request Body:**
```typescript
{
  // For timer-based entry
  todoId: string,
  todoType: "personal" | "team",
  description?: string,
  
  // For manual entry
  isManual?: boolean,
  startTime?: string,
  endTime?: string,
  duration?: number, // in seconds
  billable?: boolean,
  hourlyRate?: number
}
```

**Response (201):**
```typescript
{
  data: {
    // Complete time entry object
  },
  message: "Time tracking started" | "Time entry created"
}
```

---

### PUT `/api/time-entries/[id]`
Update or stop time entry.

**Authentication:** Required
**Authorization:** Must own the time entry

**Request Body:**
```typescript
{
  endTime?: string, // To stop timer
  description?: string,
  billable?: boolean,
  hourlyRate?: number
}
```

**Response (200):**
```typescript
{
  data: {
    // Updated time entry object
  },
  message: "Time entry updated"
}
```

---

### DELETE `/api/time-entries/[id]`
Delete time entry.

**Authentication:** Required
**Authorization:** Must own the time entry

**Response (200):**
```typescript
{
  message: "Time entry deleted successfully"
}
```

---

### GET `/api/time-entries/reports`
Generate time tracking reports.

**Authentication:** Required

**Query Parameters:**
- `startDate: string`
- `endDate: string`
- `teamId?: string`
- `todoId?: string`
- `groupBy?: "day" | "week" | "month" | "todo" | "user"`

**Response (200):**
```typescript
{
  data: {
    summary: {
      totalTime: number, // in seconds
      billableTime: number,
      totalEntries: number,
      averageSessionTime: number
    },
    breakdown: {
      [key: string]: {
        time: number,
        entries: number,
        billableTime: number
      }
    }
  }
}
```

---

## Error Handling

### Standard Error Response Format

```typescript
{
  error: string,           // Error type/code
  message: string,         // Human-readable message
  statusCode: number,      // HTTP status code
  details?: any           // Additional error details (dev only)
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Rate Limiting

Critical endpoints are rate limited:
- **Authentication**: 5 requests per minute per IP
- **Password reset**: 3 requests per hour per email
- **Team invitations**: 10 requests per hour per user
- **API general**: 1000 requests per hour per user

Rate limit headers included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

This API specification provides a complete foundation for building the collaborative todo application with proper authentication, authorization, and data management.