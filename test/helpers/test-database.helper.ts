import { PrismaClient } from 'generated/prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

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

    this.connectionString = this.container.getConnectionUri();

    process.env.DATABASE_URL = this.connectionString;

    console.log('Deploying migrations...');
    execSync(`pnpm prisma migrate deploy`, {
      env: { ...process.env, DATABASE_URL: this.connectionString },
      stdio: 'inherit',
    });

    await this.seedStaticData();

    console.log('Database setup complete');
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
      adapter: new PrismaPg(
        new Pool({ connectionString: this.connectionString }),
      ),
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
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "invitations" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
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
}
