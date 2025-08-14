import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-500 text-white shadow hover:bg-green-500/80",
        warning:
          "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-500/80",
        info:
          "border-transparent bg-blue-500 text-white shadow hover:bg-blue-500/80",
      },
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      priority: {
        low: "bg-gray-100 text-gray-800 border-gray-200",
        medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
        high: "bg-orange-100 text-orange-800 border-orange-200",
        urgent: "bg-red-100 text-red-800 border-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, priority, ...props }, ref) => {
    const computedVariant = priority ? undefined : variant
    const computedClassName = priority
      ? cn(badgeVariants({ size, priority, className }))
      : cn(badgeVariants({ variant: computedVariant, size, className }))
    
    return (
      <div ref={ref} className={computedClassName} {...props} />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }