"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/alert-dialog"
import { showToast, toastMessages } from "@/lib/toast"
import { 
  NoPlayersEmptyState, 
  NoSearchResultsEmptyState, 
  LoadingEmptyState 
} from "@/components/ui/empty-state"
import { 
  LoadingButton, 
  CardSkeleton, 
  PlayerCardSkeleton, 
  PageLoading 
} from "@/components/ui/loading"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Table, TableBody } from "@/components/ui/table"
import { Trash2, UserPlus, Filter, Download } from "lucide-react"

export function UIDemo() {
  const [loading, setLoading] = React.useState(false)
  const [showSkeletons, setShowSkeletons] = React.useState(false)
  const { confirm, dialog } = useConfirmDialog()

  const handleDeletePlayer = () => {
    confirm({
      title: "Delete Player",
      description: "Are you sure you want to delete this player? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: () => {
        toastMessages.player.deleted("John Doe")
      }
    })
  }

  const handleClearFilters = () => {
    confirm({
      title: "Clear All Filters",
      description: "This will reset all your current filters and search criteria.",
      confirmText: "Clear Filters",
      onConfirm: () => {
        toastMessages.filters.cleared()
      }
    })
  }

  const simulateLoading = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
    showToast.success("Operation completed successfully!")
  }

  const demonstrateToasts = () => {
    toastMessages.player.created("New Player")
    
    setTimeout(() => {
      showToast.info("This is an info message", {
        description: "Additional information about the action"
      })
    }, 1000)

    setTimeout(() => {
      showToast.warning("This is a warning", {
        description: "Something needs your attention"
      })
    }, 2000)

    setTimeout(() => {
      toastMessages.errors.network()
    }, 3000)
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">UI Components Demo</h1>
        <p className="text-muted-foreground">
          Demonstration of the enhanced UI components with confirmation dialogs, 
          toast notifications, loading states, and empty states.
        </p>
      </div>

      {/* Confirmation Dialogs */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmation Dialogs</CardTitle>
          <CardDescription>
            Interactive confirmation dialogs for destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleDeletePlayer}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Player
            </Button>
            
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Toast Notifications</CardTitle>
          <CardDescription>
            Enhanced toast messages with contextual information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={demonstrateToasts}>
              Show Toast Examples
            </Button>
            
            <Button
              onClick={() => toastMessages.player.importSuccess(15)}
              variant="outline"
            >
              Import Success
            </Button>
            
            <Button
              onClick={() => toastMessages.errors.validation("email")}
              variant="destructive"
            >
              Validation Error
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>Loading States</CardTitle>
          <CardDescription>
            Enhanced buttons and loading indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <LoadingButton
              loading={loading}
              onClick={simulateLoading}
              loadingText="Processing..."
            >
              Process Data
            </LoadingButton>
            
            <Button
              loading={loading}
              onClick={simulateLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Players
            </Button>
            
            <Button
              onClick={() => setShowSkeletons(!showSkeletons)}
              variant="secondary"
            >
              Toggle Skeletons
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeletons */}
      {showSkeletons && (
        <Card>
          <CardHeader>
            <CardTitle>Loading Skeletons</CardTitle>
            <CardDescription>
              Skeleton loading states for different content types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Card Skeleton</h4>
              <CardSkeleton />
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Player Card Skeleton</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <PlayerCardSkeleton />
                <PlayerCardSkeleton />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Table Skeleton</h4>
              <Table>
                <TableBody>
                  <TableSkeleton rows={3} cols={4} />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      <Card>
        <CardHeader>
          <CardTitle>Empty States</CardTitle>
          <CardDescription>
            Helpful empty states with clear call-to-action buttons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">No Players</h4>
            <NoPlayersEmptyState
              onAddPlayer={() => showToast.info("Add Player clicked", {
                description: "This would open the add player form"
              })}
            />
          </div>
          
          <div>
            <h4 className="font-medium mb-3">No Search Results</h4>
            <NoSearchResultsEmptyState
              searchTerm="Messi"
              onClearFilters={() => showToast.info("Filters cleared")}
            />
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Loading State</h4>
            <LoadingEmptyState message="Loading player data..." />
          </div>
        </CardContent>
      </Card>

      {dialog}
    </div>
  )
}