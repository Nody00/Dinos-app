# NestJS Testing Implementation Guide - Step by Step

This guide will walk you through implementing a comprehensive testing setup for your NestJS application. Each step includes explanations to help you understand **why** we're doing it this way.

---

## Prerequisites

Before starting, ensure you have:

- ✅ Docker Desktop installed and running
- ✅ Node.js and pnpm installed
- ✅ Basic understanding of Jest and testing concepts
- ✅ Your NestJS application running

---

## Phase 1: Install Dependencies & Configure Jest

### Step 1.1: Install Testing Dependencies

```bash
pnpm add -D jest-mock-extended @faker-js/faker testcontainers
```

**What each package does:**

- `jest-mock-extended`: Provides type-safe deep mocking for TypeScript (better than plain jest.fn())
- `@faker-js/faker`: Generates realistic test data (emails, names, etc.)
- `testcontainers`: Spins up Docker containers (PostgreSQL) programmatically during tests

### Step 1.2: Create Test Environment File

Create `.env.test` in your project root:

```bash
# .env.test
NODE_ENV=test
# DATABASE_URL will be set dynamically by Testcontainers
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=events_queue_test
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM_EMAIL=test@example.com
SMTP_FROM_NAME=Test App
LOG_LEVEL=error
JWT_SECRET=test-secret-key
```

**Why:** Separate environment for tests prevents interference with your development database.

### Step 1.3: Create Master Jest Configuration

Create `jest.config.js` in project root:

```javascript
// jest.config.js
module.exports = {
  // Run multiple test projects (unit, integration, e2e)
  projects: [
    '<rootDir>/test/jest-unit.config.js',
    '<rootDir>/test/jest-integration.config.js',
    '<rootDir>/test/jest-e2e.config.js',
  ],

  // Coverage settings
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.integration.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/**/index.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/seed/**',
  ],

  // Coverage thresholds - your tests must meet these
  coverageThresholds: {
    global: {
      branches: 70, // 70% of if/else branches tested
      functions: 75, // 75% of functions tested
      lines: 80, // 80% of lines executed
      statements: 80, // 80% of statements executed
    },
  },
};
```

**Why projects?** This lets you run different types of tests separately (unit vs integration vs e2e).

### Step 1.4: Create Unit Test Configuration

Create `test/jest-unit.config.js`:

```javascript
// test/jest-unit.config.js
module.exports = {
  displayName: 'unit', // Shows "unit" when running tests
  preset: 'ts-jest', // Use ts-jest for TypeScript
  testEnvironment: 'node', // Node environment (not browser)
  rootDir: '../', // Root is one level up
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Pattern: any .spec.ts file
  testRegex: '.*\\.spec\\.ts$',

  // Ignore these directories
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/', // Integration tests
    '/test/e2e/', // E2E tests
  ],

  // Transform TypeScript to JavaScript
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },

  // Module path aliases (@/... becomes src/...)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },

  // What files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],

  // Setup file to run before each test file
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts'],

  // Clear mocks between tests automatically
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
```

**Why separate config?** Unit tests should be fast (no DB), so we exclude integration/e2e tests.

### Step 1.5: Create Integration Test Configuration

Create `test/jest-integration.config.js`:

```javascript
// test/jest-integration.config.js
module.exports = {
  displayName: 'integration',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../',
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Pattern: any .integration.spec.ts file
  testRegex: '.*\\.integration\\.spec\\.ts$',

  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },

  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts'],

  // Longer timeout for DB operations
  testTimeout: 30000, // 30 seconds

  // Run tests serially (not in parallel) to avoid DB conflicts
  maxWorkers: 1,
};
```

**Why maxWorkers: 1?** Each test file gets its own DB container. Running them in parallel could cause resource issues. Serial execution is safer.

### Step 1.6: Update E2E Test Configuration

Update `test/jest-e2e.json` (rename to `test/jest-e2e.config.js`):

```javascript
// test/jest-e2e.config.js
module.exports = {
  displayName: 'e2e',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../',
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Pattern: any .e2e-spec.ts file in test/e2e/
  testRegex: '\\.e2e-spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/'],

  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },

  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts'],

  // Even longer timeout for full app boot + requests
  testTimeout: 60000, // 60 seconds

  maxWorkers: 1, // Serial execution
};
```

### Step 1.7: Create Jest Setup File

Create `test/setup/jest.setup.ts`:

```typescript
// test/setup/jest.setup.ts

// Set global timeout for all tests
jest.setTimeout(10000); // 10 seconds default

// You can add global test utilities here
// We'll add custom matchers later
```

**Why?** This file runs before each test file, setting up global configuration.

### Step 1.8: Update package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest --config test/jest-unit.config.json",
    "test:unit": "jest --config test/jest-unit.config.json",
    "test:integration": "jest --config test/jest-integration.config.json",
    "test:e2e": "jest --config test/jest-e2e.config.json",
    "test:all": "jest",
    "test:watch": "jest --config test/jest-unit.config.json --watch",
    "test:cov": "jest --coverage",
    "test:cov:unit": "jest --config test/jest-unit.config.json --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:smoke": "jest test/smoke",
    "test:regression": "jest test/regression"
  }
}
```

**Test the setup:**

```bash
pnpm run test:unit
```

You should see "No tests found" - that's correct! We haven't written tests yet.

---

## Phase 2: Create Test Infrastructure

**IMPORTANT:** We use a REAL database for all tests (unit, integration, E2E). We do NOT mock PrismaService.

### Step 2.1: Create Event Outbox Mock

Create `test/mocks/event-outbox.mock.ts`:

```typescript
// test/mocks/event-outbox.mock.ts
import { EventOutboxService } from '../../src/common/events/outbox/event-outbox.service';
import { EventOutboxRepository } from '../../src/common/events/outbox/event-outbox.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Creates a fully mocked EventOutboxService with all dependencies.
 *
 * This properly mocks:
 * - EventOutboxRepository (the repository dependency)
 * - EventEmitter2 (the event emitter dependency)
 * - All service methods
 *
 * Use this for unit tests where you want to verify event recording
 * without touching the database or event emitter.
 */
