# Lib Directory Rules

## Purpose & Organization
- **Utilities**: Pure functions and helper utilities
- **Configuration**: App-wide configuration and setup
- **Integrations**: Third-party service integrations
- **Singletons**: Database clients, auth configs, etc.

## File Naming Conventions
- Use kebab-case for filenames (e.g., `auth.ts`, `db.ts`, `utils.ts`)
- Group related utilities in single files
- Use descriptive names that indicate purpose
- Keep files focused on a single concern

## Database Client (db.ts)
```tsx
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Utility Functions Standards
- Write pure functions when possible
- Use TypeScript for all utilities
- Export named functions, not default exports
- Include JSDoc comments for complex functions
- Handle edge cases and provide fallbacks

## Class Name Utility (cn.ts)
```tsx
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Configuration Management
- Use environment variables for configuration
- Provide sensible defaults
- Validate configuration at startup
- Never commit secrets or API keys
- Use type-safe environment variable parsing

## Authentication Configuration
- Keep NextAuth.js config in `auth.ts`
- Export both the config object and handlers
- Use proper TypeScript typing
- Handle all required callbacks
- Configure proper session strategy

## Error Handling
- Create custom error classes when needed
- Provide consistent error formatting
- Log errors appropriately
- Never expose sensitive information in errors
- Use proper error boundaries

## Type Safety Requirements
- All functions must be properly typed
- Use generic types for reusable utilities
- Export types alongside utilities
- Avoid `any` types - use `unknown` instead
- Use branded types for domain-specific values

## Performance Considerations
- Implement caching for expensive operations
- Use memoization for pure functions
- Lazy load heavy utilities
- Consider bundle size impact
- Profile performance-critical paths

## Testing
- Write unit tests for utility functions
- Mock external dependencies
- Test edge cases and error conditions
- Use property-based testing where appropriate
- Maintain high test coverage for utilities