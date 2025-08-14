import { NextRequest } from 'next/server'
import { 
  requireAuth, 
  successResponse, 
  errorResponse, 
  withErrorHandler,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ token: string }>
}

// POST /api/invitations/[token]/accept - Accept invitation
export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { token } = await context.params
  
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
          maxMembers: true,
          _count: {
            select: { members: true }
          }
        }
      }
    }
  })
  
  if (!invitation) {
    return errorResponse('Invitation not found', 404)
  }
  
  if (invitation.status !== 'PENDING') {
    return errorResponse('Invitation is no longer valid', 400)
  }
  
  if (invitation.expiresAt < new Date()) {
    // Mark as expired
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED', updatedAt: new Date() }
    })
    return errorResponse('Invitation has expired', 400)
  }
  
  // Check if invitation email matches user email
  if (invitation.email !== user.email) {
    return errorResponse('Invitation email does not match your account email', 403)
  }
  
  // Check if user is already a team member
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: invitation.teamId,
        userId: user.id,
      }
    }
  })
  
  if (existingMember) {
    return errorResponse('You are already a member of this team', 409)
  }
  
  // Check team member limit
  if (invitation.team.maxMembers && invitation.team._count.members >= invitation.team.maxMembers) {
    return errorResponse('Team has reached maximum member limit', 400)
  }
  
  // Accept invitation in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Mark invitation as accepted
    await tx.teamInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
        updatedAt: new Date(),
      }
    })
    
    // Add user to team
    const membership = await tx.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: user.id,
        role: invitation.role,
        invitedById: invitation.inviterId,
      }
    })
    
    return { membership, team: invitation.team }
  })
  
  return successResponse({
    team: {
      id: result.team.id,
      name: result.team.name,
      slug: result.team.slug,
    },
    role: invitation.role,
    membership: result.membership
  }, 'Invitation accepted successfully')
})