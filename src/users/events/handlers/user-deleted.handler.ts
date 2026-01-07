import { Controller, Logger } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  RmqContext,
} from '@nestjs/microservices';
import { UserDeletedEvent, UserDeletedPayload } from '../user-deleted.event';
import { ActorType } from '../../../common/events/types/actor-type.enum';
import { Channel, Message } from 'amqplib';

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

@Controller()
export class UserDeletedHandler {
  private readonly logger = new Logger(UserDeletedHandler.name);

  @MessagePattern('user.deleted')
  async handle(
    @Payload() eventData: UserDeletedEventData,
    @Ctx() context: RmqContext,
  ): Promise<void> {
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

      // Acknowledge the message
      const channel = context.getChannelRef() as Channel;
      const message = context.getMessage() as Message;
      channel.ack(message);
      this.logger.debug(`Acknowledged user.deleted event`);
    } catch (error) {
      this.logger.error(
        `Failed to handle user.deleted event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // NACK with requeue on error
      const channel = context.getChannelRef() as Channel;
      const message = context.getMessage() as Message;
      channel.nack(message, false, true);
    }
  }
}
