'use client'

import * as React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  ArrowLeft,
  Users, 
  Plus, 
  Settings,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  ListTodo,
  Crown,
  Shield,
  User as UserIcon,
  Eye,
  MoreHorizontal,
  Calendar,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { AppLayout } from '@/components/layouts/app-layout'
import { useTeam, useTeamMembers, useTeamTodos } from '@/hooks/use-teams'
import { TeamMemberWithUser, TeamTodoSummary } from '@/types/api'
import { InviteMembersModal } from '@/components/teams/invite-members-modal'
import { InvitationsList } from '@/components/teams/invitations-list'

interface TeamDashboardClientProps {
  teamId: string
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: UserIcon,
  VIEWER: Eye,
}

const roleColors = {
  OWNER: 'text-yellow-600',
  ADMIN: 'text-blue-600',
  MEMBER: 'text-green-600',
  VIEWER: 'text-gray-600',
}

interface TeamStatsCardProps {
  title: string
  value: number | string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color?: string
  trend?: {
    value: number
    label: string
  }
}

function TeamStatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color = 'text-primary',
  trend 
}: TeamStatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="mt-2 text-xs text-muted-foreground">
            <span className={trend.value > 0 ? 'text-green-600' : 'text-red-600'}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            {' '}
            {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface MemberCardProps {
  member: TeamMemberWithUser
  canManage: boolean
}

function MemberCard({ member, canManage }: MemberCardProps) {
  const RoleIcon = roleIcons[member.role]
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <AvatarImage src={member.user.image || undefined} />
          <AvatarFallback>
            {member.user.name?.charAt(0)?.toUpperCase() || 
             member.user.email?.charAt(0)?.toUpperCase() || 
             'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">
              {member.user.name || member.user.email}
            </p>
            <Badge variant="secondary" className="flex items-center gap-1">
              <RoleIcon className={`h-3 w-3 ${roleColors[member.role]}`} />
              {member.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {member.user.email}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {member.todoStats && (
          <div className="text-center">
            <div className="font-medium">{member.todoStats.assigned}</div>
            <div>assigned</div>
          </div>
        )}
        {canManage && (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

interface RecentTodoItemProps {
  todo: TeamTodoSummary
}

function RecentTodoItem({ todo }: RecentTodoItemProps) {
  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  }

  const statusColors = {
    TODO: 'text-gray-600',
    IN_PROGRESS: 'text-blue-600',
    COMPLETED: 'text-green-600',
    CANCELLED: 'text-gray-500',
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-2 h-2 rounded-full ${statusColors[todo.status]}`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{todo.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" size="sm" className={priorityColors[todo.priority]}>
              {todo.priority}
            </Badge>
            {todo.assignee && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Avatar size="sm" className="w-4 h-4">
                  <AvatarImage src={todo.assignee.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {todo.assignee.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span>{todo.assignee.name || 'Unassigned'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {todo.dueDate && (
          <div className="text-right">
            <div>Due {format(new Date(todo.dueDate), 'MMM d')}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export function TeamDashboardClient({ teamId, user }: TeamDashboardClientProps) {
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false)

  const { data: team, isLoading: teamLoading, error: teamError } = useTeam(teamId)
  const { data: membersData, isLoading: membersLoading } = useTeamMembers(teamId, { limit: 10 })
  const { data: todosData, isLoading: todosLoading } = useTeamTodos(teamId, { 
    limit: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc' 
  })

  const members = membersData?.data || []
  const todos = todosData?.data || []

  const canManageTeam = team && (team.userRole === 'OWNER' || team.userRole === 'ADMIN')
  const canCreateTodos = team && team.userRole !== 'VIEWER'

  if (teamLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex flex-col h-full">
          <div className="border-b">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </div>
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </AppLayout>
    )
  }

  if (teamError || !team) {
    return (
      <AppLayout user={user}>
        <div className="flex flex-col h-full items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Team not found</h1>
            <p className="text-muted-foreground mb-4">
              The team you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Link href="/dashboard/teams">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Teams
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const completionRate = team.todoStats.total > 0 
    ? Math.round((team.todoStats.completed / team.todoStats.total) * 100)
    : 0

  return (
    <AppLayout user={user}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/teams">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: team.color || '#06b6d4' }}
                >
                  {team.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{team.name}</h1>
                  {team.description && (
                    <p className="text-muted-foreground">{team.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {canCreateTodos && (
                  <Link href={`/dashboard/teams/${teamId}/todos/new`}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Todo
                    </Button>
                  </Link>
                )}
                {canManageTeam && (
                  <>
                    <Button variant="outline" onClick={() => setInviteModalOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Button>
                    <Link href={`/dashboard/teams/${teamId}/settings`}>
                      <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Team Info Bar */}
            <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{team.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created {format(new Date(team.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Crown className={`h-4 w-4 ${roleColors[team.userRole]}`} />
                <span>Your role: {team.userRole}</span>
              </div>
              {completionRate > 0 && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>{completionRate}% complete</span>
                  <Progress value={completionRate} className="w-16 h-2" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6">
            {/* Statistics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <TeamStatsCard
                title="Total Members"
                value={team.memberCount}
                description="Active team members"
                icon={Users}
                color="text-blue-600"
              />
              <TeamStatsCard
                title="Active Tasks"
                value={team.todoStats.inProgress}
                description="Currently in progress"
                icon={Clock}
                color="text-orange-600"
              />
              <TeamStatsCard
                title="Completed"
                value={team.todoStats.completed}
                description="Tasks finished"
                icon={CheckCircle2}
                color="text-green-600"
              />
              <TeamStatsCard
                title="Overdue"
                value={team.todoStats.overdue}
                description="Need attention"
                icon={AlertTriangle}
                color="text-red-600"
              />
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                {canManageTeam && (
                  <TabsTrigger value="invitations">Invitations</TabsTrigger>
                )}
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      {canCreateTodos && (
                        <Link href={`/dashboard/teams/${teamId}/todos/new`}>
                          <Button variant="outline" className="w-full justify-start">
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Task
                          </Button>
                        </Link>
                      )}
                      <Link href={`/dashboard/teams/${teamId}/todos`}>
                        <Button variant="outline" className="w-full justify-start">
                          <ListTodo className="h-4 w-4 mr-2" />
                          View All Tasks
                        </Button>
                      </Link>
                      {canManageTeam && (
                        <>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setInviteModalOpen(true)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite Team Members
                          </Button>
                          <Link href={`/dashboard/teams/${teamId}/reports`}>
                            <Button variant="outline" className="w-full justify-start">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Team Reports
                            </Button>
                          </Link>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Progress Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Team Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {team.todoStats.total > 0 ? (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Overall Progress</span>
                              <span>{completionRate}%</span>
                            </div>
                            <Progress value={completionRate} className="h-3" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {team.todoStats.completed}
                              </div>
                              <div className="text-xs text-muted-foreground">Completed</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-blue-600">
                                {team.todoStats.inProgress}
                              </div>
                              <div className="text-xs text-muted-foreground">In Progress</div>
                            </div>
                          </div>

                          {team.todoStats.overdue > 0 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 text-red-800">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-medium">
                                  {team.todoStats.overdue} overdue tasks
                                </span>
                              </div>
                              <p className="text-sm text-red-600 mt-1">
                                These tasks need immediate attention
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">No tasks yet</p>
                          {canCreateTodos && (
                            <Link href={`/dashboard/teams/${teamId}/todos/new`}>
                              <Button size="sm" className="mt-2">
                                Create First Task
                              </Button>
                            </Link>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Tasks */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <ListTodo className="h-5 w-5" />
                        Recent Tasks
                      </CardTitle>
                      <Link href={`/dashboard/teams/${teamId}/todos`}>
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {todosLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-16" />
                        ))}
                      </div>
                    ) : todos.length > 0 ? (
                      <div className="space-y-3">
                        {todos.slice(0, 5).map((todo) => (
                          <RecentTodoItem key={todo.id} todo={todo} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No tasks created yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members ({team.memberCount})
                      </CardTitle>
                      {canManageTeam && (
                        <Button onClick={() => setInviteModalOpen(true)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Members
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {membersLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-16" />
                        ))}
                      </div>
                    ) : members.length > 0 ? (
                      <div className="space-y-3">
                        {members.map((member) => (
                          <MemberCard 
                            key={member.id} 
                            member={member} 
                            canManage={canManageTeam || false}
                          />
                        ))}
                        {team.memberCount > members.length && (
                          <div className="text-center pt-4">
                            <Button variant="outline" size="sm">
                              Load More Members
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No members found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {canManageTeam && (
                <TabsContent value="invitations" className="space-y-6">
                  <InvitationsList teamId={teamId} canManage={canManageTeam} />
                </TabsContent>
              )}

              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Activity feed coming soon
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Track team member actions, task updates, and more
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* Modals */}
      {team && (
        <InviteMembersModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          teamId={teamId}
          teamName={team.name}
          teamColor={team.color}
        />
      )}
    </AppLayout>
  )
}