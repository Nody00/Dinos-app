# Comprehensive Modern Testing Plan for NestJS N-Layer Application

## Overview

This plan outlines a complete testing strategy for your NestJS application with N-layer architecture, covering all layers from controllers to database with modern 2025 best practices.

## Architecture Summary

Your application follows a clean 4-layer architecture:
- **Controllers**: HTTP entry points ([users.controller.ts](src/users/users.controller.ts), [invitations.controller.ts](src/invitations/invitations.controller.ts))
- **Services**: Business logic with transactions ([users.service.ts](src/users/users.service.ts), [email.service.ts](src/email/email.service.ts))
- **Repositories**: Data access layer ([users.repository.ts](src/users/users.repository.ts))
- **Event Handlers**: RabbitMQ message consumers with manual ACK/NACK
- **Database**: PostgreSQL via Prisma ORM with transactional outbox pattern

**Key Patterns:**
- Transactional outbox for reliable event publishing
- Provider pattern for email services (SMTP/SendGrid)
- EventEmitter2 + RabbitMQ for event processing
- Prisma transactions with custom pg adapter

## Current Testing State

✅ **Already Configured:**
- Jest 30.0.0 with TypeScript support (ts-jest 29.2.5)
- @nestjs/testing 11.0.1
- Supertest 7.0.0 for HTTP testing
- Basic test examples exist

⚠️ **Gaps:**
- Only 2 basic test files exist
- No test infrastructure (mocks, fixtures, helpers)
- No database setup/teardown for tests
- No test coverage for services, repositories, event handlers

---

## Test Types & Organization

### 1. Unit Tests (Layer Isolation)

**Pattern**: Test each layer independently with all dependencies mocked.

**File Locations**: Colocated with source files (`*.spec.ts`)

**Layers to Test:**

#### Controllers
- **Files**: [users.controller.spec.ts](src/users/users.controller.spec.ts), [invitations.controller.spec.ts](src/invitations/invitations.controller.spec.ts)
- **Test**: HTTP status codes, DTO validation, request/response transformation, actor ID extraction
- **Mock**: Services (UsersService, InvitationsService)
- **Example scenarios**:
  - Creating user returns 201 with user data
  - Missing actor ID defaults to undefined
  - Invalid DTO returns 400

#### Services
- **Files**: [users.service.spec.ts](src/users/users.service.spec.ts), [invitations.service.spec.ts](src/invitations/invitations.service.spec.ts), [email.service.spec.ts](src/email/email.service.spec.ts)
- **Test**: Business logic, transaction handling, event recording, error cases
- **Mock**: PrismaService, EventOutboxService, EmailService
- **Example scenarios**:
  - User creation records event in same transaction
  - Update with no changes doesn't create event
  - Transaction rollback on event recording failure
  - NotFoundException for missing user

#### Repositories
- **Files**: [users.repository.spec.ts](src/users/users.repository.spec.ts), [event-outbox.repository.spec.ts](src/common/events/outbox/event-outbox.repository.spec.ts)
- **Test**: Query construction, Prisma method calls, data transformations
- **Mock**: PrismaService
- **Note**: Current implementation has UsersService directly using Prisma; repository is mostly unused

#### Event Handlers
- **Files**: [user-created.handler.spec.ts](src/users/events/handlers/user-created.handler.spec.ts), [invitation-created.handler.spec.ts](src/invitations/events/handlers/invitation-created.handler.spec.ts)
- **Test**: Event deserialization, email sending, message ACK/NACK, error handling
- **Mock**: EmailService, RmqContext (channel, message)
- **Example scenarios**:
  - Successful processing sends email and ACKs message
  - Email failure triggers NACK with requeue
  - Proper logging on errors

### 2. Integration Tests (Multi-Layer with Real DB)

**Pattern**: Test layer interactions with in-memory SQLite database via Prisma.

**File Locations**: `src/<module>/__tests__/*.integration.spec.ts`

**Key Tests:**
- **User Creation Flow** ([users.integration.spec.ts](src/users/__tests__/users.integration.spec.ts)):
  - Controller → Service → Prisma → Database
  - Event recorded in outbox table
  - Transaction atomicity (both user and event created or neither)
  - Duplicate email constraint enforcement

- **Event Outbox Flow** ([event-outbox.integration.spec.ts](src/common/events/outbox/__tests__/event-outbox.integration.spec.ts)):
  - Event recording with transaction
  - Publishing and moving to history table
  - Retry logic on failure
  - Cleanup of old events