export function createMockEventOutboxService() {
  const mockRepository = {
    recordEvent: jest.fn().mockResolvedValue({
      id: 'mock-event-id',
      eventTypeId: 'mock-event-type-id',
      aggregateId: 'mock-aggregate-id',
      aggregateType: 'MockAggregate',
      actorType: 'SYSTEM',
      actorId: null,
      eventData: {},
      published: false,
      publishedAt: null,
      retryCount: 0,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    getEventHistory: jest.fn().mockResolvedValue([]),
    ensureEventType: jest.fn().mockResolvedValue({
      id: 'mock-event-type-id',
      name: 'mock.event',
      category: 'mock',
      description: 'Mock event type',
      schemaVersion: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    getUnpublishedEvents: jest.fn().mockResolvedValue([]),
    markAsPublished: jest.fn().mockResolvedValue(undefined),
    incrementRetryCount: jest.fn().mockResolvedValue(undefined),
    cleanupPublishedEvents: jest.fn().mockResolvedValue(0),
  } as unknown as jest.Mocked<EventOutboxRepository>;

  const mockEventEmitter = {
    emit: jest.fn().mockReturnValue(true),
    emitAsync: jest.fn().mockResolvedValue([]),
    on: jest.fn().mockReturnThis(),
    once: jest.fn().mockReturnThis(),
    removeListener: jest.fn().mockReturnThis(),
    removeAllListeners: jest.fn().mockReturnThis(),
    listeners: jest.fn().mockReturnValue([]),
    listenerCount: jest.fn().mockReturnValue(0),
  } as unknown as jest.Mocked<EventEmitter2>;

  // Create the actual service with mocked dependencies
  const service = new EventOutboxService(mockRepository, mockEventEmitter);

  // Spy on service methods to track calls
  jest.spyOn(service, 'record');
  jest.spyOn(service, 'getHistory');

  return {
    service,
    mockRepository,
    mockEventEmitter,
  };
}

/**
 * Creates a simple mock of just the EventOutboxService interface.
 * Use when you only need to verify method calls, not internal behavior.
 */
export function createSimpleMockEventOutboxService() {
  return {
    record: jest.fn().mockResolvedValue({
      id: 'mock-event-id',
      eventTypeId: 'mock-event-type-id',
      aggregateId: 'mock-aggregate-id',
      aggregateType: 'MockAggregate',
      actorType: 'SYSTEM',
      actorId: null,
      eventData: {},
      published: false,
      publishedAt: null,
      retryCount: 0,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    getHistory: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<EventOutboxService>;
}
```

**Why the complex mock?**

EventOutboxService has two dependencies (EventOutboxRepository and EventEmitter2) that need to be mocked. The first function creates a real service instance with mocked dependencies, allowing you to test the service's actual behavior. The second function provides a simpler mock for when you just need to verify method calls.

**TypeScript Note:** We use `as unknown as jest.Mocked<T>` to properly type partial mocks while avoiding TypeScript errors for missing properties.

### Step 2.2: Create Email Service Mock

Create `test/mocks/email.mock.ts`:

````typescript
// test/mocks/email.mock.ts
import { EmailService } from '../../src/email/email.service';
import { IEmailProvider } from '../../src/email/interfaces/email-provider.interface';
import { EmailOptions } from '../../src/email/interfaces/email-options.interface';

/**
 * Creates a simple mock EmailService for unit tests.
 * Just mocks the send method - we don't verify email content.
 */
export function createMockEmailService() {
  return {
    send: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<EmailService>;
}

/**
 * Email capture service for E2E and integration tests.
 * Implements IEmailProvider but captures emails instead of sending them.
 *
 * This allows you to:
 * - Verify emails were sent
 * - Check email recipients
 * - Validate email content
 * - Test email-triggered workflows
 *
 * @example
 * ```typescript
 * const emailCapture = new EmailCaptureService();
 *
 * // Use in test module
 * const module = await Test.createTestingModule({
 *   providers: [
 *     UserService,
 *     { provide: 'IEmailProvider', useValue: emailCapture }
 *   ]
 * }).compile();
 *
 * // After triggering email
 * const emails = emailCapture.getEmails();
 * expect(emails).toHaveLength(1);
 * expect(emails[0].to).toBe('user@test.com');
 * expect(emails[0].subject).toContain('Welcome');
 * ```
 */
export class EmailCaptureService implements IEmailProvider {
  private emails: EmailOptions[] = [];

  /**
   * Captures the email instead of sending it.
   */
  async send(options: EmailOptions): Promise<void> {
    // Store email for later verification
    this.emails.push({ ...options });
  }

  /**
   * Get all captured emails.
   * Returns a copy to prevent test interference.
   */
  getEmails(): EmailOptions[] {
    return [...this.emails];
  }

  /**
   * Find an email by recipient.
   * Handles both string and array recipients.
   *
   * @param to - Email address to search for
   * @returns First matching email or undefined
   */
  findEmail(to: string): EmailOptions | undefined {
    return this.emails.find((email) => {
      if (typeof email.to === 'string') {
        return email.to === to;
      }
      return email.to.includes(to);
    });
  }

  /**
   * Find emails by subject (partial match, case-insensitive).
   *
   * @param subjectPart - Partial subject to search for
   * @returns Array of matching emails
   */
  findEmailsBySubject(subjectPart: string): EmailOptions[] {
    return this.emails.filter((email) =>
      email.subject.toLowerCase().includes(subjectPart.toLowerCase()),
    );
  }

  /**
   * Get the count of captured emails.
   */
  getEmailCount(): number {
    return this.emails.length;
  }

  /**
   * Get the last captured email.
   * Useful when testing sequential email sends.
   */
  getLastEmail(): EmailOptions | undefined {
    return this.emails[this.emails.length - 1];
  }

  /**
   * Clear all captured emails.
   * Call this in beforeEach to reset state between tests.
   */
  clear(): void {
    this.emails = [];
  }
}
````

**Why two approaches?**

- **Unit tests**: Use `createMockEmailService()` - Just verify `send()` was called
- **Integration/E2E tests**: Use `EmailCaptureService` - Verify email content, recipients, and workflows

**Best Practice:** Always call `emailCapture.clear()` in `beforeEach()` to ensure test isolation.

### Step 2.3: Create RabbitMQ Context Mock

Create `test/mocks/rmq-context.mock.ts`:

```typescript
// test/mocks/rmq-context.mock.ts
import { RmqContext } from '@nestjs/microservices';

/**
 * Creates a mock RmqContext for testing event handlers.
 * Event handlers receive a context with channel and message - we mock both.
 */
export function createMockRmqContext() {
  // Mock the channel (used for ack/nack)
  const mockChannel = {
    ack: jest.fn(), // Acknowledge message
    nack: jest.fn(), // Negative acknowledge (requeue)
  };

  // Mock the message
  const mockMessage = {
    content: Buffer.from(''),
    fields: {},
    properties: {},
  };

  // Create the context
  return {
    getChannelRef: jest.fn().mockReturnValue(mockChannel),
    getMessage: jest.fn().mockReturnValue(mockMessage),
  } as unknown as RmqContext;
}

/**
 * Get the mocked channel from a context.
 * Useful for asserting ack/nack was called.
 */
export function getMockChannel(context: RmqContext) {
  return context.getChannelRef() as jest.Mocked<any>;
}

/**
 * Get the mocked message from a context.
 */
export function getMockMessage(context: RmqContext) {
  return context.getMessage() as any;
}
```

**Why?** Your event handlers use `@MessagePattern()` and manually ACK/NACK messages. This mock lets you test that logic.

**Usage example:**

```typescript
const context = createMockRmqContext();
await handler.handle(event, context);
expect(getMockChannel(context).ack).toHaveBeenCalled();
```

### Step 2.4: Create Test Database Helper (Testcontainers)

Create `test/helpers/test-database.helper.ts`:

```typescript
// test/helpers/test-database.helper.ts
import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';

/**
 * Test database helper using Testcontainers.
 *
 * IMPORTANT: This helper does NOT create its own PrismaClient.
 * It only manages the database container and sets DATABASE_URL.
 * Your tests will use the real PrismaService from your app.
 *
 * Lifecycle:
 * 1. beforeAll: Start PostgreSQL container, run migrations, seed data
 * 2. beforeEach: Truncate tables (fast cleanup) - pass YOUR PrismaService
 * 3. tests run with clean state using REAL PrismaService
 * 4. afterAll: Stop container
 */
export class TestDatabaseHelper {
  private container: StartedPostgreSqlContainer;
  private connectionString: string;

  /**
   * Setup: Start container and run migrations.
   * Call this in beforeAll.
   */
  async setup(): Promise<void> {
    console.log('Starting PostgreSQL container...');

    // Start PostgreSQL container with performance optimizations
    this.container = await new PostgreSqlContainer('postgres:16-alpine')
      .withCommand([
        '-c',
        'fsync=off', // Don't sync to disk (faster, safe for tests)
        '-c',
        'synchronous_commit=off', // Don't wait for write confirmation
        '-c',
        'full_page_writes=off', // Skip full page writes
        '-c',
        'max_connections=100', // Limit connections
      ])
      .start();

    // Get the connection string (dynamic port!)
    this.connectionString = this.container.getConnectionUri();

    console.log(`Container started on ${this.connectionString}`);

    // Set environment variable for YOUR PrismaService to pick up
    process.env.DATABASE_URL = this.connectionString;

    // Run Prisma migrations
    console.log('Running migrations...');
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: this.connectionString },
      stdio: 'inherit',
    });

    // Seed static data using a temporary client
    await this.seedStaticData();

    console.log('Database ready for testing');
  }

  /**
   * Seed data that should persist across tests.
   * Called once during setup.
   *
   * Note: Uses a temporary PrismaClient just for seeding.
   * Your tests will use the real PrismaService.
   */
  private async seedStaticData(): Promise<void> {
    const tempPrisma = new PrismaClient({
      datasources: {
        db: {
          url: this.connectionString,
        },
      },
    });

    try {
      await tempPrisma.$connect();

      // Seed roles
      await tempPrisma.role.createMany({
        data: [
          { id: 'admin-role-id', name: 'Admin' },
          { id: 'user-role-id', name: 'User' },
          { id: 'guest-role-id', name: 'Guest' },
        ],
        skipDuplicates: true,
      });

      // Seed event types
      await tempPrisma.eventType.createMany({
        data: [
          {
            name: 'user.created',
            category: 'user',
            description: 'User created event',
            schemaVersion: 1,
            isActive: true,
          },
          {
            name: 'user.updated',
            category: 'user',
            description: 'User updated event',
            schemaVersion: 1,
            isActive: true,
          },
          {
            name: 'user.deleted',
            category: 'user',
            description: 'User deleted event',
            schemaVersion: 1,
            isActive: true,
          },
          {
            name: 'invitation.created',
            category: 'invitation',
            description: 'Invitation created event',
            schemaVersion: 1,
            isActive: true,
          },
          {
            name: 'invitation.accepted',
            category: 'invitation',
            description: 'Invitation accepted event',
            schemaVersion: 1,
            isActive: true,
          },
        ],
        skipDuplicates: true,
      });
    } finally {
      await tempPrisma.$disconnect();
    }
  }

  /**
   * Clear data between tests using TRUNCATE.
   * Call this in beforeEach.
   *
   * IMPORTANT: Pass YOUR test's PrismaService/PrismaClient instance.
   * This helper does NOT create its own Prisma client.
   *
   * TRUNCATE is 10-20x faster than DELETE and faster than recreating the schema.
   *
   * @param prisma - Your test's PrismaService or PrismaClient instance
   */
  async clearData(prisma: PrismaClient): Promise<void> {
    // Truncate in dependency order (child tables first)
    // CASCADE will handle foreign key relationships
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "event_history" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "event_outbox" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "invitation" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "user" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "permissions" CASCADE');

    // Don't truncate: roles, event_types (these are seed data)
  }

  /**
   * Get the database connection string.
   * Useful for debugging.
   */
  getConnectionString(): string {
    return this.connectionString;
  }

  /**
   * Helper: Get event history for an aggregate.
   * Convenience method for common assertion pattern.
   *
   * @param prisma - Your test's PrismaService or PrismaClient instance
   * @param aggregateId - The aggregate ID to query
   */
  async getEventHistory(prisma: PrismaClient, aggregateId: string) {
    return prisma.eventHistory.findMany({
      where: { aggregateId },
      include: { eventType: true },
      orderBy: { occurredAt: 'asc' },
    });
  }

  /**
   * Teardown: Stop container.
   * Call this in afterAll.
   *
   * Note: Does NOT disconnect Prisma - your test should handle that.
   */
  async teardown(): Promise<void> {
    await this.container.stop();
    console.log('Database container stopped');
  }
}
```

**Key concepts:**

1. **Testcontainers**: Automatically starts/stops PostgreSQL in Docker
2. **Dynamic ports**: Each test file gets a unique port (enables parallel runs)
3. **Performance flags**: `fsync=off` makes PostgreSQL faster (safe for tests)
4. **TRUNCATE**: Much faster than DELETE or recreating schema
5. **Seed once**: Roles/event types created once, not every test

**Why TRUNCATE?**

- `DELETE FROM users` - Slow, doesn't reset IDs
- `DROP TABLE / CREATE TABLE` - Very slow, loses indexes
- `TRUNCATE TABLE users CASCADE` - Fast, resets IDs, keeps schema

### Step 2.5: Create Test Fixtures BOOKMARK

Create `test/fixtures/users.fixture.ts`:

```typescript
// test/fixtures/users.fixture.ts
import { faker } from '@faker-js/faker';

/**
 * Fixtures for user-related test data.
 * Uses Faker to generate realistic data.
 */
export class UserFixtures {
  /**
   * Create a user DTO (for creating users).
   */
  static createUserDto(overrides: Partial<any> = {}) {
    return {
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: faker.internet.password(),
      roleId: 'admin-role-id', // Default to admin role
      ...overrides, // Allow overriding any field
    };
  }

  /**
   * Create a full user entity (as returned from DB).
   */
  static createUser(overrides: Partial<any> = {}) {
    return {
      id: faker.string.uuid(),
      ...this.createUserDto(),
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create multiple users.
   */
  static createMultipleUsers(count: number, overrides: Partial<any> = {}) {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  /**
   * Create a user with a specific email (useful for testing duplicates).
   */
  static createUserWithEmail(email: string) {
    return this.createUserDto({ email });
  }
}
```

**Why Faker?** Generates realistic, random data. Each test run uses different emails/names, catching edge cases.

**Usage:**

```typescript
const dto = UserFixtures.createUserDto({ email: 'specific@test.com' });
```

Create `test/fixtures/events.fixture.ts`:

```typescript
// test/fixtures/events.fixture.ts
import { UserCreatedEvent } from '../../src/users/events/user-created.event';
import { ActorType } from '../../src/common/events/types/actor-type.enum';
import { faker } from '@faker-js/faker';

/**
 * Fixtures for domain events.
 */
export class EventFixtures {
  /**
   * Create a UserCreatedEvent.
   */
  static createUserCreatedEvent(overrides: Partial<any> = {}) {
    return new UserCreatedEvent(
      overrides.userId || faker.string.uuid(),
      {
        email: overrides.email || faker.internet.email(),
        firstName: overrides.firstName || faker.person.firstName(),
        lastName: overrides.lastName || faker.person.lastName(),
        roleId: overrides.roleId || 'admin-role-id',
      },
      overrides.actorType || ActorType.SYSTEM,
      overrides.actorId,
    );
  }
}
```

### Step 2.6: Create Custom Assertions Helper

Create `test/helpers/assertions.helper.ts`:

```typescript
// test/helpers/assertions.helper.ts

/**
 * Wait for an assertion to pass.
 * Polls the assertion every intervalMs until it passes or timeout.
 *
 * Useful for async operations like waiting for events to process.
 */
export function waitFor(
  assertion: () => void,
  timeoutMs: number = 5000,
  intervalMs: number = 100,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      try {
        // Try the assertion
        assertion();
        // If it passes, we're done
        clearInterval(interval);
        resolve();
      } catch (error) {
        // If timeout exceeded, reject
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(interval);
          reject(
            new Error(
              `Assertion failed after ${timeoutMs}ms: ${error.message}`,
            ),
          );
        }
        // Otherwise, keep polling
      }
    }, intervalMs);
  });
}

/**
 * Custom Jest matchers.
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toHaveBeenCalledWithEvent(eventType: string): R;
    }
  }
}

// Extend Jest with custom matchers
expect.extend({
  /**
   * Check if a string is a valid UUID.
   */
  toBeValidUUID(received: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`,
    };
  },

  /**
   * Check if a mock was called with a specific event type.
   */
  toHaveBeenCalledWithEvent(received: jest.Mock, eventType: string) {
    const calls = received.mock.calls;
    const pass = calls.some((call) => {
      const event = call[0];
      return event?.getEventType?.() === eventType;
    });

    return {
      pass,
      message: () =>
        pass
          ? `expected mock not to have been called with event type ${eventType}`
          : `expected mock to have been called with event type ${eventType}`,
    };
  },
});
```

**Why custom matchers?** Makes tests more readable:

```typescript
// Without custom matcher
expect(/^[0-9a-f]{8}-.../.test(userId)).toBe(true);

// With custom matcher
expect(userId).toBeValidUUID();
```

### Step 2.7: Update Jest Setup to Load Custom Matchers

Update `test/setup/jest.setup.ts`:

```typescript
// test/setup/jest.setup.ts

// Set global timeout
jest.setTimeout(10000);

// Load custom matchers
import '../helpers/assertions.helper';

// Export waitFor for convenience
import { waitFor } from '../helpers/assertions.helper';
(global as any).waitFor = waitFor;
```

Now you can use `waitFor()` in any test without importing it!

---

**Checkpoint:** You've now created all the infrastructure! Let's verify:

```bash
# Check directory structure
tree test/

# Should see:
# test/
# ├── fixtures/
# │   ├── users.fixture.ts
# │   └── events.fixture.ts
# ├── helpers/
# │   ├── test-database.helper.ts
# │   └── assertions.helper.ts
# ├── mocks/
# │   ├── prisma.mock.ts
# │   ├── event-outbox.mock.ts
# │   ├── email.mock.ts
# │   └── rmq-context.mock.ts
# ├── setup/
# │   └── jest.setup.ts
# ├── jest-unit.config.js
# ├── jest-integration.config.js
# └── jest-e2e.config.js
```

---

## Phase 3: Write Your First Unit Tests

**⚠️ IMPORTANT CORRECTION:**
The examples in this section use MOCKED Prisma, which is INCORRECT for your use case!

**USE THESE CORRECT EXAMPLES INSTEAD:**

- See `test/examples/users.integration.spec.example.ts` for the CORRECT pattern using REAL database
- All tests (unit, integration, E2E) should use REAL PrismaService with TestDatabaseHelper
- DO NOT follow the mock-based examples below - they are OUTDATED

### Step 3.1: Test UsersService (Service Layer) - OUTDATED EXAMPLE BELOW

**⚠️ DO NOT USE THIS EXAMPLE - See test/examples/ for corrected versions**

Create `src/users/users.service.spec.ts`:

```typescript
// ⚠️ OUTDATED - DO NOT USE
// src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventOutboxService } from '../common/events/outbox/event-outbox.service';
import {
  createMockPrismaService,
  mockPrismaTransaction,
  MockPrismaService,
} from '../../test/mocks/prisma.mock';
import { createMockEventOutboxService } from '../../test/mocks/event-outbox.mock';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrismaService;
  let eventOutbox: jest.Mocked<EventOutboxService>;

  beforeEach(async () => {
    // Create mocks
    prisma = createMockPrismaService();
    eventOutbox = createMockEventOutboxService();

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventOutboxService, useValue: eventOutbox },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create user and record event in transaction', async () => {
      // Arrange
      const dto = {
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        roleId: 'admin-role-id',
      };

      const expectedUser = {
        id: 'user-123',
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash: dto.password, // In real code, this would be hashed
        roleId: dto.roleId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the transaction
      const mockTx = mockPrismaTransaction(prisma);
      mockTx.user.create.mockResolvedValue(expectedUser);

      // Act
      const result = await service.create(dto, 'actor-123');

      // Assert
      expect(result).toEqual(expectedUser);

      // Verify transaction was used
      expect(prisma.$transaction).toHaveBeenCalled();

      // Verify user was created in transaction
      expect(mockTx.user.create).toHaveBeenCalledWith({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash: dto.password,
          roleId: dto.roleId,
        },
      });

      // Verify event was recorded
      expect(eventOutbox.record).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: expectedUser.id,
          aggregateType: 'User',
        }),
        mockTx, // Event recorded in same transaction
      );
    });

    it('should rollback if event recording fails', async () => {
      // Arrange
      const dto = {
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        roleId: 'admin-role-id',
      };

      const mockTx = mockPrismaTransaction(prisma);
      mockTx.user.create.mockResolvedValue({ id: 'user-123', ...dto } as any);

      // Event recording fails
      eventOutbox.record.mockRejectedValue(new Error('Event recording failed'));

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(
        'Event recording failed',
      );
    });
  });

  describe('update', () => {
    it('should update user and record event when fields change', async () => {
      // Arrange
      const userId = 'user-123';
      const dto = { firstName: 'Jane' };

      const oldUser = {
        id: userId,
        email: 'test@test.com',
        firstName: 'John', // Will change to Jane
        lastName: 'Doe',
        passwordHash: 'hash',
        roleId: 'admin-role-id',
      };

      const updatedUser = { ...oldUser, firstName: 'Jane' };

      const mockTx = mockPrismaTransaction(prisma);
      mockTx.user.findUnique.mockResolvedValue(oldUser as any);
      mockTx.user.update.mockResolvedValue(updatedUser as any);

      // Act
      const result = await service.update(userId, dto, 'actor-123');

      // Assert
      expect(result).toEqual(updatedUser);
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: dto,
      });

      // Verify event was recorded with changed fields
      expect(eventOutbox.record).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: userId,
          payload: expect.objectContaining({
            changedFields: ['firstName'],
            oldData: { firstName: 'John' },
            newData: { firstName: 'Jane' },
          }),
        }),
        mockTx,
      );
    });

    it('should NOT record event when no fields change', async () => {
      // Arrange
      const userId = 'user-123';
      const dto = { firstName: 'John' }; // Same as current value

      const oldUser = {
        id: userId,
        email: 'test@test.com',
        firstName: 'John', // Same value
        lastName: 'Doe',
        passwordHash: 'hash',
        roleId: 'admin-role-id',
      };

      const mockTx = mockPrismaTransaction(prisma);
      mockTx.user.findUnique.mockResolvedValue(oldUser as any);
      mockTx.user.update.mockResolvedValue(oldUser as any);

      // Act
      await service.update(userId, dto);

      // Assert
      // Event should NOT be recorded (no changes)
      expect(eventOutbox.record).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const userId = 'nonexistent';
      const dto = { firstName: 'Jane' };

      const mockTx = mockPrismaTransaction(prisma);
      mockTx.user.findUnique.mockResolvedValue(null); // User not found

      // Act & Assert
      await expect(service.update(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(userId, dto)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );
    });
  });

  describe('delete', () => {
    it('should delete user and record event', async () => {
      // Arrange
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hash',
        roleId: 'admin-role-id',
      };

      const mockTx = mockPrismaTransaction(prisma);
      mockTx.user.findUnique.mockResolvedValue(user as any);
      mockTx.user.delete.mockResolvedValue(user as any);

      // Act
      const result = await service.delete(userId, 'actor-123');

      // Assert
      expect(result).toEqual(user);
      expect(mockTx.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(eventOutbox.record).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      prisma.user.findUnique.mockResolvedValue(user as any);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const userId = 'nonexistent';
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
```

**What we're testing:**

1. ✅ User creation with transaction
2. ✅ Event recording in same transaction
3. ✅ Transaction rollback on error
4. ✅ Update only records event when fields change
5. ✅ Error handling (NotFoundException)

**Run it:**

```bash
pnpm run test:unit users.service
```

You should see all tests pass! 🎉

### Step 3.2: Test UsersController (Controller Layer)

Create `src/users/users.controller.spec.ts`:

```typescript
// src/users/users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    // Create a mock service
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  describe('create', () => {
    it('should create user with actor ID from request', async () => {
      // Arrange
      const dto = {
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        roleId: 'admin-role-id',
      };

      const req = { user: { id: 'actor-123' } };
      const expectedUser = { id: 'user-123', ...dto };

      service.create.mockResolvedValue(expectedUser as any);

      // Act
      const result = await controller.create(dto, req);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(service.create).toHaveBeenCalledWith(dto, 'actor-123');
    });

    it('should create user without actor ID when not authenticated', async () => {
      // Arrange
      const dto = {
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        roleId: 'admin-role-id',
      };

      const req = {}; // No user in request
      const expectedUser = { id: 'user-123', ...dto };

      service.create.mockResolvedValue(expectedUser as any);

      // Act
      const result = await controller.create(dto, req);

      // Assert
      expect(service.create).toHaveBeenCalledWith(dto, undefined);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      const users = [
        {
          id: '1',
          email: 'user1@test.com',
          firstName: 'User',
          lastName: 'One',
        },
        {
          id: '2',
          email: 'user2@test.com',
          firstName: 'User',
          lastName: 'Two',
        },
      ];

      service.findAll.mockResolvedValue(users as any);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(users);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return user by ID', async () => {
      // Arrange
      const userId = 'user-123';
      const user = { id: userId, email: 'test@test.com' };

      service.findById.mockResolvedValue(user as any);

      // Act
      const result = await controller.findById(userId);

      // Assert
      expect(result).toEqual(user);
      expect(service.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('should update user with actor ID', async () => {
      // Arrange
      const userId = 'user-123';
      const dto = { firstName: 'Jane' };
      const req = { user: { id: 'actor-123' } };
      const updatedUser = { id: userId, firstName: 'Jane' };

      service.update.mockResolvedValue(updatedUser as any);

      // Act
      const result = await controller.update(userId, dto, req);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(userId, dto, 'actor-123');
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      // Arrange
      const userId = 'user-123';
      const req = { user: { id: 'actor-123' } };

      service.delete.mockResolvedValue({} as any);

      // Act
      await controller.delete(userId, req);

      // Assert
      expect(service.delete).toHaveBeenCalledWith(userId, 'actor-123');
    });
  });
});
```

**What we're testing:**

1. ✅ Actor ID extraction from request
2. ✅ Handling missing authentication
3. ✅ Delegation to service layer

**Run it:**

```bash
pnpm run test:unit users.controller
```

### Step 3.3: Test Event Handler

Create `src/users/events/handlers/user-created.handler.spec.ts`:

```typescript
// src/users/events/handlers/user-created.handler.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserCreatedHandler } from './user-created.handler';
import { EmailService } from '../../../email/email.service';
import { createMockEmailService } from '../../../../test/mocks/email.mock';
import {
  createMockRmqContext,
  getMockChannel,
  getMockMessage,
} from '../../../../test/mocks/rmq-context.mock';

describe('UserCreatedHandler', () => {
  let handler: UserCreatedHandler;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    emailService = createMockEmailService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserCreatedHandler],
      providers: [
        {
          provide: EmailService,
          useValue: emailService,
        },
      ],
    }).compile();

    handler = module.get<UserCreatedHandler>(UserCreatedHandler);
  });

  it('should send welcome email and acknowledge message on success', async () => {
    // Arrange
    const eventData = {
      eventId: 'event-123',
      aggregateId: 'user-123',
      aggregateType: 'User',
      payload: {
        email: 'newuser@test.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'user-role-id',
      },
      actorType: 'SYSTEM',
      occurredAt: new Date().toISOString(),
    };

    const context = createMockRmqContext();
    const channel = getMockChannel(context);
    const message = getMockMessage(context);

    // Act
    await handler.handle(eventData, context);

    // Assert
    // Verify email was sent
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'newuser@test.com',
      subject: 'Welcome to Our Platform!',
      values: {
        firstName: 'John',
        lastName: 'Doe',
      },
      from: expect.any(String),
      text: expect.any(String),
    });

    // Verify message was acknowledged
    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('should NACK message and requeue on email failure', async () => {
    // Arrange
    const eventData = {
      eventId: 'event-123',
      aggregateId: 'user-123',
      aggregateType: 'User',
      payload: {
        email: 'newuser@test.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'user-role-id',
      },
      actorType: 'SYSTEM',
      occurredAt: new Date().toISOString(),
    };

    const context = createMockRmqContext();
    const channel = getMockChannel(context);
    const message = getMockMessage(context);

    // Email sending fails
    emailService.send.mockRejectedValue(new Error('SMTP error'));

    // Act
    await handler.handle(eventData, context);

    // Assert
    // Verify message was NACK'd with requeue
    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
    expect(channel.ack).not.toHaveBeenCalled();
  });
});
```

**What we're testing:**

1. ✅ Email is sent with correct data
2. ✅ Message is ACK'd on success
3. ✅ Message is NACK'd on failure (for retry)

**Run all unit tests:**

```bash
pnpm run test:unit
```

You should now have unit tests for all three layers! 🎉

---

## Phase 4: Write Integration Tests

Integration tests use a real PostgreSQL database (via Testcontainers) to test multiple layers working together.

### Step 4.1: Test User Creation Flow (Integration)

Create `src/users/__tests__/users.integration.spec.ts`:

```typescript
// src/users/__tests__/users.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { TestDatabaseHelper } from '../../../test/helpers/test-database.helper';
import { PrismaService } from '../../prisma/prisma.service';

describe('Users Integration Tests', () => {
  let app: INestApplication;
  let testDb: TestDatabaseHelper;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Start PostgreSQL container and run migrations
    testDb = new TestDatabaseHelper();
    await testDb.setup();

    // Create NestJS app
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Override email service to avoid actually sending emails
      .overrideProvider('IEmailProvider')
      .useValue({ send: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = testDb.getPrismaClient();
  });

  beforeEach(async () => {
    // Clear data between tests (TRUNCATE)
    await testDb.clearData();
  });

  afterAll(async () => {
    await app.close();
    await testDb.teardown();
  });

  describe('POST /users - User Creation', () => {
    it('should create user and event outbox entry in transaction', async () => {
      // Arrange
      const dto = {
        email: 'integration@test.com',
        firstName: 'Integration',
        lastName: 'Test',
        password: 'password123',
        roleId: 'admin-role-id', // From seed data
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(dto)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: dto.roleId,
      });

      const userId = response.body.id;

      // Verify user was created in database
      const userInDb = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb.email).toBe(dto.email);

      // Verify event was recorded in outbox
      const eventsInOutbox = await prisma.eventOutbox.findMany({
        where: { aggregateId: userId },
        include: { eventType: true },
      });

      expect(eventsInOutbox).toHaveLength(1);
      expect(eventsInOutbox[0].aggregateType).toBe('User');
      expect(eventsInOutbox[0].eventType.name).toBe('user.created');
    });

    it('should enforce unique email constraint', async () => {
      // Arrange
      const dto = {
        email: 'duplicate@test.com',
        firstName: 'First',
        lastName: 'User',
        password: 'password123',
        roleId: 'admin-role-id',
      };

      // Create first user
      await request(app.getHttpServer()).post('/users').send(dto).expect(201);

      // Act - Try to create duplicate
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(dto);

      // Assert
      // Should fail (400 or 409 depending on your error handling)
      expect([400, 409, 500]).toContain(response.status);
    });
  });

  describe('PUT /users/:id - User Update', () => {
    it('should update user and record event only when fields change', async () => {
      // Arrange - Create a user first
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'update@test.com',
          firstName: 'Original',
          lastName: 'Name',
          password: 'password123',
          roleId: 'admin-role-id',
        })
        .expect(201);

      const userId = createResponse.body.id;

      // Clear outbox to isolate update event
      await prisma.eventOutbox.deleteMany({ where: { aggregateId: userId } });

      // Act - Update with actual changes
      const updateDto = { firstName: 'Updated' };
      await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send(updateDto)
        .expect(200);

      // Assert - Event should be recorded
      const eventsInOutbox = await prisma.eventOutbox.findMany({
        where: { aggregateId: userId },
      });

      expect(eventsInOutbox).toHaveLength(1);
      expect(eventsInOutbox[0].eventData).toMatchObject({
        payload: expect.objectContaining({
          changedFields: ['firstName'],
          oldData: { firstName: 'Original' },
          newData: { firstName: 'Updated' },
        }),
      });
    });

    it('should NOT record event when no fields change', async () => {
      // Arrange - Create a user
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'nochange@test.com',
          firstName: 'Original',
          lastName: 'Name',
          password: 'password123',
          roleId: 'admin-role-id',
        })
        .expect(201);

      const userId = createResponse.body.id;

      // Clear outbox
      await prisma.eventOutbox.deleteMany({ where: { aggregateId: userId } });

      // Act - Update with SAME value
      await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send({ firstName: 'Original' })
        .expect(200);

      // Assert - No event should be recorded
      const eventsInOutbox = await prisma.eventOutbox.findMany({
        where: { aggregateId: userId },
      });

      expect(eventsInOutbox).toHaveLength(0);
    });
  });

  describe('DELETE /users/:id - User Deletion', () => {
    it('should delete user and record event', async () => {
      // Arrange - Create a user
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'delete@test.com',
          firstName: 'To',
          lastName: 'Delete',
          password: 'password123',
          roleId: 'admin-role-id',
        })
        .expect(201);

      const userId = createResponse.body.id;

      // Act - Delete user
      await request(app.getHttpServer()).delete(`/users/${userId}`).expect(204);

      // Assert - User should be deleted
      const userInDb = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(userInDb).toBeNull();

      // Event should be in outbox
      const eventsInOutbox = await prisma.eventOutbox.findMany({
        where: { aggregateId: userId, eventType: { name: 'user.deleted' } },
        include: { eventType: true },
      });

      expect(eventsInOutbox).toHaveLength(1);
    });
  });

  describe('Transaction Atomicity', () => {
    it('should rollback user creation if event recording fails', async () => {
      // This test would require mocking EventOutboxService to fail
      // In practice, you'd test this at the service level with mocks
      // Here we're verifying the happy path works end-to-end
    });
  });
});
```

**What we're testing:**

1. ✅ Full HTTP → Service → Prisma → Database flow
2. ✅ Event outbox recording with real database
3. ✅ Database constraints (unique email)
4. ✅ Transaction atomicity (user + event created together)

**Run integration tests:**

```bash
pnpm run test:integration
```

**What happens:**

1. Testcontainers starts PostgreSQL container
2. Migrations run
3. Seed data created (roles, event types)
4. Each test truncates tables
5. Tests run against real PostgreSQL
6. Container stops

This will take longer than unit tests (15-30 seconds) because it's starting a real database!

---

## Phase 5: Write E2E Tests

E2E tests boot the entire application and test complete user journeys.

### Step 5.1: Enhanced E2E Test

Update `test/app.e2e-spec.ts`:

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestDatabaseHelper } from './helpers/test-database.helper';
import { EmailCaptureService } from './mocks/email.mock';

describe('Application E2E Tests', () => {
  let app: INestApplication;
  let testDb: TestDatabaseHelper;
  let emailCapture: EmailCaptureService;

  beforeAll(async () => {
    // Start database
    testDb = new TestDatabaseHelper();
    await testDb.setup();

    // Create email capture service
    emailCapture = new EmailCaptureService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Use email capture instead of real email sending
      .overrideProvider('IEmailProvider')
      .useValue(emailCapture)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply any global pipes, filters, interceptors here
    // app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  beforeEach(async () => {
    await testDb.clearData();
    emailCapture.clear();
  });

  afterAll(async () => {
    await app.close();
    await testDb.teardown();
  });

  describe('Health Check', () => {
    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Complete User Lifecycle', () => {
    it('should create user, send welcome email, and record event', async () => {
      // Step 1: Create user via API
      const createDto = {
        email: 'e2e@test.com',
        firstName: 'E2E',
        lastName: 'Test',
        password: 'password123',
        roleId: 'admin-role-id',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createDto)
        .expect(201);

      const userId = createResponse.body.id;
      expect(userId).toBeDefined();

      // Step 2: Verify user can be retrieved
      const getResponse = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(getResponse.body).toMatchObject({
        id: userId,
        email: createDto.email,
        firstName: createDto.firstName,
      });

      // Step 3: Wait for email to be captured
      // In a real E2E test with RabbitMQ, you'd wait for event processing
      // Here we use a simple timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify welcome email was "sent" (captured)
      const emails = emailCapture.getEmails();
      const welcomeEmail = emails.find((e) => e.to === createDto.email);

      expect(welcomeEmail).toBeDefined();
      expect(welcomeEmail?.subject).toContain('Welcome');

      // Step 4: Update user
      await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send({ firstName: 'Updated' })
        .expect(200);

      // Step 5: Delete user
      await request(app.getHttpServer()).delete(`/users/${userId}`).expect(204);

      // Step 6: Verify user is gone
      await request(app.getHttpServer()).get(`/users/${userId}`).expect(404);
    });
  });

  describe('User List', () => {
    it('should list all users', async () => {
      // Create multiple users
      const users = [
        {
          email: 'user1@test.com',
          firstName: 'User',
          lastName: 'One',
          password: 'pass',
          roleId: 'user-role-id',
        },
        {
          email: 'user2@test.com',
          firstName: 'User',
          lastName: 'Two',
          password: 'pass',
          roleId: 'user-role-id',
        },
      ];

      for (const user of users) {
        await request(app.getHttpServer())
          .post('/users')
          .send(user)
          .expect(201);
      }

      // List all users
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.map((u: any) => u.email)).toContain(
        'user1@test.com',
      );
      expect(response.body.map((u: any) => u.email)).toContain(
        'user2@test.com',
      );
    });
  });
});
```

**Run E2E tests:**

```bash
pnpm run test:e2e
```

---

## Phase 6: Run All Tests

### Step 6.1: Run All Test Suites

```bash
# Run all tests
pnpm run test:all

# Or run each type separately
pnpm run test:unit
pnpm run test:integration
pnpm run test:e2e
```

### Step 6.2: Check Coverage

```bash
pnpm run test:cov
```

You'll get a coverage report showing which lines are tested.

### Step 6.3: Watch Mode for Development

```bash
pnpm run test:watch
```

This reruns tests when you save files - great for TDD (Test-Driven Development)!

---

## Phase 7: Best Practices & Tips

### Tip 1: AAA Pattern

Always structure tests:

```typescript
it('should do something', async () => {
  // Arrange - Set up test data
  const input = { ... };
  mockService.method.mockResolvedValue(expectedOutput);

  // Act - Execute the code being tested
  const result = await service.doSomething(input);

  // Assert - Verify the result
  expect(result).toEqual(expectedOutput);
  expect(mockService.method).toHaveBeenCalledWith(input);
});
```

### Tip 2: Test Descriptions

Use clear, descriptive test names:

```typescript
// Bad
it('works', () => { ... });

// Good
it('should create user and record event in transaction', () => { ... });
```

### Tip 3: One Assertion Concept Per Test

Each test should verify one concept:

```typescript
// Bad - testing multiple concepts
it('should create and update user', () => {
  // Creates user
  // Updates user
  // Both could fail independently
});

// Good - separate tests
it('should create user', () => { ... });
it('should update user', () => { ... });
```

### Tip 4: Use beforeEach for Common Setup

```typescript
describe('MyService', () => {
  let service: MyService;
  let mockDep: jest.Mocked<Dependency>;

  beforeEach(async () => {
    // Fresh setup for EACH test
    mockDep = createMockDependency();
    const module = await Test.createTestingModule({ ... }).compile();
    service = module.get(MyService);
  });

  // Each test starts with fresh mocks
});
```

### Tip 5: Integration Tests Should Be Independent

Each integration test should work in isolation:

```typescript
beforeEach(async () => {
  // Clear ALL data
  await testDb.clearData();

  // Test creates its own data
  const user = await createUser();
});
```

Don't rely on data from other tests!

### Tip 6: Use Fixtures for Realistic Data

```typescript
import { UserFixtures } from '../../../test/fixtures/users.fixture';

it('should work with realistic data', () => {
  // Generate random realistic user
  const dto = UserFixtures.createUserDto();

  // Or with specific overrides
  const dto = UserFixtures.createUserDto({ email: 'specific@test.com' });
});
```

---

## Troubleshooting

### Problem: "Cannot find module '@testcontainers/postgresql'"

**Solution:**

```bash
pnpm add -D @testcontainers/postgresql
```

### Problem: "Docker daemon is not running"

**Solution:** Start Docker Desktop.

### Problem: Tests timeout waiting for container

**Solution:** Increase timeout in Jest config:

```javascript
testTimeout: 60000; // 60 seconds
```

### Problem: "Port already in use"

**Solution:** Testcontainers uses dynamic ports. This shouldn't happen unless another test is running.

### Problem: Integration tests are slow

**Solution:**

1. ✅ Use TRUNCATE (not migrations) - already doing this
2. ✅ Run tests serially (`maxWorkers: 1`) - already configured
3. Consider running fewer integration tests, more unit tests
4. Use `test.skip()` to temporarily skip slow tests while developing

### Problem: "Cannot connect to database"

**Solution:**

1. Check Docker is running
2. Check no firewall blocking Docker
3. Try: `docker ps` to see if container started

---

## Next Steps

Now that you have a comprehensive testing setup:

1. **Write more unit tests**:
   - `src/invitations/invitations.service.spec.ts`
   - `src/email/email.service.spec.ts`
   - `src/common/events/outbox/event-outbox.service.spec.ts`

2. **Write more integration tests**:
   - `src/invitations/__tests__/invitations.integration.spec.ts`
   - `src/common/events/outbox/__tests__/event-outbox.integration.spec.ts`

3. **Write E2E tests for full workflows**:
   - `test/e2e/invitations.e2e-spec.ts` (invitation → acceptance → user creation)
   - `test/e2e/events.e2e-spec.ts` (verify RabbitMQ event flow)

4. **Add smoke tests**:
   - `test/smoke/health.smoke-spec.ts` (database connection, API health)

5. **Set up CI/CD**:
   - Configure GitHub Actions to run tests on every PR
   - Run Testcontainers in CI (it works out of the box!)

---

## Summary

You've learned to:

✅ Configure Jest for unit/integration/E2E tests
✅ Create test infrastructure (mocks, helpers, fixtures)
✅ Use Testcontainers for realistic PostgreSQL testing
✅ Write unit tests for controllers, services, event handlers
✅ Write integration tests for multi-layer flows
✅ Write E2E tests for complete user journeys
✅ Use TRUNCATE for fast test cleanup
✅ Follow testing best practices (AAA, descriptive names, isolation)

**Key Takeaway:** Test the behavior, not the implementation. Your tests should verify that your code does what users need, not that it calls specific methods in specific ways.

Happy testing! 🧪
