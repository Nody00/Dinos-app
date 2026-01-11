import { UsersRepository } from './users.repository';
import { EventOutboxService } from 'src/common/events/outbox/event-outbox.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { TestDatabaseHelper } from 'test/helpers/test-database.helper';
import { UsersFixture } from 'test/fixtures/users.fixture';
import { EventOutboxRepository } from 'src/common/events/outbox/event-outbox.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '../../generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

describe('UsersRepository', () => {
  let usersRepository: UsersRepository;
  let prisma: PrismaService;
  let usersFixture: UsersFixture;
  let dbHelper: TestDatabaseHelper;
  let prismaClient: PrismaClient;

  beforeAll(async () => {
    dbHelper = new TestDatabaseHelper();
    await dbHelper.setup();

    prismaClient = new PrismaClient({
      adapter: new PrismaPg(
        new Pool({ connectionString: dbHelper.getConnectionString() }),
      ),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        PrismaService,
        EventOutboxService,
        {
          provide: EventOutboxRepository,
          useValue: {
            create: vi.fn(),
            findPending: vi.fn(),
            markAsProcessed: vi.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: vi.fn(),
            emitAsync: vi.fn(),
          },
        },
      ],
    }).compile();

    usersRepository = module.get<UsersRepository>(UsersRepository);
    prisma = module.get<PrismaService>(PrismaService);

    usersFixture = new UsersFixture(prisma);
  });

  afterAll(async () => {
    await dbHelper.clearData(prismaClient);
  });

  describe('find by id', () => {
    it('should find a user by id', async () => {
      const createUserDto = usersFixture.createUserDto();
      const createdUser = await usersFixture.createUser(prisma, createUserDto);

      const user = await usersRepository.findById(createdUser.id);
      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
    });
  });
});
