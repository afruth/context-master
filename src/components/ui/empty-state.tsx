import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary"
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {icon && (
          <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || "default"}
            size="sm"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Specific empty state components for common scenarios
export function NoPlayersEmptyState({ onAddPlayer }: { onAddPlayer: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      }
      title="No players found"
      description="Get started by adding your first player to the squad. You can manually add players or import them from a file."
      action={{
        label: "Add Player",
        onClick: onAddPlayer,
      }}
    />
  )
}

export function NoSearchResultsEmptyState({ 
  searchTerm, 
  onClearFilters 
}: { 
  searchTerm?: string
  onClearFilters: () => void 
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      }
      title={searchTerm ? `No results for "${searchTerm}"` : "No players match your filters"}
      description="Try adjusting your search terms or filters to find what you're looking for."
      action={{
        label: "Clear Filters",
        onClick: onClearFilters,
        variant: "outline",
      }}
    />
  )
}

export function LoadingEmptyState({ message = "Loading players..." }: { message?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{message}</h3>
      </CardContent>
    </Card>
  )
}