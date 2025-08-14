'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  FileText, 
  Users, 
  MessageSquare, 
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  Settings,
  LogOut,
  User,
  Timer,
  BarChart3
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchResult {
  id: string
  title: string
  description?: string
  type: 'personal-todo' | 'team-todo' | 'team' | 'comment'
  url: string
  metadata: any
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  
  const debouncedQuery = useDebounce(query, 300)

  // Quick actions that are always available
  const quickActions = [
    {
      id: 'new-todo',
      title: 'Create new personal todo',
      icon: Plus,
      url: '/dashboard/todos/new',
      shortcut: 'N',
    },
    {
      id: 'new-team',
      title: 'Create new team',
      icon: Users,
      url: '/dashboard/teams/new',
      shortcut: 'T',
    },
    {
      id: 'time-tracking',
      title: 'Time tracking',
      icon: Timer,
      url: '/dashboard/time',
      shortcut: 'M',
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: BarChart3,
      url: '/dashboard/reports',
      shortcut: 'R',
    },
    {
      id: 'profile',
      title: 'Profile settings',
      icon: User,
      url: '/dashboard/profile',
      shortcut: 'P',
    },
    {
      id: 'settings',
      title: 'Application settings',
      icon: Settings,
      url: '/dashboard/settings',
      shortcut: 'S',
    },
  ]

  // Search function
  React.useEffect(() => {
    const searchItems = async () => {
      if (!debouncedQuery.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.data.results || [])
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    searchItems()
  }, [debouncedQuery])

  // Reset when opening/closing
  React.useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      const totalItems = (query ? results.length : quickActions.length)
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % totalItems)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems)
          break
        case 'Enter':
          e.preventDefault()
          if (query && results.length > 0) {
            handleResultSelect(results[selectedIndex])
          } else if (!query && quickActions.length > 0) {
            handleActionSelect(quickActions[selectedIndex])
          }
          break
        case 'Escape':
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, query, results, quickActions, selectedIndex])

  const handleResultSelect = (result: SearchResult) => {
    router.push(result.url)
    onClose()
  }

  const handleActionSelect = (action: typeof quickActions[0]) => {
    router.push(action.url)
    onClose()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personal-todo':
      case 'team-todo':
        return FileText
      case 'team':
        return Users
      case 'comment':
        return MessageSquare
      default:
        return FileText
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'personal-todo':
        return 'Personal Todo'
      case 'team-todo':
        return 'Team Todo'
      case 'team':
        return 'Team'
      case 'comment':
        return 'Comment'
      default:
        return type
    }
  }

  const formatMetadata = (result: SearchResult) => {
    switch (result.type) {
      case 'personal-todo':
      case 'team-todo':
        return result.metadata.category || result.metadata.status
      case 'team':
        return `${result.metadata.memberCount} members`
      case 'comment':
        return result.metadata.author?.name
      default:
        return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <div className="flex items-center border-b p-4">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            placeholder="Search todos, teams, or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          {isLoading && (
            <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-r-transparent" />
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {query ? (
            // Search results
            <div className="p-2">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, index) => {
                    const Icon = getTypeIcon(result.type)
                    return (
                      <div
                        key={result.id}
                        className={cn(
                          'flex items-center px-3 py-2 rounded-md cursor-pointer text-sm transition-colors',
                          index === selectedIndex
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                        onClick={() => handleResultSelect(result)}
                      >
                        <Icon className="h-4 w-4 mr-3 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{result.title}</div>
                          {result.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {result.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                          {formatMetadata(result) && (
                            <span className="text-xs text-muted-foreground">
                              {formatMetadata(result)}
                            </span>
                          )}
                        </div>
                        <ArrowRight className="h-3 w-3 ml-2 text-muted-foreground" />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{query}"</p>
                  <p className="text-xs mt-1">Try searching for todos, teams, or comments</p>
                </div>
              )}
            </div>
          ) : (
            // Quick actions
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-3 py-2">
                Quick Actions
              </div>
              <div className="space-y-1">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <div
                      key={action.id}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition-colors',
                        index === selectedIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      )}
                      onClick={() => handleActionSelect(action)}
                    >
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-3 text-muted-foreground" />
                        {action.title}
                      </div>
                      <div className="flex items-center space-x-2">
                        <kbd className="px-2 py-1 text-xs bg-muted rounded border">
                          ⌘ {action.shortcut}
                        </kbd>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Use ↑↓ to navigate, ↵ to select, esc to close</span>
            <span>⌘K to open anywhere</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}