**Database Strategy**:
- **PostgreSQL via Docker Testcontainers** for realistic testing
- Container started once per test suite (in `beforeAll`)
- **Data cleanup only** between tests (DELETE/TRUNCATE, no schema migrations for performance)
- Seed required data once (roles, event types)
- Container stopped in `afterAll`
- Dynamic port mapping for parallel test execution

### 3. E2E Tests (Complete User Journeys)

**Pattern**: Test full application flows from HTTP request through all layers to side effects.

**File Locations**: `test/e2e/*.e2e-spec.ts`

**Key Tests:**
- **User Lifecycle** ([users.e2e-spec.ts](test/e2e/users.e2e-spec.ts)):
  - Create user → Wait for event → Verify welcome email sent → Confirm event history
  - Update user → Verify update event → Check changed fields
  - Delete user → Verify deletion event

- **Invitation Flow** ([invitations.e2e-spec.ts](test/e2e/invitations.e2e-spec.ts)):
  - Create invitation → Verify invitation email → Accept invitation → Verify user created → Check both events processed

- **Event Processing** ([events.e2e-spec.ts](test/e2e/events.e2e-spec.ts)):
  - Verify RabbitMQ message flow
  - Test immediate publishing + polling backup
  - Verify event handlers process messages

**Infrastructure Needed**:
- Test database with setup/teardown
- RabbitMQ test helper for message verification
- Email capture service (mock provider that records emails)

### 4. Smoke Tests (Health Checks)

**File Location**: [test/smoke/health.smoke-spec.ts](test/smoke/health.smoke-spec.ts)

**Tests**:
- API responds to health check
- Database connection works
- RabbitMQ connection established
- Critical services can be instantiated

### 5. Regression Tests (Critical Flows)

**File Location**: [test/regression/critical-flows.regression-spec.ts](test/regression/critical-flows.regression-spec.ts)

**Tests**:
- Lock in previously broken functionality
- Prevent breaking critical business flows
- Document edge cases that caused production bugs

---

## Test Infrastructure

### Mocking Strategy

#### 1. Prisma Mock Factory
**File**: [test/mocks/prisma.mock.ts](test/mocks/prisma.mock.ts)

Uses `jest-mock-extended` for type-safe deep mocking:
```typescript
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
export type MockPrismaService = DeepMockProxy<PrismaClient>;
export function createMockPrismaService(): MockPrismaService;
export function mockPrismaTransaction(mockPrisma);
```

**Key Features**:
- Deep mocking of all Prisma methods
- Transaction callback mocking
- Reset helper for clean state

#### 2. Event Outbox Mock
**File**: [test/mocks/event-outbox.mock.ts](test/mocks/event-outbox.mock.ts)

Mocks event recording and history queries.

#### 3. Email Service Mock
**File**: [test/mocks/email.mock.ts](test/mocks/email.mock.ts)

Includes:
- Basic mock for unit tests
- `EmailCaptureService` for E2E (captures emails instead of sending)

#### 4. RabbitMQ Mocks
**Files**:
- [test/mocks/rabbitmq.mock.ts](test/mocks/rabbitmq.mock.ts) - Mock ClientProxy
- [test/mocks/rmq-context.mock.ts](test/mocks/rmq-context.mock.ts) - Mock RmqContext with channel/message

### Test Helpers

#### 1. Test Database Helper (Testcontainers)
**File**: [test/helpers/test-database.helper.ts](test/helpers/test-database.helper.ts)

**Responsibilities**:
- Start PostgreSQL Docker container via Testcontainers
- Run Prisma migrations once on container startup
- **TRUNCATE tables between tests** (faster than DELETE, preserves schema)
- Seed required data once during setup (roles, event types)
- Provide Prisma client for assertions
- Stop container and cleanup on teardown

**Key Features**:
- Dynamic port mapping (enables parallel test execution)
- Isolated PostgreSQL instance per test file
- Real PostgreSQL behavior (constraints, triggers, indexes)
- Performance optimized: `fsync=off`, `synchronous_commit=off` for tests

**Usage**:
```typescript
let testDb: TestDatabaseHelper;
beforeAll(async () => {
  testDb = new TestDatabaseHelper();
  await testDb.setup(); // Starts container, runs migrations, seeds
});
beforeEach(async () => {
  await testDb.clearData(); // TRUNCATE tables only
});
afterAll(async () => await testDb.teardown()); // Stops container
```

