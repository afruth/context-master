"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"

interface PlayerSearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function PlayerSearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search players by name, nationality, or position...",
  debounceMs = 300,
  className
}: PlayerSearchBarProps) {
  const [localValue, setLocalValue] = useState(value)

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
        onSearch(localValue)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, onChange, onSearch, value, debounceMs])

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleClear = useCallback(() => {
    setLocalValue("")
    onChange("")
    onSearch("")
  }, [onChange, onSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onChange(localValue)
      onSearch(localValue)
    }
  }, [localValue, onChange, onSearch])

  return (
    <div className={cn("relative flex-1", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-10 pr-10"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}