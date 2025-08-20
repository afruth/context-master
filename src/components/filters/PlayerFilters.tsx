"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Filter, RotateCcw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/cn"
import type { PlayerQueryParams, PlayerStatus } from "@/types/hattrick"

interface PlayerFiltersProps {
  filters: PlayerQueryParams
  onFiltersChange: (filters: Partial<PlayerQueryParams>) => void
  onReset: () => void
  className?: string
}

interface FilterPreset {
  name: string
  icon: React.ReactNode
  filters: Partial<PlayerQueryParams>
  description: string
}

const filterPresets: FilterPreset[] = [
  {
    name: "High Value Owned",
    icon: <Zap className="h-3 w-3" />,
    filters: {
      status: 'OWNED',
      priceMin: 100000,
      sortBy: 'purchasePrice',
      sortOrder: 'desc'
    },
    description: "Owned players worth over $100k"
  },
  {
    name: "Recent Purchases",
    icon: <RotateCcw className="h-3 w-3" />,
    filters: {
      status: 'OWNED',
      sortBy: 'purchaseDate',
      sortOrder: 'desc'
    },
    description: "Recently purchased players"
  },
  {
    name: "High Skills",
    icon: <Filter className="h-3 w-3" />,
    filters: {
      status: 'OWNED',
      keeperMin: 15,
      defendingMin: 15,
      playmakingMin: 15,
      wingerMin: 15,
      passingMin: 15,
      scoringMin: 15
    },
    description: "Players with high skill levels"
  }
]

const positions = [
  "Goalkeeper",
  "Central Defender", 
  "Wingback",
  "Winger",
  "Playmaker",
  "Forward"
]

const skillLabels = [
  { key: 'keeper', label: 'Keeper' },
  { key: 'defending', label: 'Defending' },
  { key: 'playmaking', label: 'Playmaking' },
  { key: 'winger', label: 'Winger' },
  { key: 'passing', label: 'Passing' },
  { key: 'scoring', label: 'Scoring' },
  { key: 'setPieces', label: 'Set Pieces' }
]

export function PlayerFilters({
  filters,
  onFiltersChange,
  onReset,
  className
}: PlayerFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleFilterChange = (key: keyof PlayerQueryParams, value: any) => {
    onFiltersChange({ [key]: value || undefined })
  }

  const applyPreset = (preset: FilterPreset) => {
    onFiltersChange(preset.filters)
  }

  const getActiveFilterCount = () => {
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
      if (key === 'page' || key === 'limit' || key === 'sortBy' || key === 'sortOrder') return false
      return value !== undefined && value !== null && value !== ''
    })
    return activeFilters.length
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={activeFilterCount === 0}
            >
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter Presets */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Filters</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {filterPresets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="h-auto flex-col items-start p-2 text-left"
                title={preset.description}
              >
                <div className="flex items-center gap-1 text-xs font-medium">
                  {preset.icon}
                  {preset.name}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Basic Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Basic Filters</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('basic')}
              className="h-auto p-1"
            >
              {expandedSections.has('basic') ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>

          {expandedSections.has('basic') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange('status', value === "all" ? undefined : value as PlayerStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="OWNED">Owned</SelectItem>
                    <SelectItem value="SOLD">Sold</SelectItem>
                    <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={filters.position || "all"}
                  onValueChange={(value) => handleFilterChange('position', value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All positions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All positions</SelectItem>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {isExpanded && (
          <>
            {/* Age Range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Age Range</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('age')}
                  className="h-auto p-1"
                >
                  {expandedSections.has('age') ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {expandedSections.has('age') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ageMin">Min Age</Label>
                    <Input
                      id="ageMin"
                      type="number"
                      placeholder="15"
                      min="15"
                      max="45"
                      value={filters.ageMin || ""}
                      onChange={(e) => handleFilterChange('ageMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageMax">Max Age</Label>
                    <Input
                      id="ageMax"
                      type="number"
                      placeholder="45"
                      min="15"
                      max="45"
                      value={filters.ageMax || ""}
                      onChange={(e) => handleFilterChange('ageMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Purchase Price Range</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('price')}
                  className="h-auto p-1"
                >
                  {expandedSections.has('price') ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {expandedSections.has('price') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priceMin">Min Price ($)</Label>
                    <Input
                      id="priceMin"
                      type="number"
                      placeholder="0"
                      min="0"
                      value={filters.priceMin || ""}
                      onChange={(e) => handleFilterChange('priceMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceMax">Max Price ($)</Label>
                    <Input
                      id="priceMax"
                      type="number"
                      placeholder="1000000"
                      min="0"
                      value={filters.priceMax || ""}
                      onChange={(e) => handleFilterChange('priceMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Skill Levels */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Skill Levels</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('skills')}
                  className="h-auto p-1"
                >
                  {expandedSections.has('skills') ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {expandedSections.has('skills') && (
                <div className="space-y-4">
                  {skillLabels.map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm">{label}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          min="0"
                          max="20"
                          value={filters[`${key}Min` as keyof PlayerQueryParams] || ""}
                          onChange={(e) => handleFilterChange(`${key}Min` as keyof PlayerQueryParams, e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          min="0"
                          max="20"
                          value={filters[`${key}Max` as keyof PlayerQueryParams] || ""}
                          onChange={(e) => handleFilterChange(`${key}Max` as keyof PlayerQueryParams, e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}