# Types Directory Rules

## TypeScript Declaration Conventions
- Use `.d.ts` extension for declaration files
- Use `.ts` extension for type-only modules
- Export types with named exports, not default exports
- Use PascalCase for interface and type names
- Use camelCase for property names

## Interface vs Type Usage
- **Interfaces**: For object shapes, especially when extending
- **Types**: For unions, intersections, computed types, and primitives
- **Prefer interfaces** for public API contracts
- **Use types** for complex type transformations

## File Organization
```
src/types/
├── next-auth.d.ts    # Module augmentation
├── globals.d.ts      # Global type declarations
├── api.ts           # API-related types
├── database.ts      # Database model types
└── components.ts    # Component prop types
```

## Module Augmentation Pattern
```tsx
// next-auth.d.ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}
```

## Naming Conventions
- **Interfaces**: `UserProfile`, `SessionData`, `ApiResponse`
- **Types**: `Theme`, `Status`, `UserRole`
- **Generic Types**: Use single capital letters (`T`, `U`, `V`)
- **Utility Types**: End with `Type` (e.g., `DeepPartialType`)

## Type Safety Best Practices
- Avoid `any` - use `unknown` instead
- Use strict TypeScript configuration
- Prefer branded types for domain values
- Use const assertions for literal types
- Implement proper discriminated unions

## API Type Patterns
```tsx
// Request/Response types
export interface CreateUserRequest {
  email: string
  password: string
  name?: string
}

export interface CreateUserResponse {
  user: User
  session: Session
}

// Error types
export interface ApiError {
  message: string
  code: string
  details?: unknown
}
```

## Database Type Integration
- Import and re-export Prisma types when needed
- Create custom types that extend Prisma models
- Use `Prisma.UserSelect` for partial selections
- Define relationship types explicitly

## Component Prop Types
```tsx
// Base component props
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Extending HTML element props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}
```

## Utility Type Definitions
- Create reusable utility types
- Document complex type transformations
- Use conditional types judiciously
- Provide examples in JSDoc comments

## Global Type Declarations
- Keep minimal - only truly global types
- Use namespace declarations for grouped globals
- Avoid polluting global namespace
- Document global type purposes clearly