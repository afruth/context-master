# UI Components Directory Rules

## Design System Foundation
- **Base**: Radix UI primitives for behavior and accessibility
- **Styling**: Class Variance Authority (CVA) for variant management
- **Utilities**: Tailwind CSS with custom design tokens
- **Consistency**: All components follow the same architectural patterns

## Component Patterns
All UI components must follow this structure:
1. CVA variant definitions with comprehensive variant options
2. TypeScript interface extending HTML attributes + VariantProps
3. forwardRef implementation with proper ref typing
4. displayName assignment for debugging

## CVA Variant System
```tsx
const componentVariants = cva(
  "base-classes-that-always-apply",
  {
    variants: {
      variant: {
        default: "default-variant-classes",
        secondary: "secondary-variant-classes",
      },
      size: {
        sm: "small-size-classes",
        lg: "large-size-classes",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## Required Variants
Every UI component should support:
- **variant**: Visual style variations (default, secondary, destructive, outline, ghost, link)
- **size**: Size variations (sm, default, lg, icon when applicable)
- **disabled**: Disabled state styling
- **loading**: Loading state when applicable

## Accessibility Standards
- Use Radix UI primitives as the foundation
- Include proper ARIA attributes
- Support keyboard navigation
- Ensure focus management
- Meet WCAG 2.1 AA contrast requirements

## TypeScript Requirements
- Extend appropriate HTML element attributes
- Include VariantProps from CVA
- Use proper generic typing for forwardRef
- Export both component and variants for external use

## Styling Guidelines
- Mobile-first responsive design
- Dark mode support via CSS variables
- Use semantic color tokens, not hardcoded colors
- Consistent spacing scale (Tailwind spacing)
- Smooth transitions for interactive states

## Component Template
```tsx
const componentVariants = cva(/* variants */)

export interface ComponentProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {
  asChild?: boolean
}

const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "element"
    return (
      <Comp
        className={cn(componentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Component.displayName = "Component"

export { Component, componentVariants }
```