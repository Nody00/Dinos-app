import { Injectable } from '@nestjs/common';
import { EventOutboxRepository } from './event-outbox.repository';
import { DomainEvent } from '../base/domain-event.base';
import { Prisma } from '../../../../generated/prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventOutboxService {
  constructor(
    private readonly repository: EventOutboxRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Record a domain event in the outbox
   * Triggers immediate publishing via event emitter
   * Polling acts as backup if immediate publish fails
   */
  async record(
    event: DomainEvent,
    prismaTransaction?: Prisma.TransactionClient,
  ) {
    const outboxEvent = await this.repository.recordEvent(
      event,
      prismaTransaction,
    );

    // Trigger immediate publishing (fire-and-forget)
    // Using setImmediate ensures it runs after transaction commits
    setImmediate(() => {
      this.eventEmitter.emit('outbox.event.recorded');
    });

    return outboxEvent;
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
