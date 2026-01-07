import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserUpdatedEvent, UserUpdatedPayload } from '../user-updated.event';
import { ActorType } from '../../../common/events/types/actor-type.enum';

interface UserUpdatedEventData {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  payload: UserUpdatedPayload;
  actorType: ActorType;
  actorId?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

@Injectable()
export class UserUpdatedHandler {
  private readonly logger = new Logger(UserUpdatedHandler.name);

  @EventPattern('user.updated')
  handle(@Payload() eventData: UserUpdatedEventData): void {
    try {
      // Reconstruct event from JSON
      const event = UserUpdatedEvent.fromJSON(eventData);

      this.logger.log(
        `Handling user.updated event for user ${event.aggregateId}`,
      );

      this.logger.log(
        `User ${event.aggregateId} updated. Changed fields: ${event.payload.changedFields.join(', ')}`,
      );

      // TODO
      // You can add additional logic here:
      // - Send notification email if email changed
      // - Update search index
      // - Sync with external systems
    } catch (error) {
      this.logger.error(
        `Failed to handle user.updated event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
