"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  HATTRICK_CURRENCIES, 
  POPULAR_CURRENCIES,
  getCurrencyByCode, 
  type Currency 
} from "@/lib/currencies"

interface CurrencySelectorProps {
  value?: string
  onValueChange?: (currencyCode: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  showConversionRate?: boolean
}

export function CurrencySelector({
  value = "USD",
  onValueChange,
  disabled = false,
  className,
  placeholder = "Select currency...",
  showConversionRate = true
}: CurrencySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedCurrency = getCurrencyByCode(value)

  // Filter currencies based on search
  const filteredCurrencies = React.useMemo(() => {
    if (!searchValue) {
      return HATTRICK_CURRENCIES
    }

    const search = searchValue.toLowerCase()
    return HATTRICK_CURRENCIES.filter(currency =>
      currency.code.toLowerCase().includes(search) ||
      currency.name.toLowerCase().includes(search) ||
      currency.country?.toLowerCase().includes(search)
    )
  }, [searchValue])

  // Separate popular currencies for better UX
  const popularCurrencies = React.useMemo(() => {
    if (searchValue) return []
    return POPULAR_CURRENCIES.filter(currency => currency.code !== value)
  }, [value, searchValue])

  const otherCurrencies = React.useMemo(() => {
    if (searchValue) return filteredCurrencies
    return filteredCurrencies.filter(currency => 
      !POPULAR_CURRENCIES.some(pop => pop.code === currency.code)
    )
  }, [filteredCurrencies, searchValue])

  const handleSelect = (currencyCode: string) => {
    onValueChange?.(currencyCode)
    setOpen(false)
    setSearchValue("")
  }

  const formatCurrencyOption = (currency: Currency) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-medium">{currency.code}</span>
          <span className="text-muted-foreground text-sm truncate">{currency.name}</span>
        </div>
        {currency.symbol && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            {currency.symbol}
          </Badge>
        )}
      </div>
      {showConversionRate && currency.rate !== 1.0 && (
        <div className="text-xs text-muted-foreground ml-2 flex-shrink-0">
          1 USD = {(1 / currency.rate).toFixed(currency.rate < 0.01 ? 0 : 2)} {currency.code}
        </div>
      )}
    </div>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            {selectedCurrency ? (
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{selectedCurrency.code}</span>
                <span className="text-muted-foreground">({selectedCurrency.symbol})</span>
                <span className="text-sm text-muted-foreground truncate">
                  {selectedCurrency.name}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search currencies..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-auto">
          {/* Currently selected */}
          {selectedCurrency && !searchValue && (
            <div className="p-2 border-b bg-muted/50">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Current Selection
              </div>
              <button
                className={cn(
                  "flex items-center w-full px-2 py-2 text-sm rounded-md",
                  "bg-primary/10 text-primary"
                )}
                onClick={() => handleSelect(selectedCurrency.code)}
              >
                <Check className="mr-2 h-4 w-4" />
                {formatCurrencyOption(selectedCurrency)}
              </button>
            </div>
          )}

          {/* Popular currencies */}
          {popularCurrencies.length > 0 && (
            <div className="p-2 border-b">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Popular Currencies
              </div>
              <div className="space-y-1">
                {popularCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    className={cn(
                      "flex items-center w-full px-2 py-2 text-sm rounded-md",
                      "hover:bg-accent hover:text-accent-foreground",
                      "transition-colors duration-150"
                    )}
                    onClick={() => handleSelect(currency.code)}
                  >
                    <div className="mr-2 h-4 w-4" />
                    {formatCurrencyOption(currency)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All other currencies */}
          <div className="p-2">
            {!searchValue && otherCurrencies.length > 0 && (
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                All Currencies
              </div>
            )}
            <div className="space-y-1">
              {(searchValue ? filteredCurrencies : otherCurrencies).map((currency) => (
                <button
                  key={currency.code}
                  className={cn(
                    "flex items-center w-full px-2 py-2 text-sm rounded-md",
                    "hover:bg-accent hover:text-accent-foreground",
                    "transition-colors duration-150",
                    value === currency.code && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(currency.code)}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {value === currency.code && <Check className="h-4 w-4" />}
                  </div>
                  {formatCurrencyOption(currency)}
                </button>
              ))}
            </div>
          </div>

          {/* No results */}
          {searchValue && filteredCurrencies.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No currencies found matching "{searchValue}"
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Compact version of currency selector for smaller spaces
 */
export function CurrencySelectorCompact({
  value = "USD",
  onValueChange,
  disabled = false,
  className
}: Pick<CurrencySelectorProps, 'value' | 'onValueChange' | 'disabled' | 'className'>) {
  return (
    <CurrencySelector
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className={cn("w-auto min-w-[120px]", className)}
      showConversionRate={false}
    />
  )
}