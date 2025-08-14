import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['all', 'personal-todos', 'team-todos', 'teams', 'comments']).optional().default('all'),
  limit: z.string().optional().transform(val => Math.min(parseInt(val || '20') || 20, 50)),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { q: query, type, limit } = searchSchema.parse(Object.fromEntries(searchParams.entries()))

    const results: any[] = []

    // Search personal todos
    if (type === 'all' || type === 'personal-todos') {
      const personalTodos = await prisma.personalTodo.findMany({
        where: {
          userId: session.user.id,
          archivedAt: null,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          category: true,
          dueDate: true,
          createdAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: type === 'personal-todos' ? limit : Math.floor(limit / 4),
      })

      results.push(...personalTodos.map(todo => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        type: 'personal-todo',
        url: `/dashboard/todos/${todo.id}`,
        metadata: {
          status: todo.status,
          priority: todo.priority,
          category: todo.category,
          dueDate: todo.dueDate,
          createdAt: todo.createdAt,
        },
      })))
    }

    // Search team todos
    if (type === 'all' || type === 'team-todos') {
      // Get user's teams first
      const userTeams = await prisma.teamMember.findMany({
        where: { userId: session.user.id },
        select: { teamId: true },
      })
      const teamIds = userTeams.map(tm => tm.teamId)

      if (teamIds.length > 0) {
        const teamTodos = await prisma.teamTodo.findMany({
          where: {
            teamId: { in: teamIds },
            archivedAt: null,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            category: true,
            dueDate: true,
            createdAt: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            assignee: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: type === 'team-todos' ? limit : Math.floor(limit / 4),
        })

        results.push(...teamTodos.map(todo => ({
          id: todo.id,
          title: todo.title,
          description: todo.description,
          type: 'team-todo',
          url: `/dashboard/teams/${todo.team.id}/todos`,
          metadata: {
            status: todo.status,
            priority: todo.priority,
            category: todo.category,
            dueDate: todo.dueDate,
            createdAt: todo.createdAt,
            team: todo.team,
            assignee: todo.assignee,
          },
        })))
      }
    }

    // Search teams
    if (type === 'all' || type === 'teams') {
      const teams = await prisma.team.findMany({
        where: {
          members: {
            some: { userId: session.user.id },
          },
          archivedAt: null,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
              todos: {
                where: { archivedAt: null },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: type === 'teams' ? limit : Math.floor(limit / 4),
      })

      results.push(...teams.map(team => ({
        id: team.id,
        title: team.name,
        description: team.description,
        type: 'team',
        url: `/dashboard/teams/${team.id}`,
        metadata: {
          memberCount: team._count.members,
          todoCount: team._count.todos,
          createdAt: team.createdAt,
        },
      })))
    }

    // Search comments
    if (type === 'all' || type === 'comments') {
      // Get user's teams for team todo comments
      const userTeams = await prisma.teamMember.findMany({
        where: { userId: session.user.id },
        select: { teamId: true },
      })
      const teamIds = userTeams.map(tm => tm.teamId)

      if (teamIds.length > 0) {
        const comments = await prisma.todoComment.findMany({
          where: {
            content: { contains: query, mode: 'insensitive' },
            teamTodo: {
              teamId: { in: teamIds },
              archivedAt: null,
            },
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            teamTodo: {
              select: {
                id: true,
                title: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: type === 'comments' ? limit : Math.floor(limit / 4),
        })

        results.push(...comments.map(comment => ({
          id: comment.id,
          title: `Comment on "${comment.teamTodo?.title}"`,
          description: comment.content,
          type: 'comment',
          url: `/dashboard/teams/${comment.teamTodo?.team.id}/todos`,
          metadata: {
            author: comment.user,
            todo: comment.teamTodo,
            createdAt: comment.createdAt,
          },
        })))
      }
    }

    // Sort results by relevance (title matches first, then by date)
    const sortedResults = results
      .sort((a, b) => {
        const aTitle = a.title.toLowerCase()
        const bTitle = b.title.toLowerCase()
        const queryLower = query.toLowerCase()
        
        const aTitleMatch = aTitle.includes(queryLower)
        const bTitleMatch = bTitle.includes(queryLower)
        
        if (aTitleMatch && !bTitleMatch) return -1
        if (!aTitleMatch && bTitleMatch) return 1
        
        // Both or neither match title, sort by date
        return new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
      })
      .slice(0, limit)

    return NextResponse.json({
      data: {
        query,
        type,
        results: sortedResults,
        totalCount: sortedResults.length,
      },
    })
  } catch (error) {
    console.error('Error in search:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}