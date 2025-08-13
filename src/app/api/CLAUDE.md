# API Routes Directory Rules

## Route Handler Structure
- Use named exports: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Return `Response` objects or use `NextResponse`
- Handle all HTTP methods your endpoint supports
- Implement proper error handling and status codes

## File Organization
- `route.ts`: Main API route handlers
- `[...nextauth]/route.ts`: NextAuth.js authentication routes
- Group related endpoints in subdirectories
- Use dynamic routes `[id]/route.ts` for resource-specific operations

## Authentication Integration
- Use NextAuth.js for authentication
- Implement session validation in protected routes
- Use middleware for route-level protection
- Handle authentication errors gracefully

## Request/Response Patterns
```tsx
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Handler logic
    return NextResponse.json({ data: result })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

## Error Handling Standards
- Always return consistent error response format
- Use appropriate HTTP status codes
- Log errors for debugging (but not sensitive data)
- Provide helpful error messages for development
- Sanitize error messages for production

## Database Operations
- Use Prisma client from `@/lib/db`
- Implement proper transaction handling
- Handle database connection errors
- Use appropriate indexes for query performance

## Validation & Security
- Validate all input data using Zod or similar
- Sanitize user input
- Rate limit API endpoints
- Use CORS appropriately
- Never expose sensitive information in responses

## Response Format Standards
```tsx
// Success Response
{
  data: any,
  message?: string
}

// Error Response
{
  error: string,
  details?: any // Only in development
}

// Paginated Response
{
  data: any[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

## Performance Considerations
- Implement pagination for list endpoints
- Use database-level filtering and sorting
- Cache responses when appropriate
- Optimize database queries
- Use streaming for large responses

## NextAuth.js Specific Rules
- Keep authentication configuration in `/lib/auth.ts`
- Use proper providers and adapters
- Implement custom pages for auth flows
- Handle JWT and session management correctly