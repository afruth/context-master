import { NextRequest } from 'next/server'
import { updateTeamSchema } from '@/lib/validations'
import { 
  requireAuth, 
  requireTeamMembership,
  requireTeamRole,
  successResponse, 
  errorResponse, 
  withErrorHandler,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { TeamDetails } from '@/types/api'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId } = await context.params
  
  // Verify team membership
  const membership = await requireTeamMembership(teamId, user.id)
  
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
      todos: {
        where: {
          archivedAt: null,
        },
        select: {
          status: true,
          dueDate: true,
        },
      },
    },
  })
  
  if (!team) {
    return errorResponse('Team not found', 404)
  }
  
  // Calculate todo statistics
  const totalTodos = team.todos.length
  const completedTodos = team.todos.filter(t => t.status === 'COMPLETED').length
  const inProgressTodos = team.todos.filter(t => t.status === 'IN_PROGRESS').length
  const overdueTodos = team.todos.filter(t => 
    t.status !== 'COMPLETED' && 
    t.dueDate && 
    new Date(t.dueDate) < new Date()
  ).length
  
  const teamDetails: TeamDetails = {
    id: team.id,
    name: team.name,
    description: team.description,
    slug: team.slug,
    isPublic: team.isPublic,
    inviteCode: team.inviteCode,
    color: team.color,
    allowGuestInvites: team.allowGuestInvites,
    requireApproval: team.requireApproval,
    maxMembers: team.maxMembers,
    ownerId: team.ownerId,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    archivedAt: team.archivedAt,
    owner: team.owner,
    memberCount: team._count.members,
    userRole: membership.role,
    todoStats: {
      total: totalTodos,
      completed: completedTodos,
      inProgress: inProgressTodos,
      overdue: overdueTodos,
    },
  }
  
  return successResponse(teamDetails)
})

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId } = await context.params
  const body = await request.json()
  
  // Verify user is owner or admin
  await requireTeamRole(teamId, user.id, 'ADMIN')
  
  const validatedData = updateTeamSchema.parse(body)
  
  // Check if new name conflicts with existing team (if name is being changed)
  if (validatedData.name) {
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: validatedData.name,
        ownerId: user.id,
        id: { not: teamId },
        archivedAt: null,
      },
    })
    
    if (existingTeam) {
      return errorResponse('You already have a team with this name', 409)
    }
  }
  
  const updatedTeam = await prisma.team.update({
    where: { id: teamId },
    data: {
      ...validatedData,
      updatedAt: new Date(),
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  })
  
  // Get user's role in team
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: user.id,
      },
    },
  })
  
  const teamDetails: TeamDetails = {
    ...updatedTeam,
    memberCount: updatedTeam._count.members,
    userRole: membership?.role || 'VIEWER',
    todoStats: {
      total: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0,
    },
  }
  
  return successResponse(teamDetails, 'Team updated successfully')
})

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId } = await context.params
  
  // Verify user is owner
  await requireTeamRole(teamId, user.id, 'OWNER')
  
  // Soft delete team and all related data
  await prisma.$transaction(async (tx) => {
    // Archive team
    await tx.team.update({
      where: { id: teamId },
      data: {
        archivedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    
    // Archive all team todos
    await tx.teamTodo.updateMany({
      where: { teamId },
      data: {
        archivedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    
    // Cancel pending invitations
    await tx.teamInvitation.updateMany({
      where: { 
        teamId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    })
  })
  
  return successResponse(null, 'Team deleted successfully')
})