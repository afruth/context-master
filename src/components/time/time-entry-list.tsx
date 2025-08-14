'use client'

import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Clock, 
  Edit, 
  Trash2, 
  CheckSquare, 
  Users,
  Calendar,
  DollarSign,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { EditTimeEntryDialog } from './edit-time-entry-dialog'
import type { TimeEntry } from '@/types/time'

interface TimeEntryListProps {
  entries: TimeEntry[]
  onEntryUpdate: () => void
  showPagination?: boolean
}

export function TimeEntryList({ 
  entries, 
  onEntryUpdate, 
  showPagination = false 
}: TimeEntryListProps) {
  const [editingEntry, setEditingEntry] = React.useState<any>(null)

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete entry')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success('Time entry deleted')
      onEntryUpdate()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0:00'
    
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}h`
    }
    return `${mins}m`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (entryDate.getTime() === today.getTime()) {
      return 'Today'
    } else if (entryDate.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const formatTimeRange = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    if (!endTime) {
      return `${start} - Running`
    }
    
    const end = new Date(endTime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    return `${start} - ${end}`
  }

  const statusColors = {
    TODO: 'bg-gray-500',
    IN_PROGRESS: 'bg-blue-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-gray-400',
  }

  const priorityColors = {
    LOW: 'border-green-500',
    MEDIUM: 'border-yellow-500',
    HIGH: 'border-orange-500',
    URGENT: 'border-red-500',
  }

  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-6 w-6" />}
        title="No time entries yet"
        description="Start tracking time on your todos to see entries here"
      />
    )
  }

  // Group entries by date
  const groupedEntries = entries.reduce((groups: Record<string, any[]>, entry) => {
    const date = formatDate(entry.startTime)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(entry)
    return groups
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(groupedEntries).map(([date, dateEntries]) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {date}
            </h4>
            <div className="text-sm text-muted-foreground">
              {formatDuration(
                dateEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
              )} total
            </div>
          </div>
          
          <div className="space-y-2">
            {dateEntries.map((entry) => (
              <Card key={entry.id} className={cn(
                'transition-colors',
                entry.todo?.priority && priorityColors[entry.todo.priority as keyof typeof priorityColors],
                !entry.endTime && 'bg-blue-50 dark:bg-blue-950/20'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Todo Info */}
                      <div className="flex items-center gap-2 mb-2">
                        {entry.todoType === 'personal' ? (
                          <CheckSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        ) : (
                          <Users className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium truncate">
                            {entry.todo?.title || 'No Todo'}
                          </h5>
                          {entry.todoType === 'team' && entry.todo?.team && (
                            <p className="text-xs text-muted-foreground">
                              {entry.todo.team.name}
                            </p>
                          )}
                        </div>
                        {entry.todo?.status && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-white text-xs',
                              statusColors[entry.todo.status as keyof typeof statusColors]
                            )}
                          >
                            {entry.todo.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {entry.description}
                        </p>
                      )}

                      {/* Time Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatTimeRange(entry.startTime, entry.endTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(entry.duration)}
                        </div>
                        {entry.billable && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Billable
                            {entry.hourlyRate && (
                              <span className="ml-1">
                                (${((entry.duration / 3600) * entry.hourlyRate).toFixed(2)})
                              </span>
                            )}
                          </div>
                        )}
                        {entry.isManual && (
                          <Badge variant="outline" className="text-xs">
                            Manual
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingEntry(entry)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this time entry? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteEntryMutation.mutate(entry.id)}
                                disabled={deleteEntryMutation.isPending}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleteEntryMutation.isPending && (
                                  <LoadingSpinner size="sm" className="mr-2" />
                                )}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Edit Dialog */}
      {editingEntry && (
        <EditTimeEntryDialog
          entry={editingEntry}
          open={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntry(null)}
          onEntryUpdate={() => {
            setEditingEntry(null)
            onEntryUpdate()
          }}
        />
      )}

      {/* TODO: Add pagination if showPagination is true */}
    </div>
  )
}