**Implementation Details**:
- Uses `testcontainers` package with PostgreSQL image
- Runs `prisma migrate deploy` against container
- Selective TRUNCATE (only tables that change, not seed data)
- Connection pooling disabled in tests to avoid leaks

#### 2. Test RabbitMQ Helper
**File**: [test/helpers/test-rabbitmq.helper.ts](test/helpers/test-rabbitmq.helper.ts)

**Responsibilities**:
- Connect to RabbitMQ test instance
- Purge queues between tests
- Wait for specific message patterns
- Verify message content

#### 3. Test Module Builder
**File**: [test/helpers/test-module.helper.ts](test/helpers/test-module.helper.ts)

**Helpers**:
- `createUnitTestModule()` - For unit tests with mocks
- `createIntegrationTestModule()` - For integration tests with real DB
- `createServiceTestModule()` - Streamlined service testing with common mocks

#### 4. Custom Assertions
**File**: [test/helpers/assertions.helper.ts](test/helpers/assertions.helper.ts)

**Utilities**:
- `waitFor()` - Poll assertion until true or timeout
- Custom Jest matchers: `toBeValidUUID()`, `toHaveBeenCalledWithEvent()`

### Test Fixtures

**Purpose**: Generate realistic test data

**Files**:
- [test/fixtures/users.fixture.ts](test/fixtures/users.fixture.ts) - User DTOs and entities
- [test/fixtures/invitations.fixture.ts](test/fixtures/invitations.fixture.ts) - Invitation data
- [test/fixtures/events.fixture.ts](test/fixtures/events.fixture.ts) - Domain events
- [test/fixtures/roles.fixture.ts](test/fixtures/roles.fixture.ts) - Role data

Uses `@faker-js/faker` for realistic data generation.

---

## Jest Configuration

### File Structure

```
jest.config.js                   # Master config (runs all projects)
test/
├── jest-unit.config.js          # Unit tests only (*.spec.ts)
├── jest-integration.config.js   # Integration tests (*.__tests__/*.integration.spec.ts)
├── jest-e2e.config.js          # E2E tests (test/e2e/*.e2e-spec.ts)
└── setup/
    ├── jest.global-setup.ts     # Create test DB, run migrations
    ├── jest.global-teardown.ts  # Cleanup
    └── jest.setup.ts            # Load custom matchers, set timeouts
```

### Key Configuration Points

**Master Config** ([jest.config.js](jest.config.js)):
- Runs all test projects
- Collects coverage across all tests
- Coverage thresholds: 80% lines, 75% functions, 70% branches

**Unit Config**:
- Pattern: `*.spec.ts`
- Excludes: `__tests__/`, `test/e2e/`
- Fast execution, no DB dependencies

**Integration Config**:
- Pattern: `*.integration.spec.ts`
- Uses test database
- `maxWorkers: 1` (serial execution)
- Timeout: 30 seconds
- Global setup/teardown for DB

**E2E Config**:
- Pattern: `*.e2e-spec.ts`
- Full application bootstrap
- `maxWorkers: 1`
- Timeout: 60 seconds

### Environment Variables

**File**: [.env.test](.env.test)

**Note**: DATABASE_URL is dynamically set by Testcontainers, not hardcoded.

```bash
NODE_ENV=test
# DATABASE_URL will be dynamically set by Testcontainers
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=events_queue_test
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
LOG_LEVEL=error
JWT_SECRET=test-secret-key
```

---

## Database Testing Strategy (Testcontainers + PostgreSQL)

### Why PostgreSQL via Testcontainers?

Based on 2025 best practices, this approach provides:

1. **Realistic Testing**: Test against actual PostgreSQL, not mocks or SQLite
2. **Constraint Validation**: Real unique constraints, foreign keys, triggers
3. **Isolation**: Each test suite gets its own container
4. **Parallel Execution**: Dynamic ports allow multiple test files to run simultaneously
5. **No Manual Setup**: Containers start/stop automatically
6. **CI/CD Ready**: Works in GitHub Actions, GitLab CI, etc.

### Performance: Cleanup vs. Reset

**Strategy: TRUNCATE (Cleanup Only)**

Between each test, we **TRUNCATE tables** instead of recreating schema:

