import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Protected API routes that require authentication
const protectedApiPaths = [
  '/api/users',
  '/api/todos',
  '/api/teams',
  '/api/time-entries',
]

// Public API routes that don't require authentication
const publicApiPaths = [
  '/api/auth',
]

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl
  
  // Check for protected API routes
  const isProtectedApiPath = protectedApiPaths.some(path => pathname.startsWith(path))
  const isPublicApiPath = publicApiPaths.some(path => pathname.startsWith(path))
  
  // If it's an API route
  if (pathname.startsWith('/api')) {
    // Block access to protected API routes for unauthenticated users
    if (isProtectedApiPath && !isLoggedIn) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Allow all other API routes to continue
    return NextResponse.next()
  }
  
  // Handle web routes
  const isOnDashboard = pathname.startsWith('/dashboard')
  const isOnAuth = pathname.startsWith('/login') || pathname.startsWith('/register')
  
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  if (isOnAuth && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}