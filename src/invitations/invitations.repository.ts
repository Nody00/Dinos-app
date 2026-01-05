import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Invitation } from 'generated/prisma/client';

@Injectable()
export class InvitationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    email: string,
    roleId: string,
    createdBy: string,
  ): Promise<Invitation> {
    return await this.prisma.invitation.create({
      data: { email, roleId, createdById: createdBy },
    });
  }

  async findAll() {
    return this.prisma.invitation.findMany();
  }

  async findById(id: string) {
    return this.prisma.invitation.findUnique({ where: { id } });
  }
}
