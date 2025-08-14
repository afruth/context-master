-- ContextMaster Database Seed SQL
-- This file contains comprehensive demo data for the ContextMaster collaborative todo application
-- Execute this file against your SQLite database to populate it with realistic demo data
-- 
-- Usage: sqlite3 prisma/dev.db < prisma/seed.sql
-- 
-- NOTE: This will CLEAR all existing data before inserting demo data

-- Clear existing data (in correct dependency order)
DELETE FROM time_entries;
DELETE FROM todo_comments;
DELETE FROM team_todos;
DELETE FROM personal_todos;
DELETE FROM team_invitations;
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM sessions;
DELETE FROM users;

-- Reset SQLite sequences
DELETE FROM sqlite_sequence;

-- Insert Users (password: password123, hashed with bcryptjs)
INSERT INTO users (id, email, username, password, name, timezone, theme, notifications, language, lastLoginAt, createdAt, updatedAt) VALUES
('usr_admin_001', 'admin@contextmaster.com', 'sarah_admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Chen', 'America/New_York', 'dark', 1, 'en', datetime('now', '-2 hours'), datetime('now', '-30 days'), datetime('now')),
('usr_alice_002', 'alice.johnson@contextmaster.com', 'alice_dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alice Johnson', 'America/Los_Angeles', 'light', 1, 'en', datetime('now', '-30 minutes'), datetime('now', '-25 days'), datetime('now')),
('usr_bob_003', 'bob.smith@contextmaster.com', 'bob_designer', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob Smith', 'Europe/London', 'system', 0, 'en', datetime('now', '-4 hours'), datetime('now', '-20 days'), datetime('now')),
('usr_carol_004', 'carol.davis@contextmaster.com', 'carol_marketing', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carol Davis', 'Asia/Tokyo', 'light', 1, 'en', datetime('now', '-1 hour'), datetime('now', '-18 days'), datetime('now')),
('usr_david_005', 'david.wilson@contextmaster.com', 'david_devops', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David Wilson', 'Australia/Sydney', 'dark', 1, 'en', datetime('now', '-6 hours'), datetime('now', '-15 days'), datetime('now')),
('usr_emma_006', 'emma.garcia@contextmaster.com', 'emma_qa', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emma Garcia', 'America/Chicago', 'system', 1, 'en', datetime('now', '-3 hours'), datetime('now', '-12 days'), datetime('now'));

-- Insert Teams
INSERT INTO teams (id, name, description, slug, color, isPublic, allowGuestInvites, requireApproval, maxMembers, ownerId, createdAt, updatedAt) VALUES
('team_frontend_001', 'Frontend Development', 'React, Next.js, and modern frontend development team', 'frontend-dev', '#06b6d4', 0, 0, 1, 8, 'usr_admin_001', datetime('now', '-25 days'), datetime('now')),
('team_backend_002', 'Backend & DevOps', 'API development, infrastructure, and DevOps team', 'backend-devops', '#10b981', 0, 1, 0, 6, 'usr_david_005', datetime('now', '-20 days'), datetime('now')),
('team_design_003', 'Design & UX', 'User experience, visual design, and research team', 'design-ux', '#8b5cf6', 0, 0, 1, 5, 'usr_bob_003', datetime('now', '-18 days'), datetime('now')),
('team_marketing_004', 'Marketing & Growth', 'Marketing campaigns, growth hacking, and analytics team', 'marketing-growth', '#ec4899', 1, 1, 0, NULL, 'usr_carol_004', datetime('now', '-15 days'), datetime('now')),
('team_qa_005', 'Quality Assurance', 'Testing, quality assurance, and release management team', 'quality-assurance', '#f59e0b', 0, 0, 1, 4, 'usr_emma_006', datetime('now', '-12 days'), datetime('now'));

-- Insert Team Members
INSERT INTO team_members (id, teamId, userId, role, joinedAt, updatedAt, lastActiveAt, invitedById, notifications, emailDigest) VALUES
-- Admin memberships
('member_001', 'team_frontend_001', 'usr_admin_001', 'OWNER', datetime('now', '-25 days'), datetime('now'), datetime('now', '-1 day'), NULL, 1, 1),
('member_002', 'team_backend_002', 'usr_admin_001', 'ADMIN', datetime('now', '-20 days'), datetime('now'), datetime('now', '-2 days'), 'usr_david_005', 1, 1),
-- Alice memberships
('member_003', 'team_frontend_001', 'usr_alice_002', 'ADMIN', datetime('now', '-24 days'), datetime('now'), datetime('now', '-6 hours'), 'usr_admin_001', 1, 1),
('member_004', 'team_qa_005', 'usr_alice_002', 'MEMBER', datetime('now', '-10 days'), datetime('now'), datetime('now', '-1 day'), 'usr_emma_006', 1, 1),
-- Bob memberships
('member_005', 'team_design_003', 'usr_bob_003', 'OWNER', datetime('now', '-18 days'), datetime('now'), datetime('now', '-3 hours'), NULL, 0, 1),
('member_006', 'team_frontend_001', 'usr_bob_003', 'MEMBER', datetime('now', '-16 days'), datetime('now'), datetime('now', '-5 hours'), 'usr_admin_001', 0, 1),
-- Carol memberships
('member_007', 'team_marketing_004', 'usr_carol_004', 'OWNER', datetime('now', '-15 days'), datetime('now'), datetime('now', '-2 hours'), NULL, 1, 1),
-- David memberships
('member_008', 'team_backend_002', 'usr_david_005', 'OWNER', datetime('now', '-20 days'), datetime('now'), datetime('now', '-4 hours'), NULL, 1, 1),
('member_009', 'team_frontend_001', 'usr_david_005', 'MEMBER', datetime('now', '-18 days'), datetime('now'), datetime('now', '-8 hours'), 'usr_admin_001', 1, 0),
-- Emma memberships
('member_010', 'team_qa_005', 'usr_emma_006', 'OWNER', datetime('now', '-12 days'), datetime('now'), datetime('now', '-1 hour'), NULL, 1, 1),
('member_011', 'team_frontend_001', 'usr_emma_006', 'MEMBER', datetime('now', '-12 days'), datetime('now'), datetime('now', '-3 hours'), 'usr_admin_001', 1, 1),
('member_012', 'team_backend_002', 'usr_emma_006', 'MEMBER', datetime('now', '-10 days'), datetime('now'), datetime('now', '-5 hours'), 'usr_david_005', 1, 1),
('member_013', 'team_design_003', 'usr_emma_006', 'MEMBER', datetime('now', '-8 days'), datetime('now'), datetime('now', '-6 hours'), 'usr_bob_003', 1, 1);

-- Insert Personal Todos (20 entries with varied statuses, priorities, and categories)
INSERT INTO personal_todos (id, title, description, status, priority, dueDate, category, tags, color, estimatedMinutes, actualMinutes, userId, createdAt, updatedAt, completedAt) VALUES
('ptodo_001', 'Development: Implement new feature according...', '## Development Task

Implement new feature according to specifications

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'COMPLETED', 'HIGH', datetime('now', '+5 days'), 'Development', '["development", "personal", "feature"]', '#3b82f6', 180, 165, 'usr_admin_001', datetime('now', '-15 days'), datetime('now', '-2 days'), datetime('now', '-2 days')),

('ptodo_002', 'Design: Create wireframes for new...', '## Design Task

Create wireframes for new user flow

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'IN_PROGRESS', 'MEDIUM', NULL, 'Design', '["design", "personal", "improvement"]', '#8b5cf6', 120, NULL, 'usr_bob_003', datetime('now', '-12 days'), datetime('now', '-1 day'), NULL),

('ptodo_003', 'Marketing: Plan and execute social...', '## Marketing Task

Plan and execute social media campaign

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'TODO', 'LOW', datetime('now', '+10 days'), 'Marketing', '["marketing", "personal", "urgent"]', '#ec4899', 240, NULL, 'usr_carol_004', datetime('now', '-8 days'), datetime('now', '-1 day'), NULL),

('ptodo_004', 'Testing: Create comprehensive test suite...', '## Testing Task

Create comprehensive test suite for new features

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'COMPLETED', 'HIGH', NULL, 'Testing', '["testing", "personal", "bug"]', '#f59e0b', 150, 140, 'usr_emma_006', datetime('now', '-20 days'), datetime('now', '-5 days'), datetime('now', '-5 days')),

('ptodo_005', 'DevOps: Set up monitoring and...', '## DevOps Task

Set up monitoring and alerting systems

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'IN_PROGRESS', 'URGENT', datetime('now', '+3 days'), 'DevOps', '["devops", "personal", "feature"]', '#10b981', 300, NULL, 'usr_david_005', datetime('now', '-10 days'), datetime('now'), NULL),

('ptodo_006', 'Documentation: Write comprehensive API...', '## Documentation Task

Write comprehensive API documentation

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'TODO', 'MEDIUM', NULL, 'Documentation', '["documentation", "personal", "improvement"]', '#ef4444', 90, NULL, 'usr_alice_002', datetime('now', '-6 days'), datetime('now', '-1 day'), NULL),

('ptodo_007', 'Research: Conduct user research and...', '## Research Task

Conduct user research and create personas

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'CANCELLED', 'LOW', datetime('now', '-2 days'), 'Research', '["research", "personal", "urgent"]', '#3b82f6', 180, NULL, 'usr_bob_003', datetime('now', '-25 days'), datetime('now', '-3 days'), NULL),

('ptodo_008', 'Planning: Update project README and...', '## Planning Task

Update project README and setup instructions

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'COMPLETED', 'MEDIUM', NULL, 'Planning', '["planning", "personal", "bug"]', '#8b5cf6', 60, 75, 'usr_admin_001', datetime('now', '-18 days'), datetime('now', '-7 days'), datetime('now', '-7 days')),

-- Continue with more personal todos for variety...
('ptodo_009', 'Review: Code review and debugging...', '## Review Task

Code review and debugging session

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'IN_PROGRESS', 'HIGH', datetime('now', '+2 days'), 'Review', '["review", "personal", "feature"]', '#ec4899', 120, NULL, 'usr_alice_002', datetime('now', '-5 days'), datetime('now'), NULL),

('ptodo_010', 'Maintenance: Optimize database queries for...', '## Maintenance Task

Optimize database queries for better performance

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'TODO', 'URGENT', datetime('now', '+1 day'), 'Maintenance', '["maintenance", "personal", "improvement"]', '#f59e0b', 200, NULL, 'usr_david_005', datetime('now', '-3 days'), datetime('now'), NULL),

('ptodo_011', 'Development: Fix reported bug in...', '## Development Task

Fix reported bug in production environment

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'COMPLETED', 'URGENT', NULL, 'Development', '["development", "personal", "urgent"]', '#ef4444', 90, 85, 'usr_alice_002', datetime('now', '-22 days'), datetime('now', '-10 days'), datetime('now', '-10 days')),

('ptodo_012', 'Design: Design responsive mobile layouts...', '## Design Task

Design responsive mobile layouts

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'TODO', 'MEDIUM', datetime('now', '+7 days'), 'Design', '["design", "personal", "feature"]', '#8b5cf6', 240, NULL, 'usr_bob_003', datetime('now', '-7 days'), datetime('now', '-1 day'), NULL),

('ptodo_013', 'Marketing: Analyze conversion metrics and...', '## Marketing Task

Analyze conversion metrics and user behavior

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'IN_PROGRESS', 'HIGH', NULL, 'Marketing', '["marketing", "personal", "bug"]', '#ec4899', 150, NULL, 'usr_carol_004', datetime('now', '-9 days'), datetime('now', '-2 days'), NULL),

('ptodo_014', 'Testing: Perform manual testing on...', '## Testing Task

Perform manual testing on staging environment

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'COMPLETED', 'MEDIUM', NULL, 'Testing', '["testing", "personal", "improvement"]', '#f59e0b', 180, 190, 'usr_emma_006', datetime('now', '-16 days'), datetime('now', '-8 days'), datetime('now', '-8 days')),

('ptodo_015', 'DevOps: Configure automated deployment pipeline...', '## DevOps Task

Configure automated deployment pipeline

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'TODO', 'HIGH', datetime('now', '+4 days'), 'DevOps', '["devops", "personal", "urgent"]', '#10b981', 360, NULL, 'usr_david_005', datetime('now', '-4 days'), datetime('now'), NULL),

('ptodo_016', 'Documentation: Create user guides and...', '## Documentation Task

Create user guides and tutorials

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'IN_PROGRESS', 'LOW', NULL, 'Documentation', '["documentation", "personal", "feature"]', '#3b82f6', 120, NULL, 'usr_alice_002', datetime('now', '-11 days'), datetime('now', '-1 day'), NULL),

('ptodo_017', 'Research: Document architectural decisions and...', '## Research Task

Document architectural decisions and patterns

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'TODO', 'MEDIUM', datetime('now', '+6 days'), 'Research', '["research", "personal", "bug"]', '#8b5cf6', 90, NULL, 'usr_admin_001', datetime('now', '-13 days'), datetime('now', '-2 days'), NULL),

('ptodo_018', 'Planning: Create troubleshooting guides for...', '## Planning Task

Create troubleshooting guides for common issues

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'COMPLETED', 'LOW', NULL, 'Planning', '["planning", "personal", "improvement"]', '#ec4899', 75, 80, 'usr_bob_003', datetime('now', '-19 days'), datetime('now', '-6 days'), datetime('now', '-6 days')),

('ptodo_019', 'Review: Set up automated integration...', '## Review Task

Set up automated integration tests

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'IN_PROGRESS', 'HIGH', datetime('now', '+8 days'), 'Review', '["review", "personal", "urgent"]', '#f59e0b', 210, NULL, 'usr_emma_006', datetime('now', '-14 days'), datetime('now'), NULL),

('ptodo_020', 'Maintenance: Review and update existing...', '## Maintenance Task

Review and update existing test cases

### Acceptance Criteria
- [ ] Complete implementation
- [ ] Add tests
- [ ] Update documentation', 'TODO', 'MEDIUM', NULL, 'Maintenance', '["maintenance", "personal", "feature"]', '#ef4444', 135, NULL, 'usr_carol_004', datetime('now', '-2 days'), datetime('now'), NULL);

-- Insert Team Todos (20 entries with assignments and realistic team context)
INSERT INTO team_todos (id, title, description, status, priority, dueDate, teamId, assigneeId, createdById, category, tags, color, estimatedMinutes, actualMinutes, createdAt, updatedAt, completedAt, isTemplate, templateName) VALUES
('ttodo_001', '[Frontend Development] Development: Implement new feature...', '## Development Task for Frontend Development

Implement new feature according to specifications

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'COMPLETED', 'HIGH', NULL, 'team_frontend_001', 'usr_alice_002', 'usr_admin_001', 'Development', '["development", "frontend-dev", "sprint"]', '#06b6d4', 480, 450, datetime('now', '-30 days'), datetime('now', '-12 days'), datetime('now', '-12 days'), 0, NULL),

('ttodo_002', '[Backend & DevOps] DevOps: Set up monitoring...', '## DevOps Task for Backend & DevOps

Set up monitoring and alerting systems

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'IN_PROGRESS', 'URGENT', datetime('now', '+5 days'), 'team_backend_002', 'usr_david_005', 'usr_admin_001', 'DevOps', '["devops", "backend-devops", "epic"]', '#10b981', 360, NULL, datetime('now', '-25 days'), datetime('now', '-1 day'), NULL, 0, NULL),

('ttodo_003', '[Design & UX] Design: Create wireframes for...', '## Design Task for Design & UX

Create wireframes for new user flow

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'TODO', 'MEDIUM', datetime('now', '+10 days'), 'team_design_003', 'usr_bob_003', 'usr_bob_003', 'Design', '["design", "design-ux", "story"]', '#8b5cf6', 240, NULL, datetime('now', '-20 days'), datetime('now', '-3 days'), NULL, 1, 'Design Template'),

('ttodo_004', '[Marketing & Growth] Marketing: Plan and execute...', '## Marketing Task for Marketing & Growth

Plan and execute social media campaign

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'COMPLETED', 'HIGH', NULL, 'team_marketing_004', 'usr_carol_004', 'usr_carol_004', 'Marketing', '["marketing", "marketing-growth", "task"]', '#ec4899', 300, 280, datetime('now', '-35 days'), datetime('now', '-15 days'), datetime('now', '-15 days'), 0, NULL),

('ttodo_005', '[Quality Assurance] Testing: Create comprehensive test...', '## Testing Task for Quality Assurance

Create comprehensive test suite for new features

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'IN_PROGRESS', 'HIGH', datetime('now', '+3 days'), 'team_qa_005', 'usr_emma_006', 'usr_alice_002', 'Testing', '["testing", "quality-assurance", "sprint"]', '#f59e0b', 420, NULL, datetime('now', '-18 days'), datetime('now'), NULL, 0, NULL),

('ttodo_006', '[Frontend Development] Review: Code review and...', '## Review Task for Frontend Development

Code review and debugging session

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'TODO', 'MEDIUM', datetime('now', '+7 days'), 'team_frontend_001', 'usr_bob_003', 'usr_admin_001', 'Review', '["review", "frontend-dev", "epic"]', '#06b6d4', 180, NULL, datetime('now', '-15 days'), datetime('now', '-2 days'), NULL, 0, NULL),

('ttodo_007', '[Backend & DevOps] Development: Fix reported bug...', '## Development Task for Backend & DevOps

Fix reported bug in production environment

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'COMPLETED', 'URGENT', NULL, 'team_backend_002', 'usr_admin_001', 'usr_david_005', 'Development', '["development", "backend-devops", "story"]', '#10b981', 120, 135, datetime('now', '-40 days'), datetime('now', '-20 days'), datetime('now', '-20 days'), 0, NULL),

('ttodo_008', '[Design & UX] Research: Conduct user research...', '## Research Task for Design & UX

Conduct user research and create personas

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'IN_PROGRESS', 'MEDIUM', NULL, 'team_design_003', 'usr_emma_006', 'usr_bob_003', 'Research', '["research", "design-ux", "task"]', '#8b5cf6', 360, NULL, datetime('now', '-22 days'), datetime('now', '-1 day'), NULL, 0, NULL),

('ttodo_009', '[Marketing & Growth] Documentation: Write comprehensive API...', '## Documentation Task for Marketing & Growth

Write comprehensive API documentation

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'TODO', 'LOW', datetime('now', '+14 days'), 'team_marketing_004', NULL, 'usr_carol_004', 'Documentation', '["documentation", "marketing-growth", "sprint"]', '#ec4899', 200, NULL, datetime('now', '-12 days'), datetime('now', '-4 days'), NULL, 0, NULL),

('ttodo_010', '[Quality Assurance] Maintenance: Optimize database queries...', '## Maintenance Task for Quality Assurance

Optimize database queries for better performance

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'CANCELLED', 'LOW', datetime('now', '-5 days'), 'team_qa_005', 'usr_alice_002', 'usr_emma_006', 'Maintenance', '["maintenance", "quality-assurance", "epic"]', '#f59e0b', 300, NULL, datetime('now', '-28 days'), datetime('now', '-8 days'), NULL, 0, NULL),

-- Continue with more team todos...
('ttodo_011', '[Frontend Development] Planning: Update project README...', '## Planning Task for Frontend Development

Update project README and setup instructions

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'COMPLETED', 'MEDIUM', NULL, 'team_frontend_001', 'usr_david_005', 'usr_alice_002', 'Planning', '["planning", "frontend-dev", "story"]', '#06b6d4', 90, 100, datetime('now', '-33 days'), datetime('now', '-18 days'), datetime('now', '-18 days'), 0, NULL),

('ttodo_012', '[Backend & DevOps] Testing: Perform manual testing...', '## Testing Task for Backend & DevOps

Perform manual testing on staging environment

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'IN_PROGRESS', 'HIGH', datetime('now', '+2 days'), 'team_backend_002', 'usr_emma_006', 'usr_david_005', 'Testing', '["testing", "backend-devops", "task"]', '#10b981', 240, NULL, datetime('now', '-16 days'), datetime('now'), NULL, 0, NULL),

('ttodo_013', '[Design & UX] Development: Refactor legacy code...', '## Development Task for Design & UX

Refactor legacy code for better maintainability

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'TODO', 'MEDIUM', datetime('now', '+12 days'), 'team_design_003', 'usr_bob_003', 'usr_emma_006', 'Development', '["development", "design-ux", "sprint"]', '#8b5cf6', 480, NULL, datetime('now', '-10 days'), datetime('now', '-1 day'), NULL, 0, NULL),

('ttodo_014', '[Marketing & Growth] Review: Design promotional materials...', '## Review Task for Marketing & Growth

Design promotional materials for product launch

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'COMPLETED', 'HIGH', NULL, 'team_marketing_004', 'usr_carol_004', 'usr_carol_004', 'Review', '["review", "marketing-growth", "epic"]', '#ec4899', 360, 340, datetime('now', '-26 days'), datetime('now', '-14 days'), datetime('now', '-14 days'), 0, NULL),

('ttodo_015', '[Quality Assurance] DevOps: Configure automated deployment...', '## DevOps Task for Quality Assurance

Configure automated deployment pipeline

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'TODO', 'URGENT', datetime('now', '+1 day'), 'team_qa_005', 'usr_david_005', 'usr_emma_006', 'DevOps', '["devops", "quality-assurance", "story"]', '#f59e0b', 420, NULL, datetime('now', '-8 days'), datetime('now', '-2 days'), NULL, 1, NULL),

('ttodo_016', '[Frontend Development] Design: Update brand guidelines...', '## Design Task for Frontend Development

Update brand guidelines and style guide

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'IN_PROGRESS', 'LOW', NULL, 'team_frontend_001', 'usr_bob_003', 'usr_admin_001', 'Design', '["design", "frontend-dev", "task"]', '#06b6d4', 180, NULL, datetime('now', '-24 days'), datetime('now', '-3 days'), NULL, 0, NULL),

('ttodo_017', '[Backend & DevOps] Documentation: Create user guides...', '## Documentation Task for Backend & DevOps

Create user guides and tutorials

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'COMPLETED', 'MEDIUM', NULL, 'team_backend_002', 'usr_alice_002', 'usr_david_005', 'Documentation', '["documentation", "backend-devops", "sprint"]', '#10b981', 150, 160, datetime('now', '-21 days'), datetime('now', '-11 days'), datetime('now', '-11 days'), 0, NULL),

('ttodo_018', '[Design & UX] Marketing: Analyze conversion metrics...', '## Marketing Task for Design & UX

Analyze conversion metrics and user behavior

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'TODO', 'HIGH', datetime('now', '+9 days'), 'team_design_003', NULL, 'usr_bob_003', 'Marketing', '["marketing", "design-ux", "epic"]', '#8b5cf6', 270, NULL, datetime('now', '-6 days'), datetime('now'), NULL, 0, NULL),

('ttodo_019', '[Marketing & Growth] Testing: Set up automated...', '## Testing Task for Marketing & Growth

Set up automated integration tests

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'IN_PROGRESS', 'MEDIUM', datetime('now', '+6 days'), 'team_marketing_004', 'usr_alice_002', 'usr_carol_004', 'Testing', '["testing", "marketing-growth", "story"]', '#ec4899', 300, NULL, datetime('now', '-17 days'), datetime('now', '-2 days'), NULL, 0, NULL),

('ttodo_020', '[Quality Assurance] Planning: Document architectural decisions...', '## Planning Task for Quality Assurance

Document architectural decisions and patterns

### Requirements
- Collaborate with team members
- Follow team standards
- Update project documentation

### Definition of Done
- [ ] Implementation complete
- [ ] Code review passed
- [ ] Tests added and passing
- [ ] Documentation updated', 'TODO', 'LOW', NULL, 'team_qa_005', 'usr_emma_006', 'usr_alice_002', 'Planning', '["planning", "quality-assurance", "task"]', '#f59e0b', 120, NULL, datetime('now', '-4 days'), datetime('now', '-1 day'), NULL, 0, NULL);

-- Insert Todo Comments (25 entries showing realistic team collaboration)
INSERT INTO todo_comments (id, content, teamTodoId, userId, isEdited, editedAt, createdAt, updatedAt) VALUES
('comment_001', 'Great progress on this! The implementation looks solid.', 'ttodo_001', 'usr_admin_001', 0, NULL, datetime('now', '-10 days'), datetime('now', '-10 days')),
('comment_002', 'I have a few suggestions for improvement. Let\'s discuss in our next standup.', 'ttodo_002', 'usr_alice_002', 1, datetime('now', '-2 days'), datetime('now', '-5 days'), datetime('now', '-2 days')),
('comment_003', 'This is ready for review. Please take a look when you have a moment.', 'ttodo_003', 'usr_bob_003', 0, NULL, datetime('now', '-8 days'), datetime('now', '-8 days')),
('comment_004', 'I\'ve tested this locally and it works perfectly. Nice work! 🎉', 'ttodo_004', 'usr_emma_006', 0, NULL, datetime('now', '-12 days'), datetime('now', '-12 days')),
('comment_005', 'Could we add some unit tests for this functionality?', 'ttodo_005', 'usr_david_005', 0, NULL, datetime('now', '-6 days'), datetime('now', '-6 days')),
('comment_006', 'The design looks good, but I think we should consider accessibility requirements.', 'ttodo_006', 'usr_bob_003', 0, NULL, datetime('now', '-4 days'), datetime('now', '-4 days')),
('comment_007', 'This aligns well with our architecture guidelines. Approved!', 'ttodo_007', 'usr_admin_001', 1, datetime('now', '-1 day'), datetime('now', '-15 days'), datetime('now', '-1 day')),
('comment_008', 'I found a small bug in the edge case handling. I\'ll create a separate ticket.', 'ttodo_008', 'usr_alice_002', 0, NULL, datetime('now', '-3 days'), datetime('now', '-3 days')),
('comment_009', 'Documentation has been updated to reflect these changes.', 'ttodo_009', 'usr_carol_004', 0, NULL, datetime('now', '-7 days'), datetime('now', '-7 days')),
('comment_010', 'This feature is now deployed to staging for testing.', 'ttodo_010', 'usr_david_005', 0, NULL, datetime('now', '-9 days'), datetime('now', '-9 days')),
('comment_011', 'The performance impact looks minimal based on our metrics.', 'ttodo_011', 'usr_emma_006', 0, NULL, datetime('now', '-11 days'), datetime('now', '-11 days')),
('comment_012', 'Let\'s make sure this is compatible with our mobile app.', 'ttodo_012', 'usr_alice_002', 1, datetime('now', '-1 day'), datetime('now', '-13 days'), datetime('now', '-1 day')),
('comment_013', 'I\'ve coordinated with the backend team on the API changes.', 'ttodo_013', 'usr_bob_003', 0, NULL, datetime('now', '-5 days'), datetime('now', '-5 days')),
('comment_014', 'The user feedback on this feature has been very positive!', 'ttodo_014', 'usr_carol_004', 0, NULL, datetime('now', '-2 days'), datetime('now', '-2 days')),
('comment_015', 'We should consider adding this to our component library.', 'ttodo_015', 'usr_admin_001', 0, NULL, datetime('now', '-14 days'), datetime('now', '-14 days')),
('comment_016', 'I\'ll handle the code review for this one. Looks comprehensive!', 'ttodo_001', 'usr_david_005', 0, NULL, datetime('now', '-9 days'), datetime('now', '-9 days')),
('comment_017', 'The tests are passing locally. Ready for merge.', 'ttodo_002', 'usr_emma_006', 0, NULL, datetime('now', '-3 days'), datetime('now', '-3 days')),
('comment_018', 'Added some additional edge case handling based on QA feedback.', 'ttodo_004', 'usr_carol_004', 1, datetime('now', '-4 days'), datetime('now', '-16 days'), datetime('now', '-4 days')),
('comment_019', 'The mockups are looking great! Can we add some hover states?', 'ttodo_003', 'usr_alice_002', 0, NULL, datetime('now', '-6 days'), datetime('now', '-6 days')),
('comment_020', 'Performance benchmarks show 20% improvement. Excellent work!', 'ttodo_007', 'usr_bob_003', 0, NULL, datetime('now', '-18 days'), datetime('now', '-18 days')),
('comment_021', 'I\'ve updated the documentation to include the new API endpoints.', 'ttodo_017', 'usr_alice_002', 0, NULL, datetime('now', '-8 days'), datetime('now', '-8 days')),
('comment_022', 'This will require some coordination with the DevOps team for deployment.', 'ttodo_012', 'usr_david_005', 0, NULL, datetime('now', '-7 days'), datetime('now', '-7 days')),
('comment_023', 'The analytics integration is working perfectly. Great job team!', 'ttodo_019', 'usr_carol_004', 1, datetime('now', '-2 days'), datetime('now', '-10 days'), datetime('now', '-2 days')),
('comment_024', 'I\'ve added some additional test coverage for the edge cases we discussed.', 'ttodo_005', 'usr_alice_002', 0, NULL, datetime('now', '-4 days'), datetime('now', '-4 days')),
('comment_025', 'The final implementation meets all the acceptance criteria. Approved!', 'ttodo_011', 'usr_admin_001', 0, NULL, datetime('now', '-16 days'), datetime('now', '-16 days'));

-- Insert Time Entries (30 entries with realistic work patterns)
INSERT INTO time_entries (id, startTime, endTime, duration, description, personalTodoId, teamTodoId, userId, isManual, source, billable, hourlyRate, createdAt, updatedAt) VALUES
('time_001', datetime('now', '-25 days', '+9 hours'), datetime('now', '-25 days', '+11 hours'), 7200, 'Deep focus work session', 'ptodo_001', NULL, 'usr_admin_001', 0, 'web', 0, NULL, datetime('now', '-25 days', '+9 hours'), datetime('now', '-25 days', '+11 hours')),
('time_002', datetime('now', '-24 days', '+14 hours'), datetime('now', '-24 days', '+16 hours', '+30 minutes'), 9000, 'Code review and debugging', NULL, 'ttodo_001', 'usr_alice_002', 0, 'web', 1, 85.0, datetime('now', '-24 days', '+14 hours'), datetime('now', '-24 days', '+16 hours', '+30 minutes')),
('time_003', datetime('now', '-23 days', '+10 hours'), datetime('now', '-23 days', '+12 hours', '+45 minutes'), 9900, 'Research and planning', 'ptodo_002', NULL, 'usr_bob_003', 0, 'web', 0, NULL, datetime('now', '-23 days', '+10 hours'), datetime('now', '-23 days', '+12 hours', '+45 minutes')),
('time_004', datetime('now', '-22 days', '+15 hours'), datetime('now', '-22 days', '+18 hours'), 10800, 'Implementation and testing', NULL, 'ttodo_003', 'usr_bob_003', 1, 'mobile', 1, 75.0, datetime('now', '-22 days', '+15 hours'), datetime('now', '-22 days', '+18 hours')),
('time_005', datetime('now', '-21 days', '+8 hours'), datetime('now', '-21 days', '+9 hours', '+30 minutes'), 5400, 'Documentation and cleanup', 'ptodo_004', NULL, 'usr_emma_006', 0, 'web', 0, NULL, datetime('now', '-21 days', '+8 hours'), datetime('now', '-21 days', '+9 hours', '+30 minutes')),
('time_006', datetime('now', '-20 days', '+13 hours'), datetime('now', '-20 days', '+17 hours'), 14400, 'Meeting and collaboration', NULL, 'ttodo_004', 'usr_carol_004', 0, 'web', 1, 90.0, datetime('now', '-20 days', '+13 hours'), datetime('now', '-20 days', '+17 hours')),
('time_007', datetime('now', '-19 days', '+11 hours'), datetime('now', '-19 days', '+13 hours', '+15 minutes'), 8100, 'Bug fixing and optimization', 'ptodo_005', NULL, 'usr_david_005', 0, 'api', 1, 95.0, datetime('now', '-19 days', '+11 hours'), datetime('now', '-19 days', '+13 hours', '+15 minutes')),
('time_008', datetime('now', '-18 days', '+16 hours'), datetime('now', '-18 days', '+18 hours', '+45 minutes'), 9900, 'Feature development', NULL, 'ttodo_005', 'usr_emma_006', 1, 'web', 1, 80.0, datetime('now', '-18 days', '+16 hours'), datetime('now', '-18 days', '+18 hours', '+45 minutes')),
('time_009', datetime('now', '-17 days', '+9 hours'), datetime('now', '-17 days', '+11 hours', '+30 minutes'), 9000, 'Design and mockup creation', 'ptodo_006', NULL, 'usr_alice_002', 0, 'web', 0, NULL, datetime('now', '-17 days', '+9 hours'), datetime('now', '-17 days', '+11 hours', '+30 minutes')),
('time_010', datetime('now', '-16 days', '+14 hours'), datetime('now', '-16 days', '+16 hours'), 7200, 'Testing and validation', NULL, 'ttodo_006', 'usr_bob_003', 0, 'mobile', 1, 75.0, datetime('now', '-16 days', '+14 hours'), datetime('now', '-16 days', '+16 hours')),
('time_011', datetime('now', '-15 days', '+10 hours'), datetime('now', '-15 days', '+11 hours', '+45 minutes'), 6300, 'Deep focus work session', 'ptodo_008', NULL, 'usr_admin_001', 1, 'web', 0, NULL, datetime('now', '-15 days', '+10 hours'), datetime('now', '-15 days', '+11 hours', '+45 minutes')),
('time_012', datetime('now', '-14 days', '+15 hours'), datetime('now', '-14 days', '+19 hours'), 14400, 'Code review and debugging', NULL, 'ttodo_007', 'usr_admin_001', 0, 'web', 1, 100.0, datetime('now', '-14 days', '+15 hours'), datetime('now', '-14 days', '+19 hours')),
('time_013', datetime('now', '-13 days', '+8 hours'), datetime('now', '-13 days', '+10 hours', '+15 minutes'), 8100, 'Research and planning', 'ptodo_009', NULL, 'usr_alice_002', 0, 'api', 0, NULL, datetime('now', '-13 days', '+8 hours'), datetime('now', '-13 days', '+10 hours', '+15 minutes')),
('time_014', datetime('now', '-12 days', '+12 hours'), datetime('now', '-12 days', '+15 hours', '+30 minutes'), 12600, 'Implementation and testing', NULL, 'ttodo_008', 'usr_emma_006', 0, 'web', 1, 80.0, datetime('now', '-12 days', '+12 hours'), datetime('now', '-12 days', '+15 hours', '+30 minutes')),
('time_015', datetime('now', '-11 days', '+16 hours'), datetime('now', '-11 days', '+17 hours', '+45 minutes'), 6300, 'Documentation and cleanup', 'ptodo_011', NULL, 'usr_alice_002', 1, 'mobile', 0, NULL, datetime('now', '-11 days', '+16 hours'), datetime('now', '-11 days', '+17 hours', '+45 minutes')),
('time_016', datetime('now', '-10 days', '+9 hours'), datetime('now', '-10 days', '+12 hours'), 10800, 'Meeting and collaboration', NULL, 'ttodo_011', 'usr_david_005', 0, 'web', 1, 95.0, datetime('now', '-10 days', '+9 hours'), datetime('now', '-10 days', '+12 hours')),
('time_017', datetime('now', '-9 days', '+13 hours'), datetime('now', '-9 days', '+15 hours', '+15 minutes'), 8100, 'Bug fixing and optimization', 'ptodo_013', NULL, 'usr_carol_004', 0, 'web', 1, 70.0, datetime('now', '-9 days', '+13 hours'), datetime('now', '-9 days', '+15 hours', '+15 minutes')),
('time_018', datetime('now', '-8 days', '+11 hours'), datetime('now', '-8 days', '+14 hours', '+30 minutes'), 12600, 'Feature development', NULL, 'ttodo_012', 'usr_emma_006', 0, 'api', 1, 80.0, datetime('now', '-8 days', '+11 hours'), datetime('now', '-8 days', '+14 hours', '+30 minutes')),
('time_019', datetime('now', '-7 days', '+14 hours'), datetime('now', '-7 days', '+16 hours', '+45 minutes'), 9900, 'Design and mockup creation', 'ptodo_014', NULL, 'usr_emma_006', 1, 'web', 0, NULL, datetime('now', '-7 days', '+14 hours'), datetime('now', '-7 days', '+16 hours', '+45 minutes')),
('time_020', datetime('now', '-6 days', '+10 hours'), datetime('now', '-6 days', '+12 hours', '+30 minutes'), 9000, 'Testing and validation', NULL, 'ttodo_014', 'usr_carol_004', 0, 'mobile', 1, 70.0, datetime('now', '-6 days', '+10 hours'), datetime('now', '-6 days', '+12 hours', '+30 minutes')),
('time_021', datetime('now', '-5 days', '+15 hours'), datetime('now', '-5 days', '+17 hours'), 7200, 'Deep focus work session', 'ptodo_016', NULL, 'usr_alice_002', 0, 'web', 0, NULL, datetime('now', '-5 days', '+15 hours'), datetime('now', '-5 days', '+17 hours')),
('time_022', datetime('now', '-4 days', '+9 hours'), datetime('now', '-4 days', '+13 hours'), 14400, 'Code review and debugging', NULL, 'ttodo_016', 'usr_bob_003', 0, 'web', 1, 75.0, datetime('now', '-4 days', '+9 hours'), datetime('now', '-4 days', '+13 hours')),
('time_023', datetime('now', '-3 days', '+12 hours'), datetime('now', '-3 days', '+14 hours', '+15 minutes'), 8100, 'Research and planning', 'ptodo_017', NULL, 'usr_admin_001', 1, 'api', 0, NULL, datetime('now', '-3 days', '+12 hours'), datetime('now', '-3 days', '+14 hours', '+15 minutes')),
('time_024', datetime('now', '-2 days', '+16 hours'), datetime('now', '-2 days', '+19 hours', '+30 minutes'), 12600, 'Implementation and testing', NULL, 'ttodo_017', 'usr_alice_002', 0, 'web', 1, 85.0, datetime('now', '-2 days', '+16 hours'), datetime('now', '-2 days', '+19 hours', '+30 minutes')),
('time_025', datetime('now', '-1 day', '+8 hours'), datetime('now', '-1 day', '+10 hours', '+45 minutes'), 9900, 'Documentation and cleanup', 'ptodo_018', NULL, 'usr_bob_003', 0, 'mobile', 0, NULL, datetime('now', '-1 day', '+8 hours'), datetime('now', '-1 day', '+10 hours', '+45 minutes')),
('time_026', datetime('now', '-1 day', '+13 hours'), datetime('now', '-1 day', '+15 hours'), 7200, 'Meeting and collaboration', NULL, 'ttodo_019', 'usr_alice_002', 0, 'web', 1, 85.0, datetime('now', '-1 day', '+13 hours'), datetime('now', '-1 day', '+15 hours')),
('time_027', datetime('now', '-12 hours'), datetime('now', '-10 hours', '+30 minutes'), 9000, 'Bug fixing and optimization', 'ptodo_019', NULL, 'usr_emma_006', 1, 'web', 1, 80.0, datetime('now', '-12 hours'), datetime('now', '-10 hours', '+30 minutes')),
('time_028', datetime('now', '-8 hours'), datetime('now', '-6 hours', '+15 minutes'), 7500, 'Feature development', NULL, 'ttodo_002', 'usr_david_005', 0, 'api', 1, 95.0, datetime('now', '-8 hours'), datetime('now', '-6 hours', '+15 minutes')),
('time_029', datetime('now', '-4 hours'), datetime('now', '-2 hours', '+45 minutes'), 6300, 'Design and mockup creation', 'ptodo_010', NULL, 'usr_david_005', 0, 'mobile', 1, 95.0, datetime('now', '-4 hours'), datetime('now', '-2 hours', '+45 minutes')),
('time_030', datetime('now', '-2 hours'), datetime('now', '-30 minutes'), 5400, 'Testing and validation', NULL, 'ttodo_005', 'usr_emma_006', 0, 'web', 1, 80.0, datetime('now', '-2 hours'), datetime('now', '-30 minutes'));

-- Insert Team Invitations (5 entries with different statuses)
INSERT INTO team_invitations (id, email, teamId, inviterId, role, token, status, message, expiresAt, respondedAt, createdAt, updatedAt) VALUES
('invite_001', 'newdev@contextmaster.com', 'team_frontend_001', 'usr_admin_001', 'MEMBER', 'frontend-invite-token-1', 'PENDING', 'Welcome to our frontend development team! We\'re excited to have you join us for our upcoming React project.', datetime('now', '+7 days'), NULL, datetime('now', '-5 days'), datetime('now', '-5 days')),
('invite_002', 'designer.new@contextmaster.com', 'team_design_003', 'usr_bob_003', 'MEMBER', 'design-invite-token-1', 'PENDING', 'Join our design team to create amazing user experiences!', datetime('now', '+14 days'), NULL, datetime('now', '-3 days'), datetime('now', '-3 days')),
('invite_003', 'senior.dev@contextmaster.com', 'team_backend_002', 'usr_david_005', 'ADMIN', 'backend-admin-invite-token-1', 'PENDING', NULL, datetime('now', '+5 days'), NULL, datetime('now', '-7 days'), datetime('now', '-7 days')),
('invite_004', 'marketer@contextmaster.com', 'team_marketing_004', 'usr_carol_004', 'MEMBER', 'marketing-invite-token-1', 'PENDING', 'Come help us grow our user base and create compelling marketing campaigns!', datetime('now', '+10 days'), NULL, datetime('now', '-2 days'), datetime('now', '-2 days')),
('invite_005', 'declined@example.com', 'team_qa_005', 'usr_emma_006', 'MEMBER', 'qa-declined-invite-token-1', 'DECLINED', NULL, datetime('now', '-2 days'), datetime('now', '-3 days'), datetime('now', '-10 days'), datetime('now', '-3 days'));

-- Update SQLite sequence counters (optional, for consistency)
UPDATE sqlite_sequence SET seq = (SELECT COUNT(*) FROM users) WHERE name = 'users';
UPDATE sqlite_sequence SET seq = (SELECT COUNT(*) FROM teams) WHERE name = 'teams';
UPDATE sqlite_sequence SET seq = (SELECT COUNT(*) FROM team_members) WHERE name = 'team_members';
UPDATE sqlite_sequence SET seq = (SELECT COUNT(*) FROM personal_todos) WHERE name = 'personal_todos';
UPDATE sqlite_sequence SET seq = (SELECT COUNT(*) FROM team_todos) WHERE name = 'team_todos';
UPDATE sqlite_sequence SET seq = (SELECT COUNT(*) FROM todo_comments) WHERE name = 'todo_comments';
UPDATE sqlite_sequence SET seq = (SELECT COUNT(*) FROM time_entries) WHERE name = 'time_entries';
UPDATE sqlite_sequence SET seq = (SELECT COUNT(*) FROM team_invitations) WHERE name = 'team_invitations';

-- Seed completion confirmation
SELECT 
  'Database seeded successfully!' AS message,
  (SELECT COUNT(*) FROM users) AS users,
  (SELECT COUNT(*) FROM teams) AS teams,
  (SELECT COUNT(*) FROM team_members) AS team_members,
  (SELECT COUNT(*) FROM personal_todos) AS personal_todos,
  (SELECT COUNT(*) FROM team_todos) AS team_todos,
  (SELECT COUNT(*) FROM todo_comments) AS comments,
  (SELECT COUNT(*) FROM time_entries) AS time_entries,
  (SELECT COUNT(*) FROM team_invitations) AS invitations;

-- Show sample login credentials
SELECT 
  '========== SAMPLE LOGIN CREDENTIALS ==========' AS info
UNION ALL
SELECT 'Email: admin@contextmaster.com | Password: password123 | User: Sarah Chen (Admin)'
UNION ALL
SELECT 'Email: alice.johnson@contextmaster.com | Password: password123 | User: Alice Johnson (Frontend Dev)'
UNION ALL
SELECT 'Email: bob.smith@contextmaster.com | Password: password123 | User: Bob Smith (Designer)'  
UNION ALL
SELECT 'Email: carol.davis@contextmaster.com | Password: password123 | User: Carol Davis (Marketing)'
UNION ALL
SELECT 'Email: david.wilson@contextmaster.com | Password: password123 | User: David Wilson (DevOps)'
UNION ALL
SELECT 'Email: emma.garcia@contextmaster.com | Password: password123 | User: Emma Garcia (QA)'
UNION ALL
SELECT '==============================================';