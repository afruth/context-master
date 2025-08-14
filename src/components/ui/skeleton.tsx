import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        shimmer: "bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_2s_infinite_linear]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, className }))}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// Predefined skeleton components for common patterns
const SkeletonText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { lines?: number }
>(({ className, lines = 1, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          "h-4",
          i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
        )}
      />
    ))}
  </div>
))
SkeletonText.displayName = "SkeletonText"

const SkeletonAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { size?: "sm" | "default" | "lg" }
>(({ className, size = "default", ...props }, ref) => (
  <Skeleton
    ref={ref}
    className={cn(
      "rounded-full",
      {
        "h-6 w-6": size === "sm",
        "h-8 w-8": size === "default",
        "h-10 w-10": size === "lg",
      },
      className
    )}
    {...props}
  />
))
SkeletonAvatar.displayName = "SkeletonAvatar"

const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border p-4 space-y-3", className)}
    {...props}
  >
    <div className="flex items-center space-x-3">
      <SkeletonAvatar />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
))
SkeletonCard.displayName = "SkeletonCard"

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, skeletonVariants }