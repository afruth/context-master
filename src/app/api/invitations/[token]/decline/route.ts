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

// POST /api/invitations/[token]/decline - Decline invitation
export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { token } = await context.params
  
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token }
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
  
  // Mark invitation as declined
  await prisma.teamInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'DECLINED',
      respondedAt: new Date(),
      updatedAt: new Date(),
    }
  })
  
  return successResponse(null, 'Invitation declined')
})