import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function clearDatabase() {
  console.log('Clearing database...');

  // Delete in reverse order of dependencies
  await prisma.eventHistory.deleteMany();
  await prisma.eventOutbox.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  console.log('✓ Database cleared');
}

async function main() {
  console.log('Starting database seed...');

  // Clear existing data
  await clearDatabase();

  // Seed Event Types
  console.log('Seeding event types...');

  const eventTypes = [
    {
      name: 'user.created',
      description: 'Fired when a new user is created',
      version: 1,
      category: 'user',
    },
    {
      name: 'user.updated',
      description: 'Fired when a user is updated',
      version: 1,
      category: 'user',
    },
    {
      name: 'user.deleted',
      description: 'Fired when a user is deleted',
      version: 1,
      category: 'user',
    },
    {
      name: 'invitation.created',
      description: 'Fired when an invitation is created',
      version: 1,
      category: 'invitation',
    },
    {
      name: 'invitation.accepted',
      description: 'Fired when an invitation is accepted',
      version: 1,
      category: 'invitation',
    },
  ];

  for (const eventType of eventTypes) {
    await prisma.eventType.upsert({
      where: { name: eventType.name },
      update: {
        description: eventType.description,
        schemaVersion: eventType.version,
        category: eventType.category,
      },
      create: {
        name: eventType.name,
        description: eventType.description,
        schemaVersion: eventType.version,
        category: eventType.category,
      },
    });
    console.log(`✓ Event type: ${eventType.name}`);
  }

  // Seed Roles
  console.log('Seeding roles...');

  const roles = [
    {
      id: 'admin-role-id',
      name: 'Admin',
    },
    {
      id: 'user-role-id',
      name: 'User',
    },
    {
      id: 'guest-role-id',
      name: 'Guest',
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {
        name: role.name,
      },
      create: role,
    });
    console.log(`✓ Role: ${role.name}`);
  }

  console.log('Database seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('Error during database seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
