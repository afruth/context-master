# Claude Code Agent Instructions

## Project Context
This is a Next.js 14 application with TypeScript, Prisma (SQLite), NextAuth.js authentication, and Tailwind CSS styling. The project follows modern web development practices with a focus on type safety, accessibility, and maintainable code architecture.

## Essential Instructions

### 📚 Always Check Documentation First
**IMPORTANT**: In the `documentation/` directory, you have important information that could relate to your current task. Always take a look and see if there's anything you might need to consult before implementing new things.

The documentation directory contains:
- **PROJECT.md** - Project purpose and business context
- **ARCHITECTURE.md** - System architecture and technical decisions  
- **TOOLS.md** - Technology stack and tool choices
- **DESIGN.md** - UI/UX guidelines and design system
- **API.md** - API patterns and contracts
- **DEPLOYMENT.md** - Environment and deployment processes

### 🏗️ Follow Directory-Specific Standards
Each major directory has a `CLAUDE.md` file with specific coding standards:
- `prisma/CLAUDE.md` - Database schema conventions
- `src/components/CLAUDE.md` - React component patterns
- `src/components/ui/CLAUDE.md` - UI component architecture with CVA
- `src/app/CLAUDE.md` - Next.js App Router conventions
- `src/app/api/CLAUDE.md` - API route standards
- `src/lib/CLAUDE.md` - Utility function patterns
- `src/types/CLAUDE.md` - TypeScript declaration standards
- `public/CLAUDE.md` - Asset organization guidelines

### 🔍 Development Workflow
1. **Before making changes**: Check relevant documentation and directory CLAUDE.md files
2. **When adding features**: Ensure they align with documented architecture
3. **For UI components**: Follow the established Radix UI + Tailwind + CVA patterns
4. **For database changes**: Follow Prisma conventions and create proper migrations
5. **For API endpoints**: Implement proper authentication, validation, and error handling

### 🛡️ Code Quality Standards
- Write TypeScript with strict typing - avoid `any`, use `unknown` instead
- Use Tailwind CSS for styling with the `cn()` utility for conditional classes
- Implement proper error boundaries and loading states
- Follow accessibility standards (WCAG 2.1 AA)
- Use React.forwardRef for components that need ref forwarding
- Export components as named exports, not default exports

### 🔐 Security Reminders
- Never expose sensitive information in API responses
- Use proper authentication checks in protected routes
- Validate all user inputs
- Keep environment variables secure and never commit them

### 📝 When Updates Are Needed
If you notice documentation that needs updates or find architectural decisions that should be documented, always mention this to the user and suggest specific improvements to keep the project documentation current.