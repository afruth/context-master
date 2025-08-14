#!/usr/bin/env tsx
/**
 * Database Health Check Script
 * 
 * Verifies that the database schema is properly set up and all relationships work correctly.
 * Run with: npx tsx scripts/db-health-check.ts
 */

import { prisma, TeamRole, TodoStatus, Priority } from '../src/lib/db'

interface HealthCheckResult {
  name: string
  passed: boolean
  error?: string
  details?: string
}

async function runHealthChecks(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = []

  // Test 1: Basic connection
  try {
    await prisma.$connect()
    results.push({ name: 'Database Connection', passed: true, details: 'Connected successfully' })
  } catch (error) {
    results.push({ 
      name: 'Database Connection', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return results // Can't continue without connection
  }

  // Test 2: Table existence and basic queries
  try {
    const counts = {
      users: await prisma.user.count(),
      teams: await prisma.team.count(),
      personalTodos: await prisma.personalTodo.count(),
      teamTodos: await prisma.teamTodo.count(),
      timeEntries: await prisma.timeEntry.count(),
    }
    
    results.push({ 
      name: 'Table Structure', 
      passed: true, 
      details: `Users: ${counts.users}, Teams: ${counts.teams}, Personal Todos: ${counts.personalTodos}, Team Todos: ${counts.teamTodos}, Time Entries: ${counts.timeEntries}` 
    })
  } catch (error) {
    results.push({ 
      name: 'Table Structure', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }

  // Test 3: User relationships
  try {
    const userWithRelations = await prisma.user.findFirst({
      include: {
        teamMembers: {
          include: { team: true }
        },
        personalTodos: true,
        timeEntries: true,
      }
    })
    
    results.push({ 
      name: 'User Relationships', 
      passed: !!userWithRelations, 
      details: userWithRelations ? 
        `User has ${userWithRelations.teamMembers.length} team memberships, ${userWithRelations.personalTodos.length} personal todos` : 
        'No user found' 
    })
  } catch (error) {
    results.push({ 
      name: 'User Relationships', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }

  // Test 4: Team relationships
  try {
    const teamWithRelations = await prisma.team.findFirst({
      include: {
        members: {
          include: { user: true }
        },
        todos: true,
        owner: true,
      }
    })
    
    results.push({ 
      name: 'Team Relationships', 
      passed: !!teamWithRelations, 
      details: teamWithRelations ? 
        `Team has ${teamWithRelations.members.length} members, ${teamWithRelations.todos.length} todos` : 
        'No team found' 
    })
  } catch (error) {
    results.push({ 
      name: 'Team Relationships', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }

  // Test 5: Todo relationships
  try {
    const teamTodoWithRelations = await prisma.teamTodo.findFirst({
      include: {
        team: true,
        assignee: true,
        createdBy: true,
        timeEntries: true,
        comments: {
          include: { user: true }
        }
      }
    })
    
    results.push({ 
      name: 'Todo Relationships', 
      passed: !!teamTodoWithRelations, 
      details: teamTodoWithRelations ? 
        `Todo has ${teamTodoWithRelations.timeEntries.length} time entries, ${teamTodoWithRelations.comments.length} comments` : 
        'No team todo found' 
    })
  } catch (error) {
    results.push({ 
      name: 'Todo Relationships', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }

  // Test 6: Enum values
  try {
    const todoWithEnums = await prisma.teamTodo.findFirst({
      where: {
        status: TodoStatus.COMPLETED,
        priority: Priority.HIGH,
      }
    })
    
    const memberWithRole = await prisma.teamMember.findFirst({
      where: {
        role: TeamRole.OWNER
      }
    })
    
    results.push({ 
      name: 'Enum Values', 
      passed: true, 
      details: `Found ${todoWithEnums ? 'completed high-priority todo' : 'no matching todo'}, ${memberWithRole ? 'team owner' : 'no team owner'}` 
    })
  } catch (error) {
    results.push({ 
      name: 'Enum Values', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }

  // Test 7: Complex queries
  try {
    const complexQuery = await prisma.user.findMany({
      where: {
        teamMembers: {
          some: {
            team: {
              todos: {
                some: {
                  status: TodoStatus.COMPLETED
                }
              }
            }
          }
        }
      },
      include: {
        _count: {
          select: {
            personalTodos: true,
            teamMembers: true,
          }
        }
      },
      take: 5
    })
    
    results.push({ 
      name: 'Complex Queries', 
      passed: true, 
      details: `Found ${complexQuery.length} users with completed team todos` 
    })
  } catch (error) {
    results.push({ 
      name: 'Complex Queries', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }

  return results
}

async function main() {
  console.log('🏥 Starting Database Health Check...\n')
  
  try {
    const results = await runHealthChecks()
    
    const passed = results.filter(r => r.passed).length
    const total = results.length
    
    console.log('📊 Health Check Results:')
    console.log('=' .repeat(50))
    
    for (const result of results) {
      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${result.name}`)
      
      if (result.details) {
        console.log(`   ${result.details}`)
      }
      
      if (result.error) {
        console.log(`   ❗ Error: ${result.error}`)
      }
      
      console.log()
    }
    
    console.log('=' .repeat(50))
    console.log(`📈 Summary: ${passed}/${total} checks passed`)
    
    if (passed === total) {
      console.log('🎉 All health checks passed! Database is ready for use.')
      process.exit(0)
    } else {
      console.log('⚠️  Some health checks failed. Please review the errors above.')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('💥 Health check failed with unexpected error:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()