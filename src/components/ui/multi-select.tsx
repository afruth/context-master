import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, X, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

const multiSelectVariants = cva(
  "flex min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface MultiSelectOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface MultiSelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof multiSelectVariants> {
  options: MultiSelectOption[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  maxCount?: number
  disabled?: boolean
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({
    className,
    variant,
    options,
    value = [],
    onValueChange,
    placeholder = "Select items...",
    searchPlaceholder = "Search...",
    emptyText = "No items found.",
    maxCount = 3,
    disabled = false,
    ...props
  }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")

    const selectedOptions = options.filter(option => value.includes(option.value))
    const selectableOptions = options.filter(option => !value.includes(option.value))

    const handleSelect = (selectedValue: string) => {
      const newValue = value.includes(selectedValue)
        ? value.filter(v => v !== selectedValue)
        : [...value, selectedValue]
      onValueChange?.(newValue)
    }

    const handleRemove = (valueToRemove: string, event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const newValue = value.filter(v => v !== valueToRemove)
      onValueChange?.(newValue)
    }

    const filteredOptions = selectableOptions.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                multiSelectVariants({ variant }),
                "h-auto min-h-9 justify-between hover:bg-transparent",
                disabled && "cursor-not-allowed opacity-50"
              )}
              disabled={disabled}
            >
              <div className="flex flex-wrap gap-1">
                {selectedOptions.length === 0 && (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
                {selectedOptions.slice(0, maxCount).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {option.icon && (
                      <option.icon className="mr-1 h-3 w-3" />
                    )}
                    {option.label}
                    <button
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRemove(option.value, e as any)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => handleRemove(option.value, e)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
                {selectedOptions.length > maxCount && (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    +{selectedOptions.length - maxCount} more
                  </Badge>
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={handleSelect}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.icon && (
                        <option.icon className="mr-2 h-4 w-4" />
                      )}
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)
MultiSelect.displayName = "MultiSelect"

export { MultiSelect, multiSelectVariants }