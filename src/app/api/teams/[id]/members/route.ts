import { NextRequest } from 'next/server'
import { paginationSchema } from '@/lib/validations'
import { 
  requireAuth, 
  requireTeamMembership,
  paginatedResponse,
  withErrorHandler,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { TeamMemberWithUser } from '@/types/api'
import { TeamRole } from '@prisma/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const user = await requireAuth()
  const { id: teamId } = await context.params
  const { searchParams } = new URL(request.url)
  
  // Verify team membership
  await requireTeamMembership(teamId, user.id)
  
  const query = paginationSchema.parse(Object.fromEntries(searchParams))
  const roleFilter = searchParams.get('role') as TeamRole | null
  const searchQuery = searchParams.get('search')
  
  const skip = (query.page - 1) * query.limit
  
  // Build where clause
  const where: any = {
    teamId,
  }
  
  if (roleFilter) {
    where.role = roleFilter
  }
  
  // Add search functionality
  if (searchQuery) {
    where.user = {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { username: { contains: searchQuery, mode: 'insensitive' } },
      ],
    }
  }
  
  const [members, total] = await Promise.all([
    prisma.teamMember.findMany({
      where,
      skip,
      take: query.limit,
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
      orderBy: [
        { role: 'desc' }, // Owners first, then admins, etc.
        { joinedAt: 'asc' },
      ],
    }),
    prisma.teamMember.count({ where }),
  ])
  
  // Get todo statistics for each member
  const membersWithStats: TeamMemberWithUser[] = await Promise.all(
    members.map(async (member) => {
      const [assignedTodos, completedTodos, overdueTodos] = await Promise.all([
        prisma.teamTodo.count({
          where: {
            teamId,
            assigneeId: member.userId,
            archivedAt: null,
          },
        }),
        prisma.teamTodo.count({
          where: {
            teamId,
            assigneeId: member.userId,
            status: 'COMPLETED',
            archivedAt: null,
          },
        }),
        prisma.teamTodo.count({
          where: {
            teamId,
            assigneeId: member.userId,
            status: { not: 'COMPLETED' },
            dueDate: { lt: new Date() },
            archivedAt: null,
          },
        }),
      ])
      
      return {
        ...member,
        todoStats: {
          assigned: assignedTodos,
          completed: completedTodos,
          overdue: overdueTodos,
        },
      }
    })
  )
  
  return paginatedResponse(membersWithStats, { 
    page: query.page, 
    limit: query.limit, 
    total 
  })
})