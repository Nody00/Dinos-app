import { Controller, Logger } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  RmqContext,
} from '@nestjs/microservices';
import type { Channel, Message } from 'amqplib';
import { EmailService } from 'src/email/email.service';
import { UserCreatedEvent, UserCreatedPayload } from '../user-created.event';
import { ActorType } from 'src/common/events/types/actor-type.enum';

interface UserCreatedEventData {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  payload: UserCreatedPayload;
  actorType: ActorType;
  actorId?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

@Controller()
export class UserCreatedHandler {
  private readonly logger = new Logger(UserCreatedHandler.name);

  constructor(private readonly emailService: EmailService) {}

  @MessagePattern('user.created')
  async handle(
    @Payload() eventData: UserCreatedEventData,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      // Reconstruct event from JSON
      const event = UserCreatedEvent.fromJSON(eventData);

      this.logger.log(
        `Handling user.created event for user ${event.aggregateId}`,
      );

      // Send welcome email
      await this.emailService.send({
        to: event.payload.email,
        subject: 'Welcome to Our Platform!',
        values: {
          firstName: event.payload.firstName,
          lastName: event.payload.lastName,
        },
        from: process.env.EMAIL_FROM ?? 'no-reply@example.com',
        text: 'Welcome to Our Platform!',
      });

      // Acknowledge the message
      const channel = context.getChannelRef() as Channel;
      const message = context.getMessage() as Message;
      channel.ack(message);
      this.logger.debug(`Acknowledged user.created event`);
    } catch (error) {
      this.logger.error(`Error handling user.created event: ${error}`);
      // NACK with requeue on error
      const channel = context.getChannelRef() as Channel;
      const message = context.getMessage() as Message;
      channel.nack(message, false, true);
    }
  }
}
