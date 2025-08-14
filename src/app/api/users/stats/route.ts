import { NextRequest } from 'next/server'
import { 
  requireAuth, 
  successResponse, 
  errorResponse, 
  withErrorHandler 
} from '@/lib/api-utils'
import { prisma } from '@/lib/db'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const user = await requireAuth()
  
  // Get user statistics
  const [
    personalTodosCount,
    completedPersonalTodos,
    teamsCount,
    teamTodosCount,
    totalTimeEntries,
    thisMonthCompletedTodos
  ] = await Promise.all([
    // Total personal todos
    prisma.personalTodo.count({
      where: { 
        userId: user.id,
        archivedAt: null
      }
    }),
    
    // Completed personal todos
    prisma.personalTodo.count({
      where: { 
        userId: user.id, 
        status: 'COMPLETED',
        archivedAt: null
      }
    }),
    
    // Teams user is member of
    prisma.teamMember.count({
      where: { userId: user.id }
    }),
    
    // Team todos user has access to
    prisma.teamTodo.count({
      where: {
        team: {
          members: {
            some: {
              userId: user.id
            }
          }
        },
        archivedAt: null
      }
    }),
    
    // Total time tracked (sum of all time entries)
    prisma.timeEntry.aggregate({
      where: { userId: user.id },
      _sum: {
        duration: true
      }
    }),
    
    // Completed todos this month
    prisma.personalTodo.count({
      where: {
        userId: user.id,
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })
  ])
  
  // Calculate total time in minutes (duration is stored in seconds)
  const totalTimeMinutes = totalTimeEntries._sum.duration 
    ? Math.round(totalTimeEntries._sum.duration / 60) 
    : 0
  
  // Calculate productivity percentage (completed vs total)
  const productivity = personalTodosCount > 0 
    ? Math.round((completedPersonalTodos / personalTodosCount) * 100)
    : 0
  
  const stats = {
    totalPersonalTodos: personalTodosCount,
    completedPersonalTodos,
    totalTeams: teamsCount,
    totalTeamTodos: teamTodosCount,
    totalTimeSpent: totalTimeMinutes,
    completedThisMonth: thisMonthCompletedTodos,
    productivity
  }
  
  return successResponse(stats)
})