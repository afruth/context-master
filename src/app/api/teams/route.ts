import { NextRequest } from 'next/server'
import { createTeamSchema, paginationSchema } from '@/lib/validations'
import { 
  requireAuth, 
  successResponse, 
  paginatedResponse,
  errorResponse,
  withErrorHandler,
  generateTeamSlug,
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { TeamWithStats } from '@/types/api'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  const { searchParams } = new URL(request.url)
  
  const { page, limit } = paginationSchema.parse(Object.fromEntries(searchParams))
  
  const skip = (page - 1) * limit
  
  // Get teams where user is a member
  const [memberships, total] = await Promise.all([
    prisma.teamMember.findMany({
      where: {
        userId: user.id,
      },
      skip,
      take: limit,
      include: {
        team: {
          include: {
            _count: {
              select: {
                members: true,
                todos: true,
              },
            },
            todos: {
              where: {
                archivedAt: null,
              },
              select: {
                status: true,
                dueDate: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        team: {
          updatedAt: 'desc',
        },
      },
    }),
    prisma.teamMember.count({
      where: {
        userId: user.id,
      },
    }),
  ])
  
  const teamsWithStats: TeamWithStats[] = memberships.map(membership => {
    const team = membership.team
    const todos = team.todos
    
    const completedTodos = todos.filter(t => t.status === 'COMPLETED').length
    const inProgressTodos = todos.filter(t => t.status === 'IN_PROGRESS').length
    const overdueTodos = todos.filter(t => 
      t.status !== 'COMPLETED' && 
      t.dueDate && 
      new Date(t.dueDate) < new Date()
    ).length
    
    // Get latest activity from todos
    const latestTodo = todos.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
    
    return {
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
      memberCount: team._count.members,
      role: membership.role,
      todoStats: {
        total: todos.length,
        completed: completedTodos,
        inProgress: inProgressTodos,
        overdue: overdueTodos,
      },
      lastActivity: latestTodo?.createdAt.toISOString(),
    }
  })
  
  return paginatedResponse(teamsWithStats, { page, limit, total })
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  const body = await request.json()
  
  const validatedData = createTeamSchema.parse(body)
  
  // Generate unique slug
  const slug = generateTeamSlug(validatedData.name)
  
  // Check if team name already exists for this user
  const existingTeam = await prisma.team.findFirst({
    where: {
      name: validatedData.name,
      ownerId: user.id,
      archivedAt: null,
    },
  })
  
  if (existingTeam) {
    return errorResponse('You already have a team with this name', 409)
  }
  
  // Create team and add creator as owner in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        slug,
        isPublic: validatedData.isPublic || false,
        color: validatedData.color || '#06b6d4',
        allowGuestInvites: validatedData.allowGuestInvites || false,
        requireApproval: validatedData.requireApproval || false,
        maxMembers: validatedData.maxMembers,
        ownerId: user.id,
      },
    })
    
    // Add creator as owner member
    await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: 'OWNER',
      },
    })
    
    return team
  })
  
  const teamWithStats: TeamWithStats = {
    ...result,
    memberCount: 1,
    role: 'OWNER',
    todoStats: {
      total: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0,
    },
  }
  
  return successResponse(teamWithStats, 'Team created successfully', 201)
})