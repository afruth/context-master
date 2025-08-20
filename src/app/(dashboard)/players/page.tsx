"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  PlusCircle, 
  Eye, 
  Edit, 
  Trash2, 
  ShoppingCart,
  Loader2
} from "lucide-react"
import type { PlayerWithCalculations, PaginatedResponse } from "@/types/hattrick"
import { playersApi, ApiError } from "@/lib/api"
import { TableSkeleton } from "@/components/ui/skeleton"
import { RecordSaleModal } from "@/components/record-sale-modal"
import { ExportButton } from "@/components/export-button"

// Filter components
import { PlayerSearchBar } from "@/components/filters/PlayerSearchBar"
import { PlayerFilters } from "@/components/filters/PlayerFilters"
import { SortControls } from "@/components/filters/SortControls"
import { FilterSummary } from "@/components/filters/FilterSummary"
import { usePlayerFilters } from "@/hooks/usePlayerFilters"

export default function PlayersPage() {
  const [response, setResponse] = useState<PaginatedResponse<PlayerWithCalculations> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlayerForSale, setSelectedPlayerForSale] = useState<PlayerWithCalculations | null>(null)
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  
  const {
    filters,
    isLoading,
    setIsLoading,
    updateFilters,
    clearFilters,
    clearFilter,
    updateSearch,
    updateSort,
    updatePagination
  } = usePlayerFilters()

  // Fetch players data
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await playersApi.getAll(filters)
        setResponse(result)
      } catch (err) {
        console.error('Error fetching players:', err)
        setError(err instanceof ApiError ? err.message : 'Failed to fetch players')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlayers()
  }, [filters, setIsLoading])

  // Handle player deletion
  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm("Are you sure you want to delete this player? This action cannot be undone.")) {
      return
    }

    try {
      await playersApi.delete(playerId)
      // Refresh the current page
      const result = await playersApi.getAll(filters)
      setResponse(result)
    } catch (err) {
      console.error('Error deleting player:', err)
      alert('Failed to delete player. Please try again.')
    }
  }

  // Handle opening record sale modal
  const handleRecordSale = (player: PlayerWithCalculations) => {
    setSelectedPlayerForSale(player)
    setSaleModalOpen(true)
  }

  // Handle sale recorded - refresh players data
  const handleSaleRecorded = async () => {
    try {
      const result = await playersApi.getAll(filters)
      setResponse(result)
    } catch (err) {
      console.error('Error refreshing players:', err)
    }
  }

  const players = response?.data || []
  const pagination = response?.pagination
  const totalResults = pagination?.total || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Players</h1>
          <p className="text-muted-foreground">
            Manage your player portfolio and track performance
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton 
            exportType="players"
            label="Export Players"
            filters={filters}
          />
          <Button asChild>
            <Link href="/players/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Player
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PlayerSearchBar
          value={filters.search || ""}
          onChange={updateSearch}
          onSearch={updateSearch}
          className="flex-1 md:max-w-md"
        />
        <SortControls
          sortBy={filters.sortBy || 'purchaseDate'}
          sortOrder={filters.sortOrder || 'desc'}
          onSortChange={updateSort}
        />
      </div>

      {/* Advanced Filters */}
      <PlayerFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={clearFilters}
      />

      {/* Filter Summary */}
      <FilterSummary
        filters={filters}
        onClearFilter={clearFilter}
        onClearAll={clearFilters}
        totalResults={players.length}
        totalItems={totalResults}
      />

      {/* Players Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Player Portfolio</CardTitle>
              <CardDescription>
                {pagination ? 
                  `Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total players)` :
                  `${players.length} players`
                }
              </CardDescription>
            </div>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Profit Projection</TableHead>
                <TableHead>Weeks Owned</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton rows={6} cols={8} />
              ) : players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{player.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {player.nationality}
                        {player.speciality && ` • ${player.speciality}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{player.position}</TableCell>
                  <TableCell>
                    {player.age.years}y {player.age.days}d
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        player.currentStatus === 'OWNED' ? 'success' : 
                        player.currentStatus === 'SOLD' ? 'secondary' : 'outline'
                      }
                    >
                      {player.currentStatus.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ${player.purchaseDetails.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {player.currentStatus === 'OWNED' && player.estimatedProfit !== undefined ? (
                      <div className={`flex flex-col ${player.estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="font-medium">
                          {player.estimatedProfit >= 0 ? '+' : ''}${player.estimatedProfit.toLocaleString()}
                        </span>
                        <span className="text-xs">
                          Current: ${player.currentValue?.toLocaleString()}
                        </span>
                      </div>
                    ) : player.currentStatus === 'SOLD' && player.totalProfit !== undefined ? (
                      <div className={`flex flex-col ${player.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="font-medium">
                          {player.totalProfit >= 0 ? '+' : ''}${player.totalProfit.toLocaleString()}
                        </span>
                        <span className="text-xs">
                          {player.profitMargin?.toFixed(1)}% margin
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {player.weeksOwned || 0} weeks
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/players/${player.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/players/${player.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>

                      {player.currentStatus === 'OWNED' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRecordSale(player)}
                          title="Record Sale"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      )}

                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeletePlayer(player.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          )}

          {!isLoading && !error && players.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No players found matching your criteria.</p>
              <Button className="mt-4" asChild>
                <Link href="/players/add">Add Your First Player</Link>
              </Button>
            </div>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} players
          </div>
          <div className="flex items-center gap-2 justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updatePagination(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => updatePagination(pageNum)}
                    disabled={isLoading}
                    className="w-8"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updatePagination(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Record Sale Modal */}
      {selectedPlayerForSale && (
        <RecordSaleModal
          player={selectedPlayerForSale}
          open={saleModalOpen}
          onOpenChange={setSaleModalOpen}
          onSaleRecorded={handleSaleRecorded}
        />
      )}
    </div>
  )
}