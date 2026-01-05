import { Injectable, NotFoundException } from '@nestjs/common';
import { InvitationsRepository } from './invitations.repository';

@Injectable()
export class InvitationsService {
  constructor(private readonly invitationsRepository: InvitationsRepository) {}

  async create(email: string, roleId: string, createdBy: string) {
    // const role = await this.rolesRepository.findById(roleId);
    // if (!role) {
    //   throw new NotFoundException('Role not found');
    // }
  }

  async resend(id: string) {}

  async revoke(id: string) {}

  async findAll() {
    return this.invitationsRepository.findAll();
  }

  async findById(id: string) {
    return this.invitationsRepository.findById(id);
  }
}
