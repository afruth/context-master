"use client"

import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"

export type SortField = 'name' | 'age' | 'position' | 'purchasePrice' | 'purchaseDate' | 'projectedProfit'
export type SortDirection = 'asc' | 'desc'

interface SortControlsProps {
  sortBy: SortField
  sortOrder: SortDirection
  onSortChange: (field: SortField, direction: SortDirection) => void
  className?: string
}

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'age', label: 'Age' },
  { value: 'position', label: 'Position' },
  { value: 'purchasePrice', label: 'Purchase Price' },
  { value: 'purchaseDate', label: 'Purchase Date' },
  { value: 'projectedProfit', label: 'Projected Profit' }
]

export function SortControls({
  sortBy,
  sortOrder,
  onSortChange,
  className
}: SortControlsProps) {
  const toggleSortDirection = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const handleSortFieldChange = (field: string) => {
    onSortChange(field as SortField, sortOrder)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Sort by:
      </span>
      
      <Select value={sortBy} onValueChange={handleSortFieldChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleSortDirection}
        className="px-3"
        aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
      >
        {sortOrder === 'asc' ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}