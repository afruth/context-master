# Prisma Directory Rules

## Database Schema Conventions
- **Model Names**: Use PascalCase (e.g., `User`, `Session`, `UserProfile`)
- **Field Names**: Use camelCase (e.g., `userId`, `createdAt`, `emailVerified`)
- **Database Tables**: Prisma automatically converts PascalCase models to snake_case tables

## Required Fields for All Models
- `id`: Use `String @id @default(cuid())` for primary keys
- `createdAt`: Use `DateTime @default(now())`
- `updatedAt`: Use `DateTime @updatedAt`

## Relationships
- Always define both sides of relationships
- Use `onDelete: Cascade` for parent-child relationships
- Use `onDelete: SetNull` for optional relationships
- Name foreign key fields with suffix `Id` (e.g., `userId`, `postId`)

## Migration Best Practices
- Run `npx prisma migrate dev --name descriptive_name` for development
- Always review generated SQL before applying
- Use descriptive migration names (e.g., `add_user_profile_table`, `update_session_expiry`)
- Never edit existing migrations - create new ones for changes

## Indexing Guidelines
- Add `@@index` for frequently queried fields
- Use `@@unique` for compound unique constraints
- Consider database performance when designing schemas

## Data Types
- Use `String` for text fields (maps to VARCHAR)
- Use `DateTime` for timestamps
- Use `Boolean` for true/false values
- Use `Int` for integers, `Float` for decimals
- Use `Json` sparingly and only when necessary

## Environment Variables
- Database URL should be in `.env` file
- Use `DATABASE_URL` for the connection string
- Never commit `.env` files to version control