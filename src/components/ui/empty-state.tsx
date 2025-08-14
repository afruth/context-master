import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/button"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        error: "text-destructive",
        success: "text-green-600",
      },
      size: {
        sm: "py-6 px-4",
        default: "py-12 px-6",
        lg: "py-16 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({
    className,
    variant,
    size,
    icon,
    title,
    description,
    action,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ variant, size, className }))}
        {...props}
      >
        {icon && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {description}
            </p>
          )}
        </div>
        {action && (
          <Button
            onClick={action.onClick}
            className="mt-6"
            variant="default"
          >
            {action.label}
          </Button>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState, emptyStateVariants }