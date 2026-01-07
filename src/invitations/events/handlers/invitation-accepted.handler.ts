import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  InvitationAcceptedEvent,
  InvitationAcceptedPayload,
} from '../invitation-accepted.event';
import { ActorType } from '../../../common/events/types/actor-type.enum';

interface InvitationAcceptedEventData {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  payload: InvitationAcceptedPayload;
  actorType: ActorType;
  actorId?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

@Injectable()
export class InvitationAcceptedHandler {
  private readonly logger = new Logger(InvitationAcceptedHandler.name);

  @EventPattern('invitation.accepted')
  handle(@Payload() eventData: InvitationAcceptedEventData): void {
    try {
      const event = InvitationAcceptedEvent.fromJSON(eventData);

      this.logger.log(
        `Handling invitation.accepted event for invitation ${event.aggregateId}`,
      );

      this.logger.log(
        `Invitation ${event.payload.invitationId} accepted by user ${event.payload.acceptedByUserId}`,
      );

      // TODO
      // You can add additional logic here:
      // - Send notification to the user who sent the invitation
      // - Update analytics
      // - Trigger onboarding workflow
    } catch (error) {
      this.logger.error(
        `Failed to handle invitation.accepted event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
