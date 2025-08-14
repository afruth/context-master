'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Clock, Users, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePersonalTodos } from '@/hooks/use-todos'
import { useTeams } from '@/hooks/use-teams'

interface ActivityItem {
  id: string
  type: 'todo_created' | 'todo_completed' | 'team_joined'
  title: string
  description?: string
  timestamp: Date
  icon: React.ReactNode
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'success'
  }
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

export function RecentActivity() {
  const { data: todosData, isLoading: todosLoading } = usePersonalTodos({ 
    limit: 50,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  })
  const { data: teamsData, isLoading: teamsLoading } = useTeams()

  const todos = todosData?.data || []
  const teams = teamsData?.data || []

  const activities = React.useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = []

    // Add recent todo activities
    todos.slice(0, 10).forEach(todo => {
      if (todo.status === 'COMPLETED') {
        items.push({
          id: `todo-completed-${todo.id}`,
          type: 'todo_completed',
          title: `Completed "${todo.title}"`,
          description: todo.category || undefined,
          timestamp: new Date(todo.updatedAt),
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          badge: {
            text: 'Completed',
            variant: 'success',
          },
        })
      } else {
        items.push({
          id: `todo-created-${todo.id}`,
          type: 'todo_created',
          title: `Created "${todo.title}"`,
          description: todo.category || undefined,
          timestamp: new Date(todo.createdAt),
          icon: <Plus className="h-4 w-4 text-blue-500" />,
          badge: {
            text: todo.priority || 'Medium',
            variant: 'secondary',
          },
        })
      }
    })

    // Add team activities (simplified - just team creation/joining)
    teams.slice(0, 5).forEach(team => {
      items.push({
        id: `team-joined-${team.id}`,
        type: 'team_joined',
        title: `Joined team "${team.name}"`,
        description: team.role === 'OWNER' ? 'Created team' : `As ${team.role.toLowerCase()}`,
        timestamp: new Date(team.createdAt),
        icon: <Users className="h-4 w-4 text-purple-500" />,
        badge: {
          text: team.role,
          variant: team.role === 'OWNER' ? 'default' : 'secondary',
        },
      })
    })

    // Sort by timestamp, most recent first
    return items
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8) // Show max 8 items
  }, [todos, teams])

  const isLoading = todosLoading || teamsLoading

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ActivitySkeleton />
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs">Create your first todo to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 last:pb-0">
                <div className="flex-shrink-0 mt-0.5">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none mb-1">
                    {activity.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(activity.timestamp, 'MMM d, h:mm a')}</span>
                    {activity.description && (
                      <>
                        <span>•</span>
                        <span>{activity.description}</span>
                      </>
                    )}
                  </div>
                </div>
                {activity.badge && (
                  <Badge variant={activity.badge.variant} className="text-xs">
                    {activity.badge.text}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}