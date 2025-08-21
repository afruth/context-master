"use client"

import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PlayerQueryParams } from "@/types/hattrick"
import { useCurrency } from "@/hooks/use-settings"
import { formatCurrency } from "@/lib/utils"

interface FilterSummaryProps {
  filters: PlayerQueryParams
  onClearFilter: (key: keyof PlayerQueryParams) => void
  onClearAll: () => void
  totalResults: number
  totalItems: number
}

export function FilterSummary({
  filters,
  onClearFilter,
  onClearAll,
  totalResults,
  totalItems
}: FilterSummaryProps) {
  const { currency } = useCurrency()
  const activeFilters: Array<{ key: keyof PlayerQueryParams; label: string; value: string }> = []

  // Build list of active filters
  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: 'Search',
      value: `"${filters.search}"`
    })
  }

  if (filters.status) {
    activeFilters.push({
      key: 'status',
      label: 'Status',
      value: filters.status.toLowerCase()
    })
  }

  if (filters.position) {
    activeFilters.push({
      key: 'position',
      label: 'Position',
      value: filters.position
    })
  }

  if (filters.ageMin || filters.ageMax) {
    const min = filters.ageMin || 'any'
    const max = filters.ageMax || 'any'
    activeFilters.push({
      key: 'ageMin', // We'll clear both min and max when this is clicked
      label: 'Age',
      value: `${min} - ${max} years`
    })
  }

  if (filters.priceMin || filters.priceMax) {
    const min = filters.priceMin ? formatCurrency(filters.priceMin, currency) : 'any'
    const max = filters.priceMax ? formatCurrency(filters.priceMax, currency) : 'any'
    activeFilters.push({
      key: 'priceMin', // We'll clear both min and max when this is clicked
      label: 'Price',
      value: `${min} - ${max}`
    })
  }

  // Skill filters
  const skillFilters = [
    { key: 'keeper', label: 'Keeper', min: filters.keeperMin, max: filters.keeperMax },
    { key: 'defending', label: 'Defending', min: filters.defendingMin, max: filters.defendingMax },
    { key: 'playmaking', label: 'Playmaking', min: filters.playmakingMin, max: filters.playmakingMax },
    { key: 'winger', label: 'Winger', min: filters.wingerMin, max: filters.wingerMax },
    { key: 'passing', label: 'Passing', min: filters.passingMin, max: filters.passingMax },
    { key: 'scoring', label: 'Scoring', min: filters.scoringMin, max: filters.scoringMax },
    { key: 'setPieces', label: 'Set Pieces', min: filters.setPiecesMin, max: filters.setPiecesMax }
  ]

  skillFilters.forEach(({ key, label, min, max }) => {
    if (min || max) {
      const minValue = min || 'any'
      const maxValue = max || 'any'
      activeFilters.push({
        key: `${key}Min` as keyof PlayerQueryParams,
        label,
        value: `${minValue} - ${maxValue}`
      })
    }
  })

  const handleClearFilter = (key: keyof PlayerQueryParams) => {
    // Handle clearing range filters (both min and max)
    if (key === 'ageMin') {
      onClearFilter('ageMin')
      onClearFilter('ageMax')
    } else if (key === 'priceMin') {
      onClearFilter('priceMin')
      onClearFilter('priceMax')
    } else if (key.endsWith('Min')) {
      // Handle skill range filters
      const baseKey = key.replace('Min', '')
      onClearFilter(`${baseKey}Min` as keyof PlayerQueryParams)
      onClearFilter(`${baseKey}Max` as keyof PlayerQueryParams)
    } else {
      onClearFilter(key)
    }
  }

  if (activeFilters.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Showing {totalResults} of {totalItems} players
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalResults} of {totalItems} players match your filters
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all filters
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter) => (
          <Badge
            key={filter.key}
            variant="secondary"
            className="px-2 py-1 text-xs"
          >
            <span className="font-medium">{filter.label}:</span>
            <span className="ml-1">{filter.value}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-auto p-0 hover:bg-transparent"
              onClick={() => handleClearFilter(filter.key)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  )
}