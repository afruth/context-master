import { PrismaClient, TeamRole, Priority, TodoStatus, InvitationStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper functions for realistic data generation
function getRandomDate(daysBack: number, daysForward: number = 0): Date {
  const now = new Date()
  const minTime = now.getTime() - (daysBack * 24 * 60 * 60 * 1000)
  const maxTime = now.getTime() + (daysForward * 24 * 60 * 60 * 1000)
  return new Date(minTime + Math.random() * (maxTime - minTime))
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomDuration(minMinutes: number, maxMinutes: number): number {
  return (minMinutes + Math.random() * (maxMinutes - minMinutes)) * 60 // Convert to seconds
}

const categories = ['Development', 'Design', 'Marketing', 'DevOps', 'Documentation', 'Testing', 'Research', 'Planning', 'Review', 'Maintenance']
const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT]
const statuses = [TodoStatus.TODO, TodoStatus.IN_PROGRESS, TodoStatus.COMPLETED, TodoStatus.CANCELLED]

// Sample descriptions for different types of work
const todoDescriptions = {
  Development: [
    'Implement new feature according to specifications',
    'Fix reported bug in production environment', 
    'Refactor legacy code for better maintainability',
    'Add unit tests for critical functions',
    'Optimize database queries for better performance'
  ],
  Design: [
    'Create wireframes for new user flow',
    'Design responsive mobile layouts',
    'Conduct user research and create personas',
    'Update brand guidelines and style guide',
    'Create prototypes for user testing'
  ],
  Marketing: [
    'Plan and execute social media campaign',
    'Create content calendar for next quarter',
    'Analyze conversion metrics and user behavior',
    'Design promotional materials for product launch',
    'Conduct competitor analysis and market research'
  ],
  DevOps: [
    'Set up monitoring and alerting systems',
    'Configure automated deployment pipeline',
    'Optimize server performance and scaling',
    'Implement backup and disaster recovery procedures',
    'Update security configurations and patches'
  ],
  Documentation: [
    'Write comprehensive API documentation',
    'Create user guides and tutorials',
    'Update project README and setup instructions',
    'Document architectural decisions and patterns',
    'Create troubleshooting guides for common issues'
  ],
  Testing: [
    'Create comprehensive test suite for new features',
    'Perform manual testing on staging environment',
    'Set up automated integration tests',
    'Conduct performance and load testing',
    'Review and update existing test cases'
  ]
}

async function main() {
  console.log('🌱 Starting comprehensive database seeding...')

  // Clean existing data
  await prisma.timeEntry.deleteMany()
  await prisma.todoComment.deleteMany()
  await prisma.teamTodo.deleteMany()
  await prisma.personalTodo.deleteMany()
  await prisma.teamInvitation.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleaned existing data')

  // Create users with more variety
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const users = [
    {
      email: 'admin@contextmaster.com',
      name: 'Sarah Chen',
      username: 'sarah_admin',
      password: hashedPassword,
      timezone: 'America/New_York',
      theme: 'dark',
      notifications: true,
      language: 'en',
      lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      email: 'alice.johnson@contextmaster.com',
      name: 'Alice Johnson',
      username: 'alice_dev',
      password: hashedPassword,
      timezone: 'America/Los_Angeles',
      theme: 'light',
      notifications: true,
      language: 'en',
      lastLoginAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
    {
      email: 'bob.smith@contextmaster.com',
      name: 'Bob Smith',
      username: 'bob_designer',
      password: hashedPassword,
      timezone: 'Europe/London',
      theme: 'system',
      notifications: false,
      language: 'en',
      lastLoginAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      email: 'carol.davis@contextmaster.com',
      name: 'Carol Davis',
      username: 'carol_marketing',
      password: hashedPassword,
      timezone: 'Asia/Tokyo',
      theme: 'light',
      notifications: true,
      language: 'en',
      lastLoginAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      email: 'david.wilson@contextmaster.com',
      name: 'David Wilson',
      username: 'david_devops',
      password: hashedPassword,
      timezone: 'Australia/Sydney',
      theme: 'dark',
      notifications: true,
      language: 'en',
      lastLoginAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    },
    {
      email: 'emma.garcia@contextmaster.com',
      name: 'Emma Garcia',
      username: 'emma_qa',
      password: hashedPassword,
      timezone: 'America/Chicago',
      theme: 'system',
      notifications: true,
      language: 'en',
      lastLoginAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    }
  ]

  const createdUsers = []
  for (const userData of users) {
    const user = await prisma.user.create({ data: userData })
    createdUsers.push(user)
  }

  const [admin, alice, bob, carol, david, emma] = createdUsers

  console.log('👥 Created 6 users')

  // Create teams with more variety
  const teams = [
    {
      name: 'Frontend Development',
      description: 'React, Next.js, and modern frontend development team',
      slug: 'frontend-dev',
      color: '#06b6d4',
      isPublic: false,
      allowGuestInvites: false,
      requireApproval: true,
      maxMembers: 8,
      ownerId: admin.id,
    },
    {
      name: 'Backend & DevOps',
      description: 'API development, infrastructure, and DevOps team',
      slug: 'backend-devops',
      color: '#10b981',
      isPublic: false,
      allowGuestInvites: true,
      requireApproval: false,
      maxMembers: 6,
      ownerId: david.id,
    },
    {
      name: 'Design & UX',
      description: 'User experience, visual design, and research team',
      slug: 'design-ux',
      color: '#8b5cf6',
      isPublic: false,
      allowGuestInvites: false,
      requireApproval: true,
      maxMembers: 5,
      ownerId: bob.id,
    },
    {
      name: 'Marketing & Growth',
      description: 'Marketing campaigns, growth hacking, and analytics team',
      slug: 'marketing-growth',
      color: '#ec4899',
      isPublic: true,
      allowGuestInvites: true,
      requireApproval: false,
      ownerId: carol.id,
    },
    {
      name: 'Quality Assurance',
      description: 'Testing, quality assurance, and release management team',
      slug: 'quality-assurance',
      color: '#f59e0b',
      isPublic: false,
      allowGuestInvites: false,
      requireApproval: true,
      maxMembers: 4,
      ownerId: emma.id,
    }
  ]

  const createdTeams = []
  for (const teamData of teams) {
    const team = await prisma.team.create({ data: teamData })
    createdTeams.push(team)
  }

  const [frontendTeam, backendTeam, designTeam, marketingTeam, qaTeam] = createdTeams

  console.log('🏢 Created 5 teams')

  // Create comprehensive team memberships
  const memberships = [
    // Admin is owner/member of multiple teams
    { teamId: frontendTeam.id, userId: admin.id, role: TeamRole.OWNER },
    { teamId: backendTeam.id, userId: admin.id, role: TeamRole.ADMIN, invitedById: david.id },
    
    // Alice - Frontend developer
    { teamId: frontendTeam.id, userId: alice.id, role: TeamRole.ADMIN, invitedById: admin.id },
    { teamId: qaTeam.id, userId: alice.id, role: TeamRole.MEMBER, invitedById: emma.id },
    
    // Bob - Design lead with frontend involvement
    { teamId: designTeam.id, userId: bob.id, role: TeamRole.OWNER },
    { teamId: frontendTeam.id, userId: bob.id, role: TeamRole.MEMBER, invitedById: admin.id },
    
    // Carol - Marketing lead
    { teamId: marketingTeam.id, userId: carol.id, role: TeamRole.OWNER },
    
    // David - Backend/DevOps lead
    { teamId: backendTeam.id, userId: david.id, role: TeamRole.OWNER },
    { teamId: frontendTeam.id, userId: david.id, role: TeamRole.MEMBER, invitedById: admin.id },
    
    // Emma - QA lead with involvement in all teams
    { teamId: qaTeam.id, userId: emma.id, role: TeamRole.OWNER },
    { teamId: frontendTeam.id, userId: emma.id, role: TeamRole.MEMBER, invitedById: admin.id },
    { teamId: backendTeam.id, userId: emma.id, role: TeamRole.MEMBER, invitedById: david.id },
    { teamId: designTeam.id, userId: emma.id, role: TeamRole.MEMBER, invitedById: bob.id },
  ]

  for (const membership of memberships) {
    await prisma.teamMember.create({
      data: {
        ...membership,
        lastActiveAt: getRandomDate(7, 0)
      }
    })
  }

  console.log('🤝 Created team memberships')

  // Create comprehensive personal todos (20 entries)
  const personalTodosData = []
  
  // Generate personal todos for each user
  for (let i = 0; i < 20; i++) {
    const user = getRandomElement(createdUsers)
    const category = getRandomElement(categories)
    const priority = getRandomElement(priorities)
    const status = getRandomElement(statuses)
    const description = getRandomElement(todoDescriptions[category as keyof typeof todoDescriptions] || ['Generic task description'])
    
    const createdDate = getRandomDate(30, 0)
    const dueDate = Math.random() > 0.6 ? getRandomDate(0, 14) : null // 40% chance of having due date
    const completedAt = status === TodoStatus.COMPLETED ? getRandomDate(5, 0) : null
    
    personalTodosData.push({
      title: `${category}: ${description.split(' ').slice(0, 4).join(' ')}...`,
      description: `## ${category} Task\n\n${description}\n\n### Acceptance Criteria\n- [ ] Complete implementation\n- [ ] Add tests\n- [ ] Update documentation`,
      status,
      priority,
      category,
      tags: JSON.stringify([category.toLowerCase(), 'personal', getRandomElement(['urgent', 'feature', 'bug', 'improvement'])]),
      color: getRandomElement(['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444']),
      estimatedMinutes: Math.floor(30 + Math.random() * 300), // 30 minutes to 5 hours
      actualMinutes: status === TodoStatus.COMPLETED ? Math.floor(30 + Math.random() * 240) : null,
      userId: user.id,
      createdAt: createdDate,
      updatedAt: getRandomDate(3, 0),
      completedAt,
      dueDate,
    })
  }

  for (const todo of personalTodosData) {
    await prisma.personalTodo.create({ data: todo })
  }

  console.log('✅ Created 20 personal todos')

  // Create comprehensive team todos (20 entries)
  const teamTodosData = []
  
  for (let i = 0; i < 20; i++) {
    const team = getRandomElement(createdTeams)
    const category = getRandomElement(categories)
    const priority = getRandomElement(priorities)
    const status = getRandomElement(statuses)
    const description = getRandomElement(todoDescriptions[category as keyof typeof todoDescriptions] || ['Generic team task description'])
    
    // Get team members for assignment
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: team.id },
      include: { user: true }
    })
    
    const creator = getRandomElement(teamMembers)?.user || admin
    const assignee = Math.random() > 0.3 ? getRandomElement(teamMembers)?.user : null // 70% chance of assignment
    
    const createdDate = getRandomDate(45, 0)
    const dueDate = Math.random() > 0.5 ? getRandomDate(0, 21) : null // 50% chance of having due date
    const completedAt = status === TodoStatus.COMPLETED ? getRandomDate(7, 0) : null
    
    teamTodosData.push({
      title: `[${team.name}] ${category}: ${description.split(' ').slice(0, 5).join(' ')}...`,
      description: `## ${category} Task for ${team.name}\n\n${description}\n\n### Requirements\n- Collaborate with team members\n- Follow team standards\n- Update project documentation\n\n### Definition of Done\n- [ ] Implementation complete\n- [ ] Code review passed\n- [ ] Tests added and passing\n- [ ] Documentation updated`,
      status,
      priority,
      category,
      tags: JSON.stringify([category.toLowerCase(), team.slug, getRandomElement(['sprint', 'epic', 'story', 'task'])]),
      color: team.color,
      estimatedMinutes: Math.floor(60 + Math.random() * 480), // 1 hour to 8 hours
      actualMinutes: status === TodoStatus.COMPLETED ? Math.floor(45 + Math.random() * 360) : null,
      teamId: team.id,
      assigneeId: assignee?.id,
      createdById: creator.id,
      createdAt: createdDate,
      updatedAt: getRandomDate(3, 0),
      completedAt,
      dueDate,
      isTemplate: Math.random() > 0.9, // 10% chance of being a template
      templateName: Math.random() > 0.9 ? `${category} Template` : null,
    })
  }

  for (const todo of teamTodosData) {
    await prisma.teamTodo.create({ data: todo })
  }

  console.log('📋 Created 20 team todos')

  // Create comprehensive todo comments (25 entries)
  const teamTodos = await prisma.teamTodo.findMany()
  
  const commentTemplates = [
    'Great progress on this! The implementation looks solid.',
    'I have a few suggestions for improvement. Let\'s discuss in our next standup.',
    'This is ready for review. Please take a look when you have a moment.',
    'I\'ve tested this locally and it works perfectly. Nice work! 🎉',
    'Could we add some unit tests for this functionality?',
    'The design looks good, but I think we should consider accessibility requirements.',
    'This aligns well with our architecture guidelines. Approved!',
    'I found a small bug in the edge case handling. I\'ll create a separate ticket.',
    'Documentation has been updated to reflect these changes.',
    'This feature is now deployed to staging for testing.',
    'The performance impact looks minimal based on our metrics.',
    'Let\'s make sure this is compatible with our mobile app.',
    'I\'ve coordinated with the backend team on the API changes.',
    'The user feedback on this feature has been very positive!',
    'We should consider adding this to our component library.',
  ]

  for (let i = 0; i < 25; i++) {
    const todo = getRandomElement(teamTodos)
    const user = getRandomElement(createdUsers)
    const content = getRandomElement(commentTemplates)
    
    await prisma.todoComment.create({
      data: {
        content,
        teamTodoId: todo.id,
        userId: user.id,
        createdAt: getRandomDate(20, 0),
        isEdited: Math.random() > 0.8, // 20% chance of being edited
        editedAt: Math.random() > 0.8 ? getRandomDate(10, 0) : null,
      }
    })
  }

  console.log('💬 Created 25 todo comments')

  // Create comprehensive time entries (30 entries)
  const personalTodos = await prisma.personalTodo.findMany()
  const allTodos = [...personalTodos, ...teamTodos]
  
  for (let i = 0; i < 30; i++) {
    const isPersonalTodo = Math.random() > 0.4 // 60% team todos, 40% personal todos
    const todo = isPersonalTodo 
      ? getRandomElement(personalTodos)
      : getRandomElement(teamTodos)
    
    const user = isPersonalTodo 
      ? await prisma.user.findUnique({ where: { id: (todo as any).userId } })
      : getRandomElement(createdUsers)
    
    if (!user) continue
    
    const startTime = getRandomDate(30, 0)
    const sessionMinutes = getRandomDuration(15, 240) / 60 // 15 minutes to 4 hours
    const endTime = new Date(startTime.getTime() + sessionMinutes * 60 * 1000)
    const duration = Math.floor(sessionMinutes * 60) // in seconds
    
    const descriptions = [
      'Deep focus work session',
      'Code review and debugging',
      'Research and planning',
      'Implementation and testing',
      'Documentation and cleanup',
      'Meeting and collaboration',
      'Bug fixing and optimization',
      'Feature development',
      'Design and mockup creation',
      'Testing and validation',
    ]
    
    await prisma.timeEntry.create({
      data: {
        startTime,
        endTime,
        duration,
        description: getRandomElement(descriptions),
        personalTodoId: isPersonalTodo ? todo.id : null,
        teamTodoId: !isPersonalTodo ? todo.id : null,
        userId: user.id,
        isManual: Math.random() > 0.7, // 30% manual entries
        source: getRandomElement(['web', 'mobile', 'api']),
        billable: Math.random() > 0.6, // 40% billable
        hourlyRate: Math.random() > 0.6 ? (50 + Math.random() * 100) : null, // $50-$150/hour
        createdAt: startTime,
        updatedAt: endTime,
      }
    })
  }

  console.log('⏰ Created 30 time entries')

  // Create team invitations (5 entries)
  const invitations = [
    {
      email: 'newdev@contextmaster.com',
      teamId: frontendTeam.id,
      inviterId: admin.id,
      role: TeamRole.MEMBER,
      token: 'frontend-invite-token-1',
      message: 'Welcome to our frontend development team! We\'re excited to have you join us for our upcoming React project.',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: InvitationStatus.PENDING,
    },
    {
      email: 'designer.new@contextmaster.com',
      teamId: designTeam.id,
      inviterId: bob.id,
      role: TeamRole.MEMBER,
      token: 'design-invite-token-1',
      message: 'Join our design team to create amazing user experiences!',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: InvitationStatus.PENDING,
    },
    {
      email: 'senior.dev@contextmaster.com',
      teamId: backendTeam.id,
      inviterId: david.id,
      role: TeamRole.ADMIN,
      token: 'backend-admin-invite-token-1',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: InvitationStatus.PENDING,
    },
    {
      email: 'marketer@contextmaster.com',
      teamId: marketingTeam.id,
      inviterId: carol.id,
      role: TeamRole.MEMBER,
      token: 'marketing-invite-token-1',
      message: 'Come help us grow our user base and create compelling marketing campaigns!',
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: InvitationStatus.PENDING,
    },
    {
      email: 'declined@example.com',
      teamId: qaTeam.id,
      inviterId: emma.id,
      role: TeamRole.MEMBER,
      token: 'qa-declined-invite-token-1',
      expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Expired
      status: InvitationStatus.DECLINED,
      respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ]

  for (const invitation of invitations) {
    await prisma.teamInvitation.create({ data: invitation })
  }

  console.log('📧 Created 5 team invitations')

  console.log('🎉 Database seeding completed successfully!')
  
  // Print comprehensive summary
  const counts = {
    users: await prisma.user.count(),
    teams: await prisma.team.count(),
    teamMembers: await prisma.teamMember.count(),
    personalTodos: await prisma.personalTodo.count(),
    teamTodos: await prisma.teamTodo.count(),
    comments: await prisma.todoComment.count(),
    timeEntries: await prisma.timeEntry.count(),
    invitations: await prisma.teamInvitation.count(),
  }

  console.log('\n📊 Comprehensive Database Summary:')
  console.log(`   Users: ${counts.users} (with realistic profiles and timezones)`)
  console.log(`   Teams: ${counts.teams} (covering different departments)`)
  console.log(`   Team Members: ${counts.teamMembers} (with proper role assignments)`)
  console.log(`   Personal Todos: ${counts.personalTodos} (varied statuses and priorities)`)
  console.log(`   Team Todos: ${counts.teamTodos} (with assignments and templates)`)
  console.log(`   Comments: ${counts.comments} (showing team collaboration)`)
  console.log(`   Time Entries: ${counts.timeEntries} (with billable hours and realistic durations)`)
  console.log(`   Invitations: ${counts.invitations} (pending and processed)`)
  
  // Show sample login info
  console.log('\n🔑 Sample Login Credentials (password: password123):')
  console.log('   admin@contextmaster.com - Sarah Chen (Admin)')
  console.log('   alice.johnson@contextmaster.com - Alice Johnson (Frontend Dev)')
  console.log('   bob.smith@contextmaster.com - Bob Smith (Designer)')
  console.log('   carol.davis@contextmaster.com - Carol Davis (Marketing)')
  console.log('   david.wilson@contextmaster.com - David Wilson (DevOps)')
  console.log('   emma.garcia@contextmaster.com - Emma Garcia (QA)')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })