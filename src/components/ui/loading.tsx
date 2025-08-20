import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Enhanced button with loading state
interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean
  loadingText?: string
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(className)}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {loading ? (loadingText || "Loading...") : children}
    </Button>
  )
}

// Skeleton components for loading states
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}


export function PlayerCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-[120px]" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-6 w-[40px]" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-6 w-[40px]" />
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-6 w-[60px]" />
        </div>
      </div>
    </div>
  )
}

// Loading overlay for forms and containers
export function LoadingOverlay({ 
  message = "Loading...",
  className 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <div className={cn(
      "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50",
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

// Page loading state
export function PageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}