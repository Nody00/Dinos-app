import { Controller, Logger } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  RmqContext,
} from '@nestjs/microservices';
import { UserUpdatedEvent, UserUpdatedPayload } from '../user-updated.event';
import { ActorType } from '../../../common/events/types/actor-type.enum';
import { Channel, Message } from 'amqplib';

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

@Controller()
export class UserUpdatedHandler {
  private readonly logger = new Logger(UserUpdatedHandler.name);

  @MessagePattern('user.updated')
  handle(
    @Payload() eventData: UserUpdatedEventData,
    @Ctx() context: RmqContext,
  ): void {
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

      // Acknowledge the message
      const channel = context.getChannelRef() as Channel;
      const message = context.getMessage() as Message;
      channel.ack(message);
      this.logger.debug(`Acknowledged user.updated event`);
    } catch (error) {
      this.logger.error(
        `Failed to handle user.updated event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // NACK with requeue on error
      const channel = context.getChannelRef() as Channel;
      const message = context.getMessage() as Message;
      channel.nack(message, false, true);
    }
  }
}
