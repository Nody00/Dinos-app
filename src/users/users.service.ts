import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventOutboxService } from '../common/events/outbox/event-outbox.service';
import { UserCreatedEvent } from './events/user-created.event';
import { UserUpdatedEvent } from './events/user-updated.event';
import { UserDeletedEvent } from './events/user-deleted.event';
import { ActorType } from '../common/events/types/actor-type.enum';

interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
}

interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventOutboxService: EventOutboxService,
  ) {}

  async create(dto: CreateUserDto, actorId?: string) {
    return await this.prisma.$transaction(async (tx) => {
      // TODO:
      // HASH PASSWORD
      // CHECK IF EMAIL IS ALREADY IN USE
      // CHECK IF ROLE EXISTS
      // CHECK IF ROLE HAS PERMISSIONS
      // CHECK IF ROLE HAS PERMISSIONS

      // Create user
      const user = await tx.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash: dto.password,
          roleId: dto.roleId,
        },
      });

      // Create event
      const event = new UserCreatedEvent(
        user.id,
        {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId,
        },
        actorId ? ActorType.USER : ActorType.SYSTEM,
        actorId,
      );

      // Record event in outbox
      await this.eventOutboxService.record(event, tx);

      return user;
    });
  }

  async update(userId: string, dto: UpdateUserDto, actorId?: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Get old user data
      const oldUser = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!oldUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Update user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: dto,
      });

      // Determine changed fields
      const changedFields: string[] = [];
      const oldData: Record<string, unknown> = {};
      const newData: Record<string, unknown> = {};

      (Object.keys(dto) as Array<keyof UpdateUserDto>).forEach((key) => {
        if (dto[key] !== undefined && oldUser[key] !== dto[key]) {
          changedFields.push(key);
          oldData[key] = oldUser[key];
          newData[key] = dto[key];
        }
      });

      // Only record event if something actually changed
      if (changedFields.length > 0) {
        const event = new UserUpdatedEvent(
          userId,
          {
            oldData,
            newData,
            changedFields,
          },
          actorId ? ActorType.USER : ActorType.SYSTEM,
          actorId,
        );

        await this.eventOutboxService.record(event, tx);
      }

      return updatedUser;
    });
  }

  async delete(userId: string, actorId?: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Get user data before deletion
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Delete user
      await tx.user.delete({
        where: { id: userId },
      });

      // Create event
      const event = new UserDeletedEvent(
        userId,
        {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        actorId ? ActorType.USER : ActorType.SYSTEM,
        actorId,
      );

      // Record event in outbox
      await this.eventOutboxService.record(event, tx);

      return user;
    });
  }

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }
}
