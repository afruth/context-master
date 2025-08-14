'use client'

import * as React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  Plus, 
  Users, 
  Crown, 
  Shield, 
  User,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { AppLayout } from '@/components/layouts/app-layout'
import { useTeams, useDeleteTeam } from '@/hooks/use-teams'
import { TeamWithStats } from '@/types/api'

interface TeamsClientProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye,
}

const roleColors = {
  OWNER: 'text-yellow-600',
  ADMIN: 'text-blue-600',
  MEMBER: 'text-green-600',
  VIEWER: 'text-gray-600',
}

interface TeamCardProps {
  team: TeamWithStats
  onEdit?: (team: TeamWithStats) => void
  onDelete?: (teamId: string) => void
  onLeave?: (teamId: string) => void
}

function TeamCard({ team, onEdit, onDelete, onLeave }: TeamCardProps) {
  const RoleIcon = roleIcons[team.role]
  const canEdit = team.role === 'OWNER' || team.role === 'ADMIN'
  const canDelete = team.role === 'OWNER'

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: team.color || '#06b6d4' }}
            >
              {team.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg leading-none mb-1">
                {team.name}
              </CardTitle>
              {team.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {team.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <RoleIcon className={`h-3 w-3 ${roleColors[team.role]}`} />
              {team.role}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/teams/${team.id}`}>
                    View Team
                  </Link>
                </DropdownMenuItem>
                {canEdit && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(team)}>
                    Edit Team
                  </DropdownMenuItem>
                )}
                {canDelete && onDelete ? (
                  <DropdownMenuItem 
                    onClick={() => onDelete(team.id)}
                    className="text-destructive"
                  >
                    Delete Team
                  </DropdownMenuItem>
                ) : onLeave && (
                  <DropdownMenuItem 
                    onClick={() => onLeave(team.id)}
                    className="text-destructive"
                  >
                    Leave Team
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Team Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
          <div>
            <div className="text-lg font-semibold">{team.memberCount}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {team.todoStats.inProgress}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {team.todoStats.completed}
            </div>
            <div className="text-xs text-muted-foreground">Done</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">
              {team.todoStats.overdue}
            </div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </div>
        </div>

        {/* Progress Bar */}
        {team.todoStats.total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>
                {Math.round((team.todoStats.completed / team.todoStats.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(team.todoStats.completed / team.todoStats.total) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Last Activity */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {team.lastActivity 
                ? `Updated ${format(new Date(team.lastActivity), 'MMM d, yyyy')}`
                : 'No recent activity'
              }
            </span>
          </div>
          <Link href={`/dashboard/teams/${team.id}`}>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function TeamsClient({ user }: TeamsClientProps) {
  const { data, isLoading, error } = useTeams({ limit: 50 })
  const deleteTeam = useDeleteTeam()

  const teams = data?.data || []

  const handleEditTeam = (team: TeamWithStats) => {
    // TODO: Open edit dialog
    console.log('Edit team:', team)
  }

  const handleDeleteTeam = (teamId: string) => {
    if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      deleteTeam.mutate(teamId)
    }
  }

  const handleLeaveTeam = (teamId: string) => {
    if (confirm('Are you sure you want to leave this team?')) {
      // TODO: Implement leave team functionality
      console.log('Leave team:', teamId)
    }
  }

  // Group teams by role
  const teamsByRole = React.useMemo(() => {
    const grouped = {
      OWNER: [] as TeamWithStats[],
      ADMIN: [] as TeamWithStats[],
      MEMBER: [] as TeamWithStats[],
      VIEWER: [] as TeamWithStats[],
    }
    
    teams.forEach(team => {
      grouped[team.role].push(team)
    })
    
    return grouped
  }, [teams])

  return (
    <AppLayout user={user}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Teams</h1>
                <p className="text-muted-foreground">
                  Collaborate with your teams and manage shared projects
                </p>
              </div>
              <Link href="/dashboard/teams/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            {teams.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{teams.length}</div>
                  <div className="text-xs text-muted-foreground">Total Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {teamsByRole.OWNER.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Owned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {teams.reduce((sum, team) => sum + team.todoStats.inProgress, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {teams.reduce((sum, team) => sum + team.memberCount, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Members</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">Failed to load teams</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : teams.length === 0 ? (
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No teams yet"
                description="Create your first team to start collaborating with others"
                action={{
                  label: 'Create Team',
                  onClick: () => window.location.href = '/dashboard/teams/new',
                }}
              />
            ) : (
              <div className="space-y-8">
                {/* Owned Teams */}
                {teamsByRole.OWNER.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      <h2 className="text-lg font-semibold">Teams You Own</h2>
                      <Badge variant="secondary">{teamsByRole.OWNER.length}</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {teamsByRole.OWNER.map((team) => (
                        <TeamCard
                          key={team.id}
                          team={team}
                          onEdit={handleEditTeam}
                          onDelete={handleDeleteTeam}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Admin Teams */}
                {teamsByRole.ADMIN.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-semibold">Teams You Administer</h2>
                      <Badge variant="secondary">{teamsByRole.ADMIN.length}</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {teamsByRole.ADMIN.map((team) => (
                        <TeamCard
                          key={team.id}
                          team={team}
                          onEdit={handleEditTeam}
                          onLeave={handleLeaveTeam}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Member Teams */}
                {teamsByRole.MEMBER.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-green-600" />
                      <h2 className="text-lg font-semibold">Teams You're a Member Of</h2>
                      <Badge variant="secondary">{teamsByRole.MEMBER.length}</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {teamsByRole.MEMBER.map((team) => (
                        <TeamCard
                          key={team.id}
                          team={team}
                          onLeave={handleLeaveTeam}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Viewer Teams */}
                {teamsByRole.VIEWER.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="h-5 w-5 text-gray-600" />
                      <h2 className="text-lg font-semibold">Teams You Can View</h2>
                      <Badge variant="secondary">{teamsByRole.VIEWER.length}</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {teamsByRole.VIEWER.map((team) => (
                        <TeamCard
                          key={team.id}
                          team={team}
                          onLeave={handleLeaveTeam}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  )
}