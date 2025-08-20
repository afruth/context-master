# Hattrick Testing Suite

Comprehensive testing suite for the Hattrick step trading application with coverage for core business logic, API endpoints, database models, and UI components.

## Test Structure

```
__tests__/
├── calculations.test.ts          # Core business logic tests
├── api-utils.test.ts            # API utility function tests
├── api/
│   ├── players.test.ts          # Player API endpoint tests
│   ├── transactions.test.ts     # Transaction API endpoint tests
│   └── calculations.test.ts     # Calculation API endpoint tests
├── components/
│   ├── record-sale-modal.test.tsx   # Sale recording modal tests
│   └── player-table.test.tsx        # Player list/table tests
├── db/
│   └── models.test.ts           # Database model relationship tests
├── utils/
│   └── test-helpers.ts          # Test utilities and mock factories
├── setup-test-db.ts             # Test database setup utilities
└── README.md                    # This file
```

## Test Categories

### 1. Unit Tests

#### Core Calculations (`calculations.test.ts`)
Tests all Hattrick-specific business logic:

- **Profit Calculations**: Accuracy of profit/loss calculations using Hattrick formula
- **Age Progression**: 112-day Hattrick year system calculations  
- **Percentage Kept**: Progressive percentage calculation (max 93%)
- **Weeks Owned**: Ownership duration calculations with partial week rounding
- **Salary Costs**: Complex salary period calculations
- **Utility Functions**: ROI, date calculations, financial value rounding

**Key Features Tested:**
- Input validation and error handling
- Edge cases (zero values, boundary conditions)
- Precision and rounding accuracy
- Hattrick-specific business rules

#### API Utilities (`api-utils.test.ts`)
Tests API communication layer:

- **Error Handling**: HTTP status codes, API errors, network failures
- **Request Formation**: Headers, parameters, body serialization
- **Response Parsing**: Data extraction, error detection
- **Authentication**: Header management, token handling

### 2. Integration Tests

#### API Endpoints (`api/`)
Tests actual API routes with mocked dependencies:

**Players API (`players.test.ts`)**
- CRUD operations (Create, Read, Update, Delete)
- Filtering and pagination
- Authentication requirements
- Data validation
- Error responses (404, 400, 500)

**Transactions API (`transactions.test.ts`)**  
- Sale recording functionality
- Profit calculation integration
- Data validation and constraints
- Transaction atomicity

**Calculations API (`calculations.test.ts`)**
- Portfolio summary accuracy
- Profit projections
- Confidence level calculations
- Performance metrics

### 3. Component Tests

#### Sale Recording Modal (`record-sale-modal.test.tsx`)
- **Form Validation**: Required fields, date constraints, price validation
- **Profit Calculation Display**: Real-time preview updates
- **Success/Error Handling**: API integration, user feedback
- **User Experience**: Confirmation flows, form reset

#### Player Table (`player-table.test.tsx`)  
- **Data Display**: Proper formatting, status indicators
- **Action Buttons**: Contextual actions based on player status
- **Filtering Integration**: Search, status, position filters
- **Accessibility**: Screen reader compatibility, keyboard navigation

### 4. Database Tests

#### Model Relationships (`db/models.test.ts`)
- **Foreign Key Constraints**: Referential integrity
- **Cascade Deletes**: Proper cleanup on parent deletion
- **Data Integrity**: Validation constraints, unique constraints
- **Index Performance**: Query optimization verification

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests for CI (no watch, with coverage)
npm run test:ci
```

### Category-Specific Tests

```bash
# Test core business logic only
npm run test:calculations

# Test all API endpoints  
npm run test:api

# Test React components
npm run test:components

# Test database models
npm run test:db
```

### Individual Test Files

```bash
# Test specific functionality
npx jest calculations.test.ts
npx jest api/players.test.ts
npx jest components/record-sale-modal.test.tsx
```

## Test Configuration

### Jest Setup (`jest.config.js`)
- **Environment**: jsdom for React component testing
- **Module Resolution**: TypeScript path aliases
- **Coverage Thresholds**: 80% minimum for critical code
- **Test Patterns**: Automatic discovery of `.test.{ts,tsx}` files

### Test Environment (`jest.setup.js`)
- **Mock Configuration**: Next.js navigation, toast notifications
- **Global Polyfills**: IntersectionObserver, ResizeObserver
- **Environment Variables**: Test database, authentication secrets

### Database Testing (`setup-test-db.ts`)
- **Isolated Database**: Separate SQLite instance for tests
- **Migration Management**: Automatic schema setup
- **Data Seeding**: Consistent test data across tests
- **Cleanup Utilities**: Database reset between tests

## Test Utilities

### Mock Factories (`test-helpers.ts`)
Provides consistent mock data creation:

```typescript
// Create mock player with defaults
const player = createMockPlayer({
  name: 'Custom Name',
  position: 'Forward'
})

