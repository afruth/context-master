# API Testing Guide

## Quick Start Testing

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Public Endpoints (No Auth Required)

#### Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Expected Response (201):
```json
{
  "data": {
    "user": {
      "id": "clx...",
      "email": "test@example.com", 
      "name": "Test User",
      "username": null,
      "createdAt": "2024-08-13T10:00:00.000Z"
    }
  },
  "message": "User registered successfully"
}
```

### 3. Authenticate and Get Session Token

Since we're using NextAuth.js, you'll need to:
1. Visit `http://localhost:3000/login` in your browser
2. Sign in with the credentials you just created
3. Use browser dev tools to get the session cookie value

Or use NextAuth's session endpoint:
```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

### 4. Test Protected Endpoints (Auth Required)

#### Get Current User Profile
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

#### Create a Personal Todo
```bash
curl -X POST http://localhost:3000/api/todos/personal \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "My First Todo",
    "description": "This is a test todo",
    "priority": "HIGH",
    "tags": ["test", "api"],
    "dueDate": "2024-12-31T23:59:59.000Z"
  }'
```

#### List Personal Todos
```bash
curl -X GET "http://localhost:3000/api/todos/personal?page=1&limit=5" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

#### Create a Team
```bash
curl -X POST http://localhost:3000/api/teams \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "My Development Team",
    "description": "A team for testing the API",
    "isPublic": false,
    "color": "#3B82F6"
  }'
```

#### List Teams
```bash
curl -X GET http://localhost:3000/api/teams \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

## Testing with Postman

### 1. Import Environment
Create a new Postman environment with:
- `baseUrl`: `http://localhost:3000`
- `sessionToken`: (get from browser after login)

### 2. Set Authorization
In Postman, for protected requests, go to:
- Headers tab
- Add: `Cookie: authjs.session-token={{sessionToken}}`

### 3. Test Collection
Here's a sample collection order to test the API:

1. **POST** `/api/auth/register` - Register user
2. **GET** `/api/users/me` - Get profile (requires login)
3. **POST** `/api/todos/personal` - Create todo
4. **GET** `/api/todos/personal` - List todos
5. **POST** `/api/teams` - Create team
6. **GET** `/api/teams` - List teams

## Common Response Patterns

### Success Response
```json
{
  "data": { /* actual data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "Error description",
  "statusCode": 400,
  "details": { /* error details in development */ }
}
```

### Validation Error
```json
{
  "error": "Validation failed",
  "statusCode": 422,
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    }
  ]
}
```

### Paginated Response
```json
{
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Authentication Testing

### Getting Session Token (Browser Method)
1. Open browser dev tools (F12)
2. Go to `http://localhost:3000/login`
3. Sign in with your credentials
4. Check Application/Storage → Cookies
5. Find `authjs.session-token` cookie value
6. Use this value in your API tests

### Testing Authentication Failures
```bash
# Should return 401
curl -X GET http://localhost:3000/api/users/me
```

## Status Code Reference

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized (not logged in)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (duplicate resource)
- **422** - Validation Error
- **429** - Rate Limited
- **500** - Server Error

## Rate Limiting Testing

### Test Registration Rate Limit
Make 6 requests quickly to `/api/auth/register`:
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@example.com","password":"password123"}' &
done
wait
```

The 6th request should return a 429 Too Many Requests error.

## Troubleshooting

### Common Issues

1. **401 Unauthorized on all protected routes**
   - Verify session token is included in Cookie header
   - Check if user is properly logged in
   - Ensure NextAuth is configured correctly

2. **CORS Issues**  
   - Make sure requests include proper headers
   - Check if middleware is interfering

3. **Validation Errors**
   - Check required fields in request body
   - Verify data types match schema requirements

4. **Database Connection Issues**
   - Run `npm run db:generate` 
   - Run `npm run db:push`
   - Check DATABASE_URL in .env

### Debug Mode
Set environment variable for more detailed errors:
```bash
NODE_ENV=development npm run dev
```

This enables detailed error messages in API responses.