**Why TRUNCATE?**
- ✅ **Fast**: 10-20x faster than running migrations
- ✅ **Preserves Schema**: Keeps indexes, constraints, sequences
- ✅ **Resets Auto-increment**: Restarts ID sequences
- ✅ **Cascades**: Can cascade to related tables

**Cleanup Pattern**:
```typescript
async clearData() {
  // Truncate in dependency order (child tables first)
  await prisma.$executeRaw`TRUNCATE TABLE event_history CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE event_outbox CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE invitation CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "user" CASCADE`;
  // Don't truncate: roles, event_types (seed data)
}
```

**Alternative: Selective DELETE**
- Use DELETE only for specific tables that change
- Track which tables are touched during test
- Skip tables that weren't modified

### Test Database Lifecycle

```
beforeAll (once per test file):
  1. Start PostgreSQL container (Testcontainers)
  2. Run Prisma migrations
  3. Seed static data (roles, event_types)

beforeEach (before each test):
  4. TRUNCATE tables (except seed data)

Test execution:
  5. Test runs with clean state

afterEach (after each test):
  6. (Optional) Additional cleanup if needed

afterAll (once per test file):
  7. Stop PostgreSQL container
  8. Clean up resources
```

### Performance Optimizations

PostgreSQL container configuration for tests:
```typescript
container
  .withCommand([
    '-c', 'fsync=off',              // Faster writes (safe for tests)
    '-c', 'synchronous_commit=off', // No sync to disk
    '-c', 'full_page_writes=off',   // Skip full page writes
    '-c', 'max_connections=100',    // Limit connections
  ])
```

---

## Best Practices

### 1. AAA Pattern
Always structure tests with Arrange-Act-Assert:
```typescript
it('should create user', async () => {
  // Arrange
  const dto = { email: 'test@test.com', ... };

  // Act
  const result = await service.create(dto);

  // Assert
  expect(result).toEqual(expect.objectContaining({ email: 'test@test.com' }));
});
```

### 2. Test Organization
Group by scenario, not just by method:
```typescript
describe('User Creation', () => {
  describe('Happy Path', () => { /* ... */ });
  describe('Error Cases', () => { /* ... */ });
  describe('Edge Cases', () => { /* ... */ });
});
```

### 3. Mock Management
- Fresh mocks in `beforeEach`
- Clear mocks in `afterEach`
- Use `jest.clearAllMocks()` to reset state

### 4. Async Testing
- Always use async/await
- Use `waitFor()` helper for polling assertions
- Set appropriate timeouts for RabbitMQ/DB operations

### 5. Transaction Testing
- Verify atomic behavior (user + event created together)
- Test rollback scenarios
- Mock transaction callbacks properly

### 6. Modern Patterns (2025)
- Use `useMocker` for auto-mocking dependencies
- Use `jest-mock-extended` for type-safe mocks
- Use `@faker-js/faker` for realistic test data

---

## Implementation Phases

### Phase 1: Foundation (Critical Infrastructure)
**Files to Create**:
1. ✅ [test/mocks/prisma.mock.ts](test/mocks/prisma.mock.ts) - Prisma mock factory
2. ✅ [test/mocks/email.mock.ts](test/mocks/email.mock.ts) - Email service mock
3. ✅ [test/mocks/event-outbox.mock.ts](test/mocks/event-outbox.mock.ts) - Event outbox mock
4. ✅ [test/mocks/rmq-context.mock.ts](test/mocks/rmq-context.mock.ts) - RabbitMQ context mock
5. ✅ [test/helpers/test-database.helper.ts](test/helpers/test-database.helper.ts) - Database lifecycle
6. ✅ [test/helpers/test-module.helper.ts](test/helpers/test-module.helper.ts) - Module builders
7. ✅ [test/fixtures/users.fixture.ts](test/fixtures/users.fixture.ts) - User test data
8. ✅ [test/jest-unit.config.js](test/jest-unit.config.js) - Unit test config
9. ✅ [test/jest-integration.config.js](test/jest-integration.config.js) - Integration config
10. ✅ Update [test/jest-e2e.config.js](test/jest-e2e.config.js) - E2E config
11. ✅ [jest.config.js](jest.config.js) - Master config
12. ✅ [.env.test](.env.test) - Test environment variables
13. ✅ [test/setup/jest.global-setup.ts](test/setup/jest.global-setup.ts) - DB setup
14. ✅ [test/setup/jest.setup.ts](test/setup/jest.setup.ts) - Load custom matchers