// Create profit calculation input
const profitInput = createMockProfitInput({
  saleValue: 1500000,
  weeksOwned: 20
})

// Create salary history
const salary = createMockSalaryHistory(50000, weeksAgo(8))
```

### Date Utilities
```typescript
// Create dates relative to now
const purchaseDate = weeksAgo(16)
const futureDate = weeksFromNow(4)
const recentDate = daysAgo(3)
```

### API Response Mocking
```typescript
// Mock successful API response
const response = createMockApiResponse(data, true)

// Mock error response  
const errorResponse = createMockApiResponse(null, false)
```

## Coverage Requirements

### Minimum Coverage Thresholds
- **Branches**: 80%
- **Functions**: 80% 
- **Lines**: 80%
- **Statements**: 80%

### Coverage Exclusions
- UI component library (`src/components/ui/`)
- Next.js specific files (pages, layouts)
- Type definitions (`.d.ts` files)
- Middleware configuration
- Story files (`.stories.{ts,tsx}`)

### Critical Coverage Areas
- **Business Logic**: `src/lib/calculations.ts` (95%+ required)
- **API Routes**: All endpoints (90%+ required)
- **Database Models**: All Prisma operations (85%+ required)

## Best Practices

### Test Organization
- **Descriptive Names**: Clear test descriptions indicating what is being tested
- **Arrange-Act-Assert**: Consistent test structure
- **One Assertion Per Test**: Focus on single responsibility
- **Proper Cleanup**: Reset state between tests

### Mock Strategy
- **Mock External Dependencies**: API calls, database operations
- **Keep Business Logic Pure**: Test actual implementation
- **Consistent Mock Data**: Use factory functions for reliability
- **Realistic Test Data**: Mirror production data patterns

### Error Testing
- **Test Error Conditions**: Invalid inputs, network failures
- **Validate Error Messages**: User-friendly error handling
- **Edge Cases**: Boundary conditions, null values
- **Recovery Scenarios**: Graceful failure handling

## Debugging Tests

### Common Issues

**Test Database Setup**
```bash
# Reset test database manually
rm test.db
npx prisma db push --force-reset
```

**Mock Issues**
```bash
# Clear Jest cache
npx jest --clearCache
```

**TypeScript Errors**
```bash
# Check types without running tests
npm run typecheck
```

### Debugging Tools

**Verbose Output**
```bash
npx jest --verbose
```

**Debug Specific Test**
```bash
npx jest --testNamePattern="specific test name"
```

**Watch Mode with Coverage**
```bash
npx jest --watch --coverage
```

## Continuous Integration

The test suite is designed for CI environments:

- **Deterministic**: Tests produce consistent results
- **Isolated**: No external dependencies
- **Fast**: Optimized for quick feedback
- **Comprehensive**: High coverage of critical paths

### CI Configuration Example
```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: npm run test:ci
  
- name: Upload Coverage
  uses: codecov/codecov-action@v1
```

## Adding New Tests

### For New Features
1. **Unit Tests**: Test business logic in isolation
2. **Integration Tests**: Test API endpoints with mocked dependencies  
3. **Component Tests**: Test UI behavior and user interactions
4. **Database Tests**: Test model relationships if applicable

### Test File Naming
- Unit tests: `feature.test.ts`
- API tests: `api/endpoint.test.ts` 
- Component tests: `components/component-name.test.tsx`
- Database tests: `db/model-area.test.ts`

### Mock Requirements
- Mock all external dependencies
- Use factory functions for consistent data
- Test both success and error scenarios
- Verify proper error handling

This testing suite provides comprehensive coverage of the Hattrick application's core functionality, ensuring reliability and maintainability of the codebase.