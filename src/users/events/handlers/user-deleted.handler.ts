import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserDeletedEvent, UserDeletedPayload } from '../user-deleted.event';
import { ActorType } from '../../../common/events/types/actor-type.enum';

interface UserDeletedEventData {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  payload: UserDeletedPayload;
  actorType: ActorType;
  actorId?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

@Injectable()
export class UserDeletedHandler {
  private readonly logger = new Logger(UserDeletedHandler.name);

  @EventPattern('user.deleted')
  handle(@Payload() eventData: UserDeletedEventData): void {
    try {
      // Reconstruct event from JSON
      const event = UserDeletedEvent.fromJSON(eventData);

      this.logger.log(
        `Handling user.deleted event for user ${event.aggregateId}`,
      );

      this.logger.log(
        `User ${event.payload.email} (${event.aggregateId}) has been deleted`,
      );

      // TODO
      // You can add additional logic here:
      // - Send goodbye email
      // - Clean up user data from external systems
      // - Archive user records
      // - Update analytics
    } catch (error) {
      this.logger.error(
        `Failed to handle user.deleted event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
