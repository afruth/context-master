import { NextRequest } from 'next/server'
import { updateMemberRoleSchema } from '@/lib/validations'
import { 
  requireAuth, 
  requireTeamRole,
  successResponse, 
  errorResponse,
  withErrorHandler,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { TeamMemberWithUser } from '@/types/api'

interface RouteContext {
  params: Promise<{ id: string; userId: string }>
}

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId, userId: targetUserId } = await context.params
  const body = await request.json()
  
  // Verify user has admin permissions
  const currentUserMembership = await requireTeamRole(teamId, user.id, 'ADMIN')
  
  const validatedData = updateMemberRoleSchema.parse(body)
  
  // Get target member
  const targetMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: targetUserId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
        },
      },
    },
  })
  
  if (!targetMember) {
    return errorResponse('Team member not found', 404)
  }
  
  // Business rules validation
  if (validatedData.role) {
    // Cannot modify owner role
    if (targetMember.role === 'OWNER') {
      return errorResponse('Cannot modify owner role', 403)
    }
    
    // Only owner can assign admin role
    if (validatedData.role === 'ADMIN' && currentUserMembership.role !== 'OWNER') {
      return errorResponse('Only team owner can assign admin role', 403)
    }
    
    // Cannot assign owner role
    if (validatedData.role === 'OWNER') {
      return errorResponse('Cannot assign owner role through this endpoint', 403)
    }
  }
  
  const updatedMember = await prisma.teamMember.update({
    where: {
      teamId_userId: {
        teamId,
        userId: targetUserId,
      },
    },
    data: {
      ...(validatedData.role && { role: validatedData.role }),
      ...(validatedData.notifications !== undefined && { 
        notifications: validatedData.notifications 
      }),
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
        },
      },
    },
  })
  
  const memberWithStats: TeamMemberWithUser = {
    ...updatedMember,
    todoStats: {
      assigned: 0,
      completed: 0,
      overdue: 0,
    },
  }
  
  return successResponse(memberWithStats, 'Member updated successfully')
})

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId, userId: targetUserId } = await context.params
  
  // Get current user's role
  const currentUserMembership = await requireTeamRole(teamId, user.id, 'MEMBER')
  
  // Get target member
  const targetMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: targetUserId,
      },
    },
  })
  
  if (!targetMember) {
    return errorResponse('Team member not found', 404)
  }
  
  // Business rules validation
  // Users can remove themselves
  // Admins and owners can remove members and viewers
  // Only owner can remove admins
  const canRemove = 
    targetUserId === user.id || // Self removal
    (currentUserMembership.role === 'ADMIN' && 
     ['MEMBER', 'VIEWER'].includes(targetMember.role)) ||
    (currentUserMembership.role === 'OWNER' && 
     targetMember.role !== 'OWNER')
  
  if (!canRemove) {
    return errorResponse('Insufficient permissions to remove this member', 403)
  }
  
  // Cannot remove owner
  if (targetMember.role === 'OWNER') {
    return errorResponse('Cannot remove team owner', 403)
  }
  
  // Remove member and reassign their todos to null (unassigned)
  await prisma.$transaction(async (tx) => {
    // Unassign todos
    await tx.teamTodo.updateMany({
      where: {
        teamId,
        assigneeId: targetUserId,
      },
      data: {
        assigneeId: null,
        updatedAt: new Date(),
      },
    })
    
    // Remove team membership
    await tx.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    })
  })
  
  return successResponse(null, 'Member removed successfully')
})