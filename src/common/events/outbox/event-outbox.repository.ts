import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DomainEvent } from '../base/domain-event.base';
import { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class EventOutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create event type in registry
   */
  async ensureEventType(
    eventTypeName: string,
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;

    return client.eventType.upsert({
      where: { name: eventTypeName },
      update: {},
      create: {
        name: eventTypeName,
        category: eventTypeName.split('.')[0], // "user.created" → "user"
        description: `Auto-registered event type: ${eventTypeName}`,
      },
    });
  }

  /**
   * Record event in outbox (transactional)
   */
  async recordEvent(
    event: DomainEvent,
    prismaTransaction?: Prisma.TransactionClient,
  ) {
    const client = prismaTransaction ?? this.prisma;

    // Get or create event type
    const eventType = await this.ensureEventType(event.getEventType(), client);

    // Serialize and save to outbox
    return client.eventOutbox.create({
      data: {
        eventTypeId: eventType.id,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        actorType: event.actorType,
        actorId: event.actorId,
        eventData: event.toJSON(),
      },
    });
  }

  /**
   * Get unpublished events for processing
   */
  async getUnpublishedEvents(limit: number = 50) {
    return this.prisma.eventOutbox.findMany({
      where: { published: false },
      include: { eventType: true },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Mark event as published and move to history
   */
  async markAsPublished(eventId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Get the outbox event
      const outboxEvent = await tx.eventOutbox.findUnique({
        where: { id: eventId },
        include: { eventType: true },
      });

      if (!outboxEvent) return;

      // Copy to history
      await tx.eventHistory.create({
        data: {
          eventTypeId: outboxEvent.eventTypeId,
          aggregateId: outboxEvent.aggregateId,
          aggregateType: outboxEvent.aggregateType,
          actorType: outboxEvent.actorType,
          actorId: outboxEvent.actorId,
          eventData: JSON.stringify(outboxEvent.eventData),
          occurredAt: outboxEvent.createdAt,
        },
      });

      // Mark as published
      await tx.eventOutbox.update({
        where: { id: eventId },
        data: {
          published: true,
          publishedAt: new Date(),
        },
      });
    });
  }

  /**
   * Increment retry count on failed publish
   */
  async incrementRetryCount(eventId: string, error: string) {
    return this.prisma.eventOutbox.update({
      where: { id: eventId },
      data: { retryCount: { increment: 1 }, error: error },
    });
  }

  /**
   * Query event history with filters
   */
  async getEventHistory(filters: {
    aggregateId?: string;
    aggregateType?: string;
    eventTypeId?: string;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: Prisma.EventHistoryWhereInput = {};

    if (filters.aggregateId) where.aggregateId = filters.aggregateId;
    if (filters.aggregateType) where.aggregateType = filters.aggregateType;
    if (filters.eventTypeId) where.eventTypeId = filters.eventTypeId;
    if (filters.actorId) where.actorId = filters.actorId;

    if (filters.startDate || filters.endDate) {
      where.occurredAt = {};
      if (filters.startDate) where.occurredAt.gte = filters.startDate;
      if (filters.endDate) where.occurredAt.lte = filters.endDate;
    }

    return this.prisma.eventHistory.findMany({
      where,
      include: { eventType: true },
      orderBy: { occurredAt: 'desc' },
      take: filters.limit || 100,
    });
  }

  /**
   * Cleanup old published events from outbox
   */
  async cleanupPublishedEvents(olderThanDays: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.eventOutbox.deleteMany({
      where: {
        published: true,
        publishedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
