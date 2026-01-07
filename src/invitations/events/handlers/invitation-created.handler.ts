import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailService } from '../../../email/email.service';
import {
  InvitationCreatedEvent,
  InvitationCreatedPayload,
} from '../invitation-created.event';
import { ActorType } from '../../../common/events/types/actor-type.enum';

interface InvitationCreatedEventData {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  payload: InvitationCreatedPayload;
  actorType: ActorType;
  actorId?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

@Injectable()
export class InvitationCreatedHandler {
  private readonly logger = new Logger(InvitationCreatedHandler.name);

  constructor(private readonly emailService: EmailService) {}

  @EventPattern('invitation.created')
  async handle(
    @Payload() eventData: InvitationCreatedEventData,
  ): Promise<void> {
    try {
      const event = InvitationCreatedEvent.fromJSON(eventData);

      this.logger.log(
        `Handling invitation.created event for invitation ${event.aggregateId}`,
      );

      // Send invitation email
      await this.emailService.send({
        to: event.payload.email,
        subject: 'You have been invited!',
        values: {
          invitationId: event.aggregateId,
          expiresAt: event.payload.expiresAt,
          //   TODO ADD LINK
        },
        from: process.env.EMAIL_FROM ?? 'no-reply@example.com',
        text: 'You have been invited to join our platform!',
      });

      this.logger.log(`Invitation email sent to ${event.payload.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle invitation.created event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
