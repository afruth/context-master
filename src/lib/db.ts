import { PrismaClient, TeamRole, InvitationStatus, TodoStatus, Priority } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export enums for use in other parts of the application
export { TeamRole, InvitationStatus, TodoStatus, Priority }

// Database utility functions
export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}

/**
 * Parse JSON tags from string format
 */
export function parseTags(tags: string | null): string[] {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Stringify tags for database storage
 */
export function stringifyTags(tags: string[]): string {
  return JSON.stringify(tags)
}

/**
 * Calculate actual minutes from time entries
 */
export async function calculateActualMinutes(
  todoType: 'personal' | 'team',
  todoId: string
): Promise<number> {
  try {
    const timeEntries = await prisma.timeEntry.findMany({
      where: todoType === 'personal' 
        ? { personalTodoId: todoId }
        : { teamTodoId: todoId },
      select: { duration: true }
    })

    return timeEntries.reduce((total, entry) => {
      return total + (entry.duration ? Math.ceil(entry.duration / 60) : 0)
    }, 0)
  } catch (error) {
    throw new DatabaseError('Failed to calculate actual minutes', error)
  }
}

/**
 * Get user's team memberships with roles
 */
export async function getUserTeamMemberships(userId: string) {
  try {
    return await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            description: true,
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })
  } catch (error) {
    throw new DatabaseError('Failed to get user team memberships', error)
  }
}

/**
 * Check if user has permission for a specific team action
 */
export async function hasTeamPermission(
  userId: string,
  teamId: string,
  requiredRole: TeamRole
): Promise<boolean> {
  try {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { role: true }
    })

    if (!membership) return false

    // Define role hierarchy
    const roleHierarchy = {
      [TeamRole.VIEWER]: 1,
      [TeamRole.MEMBER]: 2,
      [TeamRole.ADMIN]: 3,
      [TeamRole.OWNER]: 4,
    }

    return roleHierarchy[membership.role] >= roleHierarchy[requiredRole]
  } catch (error) {
    throw new DatabaseError('Failed to check team permission', error)
  }
}

/**
 * Get team with member count and user's role
 */
export async function getTeamWithUserRole(teamId: string, userId: string) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true }
        },
        members: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        },
        _count: {
          select: { members: true, todos: true }
        }
      }
    })

    if (!team) return null

    const userMembership = team.members.find(m => m.user.id === userId)

    return {
      ...team,
      userRole: userMembership?.role || null,
      memberCount: team._count.members,
      todoCount: team._count.todos,
    }
  } catch (error) {
    throw new DatabaseError('Failed to get team with user role', error)
  }
}

/**
 * Create a new team with the creator as owner
 */
export async function createTeamWithOwner(
  teamData: {
    name: string
    description?: string
    slug: string
    color?: string
    isPublic?: boolean
  },
  ownerId: string
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Create the team
      const team = await tx.team.create({
        data: {
          ...teamData,
          ownerId,
        }
      })

      // Add owner as team member
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: ownerId,
          role: TeamRole.OWNER,
        }
      })

      return team
    })
  } catch (error) {
    throw new DatabaseError('Failed to create team with owner', error)
  }
}

/**
 * Get pending invitations for a user
 */
export async function getPendingInvitations(email: string) {
  try {
    return await prisma.teamInvitation.findMany({
      where: {
        email,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() }
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
          }
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    throw new DatabaseError('Failed to get pending invitations', error)
  }
}