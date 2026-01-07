import { DomainEvent } from '../../common/events/base/domain-event.base';
import { ActorType } from '../../common/events/types/actor-type.enum';

export interface InvitationAcceptedPayload {
  email: string;
  acceptedByUserId: string;
  invitationId: string;
}

export class InvitationAcceptedEvent extends DomainEvent<InvitationAcceptedPayload> {
  constructor(
    aggregateId: string,
    payload: InvitationAcceptedPayload,
    actorType: ActorType,
    actorId?: string,
    metadata?: Record<string, unknown>,
  ) {
    super(aggregateId, 'Invitation', payload, actorType, actorId, metadata);
  }

  getEventType(): string {
    return 'invitation.accepted';
  }

  static fromJSON(data: {
    aggregateId: string;
    payload: InvitationAcceptedPayload;
    actorType: ActorType;
    actorId?: string;
    metadata?: Record<string, unknown>;
  }): InvitationAcceptedEvent {
    return new InvitationAcceptedEvent(
      data.aggregateId,
      data.payload,
      data.actorType,
      data.actorId,
      data.metadata,
    );
  }
}
