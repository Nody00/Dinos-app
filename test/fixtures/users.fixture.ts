import { faker } from '@faker-js/faker';
import { Prisma, User } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

/**
 * Fixtures for user-related test data.
 * Uses Faker to generate realistic data.
 */
export class UsersFixture {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a user DTO for creation.
   */
  createUserDto(overrides: Partial<CreateUserDto> = {}): CreateUserDto {
    return {
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: faker.internet.password(),
      roleId: 'user-role-id', // Use seeded role ID from test-database.helper
      ...overrides,
    };
  }

  async createUser(prisma: PrismaService, dto: CreateUserDto): Promise<User> {
    return await prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash: dto.password,
        roleId: dto.roleId,
      },
    });
  }

  /**
   * Create multiple users.
   */
  async createMultipleUsers(
    prisma: PrismaService,
    count: number,
    overrides: Partial<CreateUserDto> = {},
  ): Promise<Prisma.BatchPayload> {
    const users = Array.from({ length: count }, () =>
      this.createUserDto(overrides),
    );

    return await prisma.user.createMany({
      data: users.map((user) => ({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        passwordHash: user.password,
        roleId: user.roleId,
      })),
    });
  }
}
