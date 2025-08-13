# Component Architecture

## Overview
This document outlines the UI component hierarchy and architecture for the collaborative to-do application, following Next.js 14 App Router conventions with TypeScript, Radix UI, Tailwind CSS, and CVA patterns.

## Component Hierarchy

### Page-Level Components
```
app/
├── layout.tsx                    # Root layout with providers
├── page.tsx                      # Landing/dashboard page
├── auth/
│   ├── signin/page.tsx          # Sign in page
│   └── signup/page.tsx          # Sign up page
├── dashboard/
│   └── page.tsx                 # Main dashboard
├── boards/
│   ├── page.tsx                 # Board list
│   ├── [boardId]/
│   │   └── page.tsx             # Individual board view
│   └── new/page.tsx             # Create new board
└── settings/
    └── page.tsx                 # User settings
```

### Layout Components
- `RootLayout` - Global app shell with navigation
- `AuthLayout` - Authentication page wrapper
- `DashboardLayout` - Protected dashboard layout
- `BoardLayout` - Board-specific navigation

### Feature Components

#### Authentication Components
```
components/auth/
├── AuthForm.tsx                 # Reusable form wrapper
├── SignInForm.tsx              # Email/password sign in
├── SignUpForm.tsx              # User registration
├── SocialAuth.tsx              # OAuth providers
└── AuthError.tsx               # Error display
```

#### Navigation Components
```
components/navigation/
├── Header.tsx                  # Main app header
├── Sidebar.tsx                 # Dashboard sidebar
├── UserMenu.tsx               # User dropdown menu
├── BreadcrumbNav.tsx          # Page breadcrumbs
└── MobileNav.tsx              # Mobile navigation
```

#### Board Components
```
components/board/
├── BoardCard.tsx              # Board preview card
├── BoardGrid.tsx              # Board list display
├── BoardHeader.tsx            # Board title and actions
├── CreateBoardForm.tsx        # New board creation
├── BoardSettings.tsx          # Board configuration
└── ShareBoard.tsx             # Collaboration controls
```

#### Task Components
```
components/task/
├── TaskCard.tsx               # Individual task display
├── TaskList.tsx               # Column of tasks
├── TaskForm.tsx               # Create/edit task modal
├── TaskDetails.tsx            # Task detail view
├── TaskStatus.tsx             # Status indicator
├── TaskPriority.tsx           # Priority indicator
├── TaskAssignee.tsx           # User assignment
└── TaskDueDate.tsx            # Due date display
```

#### UI Components (Shadcn/UI + Radix)
```
components/ui/
├── Button.tsx                 # CVA-based button variants
├── Input.tsx                  # Form input field
├── Card.tsx                   # Content container
├── Modal.tsx                  # Dialog/modal wrapper
├── Dropdown.tsx               # Menu dropdown
├── Avatar.tsx                 # User profile image
├── Badge.tsx                  # Status/category labels
├── Tooltip.tsx                # Hover information
├── Loading.tsx                # Loading states
├── ErrorBoundary.tsx          # Error fallback
└── Toast.tsx                  # Notification system
```

## Component Patterns

### Composition Pattern
Components are designed to be composable and reusable:
```typescript
// Board with flexible content
<Board>
  <BoardHeader title="My Tasks" actions={<ShareBoard />} />
  <BoardContent>
    <TaskList status="todo" />
    <TaskList status="in-progress" />
    <TaskList status="done" />
  </BoardContent>
</Board>
```

### Container/Presentational Pattern
- **Container Components**: Handle data fetching and state management
- **Presentational Components**: Focus on rendering UI

### Compound Component Pattern
For complex UI components like forms and modals:
```typescript
<TaskForm>
  <TaskForm.Header />
  <TaskForm.Body>
    <TaskForm.Field name="title" />
    <TaskForm.Field name="description" />
  </TaskForm.Body>
  <TaskForm.Actions />
</TaskForm>
```

## State Management Architecture

### Server State
- **React Query/TanStack Query**: API data fetching and caching
- **Next.js Server Components**: Initial data loading

### Client State
- **React useState/useReducer**: Component-local state
- **Context API**: Shared UI state (theme, modals)
- **Zustand**: Complex client-side state management

### Form State
- **React Hook Form**: Form validation and submission
- **Zod**: Schema validation

## Styling Architecture

### Tailwind CSS + CVA Pattern
```typescript
// Button component with variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
)
```

### Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Progressive enhancement for larger screens
- Touch-friendly interactions on mobile

## Accessibility Standards

### WCAG 2.1 AA Compliance
- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Color contrast requirements
- Screen reader compatibility

### Implementation Patterns
- `forwardRef` for focus management
- Proper form labeling
- Skip links for keyboard users
- Loading and error announcements

## Performance Optimizations

### Code Splitting
- Dynamic imports for feature components
- Route-based code splitting with Next.js
- Lazy loading for heavy components

### Bundle Optimization
- Tree shaking for unused code
- Component lazy loading
- Image optimization with Next.js Image

### Rendering Strategy
- Server Components for initial load
- Client Components for interactivity
- Streaming for improved perceived performance

## Testing Strategy

### Component Testing
```
__tests__/
├── components/
│   ├── task/
│   │   ├── TaskCard.test.tsx
│   │   └── TaskForm.test.tsx
│   └── ui/
│       ├── Button.test.tsx
│       └── Modal.test.tsx
└── pages/
    ├── dashboard.test.tsx
    └── boards.test.tsx
```

### Testing Tools
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **MSW**: API mocking
- **Playwright**: End-to-end testing

## Development Guidelines

### Component Creation Checklist
- [ ] TypeScript interfaces defined
- [ ] Accessibility attributes added
- [ ] Error boundaries implemented
- [ ] Loading states handled
- [ ] Responsive design verified
- [ ] Tests written
- [ ] Storybook documentation (if applicable)

### File Organization
- One component per file
- Co-locate related files (styles, tests, stories)
- Use named exports consistently
- Follow TypeScript naming conventions

### Props Interface Pattern
```typescript
interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  className?: string
  variant?: 'default' | 'compact'
}
```

This architecture ensures maintainable, scalable, and accessible UI components that follow modern React and Next.js best practices.