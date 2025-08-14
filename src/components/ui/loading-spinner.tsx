import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/cn"

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      variant: {
        default: "text-primary",
        secondary: "text-muted-foreground",
        destructive: "text-destructive",
        success: "text-green-500",
        warning: "text-yellow-500",
      },
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LoadingSpinnerProps
  extends Omit<React.SVGProps<SVGSVGElement>, "ref">,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

const LoadingSpinner = React.forwardRef<SVGSVGElement, LoadingSpinnerProps>(
  ({ className, variant, size, label, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <Loader2
          ref={ref}
          className={cn(spinnerVariants({ variant, size, className }))}
          {...props}
        />
        {label && (
          <span className="text-sm text-muted-foreground">{label}</span>
        )}
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

// Centered loading component for full sections
const LoadingSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    label?: string
    variant?: VariantProps<typeof spinnerVariants>["variant"]
    size?: VariantProps<typeof spinnerVariants>["size"]
  }
>(({ className, label = "Loading...", variant, size, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-center p-8",
      className
    )}
    {...props}
  >
    <LoadingSpinner variant={variant} size={size} label={label} />
  </div>
))
LoadingSection.displayName = "LoadingSection"

// Inline loading state for buttons
const ButtonSpinner = React.forwardRef<
  SVGSVGElement,
  Omit<LoadingSpinnerProps, "label" | "size">
>(({ className, variant = "secondary", ...props }, ref) => (
  <Loader2
    ref={ref}
    className={cn(spinnerVariants({ variant, size: "sm" }), "mr-2", className)}
    {...props}
  />
))
ButtonSpinner.displayName = "ButtonSpinner"

// Overlay loading for content areas
interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean
  label?: string
  variant?: VariantProps<typeof spinnerVariants>["variant"]
  size?: VariantProps<typeof spinnerVariants>["size"]
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ 
    className, 
    isLoading = true, 
    label = "Loading...", 
    variant, 
    size = "lg",
    children,
    ...props 
  }, ref) => (
    <div ref={ref} className={cn("relative", className)} {...props}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingSpinner variant={variant} size={size} label={label} />
        </div>
      )}
    </div>
  )
)
LoadingOverlay.displayName = "LoadingOverlay"

export { 
  LoadingSpinner, 
  LoadingSection, 
  ButtonSpinner, 
  LoadingOverlay,
  spinnerVariants 
}