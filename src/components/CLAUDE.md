# Components Directory Rules

## Technology Stack
- **UI Library**: Radix UI primitives for accessibility and behavior
- **Styling**: Tailwind CSS with custom utility classes
- **Icons**: Lucide React icons (import from `lucide-react`)
- **Animations**: Framer Motion for complex animations, CSS transitions for simple ones

## Component Architecture
- Use TypeScript for all components
- Export components as named exports, not default exports
- Use `React.forwardRef` for components that need ref forwarding
- Implement proper TypeScript interfaces for all props

## File Naming Conventions
- Use kebab-case for component files (e.g., `user-profile.tsx`, `auth-form.tsx`)
- Component names should be PascalCase in code (e.g., `UserProfile`, `AuthForm`)
- Co-locate test files with `.test.tsx` suffix
- Use `.stories.tsx` for Storybook stories

## Component Structure Template
```tsx
import * as React from "react"
import { cn } from "@/lib/cn"

interface ComponentNameProps {
  // Props interface
}

export const ComponentName = React.forwardRef<
  HTMLElementType,
  ComponentNameProps
>(({ className, ...props }, ref) => {
  return (
    <element
      ref={ref}
      className={cn("default-classes", className)}
      {...props}
    />
  )
})
ComponentName.displayName = "ComponentName"
```

## Accessibility Requirements
- All interactive elements must be keyboard accessible
- Use semantic HTML elements
- Include proper ARIA labels and descriptions
- Ensure color contrast meets WCAG guidelines
- Test with screen readers

## Styling Guidelines
- Use Tailwind utility classes for styling
- Create custom CSS variables for theme colors
- Use the `cn()` utility for conditional classes
- Responsive design: mobile-first approach
- Dark mode support required for all components

## State Management
- Use React hooks for local component state
- Lift state up when multiple components need access
- Use Context API for deeply nested component communication
- Avoid prop drilling - use composition patterns instead

## Performance
- Use `React.memo()` for expensive components
- Implement proper key props for lists
- Lazy load heavy components with `React.lazy()`
- Optimize images and assets