**Dependencies to Install**:
```bash
pnpm add -D jest-mock-extended @faker-js/faker testcontainers
```

**Why Testcontainers?**
- Real PostgreSQL for integration/E2E tests (not mocks or SQLite)
- Isolated container per test suite
- Dynamic ports for parallel execution
- Production-like testing environment
- No manual Docker setup required

### Phase 2: Unit Tests (Service Layer Priority)
**Files to Create**:
1. ✅ [src/users/users.service.spec.ts](src/users/users.service.spec.ts)
   - Test create, update, delete with transaction mocking
   - Test event recording integration
   - Test error cases (NotFoundException, duplicate emails)

2. ✅ [src/users/users.controller.spec.ts](src/users/users.controller.spec.ts)
   - Mock UsersService
   - Test HTTP status codes
   - Test actor ID extraction

3. ✅ [src/users/events/handlers/user-created.handler.spec.ts](src/users/events/handlers/user-created.handler.spec.ts)
   - Mock EmailService and RmqContext
   - Test email sending and ACK
   - Test NACK on failure

4. ✅ [src/email/email.service.spec.ts](src/email/email.service.spec.ts)
   - Test provider delegation
   - Test default sender configuration

5. ✅ [src/common/events/outbox/event-outbox.service.spec.ts](src/common/events/outbox/event-outbox.service.spec.ts)
   - Test event recording
   - Test immediate emit trigger

### Phase 3: Integration Tests
**Files to Create**:
1. ✅ [src/users/__tests__/users.integration.spec.ts](src/users/__tests__/users.integration.spec.ts)
   - Full user creation flow with real DB
   - Test transaction atomicity
   - Test constraint violations

2. ✅ [src/common/events/outbox/__tests__/event-outbox.integration.spec.ts](src/common/events/outbox/__tests__/event-outbox.integration.spec.ts)
   - Event recording and publishing
   - Move to history after publish

### Phase 4: E2E Tests
**Files to Create**:
1. ✅ [test/helpers/test-rabbitmq.helper.ts](test/helpers/test-rabbitmq.helper.ts)
2. ✅ [test/e2e/users.e2e-spec.ts](test/e2e/users.e2e-spec.ts)
   - Complete user lifecycle
   - Verify email sending
   - Verify event processing

3. ✅ Update [test/app.e2e-spec.ts](test/app.e2e-spec.ts) - Enhance existing

### Phase 5: Smoke & Regression
**Files to Create**:
1. ✅ [test/smoke/health.smoke-spec.ts](test/smoke/health.smoke-spec.ts)
2. ✅ [test/regression/critical-flows.regression-spec.ts](test/regression/critical-flows.regression-spec.ts)

---

## Package.json Scripts

Add/update scripts in [package.json](package.json):

```json
{
  "scripts": {
    "test": "jest --config test/jest-unit.config.js",
    "test:unit": "jest --config test/jest-unit.config.js",
    "test:integration": "jest --config test/jest-integration.config.js",
    "test:e2e": "jest --config test/jest-e2e.config.js",
    "test:all": "jest",
    "test:watch": "jest --config test/jest-unit.config.js --watch",
    "test:cov": "jest --coverage",
    "test:cov:unit": "jest --config test/jest-unit.config.js --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:smoke": "jest test/smoke",
    "test:regression": "jest test/regression"
  }
}
```

---

## Critical Files Summary

**Top Priority (Phase 1 - Must implement first)**:
1. [test/mocks/prisma.mock.ts](test/mocks/prisma.mock.ts) - Enables service unit tests
2. [test/helpers/test-database.helper.ts](test/helpers/test-database.helper.ts) - Enables integration/E2E tests
3. [test/jest-unit.config.js](test/jest-unit.config.js) - Unit test runner config
4. [test/fixtures/users.fixture.ts](test/fixtures/users.fixture.ts) - Test data generation
5. [.env.test](.env.test) - Test environment configuration

**Example Templates (Phase 2)**:
1. [src/users/users.service.spec.ts](src/users/users.service.spec.ts) - Service testing template
2. [src/users/users.controller.spec.ts](src/users/users.controller.spec.ts) - Controller testing template
3. [src/users/events/handlers/user-created.handler.spec.ts](src/users/events/handlers/user-created.handler.spec.ts) - Event handler template

---

## Verification Plan

After implementation, verify the testing setup works:

