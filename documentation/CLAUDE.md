# Documentation Directory Guidelines

## Purpose & Overview
This directory contains high-level project documentation that provides context, architecture decisions, and strategic information about the entire project. Unlike directory-specific CLAUDE.md files (which contain coding standards), this documentation explains **what** the project does and **why** it's built this way.

## When to Read Documentation
**ALWAYS** read relevant documentation files before:
- Making significant architectural changes
- Adding new features or major functionality
- Refactoring large portions of code
- Making decisions about technology choices
- Understanding project purpose and goals

## Documentation Structure
- **PROJECT.md** - Project overview, purpose, goals, and business context
- **ARCHITECTURE.md** - High-level system design, data flow, and architectural decisions
- **TOOLS.md** - Development tools, services, dependencies, and rationale for choices
- **DESIGN.md** - UI/UX design principles, design system, and visual guidelines
- **API.md** - API contracts, endpoints, and integration patterns
- **DEPLOYMENT.md** - Deployment processes, infrastructure, and environment setup

## How to Use This Documentation

### 1. Start with Context
- Read PROJECT.md to understand the business purpose
- Review ARCHITECTURE.md for technical context
- Check TOOLS.md for technology decisions

### 2. Reference Before Changes
- Consult documentation before proposing changes
- Ensure changes align with documented architecture
- Update documentation when making structural changes

### 3. Maintain Documentation
- Keep documentation synchronized with code changes
- Suggest updates when you notice outdated information
- Add new sections when introducing new concepts

## Guidelines for Agents

### Reading Documentation
- **Scan first**: Quickly review relevant docs for context
- **Reference during**: Consult docs when making decisions
- **Validate against**: Ensure code changes align with documented patterns

### Suggesting Updates
When you notice documentation that needs updates:
1. Point out the discrepancy to the user
2. Suggest specific changes to keep docs current
3. Explain how the change affects the broader system

### Creating New Documentation
When adding new features or concepts:
- Identify which documentation files need updates
- Suggest new documentation sections if needed
- Ensure documentation explains both "what" and "why"

## Documentation vs Code
- **Documentation**: Explains purpose, decisions, and high-level design
- **Code**: Shows implementation details and specific logic
- **CLAUDE.md files**: Contain coding standards and technical patterns
- **Comments**: Explain complex logic within specific code blocks

## Best Practices
- Keep documentation up-to-date with major changes
- Write for humans who need to understand the project
- Focus on "why" decisions were made, not just "what" was built
- Use diagrams and examples where helpful
- Link between related documentation sections