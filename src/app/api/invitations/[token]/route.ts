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

// GET /api/invitations/[token] - Get invitation details
export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { token } = await context.params
  
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          _count: {
            select: { members: true }
          }
        }
      },
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
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
  
  // Return invitation details without sensitive information
  const invitationData = {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    message: invitation.message,
    expiresAt: invitation.expiresAt,
    team: {
      id: invitation.team.id,
      name: invitation.team.name,
      description: invitation.team.description,
      color: invitation.team.color,
      memberCount: invitation.team._count.members,
    },
    inviter: invitation.inviter,
  }
  
  return successResponse(invitationData)
})