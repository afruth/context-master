import * as React from "react"
import { User } from "next-auth"
import { Users, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/cn"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TeamMemberWithUser } from "@/types/api"

interface MemberWorkload {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  role: string
  stats: {
    assigned: number
    completed: number
    inProgress: number
    overdue: number
    completionRate: number
    avgCompletionDays?: number
  }
}

interface TeamWorkloadChartProps {
  members: TeamMemberWithUser[]
  todos: Array<{
    id: string
    status: string
    assigneeId: string | null
    createdById: string
    dueDate: string | null
    completedAt: string | null
    createdAt: string
  }>
  currentUser: User
  className?: string
}

export function TeamWorkloadChart({ 
  members, 
  todos, 
  currentUser, 
  className 
}: TeamWorkloadChartProps) {
  // Calculate member workload statistics
  const memberWorkloads: MemberWorkload[] = React.useMemo(() => {
    return members.map(member => {
      const assignedTodos = todos.filter(todo => todo.assigneeId === member.user.id)
      const completedTodos = assignedTodos.filter(todo => todo.status === 'COMPLETED')
      const inProgressTodos = assignedTodos.filter(todo => todo.status === 'IN_PROGRESS')
      const overdueTodos = assignedTodos.filter(todo => 
        todo.dueDate && 
        new Date(todo.dueDate) < new Date() && 
        todo.status !== 'COMPLETED'
      )
      
      const completionRate = assignedTodos.length > 0 
        ? Math.round((completedTodos.length / assignedTodos.length) * 100) 
        : 0
      
      // Calculate average completion time
      let avgCompletionDays: number | undefined
      if (completedTodos.length > 0) {
        const completionTimes = completedTodos
          .filter(todo => todo.completedAt)
          .map(todo => {
            const created = new Date(todo.createdAt)
            const completed = new Date(todo.completedAt!)
            return Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
          })
        
        if (completionTimes.length > 0) {
          avgCompletionDays = Math.round(
            completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
          )
        }
      }
      
      return {
        user: member.user,
        role: member.role,
        stats: {
          assigned: assignedTodos.length,
          completed: completedTodos.length,
          inProgress: inProgressTodos.length,
          overdue: overdueTodos.length,
          completionRate,
          avgCompletionDays,
        }
      }
    }).sort((a, b) => b.stats.assigned - a.stats.assigned)
  }, [members, todos])

  // Overall team stats
  const teamStats = React.useMemo(() => {
    const totalAssigned = memberWorkloads.reduce((sum, member) => sum + member.stats.assigned, 0)
    const totalCompleted = memberWorkloads.reduce((sum, member) => sum + member.stats.completed, 0)
    const totalInProgress = memberWorkloads.reduce((sum, member) => sum + member.stats.inProgress, 0)
    const totalOverdue = memberWorkloads.reduce((sum, member) => sum + member.stats.overdue, 0)
    const unassignedTodos = todos.filter(todo => !todo.assigneeId).length
    
    return {
      totalAssigned,
      totalCompleted,
      totalInProgress,
      totalOverdue,
      unassignedTodos,
      teamCompletionRate: totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0,
    }
  }, [memberWorkloads, todos])

  const maxAssigned = Math.max(...memberWorkloads.map(m => m.stats.assigned), 1)

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-500'
      case 'ADMIN': return 'bg-blue-500'
      case 'MEMBER': return 'bg-green-500'
      case 'VIEWER': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getWorkloadColor = (assigned: number, maxAssigned: number) => {
    const percentage = (assigned / maxAssigned) * 100
    if (percentage >= 80) return 'bg-red-500'
    if (percentage >= 60) return 'bg-orange-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <TooltipProvider>
      <Card className={cn("", className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Team Workload Overview
          </CardTitle>
          
          {/* Team Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Assigned</span>
              </div>
              <div className="text-2xl font-bold">{teamStats.totalAssigned}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{teamStats.totalCompleted}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-sm text-muted-foreground">In Progress</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{teamStats.totalInProgress}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-orange-600" />
                <span className="text-sm text-muted-foreground">Unassigned</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{teamStats.unassignedTodos}</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Team Completion Rate</span>
              <span className="text-sm text-muted-foreground">{teamStats.teamCompletionRate}%</span>
            </div>
            <Progress value={teamStats.teamCompletionRate} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Member Workload Bars */}
          <div className="space-y-3">
            {memberWorkloads.map((member) => (
              <div key={member.user.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback size="sm">
                        {(member.user.name || member.user.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {member.user.name || member.user.email}
                        {member.user.id === currentUser.id && (
                          <Badge variant="outline" className="ml-2 h-4 text-xs">You</Badge>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={cn("h-4 text-xs text-white", getRoleColor(member.role))}
                        >
                          {member.role}
                        </Badge>
                        {member.stats.avgCompletionDays !== undefined && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="h-4 text-xs">
                                ~{member.stats.avgCompletionDays}d
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Average completion time</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="font-medium">{member.stats.assigned} assigned</div>
                      <div className="text-xs text-muted-foreground">
                        {member.stats.completionRate}% completed
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Workload Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Workload Distribution</span>
                    <span>{member.stats.assigned} / {maxAssigned}</span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={(member.stats.assigned / maxAssigned) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
                
                {/* Task Breakdown */}
                <div className="flex gap-4 text-xs">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      {member.stats.completed} completed
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Completed tasks</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      {member.stats.inProgress} in progress
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tasks in progress</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {member.stats.overdue > 0 && (
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 text-red-600">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        {member.stats.overdue} overdue
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Overdue tasks</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
            
            {memberWorkloads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No team members found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}