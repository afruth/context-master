import { NextRequest } from 'next/server'
import { createInvitationSchema, paginationSchema } from '@/lib/validations'
import { 
  requireAuth, 
  requireTeamRole,
  successResponse, 
  errorResponse, 
  withErrorHandler,
  paginatedResponse
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { TeamInvitationWithInviter } from '@/types/api'
import { generateInvitationToken } from '@/lib/crypto'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/teams/[id]/invitations - Get team invitations
export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId } = await context.params
  
  // Verify user is admin or owner
  await requireTeamRole(teamId, user.id, 'ADMIN')
  
  const { searchParams } = new URL(request.url)
  const query = paginationSchema.parse({
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
  })

  const [invitations, total] = await Promise.all([
    prisma.teamInvitation.findMany({
      where: { 
        teamId,
        status: {
          in: ['PENDING', 'EXPIRED']
        }
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.teamInvitation.count({
      where: { 
        teamId,
        status: {
          in: ['PENDING', 'EXPIRED']
        }
      }
    })
  ])

  const invitationData: TeamInvitationWithInviter[] = invitations.map(invitation => ({
    ...invitation,
    inviter: invitation.inviter
  }))

  return paginatedResponse(invitationData, {
    page: query.page,
    limit: query.limit,
    total
  })
})

// POST /api/teams/[id]/invitations - Send team invitation
export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId } = await context.params
  const body = await request.json()
  
  // Verify user is admin or owner
  await requireTeamRole(teamId, user.id, 'ADMIN')
  
  const validatedData = createInvitationSchema.parse(body)
  
  // Check if team exists and get details
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      _count: {
        select: { members: true }
      }
    }
  })
  
  if (!team) {
    return errorResponse('Team not found', 404)
  }
  
  // Check member limit if set
  if (team.maxMembers && team._count.members >= team.maxMembers) {
    return errorResponse('Team has reached maximum member limit', 400)
  }
  
  // Check if user is already a team member
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: await getUserIdByEmail(validatedData.email)
      }
    }
  })
  
  if (existingMember) {
    return errorResponse('User is already a team member', 409)
  }
  
  // Check if there's already a pending invitation
  const existingInvitation = await prisma.teamInvitation.findUnique({
    where: {
      email_teamId: {
        email: validatedData.email,
        teamId
      }
    }
  })
  
  if (existingInvitation && existingInvitation.status === 'PENDING') {
    return errorResponse('Invitation already pending for this email', 409)
  }
  
  // Generate invitation token
  const token = generateInvitationToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expire in 7 days
  
  // Create or update invitation
  const invitation = await prisma.teamInvitation.upsert({
    where: {
      email_teamId: {
        email: validatedData.email,
        teamId
      }
    },
    update: {
      role: validatedData.role,
      token,
      status: 'PENDING',
      message: validatedData.message,
      expiresAt,
      inviterId: user.id,
      updatedAt: new Date(),
    },
    create: {
      email: validatedData.email,
      teamId,
      inviterId: user.id,
      role: validatedData.role,
      token,
      message: validatedData.message,
      expiresAt,
    },
    include: {
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      team: {
        select: {
          name: true,
        }
      }
    }
  })
  
  // TODO: Send email notification
  // In a real application, you would queue an email job here
  console.log(`Invitation email would be sent to ${validatedData.email}`)
  console.log(`Invitation link: ${process.env.NEXTAUTH_URL}/invite/${token}`)
  
  return successResponse(invitation, 'Invitation sent successfully', 201)
})

// Helper function to get user ID by email
async function getUserIdByEmail(email: string): Promise<string | undefined> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  })
  return user?.id
}