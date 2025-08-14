import { PrismaClient, TeamRole, Priority, TodoStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

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

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      username: 'admin',
      password: hashedPassword,
      timezone: 'America/New_York',
      theme: 'dark',
      notifications: true,
      language: 'en',
    }
  })

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      name: 'Alice Johnson',
      username: 'alice',
      password: hashedPassword,
      timezone: 'America/Los_Angeles',
      theme: 'light',
      notifications: true,
      language: 'en',
    }
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      name: 'Bob Smith',
      username: 'bob',
      password: hashedPassword,
      timezone: 'Europe/London',
      theme: 'system',
      notifications: false,
      language: 'en',
    }
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'user3@example.com',
      name: 'Carol Davis',
      username: 'carol',
      password: hashedPassword,
      timezone: 'Asia/Tokyo',
      theme: 'light',
      notifications: true,
      language: 'en',
    }
  })

  console.log('👥 Created users')

  // Create teams
  const devTeam = await prisma.team.create({
    data: {
      name: 'Development Team',
      description: 'Main development team for building awesome products',
      slug: 'dev-team',
      color: '#06b6d4',
      isPublic: false,
      allowGuestInvites: false,
      requireApproval: true,
      maxMembers: 10,
      ownerId: adminUser.id,
    }
  })

  const marketingTeam = await prisma.team.create({
    data: {
      name: 'Marketing Team',
      description: 'Creative marketing and growth team',
      slug: 'marketing-team',
      color: '#ec4899',
      isPublic: true,
      allowGuestInvites: true,
      requireApproval: false,
      ownerId: user1.id,
    }
  })

  const designTeam = await prisma.team.create({
    data: {
      name: 'Design Team',
      description: 'User experience and visual design team',
      slug: 'design-team',
      color: '#8b5cf6',
      isPublic: false,
      allowGuestInvites: false,
      requireApproval: true,
      maxMembers: 5,
      ownerId: user2.id,
    }
  })

  console.log('🏢 Created teams')

  // Create team memberships
  const memberships = [
    // Admin is owner of dev team
    { teamId: devTeam.id, userId: adminUser.id, role: TeamRole.OWNER },
    // Alice is member of dev team and owner of marketing team
    { teamId: devTeam.id, userId: user1.id, role: TeamRole.ADMIN, invitedById: adminUser.id },
    { teamId: marketingTeam.id, userId: user1.id, role: TeamRole.OWNER },
    // Bob is member of dev team and owner of design team
    { teamId: devTeam.id, userId: user2.id, role: TeamRole.MEMBER, invitedById: adminUser.id },
    { teamId: designTeam.id, userId: user2.id, role: TeamRole.OWNER },
    // Carol is member of marketing and design teams
    { teamId: marketingTeam.id, userId: user3.id, role: TeamRole.MEMBER, invitedById: user1.id },
    { teamId: designTeam.id, userId: user3.id, role: TeamRole.ADMIN, invitedById: user2.id },
  ]

  for (const membership of memberships) {
    await prisma.teamMember.create({
      data: membership
    })
  }

  console.log('🤝 Created team memberships')

  // Create personal todos
  const personalTodos = [
    {
      title: 'Set up development environment',
      description: '## Setup Tasks\n\n- Install Node.js and npm\n- Clone repository\n- Install dependencies\n- Configure environment variables\n- Run database migrations',
      status: TodoStatus.COMPLETED,
      priority: Priority.HIGH,
      category: 'Development',
      tags: JSON.stringify(['setup', 'development', 'onboarding']),
      color: '#10b981',
      estimatedMinutes: 120,
      actualMinutes: 90,
      userId: adminUser.id,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      title: 'Review project documentation',
      description: 'Go through all the project docs to understand the architecture and requirements.',
      status: TodoStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      category: 'Learning',
      tags: JSON.stringify(['documentation', 'learning', 'project']),
      color: '#3b82f6',
      estimatedMinutes: 60,
      userId: user1.id,
    },
    {
      title: 'Prepare for team meeting',
      description: 'Prepare agenda and materials for the upcoming team retrospective.',
      status: TodoStatus.TODO,
      priority: Priority.HIGH,
      category: 'Management',
      tags: JSON.stringify(['meeting', 'retrospective', 'team']),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      userId: user1.id,
    },
    {
      title: 'Update portfolio website',
      description: 'Add latest projects and update bio section.',
      status: TodoStatus.TODO,
      priority: Priority.LOW,
      category: 'Personal',
      tags: JSON.stringify(['portfolio', 'website', 'personal']),
      color: '#f59e0b',
      estimatedMinutes: 180,
      userId: user2.id,
    },
    {
      title: 'Learn new design tool',
      description: 'Explore Figma advanced features for better collaboration.',
      status: TodoStatus.TODO,
      priority: Priority.MEDIUM,
      category: 'Learning',
      tags: JSON.stringify(['design', 'tools', 'figma', 'learning']),
      userId: user3.id,
    },
  ]

  for (const todo of personalTodos) {
    await prisma.personalTodo.create({ data: todo })
  }

  console.log('✅ Created personal todos')

  // Create team todos
  const teamTodos = [
    {
      title: 'Implement user authentication',
      description: '## Authentication Features\n\n- Set up NextAuth.js\n- Configure providers (email, Google)\n- Add login/logout flows\n- Implement middleware protection\n- Add user session management',
      status: TodoStatus.COMPLETED,
      priority: Priority.HIGH,
      category: 'Backend',
      tags: JSON.stringify(['auth', 'nextauth', 'security', 'backend']),
      color: '#ef4444',
      estimatedMinutes: 480,
      actualMinutes: 420,
      teamId: devTeam.id,
      assigneeId: adminUser.id,
      createdById: adminUser.id,
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      title: 'Design user dashboard layout',
      description: 'Create wireframes and high-fidelity designs for the main user dashboard.',
      status: TodoStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      category: 'Design',
      tags: JSON.stringify(['design', 'dashboard', 'ux', 'wireframes']),
      color: '#8b5cf6',
      estimatedMinutes: 240,
      teamId: devTeam.id,
      assigneeId: user2.id,
      createdById: user1.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment.',
      status: TodoStatus.TODO,
      priority: Priority.MEDIUM,
      category: 'DevOps',
      tags: JSON.stringify(['ci-cd', 'github-actions', 'deployment', 'automation']),
      estimatedMinutes: 360,
      teamId: devTeam.id,
      assigneeId: adminUser.id,
      createdById: adminUser.id,
    },
    {
      title: 'Write API documentation',
      description: 'Document all API endpoints with examples and response schemas.',
      status: TodoStatus.TODO,
      priority: Priority.MEDIUM,
      category: 'Documentation',
      tags: JSON.stringify(['api', 'documentation', 'openapi', 'swagger']),
      estimatedMinutes: 180,
      teamId: devTeam.id,
      assigneeId: user1.id,
      createdById: adminUser.id,
    },
    {
      title: 'Create brand guidelines',
      description: 'Establish consistent brand identity, colors, typography, and usage guidelines.',
      status: TodoStatus.COMPLETED,
      priority: Priority.HIGH,
      category: 'Branding',
      tags: JSON.stringify(['branding', 'guidelines', 'identity', 'design']),
      color: '#ec4899',
      estimatedMinutes: 300,
      actualMinutes: 280,
      teamId: marketingTeam.id,
      assigneeId: user3.id,
      createdById: user1.id,
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      title: 'Launch social media campaign',
      description: '## Campaign Strategy\n\n- Create content calendar\n- Design social media posts\n- Schedule posts across platforms\n- Monitor engagement and analytics',
      status: TodoStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      category: 'Marketing',
      tags: JSON.stringify(['social-media', 'campaign', 'content', 'marketing']),
      color: '#06b6d4',
      estimatedMinutes: 480,
      teamId: marketingTeam.id,
      assigneeId: user1.id,
      createdById: user1.id,
    },
    {
      title: 'Design system components',
      description: 'Create reusable UI components library with Storybook documentation.',
      status: TodoStatus.TODO,
      priority: Priority.HIGH,
      category: 'Design System',
      tags: JSON.stringify(['design-system', 'components', 'storybook', 'ui']),
      estimatedMinutes: 600,
      teamId: designTeam.id,
      assigneeId: user2.id,
      createdById: user2.id,
      isTemplate: true,
      templateName: 'Component Creation Template',
    },
  ]

  for (const todo of teamTodos) {
    await prisma.teamTodo.create({ data: todo })
  }

  console.log('📋 Created team todos')

  // Create some todo comments
  const teamTodoIds = await prisma.teamTodo.findMany({
    select: { id: true },
    take: 3
  })

  const comments = [
    {
      content: 'Great work on the authentication flow! The middleware protection is working perfectly.',
      teamTodoId: teamTodoIds[0].id,
      userId: user1.id,
    },
    {
      content: 'I have some ideas for the dashboard layout. Let\'s discuss in the next standup.',
      teamTodoId: teamTodoIds[1]?.id || teamTodoIds[0].id,
      userId: adminUser.id,
    },
    {
      content: 'The brand guidelines look amazing! 🎨 This will really help maintain consistency.',
      teamTodoId: teamTodoIds[2]?.id || teamTodoIds[0].id,
      userId: user2.id,
    },
  ]

  for (const comment of comments) {
    await prisma.todoComment.create({ data: comment })
  }

  console.log('💬 Created todo comments')

  // Create some time entries
  const completedPersonalTodo = await prisma.personalTodo.findFirst({
    where: { status: TodoStatus.COMPLETED }
  })

  const completedTeamTodo = await prisma.teamTodo.findFirst({
    where: { status: TodoStatus.COMPLETED }
  })

  const timeEntries = [
    // Time entries for completed personal todo
    ...(completedPersonalTodo ? [
      {
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
        duration: 2 * 60 * 60, // 2 hours in seconds
        description: 'Initial environment setup and configuration',
        personalTodoId: completedPersonalTodo.id,
        userId: completedPersonalTodo.userId,
        isManual: false,
        source: 'web',
        billable: false,
      },
      {
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 minutes later
        duration: 30 * 60, // 30 minutes in seconds
        description: 'Final testing and documentation',
        personalTodoId: completedPersonalTodo.id,
        userId: completedPersonalTodo.userId,
        isManual: false,
        source: 'web',
        billable: false,
      },
    ] : []),
    // Time entries for completed team todo
    ...(completedTeamTodo ? [
      {
        startTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        endTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
        duration: 4 * 60 * 60, // 4 hours in seconds
        description: 'NextAuth.js setup and configuration',
        teamTodoId: completedTeamTodo.id,
        userId: completedTeamTodo.assigneeId || completedTeamTodo.createdById,
        isManual: false,
        source: 'web',
        billable: true,
        hourlyRate: 75.0,
      },
      {
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
        duration: 3 * 60 * 60, // 3 hours in seconds
        description: 'Testing and middleware implementation',
        teamTodoId: completedTeamTodo.id,
        userId: completedTeamTodo.assigneeId || completedTeamTodo.createdById,
        isManual: false,
        source: 'web',
        billable: true,
        hourlyRate: 75.0,
      },
    ] : []),
  ]

  for (const entry of timeEntries) {
    await prisma.timeEntry.create({ data: entry })
  }

  console.log('⏰ Created time entries')

  // Create some team invitations
  const invitations = [
    {
      email: 'newuser1@example.com',
      teamId: devTeam.id,
      inviterId: adminUser.id,
      role: TeamRole.MEMBER,
      token: 'dev-team-invite-token-1',
      message: 'Welcome to our development team! We\'re excited to have you join us.',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      email: 'designer@example.com',
      teamId: designTeam.id,
      inviterId: user2.id,
      role: TeamRole.MEMBER,
      token: 'design-team-invite-token-1',
      message: 'Join our design team to create amazing user experiences!',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
    {
      email: 'marketer@example.com',
      teamId: marketingTeam.id,
      inviterId: user1.id,
      role: TeamRole.ADMIN,
      token: 'marketing-team-invite-token-1',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
  ]

  for (const invitation of invitations) {
    await prisma.teamInvitation.create({ data: invitation })
  }

  console.log('📧 Created team invitations')

  console.log('🎉 Database seeding completed successfully!')
  
  // Print summary
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

  console.log('\n📊 Database Summary:')
  console.log(`   Users: ${counts.users}`)
  console.log(`   Teams: ${counts.teams}`)
  console.log(`   Team Members: ${counts.teamMembers}`)
  console.log(`   Personal Todos: ${counts.personalTodos}`)
  console.log(`   Team Todos: ${counts.teamTodos}`)
  console.log(`   Comments: ${counts.comments}`)
  console.log(`   Time Entries: ${counts.timeEntries}`)
  console.log(`   Invitations: ${counts.invitations}`)
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