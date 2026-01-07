import { Injectable } from '@nestjs/common';
import { EventOutboxRepository } from './event-outbox.repository';
import { DomainEvent } from '../base/domain-event.base';
import { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class EventOutboxService {
  constructor(private readonly repository: EventOutboxRepository) {}

  /**
   * Record a domain event in the outbox
   * Can be called within a transaction or standalone
   */
  async record(
    event: DomainEvent,
    prismaTransaction?: Prisma.TransactionClient,
  ) {
    return this.repository.recordEvent(event, prismaTransaction);
  }

  /**
   * Query event history with filters
   */
  async getHistory(filters: {
    aggregateId?: string;
    aggregateType?: string;
    eventTypeId?: string;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return this.repository.getEventHistory(filters);
  }
}
