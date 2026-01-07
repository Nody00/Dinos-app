import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
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

@Injectable()
export class UserCreatedHandler {
  private readonly logger = new Logger(UserCreatedHandler.name);

  constructor(private readonly emailService: EmailService) {}

  @EventPattern('user.created')
  async handle(@Payload() eventData: UserCreatedEventData): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Error handling user.created event: ${error}`);
      throw error;
    }
  }
}