### 1. Run Unit Tests
```bash
pnpm run test:unit
```
**Expected**: All unit tests pass with mocked dependencies

### 2. Run Integration Tests
```bash
pnpm run test:integration
```
**Expected**:
- PostgreSQL container starts automatically
- Migrations run
- Tests execute against real PostgreSQL
- Data truncated between tests
- Container stops after tests complete

### 3. Run E2E Tests
```bash
pnpm run test:e2e
```
**Expected**:
- PostgreSQL container starts
- Full NestJS application boots
- RabbitMQ events process (requires RabbitMQ running)
- Emails captured via test provider
- Complete user journeys work end-to-end

### 4. Check Coverage
```bash
pnpm run test:cov
```
**Expected**: Coverage report generated, thresholds met (80%+ lines)

### 5. Verify Testcontainers Setup
- Docker daemon running
- PostgreSQL container starts/stops correctly
- Migrations applied to container
- Data truncated (not recreated) between tests
- Proper teardown and container cleanup
- No orphaned containers after tests

### 6. Test Individual Layers
- Controllers: HTTP behavior with mocked services ✓
- Services: Business logic with mocked Prisma ✓
- Event Handlers: Message processing with mocked email ✓
- Integration: Multi-layer with real DB ✓
- E2E: Complete flows with real services ✓

---

## Key Testing Principles for This Architecture

1. **Transaction Atomicity**: Always verify Prisma transactions create user + event together or neither
2. **Event Outbox Pattern**: Test events recorded during transaction and published separately
3. **Mock External Services**: Email and RabbitMQ always mocked in unit/integration
4. **Database Isolation**: Separate test DB, cleared between tests
5. **Event Handler Testing**: Mock RmqContext, verify ACK/NACK behavior
6. **Provider Pattern**: Test EmailService with provider abstraction
7. **Async Operations**: Proper async/await, timeouts for event processing
8. **Error Scenarios**: Test rollbacks, failures, retries

---

## Notes & Considerations

- **Current Gap**: UsersService directly uses PrismaService instead of UsersRepository. Repository layer is mostly unused. Tests mock PrismaService directly.
- **Test Database**: Testcontainers automatically manages PostgreSQL via Docker
- **RabbitMQ**: E2E tests require RabbitMQ (can also use Testcontainers)
- **Docker Required**: Testcontainers requires Docker Desktop or Docker daemon running
- **Coverage Goals**: Target 80%+ line coverage, 75%+ function coverage
- **CI/CD**: Tests work in GitHub Actions, GitLab CI (Docker-in-Docker supported)
- **Performance**: TRUNCATE strategy provides 10-20x faster test execution vs migrations

---

## Sources & References

This plan is based on 2025 best practices from:

**Testcontainers & NestJS Integration:**
- [GitHub - nest-postgres-testcontainers](https://github.com/andredesousa/nest-postgres-testcontainers)
- [Supercharge Your Integration Tests for NestJS with Testcontainers](https://medium.com/@umakantabehera/supercharge-your-integration-tests-for-nestjs-application-with-testcontainers-751e66119814)
- [Improving Integration/E2E testing using NestJS and TestContainers](https://dev.to/medaymentn/improving-intergratione2e-testing-using-nestjs-and-testcontainers-3eh0)
- [NestJS integration testing with Testcontainers](https://www.blockydevs.com/blog/nestjs-integration-testing-with-testcontainers)
- [Testcontainers Best Practices](https://www.docker.com/blog/testcontainers-best-practices/)
- [Getting started with Testcontainers for Node.js](https://testcontainers.com/guides/getting-started-with-testcontainers-for-nodejs/)

**Database Cleanup Strategies:**
- [Cleaning PostgreSQL DB between Integration Tests Efficiently](https://carbonhealth.com/blog-post/cleaning-postgresql-db-between-integration-tests-efficiently)
- [Understanding database cleaning strategies in tests](https://makandracards.com/makandra/13045-understanding-database-cleaning-strategies-tests)
- [How to run database integration tests 20 times faster](https://vladmihalcea.com/how-to-run-database-integration-tests-20-times-faster/)

**NestJS Testing Best Practices:**
- [NestJS Official Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Best Practices for Testing NestJS Applications in 2025](https://toxigon.com/best-practices-for-testing-nestjs-applications)

---

This plan provides a complete, modern testing setup aligned with NestJS best practices and your specific N-layer architecture with event-driven patterns.
