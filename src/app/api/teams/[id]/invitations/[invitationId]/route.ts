import { NextRequest } from 'next/server'
import { 
  requireAuth, 
  requireTeamRole,
  successResponse, 
  errorResponse, 
  withErrorHandler,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string; invitationId: string }>
}

// DELETE /api/teams/[id]/invitations/[invitationId] - Cancel invitation
export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId, invitationId } = await context.params
  
  // Verify user is admin or owner
  await requireTeamRole(teamId, user.id, 'ADMIN')
  
  // Get invitation details
  const invitation = await prisma.teamInvitation.findUnique({
    where: { id: invitationId }
  })
  
  if (!invitation) {
    return errorResponse('Invitation not found', 404)
  }
  
  if (invitation.teamId !== teamId) {
    return errorResponse('Invitation does not belong to this team', 403)
  }
  
  if (invitation.status !== 'PENDING') {
    return errorResponse('Only pending invitations can be cancelled', 400)
  }
  
  // Update invitation status
  await prisma.teamInvitation.update({
    where: { id: invitationId },
    data: {
      status: 'CANCELLED',
      updatedAt: new Date(),
    }
  })
  
  return successResponse(null, 'Invitation cancelled successfully')
})

// POST /api/teams/[id]/invitations/[invitationId]/resend - Resend invitation
export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId, invitationId } = await context.params
  
  // Verify user is admin or owner
  await requireTeamRole(teamId, user.id, 'ADMIN')
  
  // Get invitation details
  const invitation = await prisma.teamInvitation.findUnique({
    where: { id: invitationId },
    include: {
      team: {
        select: { name: true }
      }
    }
  })
  
  if (!invitation) {
    return errorResponse('Invitation not found', 404)
  }
  
  if (invitation.teamId !== teamId) {
    return errorResponse('Invitation does not belong to this team', 403)
  }
  
  if (invitation.status !== 'PENDING') {
    return errorResponse('Only pending invitations can be resent', 400)
  }
  
  // Check if invitation has expired and update if needed
  const now = new Date()
  let updatedInvitation = invitation
  
  if (invitation.expiresAt < now) {
    // Extend expiration by 7 days
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7)
    
    updatedInvitation = await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      },
      include: {
        team: {
          select: { name: true }
        }
      }
    })
  }
  
  // TODO: Send email notification
  // In a real application, you would queue an email job here
  console.log(`Invitation email resent to ${updatedInvitation.email}`)
  console.log(`Invitation link: ${process.env.NEXTAUTH_URL}/invite/${updatedInvitation.token}`)
  
  return successResponse(updatedInvitation, 'Invitation resent successfully')
})