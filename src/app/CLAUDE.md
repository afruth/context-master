# App Directory Rules (Next.js 14 App Router)

## Directory Structure Conventions
- **Route Groups**: Use `(auth)`, `(dashboard)` for logical grouping without affecting URL
- **Dynamic Routes**: Use `[param]` for single dynamic segments, `[...slug]` for catch-all
- **Private Routes**: Prefix with `_` to exclude from routing (e.g., `_components`)
- **Parallel Routes**: Use `@folder` for parallel route slots

## File Conventions
- `page.tsx`: Main page component for a route
- `layout.tsx`: Shared layout for route segment and children
- `loading.tsx`: Loading UI for route segment
- `error.tsx`: Error boundary for route segment
- `not-found.tsx`: 404 page for route segment
- `template.tsx`: Re-rendered layout (use sparingly)

## Server vs Client Components
- **Default**: All components are Server Components
- **Client**: Use `"use client"` directive only when necessary
- **When to use Client**: Interactivity, browser APIs, event handlers, state, effects
- **Server Component benefits**: Better performance, SEO, and security

## Page Component Structure
```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
}

export default function PageName() {
  return (
    <main className="container mx-auto p-4">
      {/* Page content */}
    </main>
  )
}
```

## Layout Requirements
- Must accept `children` prop
- Include proper HTML structure in root layout
- Define shared UI elements (navigation, footer)
- Handle responsive design at layout level

## Authentication & Route Protection
- Use middleware.ts for route protection
- Implement authentication checks in layouts
- Redirect unauthorized users appropriately
- Handle loading states during auth checks

## SEO & Metadata
- Include metadata export in every page
- Use dynamic metadata for data-driven pages
- Implement Open Graph tags
- Add structured data where appropriate
- Ensure proper title hierarchy

## Data Fetching
- Use async Server Components for data fetching
- Implement proper error boundaries
- Use Suspense for streaming UI
- Cache data appropriately with Next.js caching strategies

## Styling & Responsive Design
- Mobile-first responsive design
- Use Tailwind CSS container classes
- Implement consistent spacing and typography
- Support dark mode at layout level

## Performance Optimization
- Use Image component for all images
- Implement proper loading strategies
- Minimize client-side JavaScript
- Use streaming for better perceived performance