import { DomainEvent } from '../../common/events/base/domain-event.base';
import { ActorType } from '../../common/events/types/actor-type.enum';

export interface InvitationCreatedPayload {
  email: string;
  invitedByUserId: string;
  roleId: string;
  expiresAt: string;
}

export class InvitationCreatedEvent extends DomainEvent<InvitationCreatedPayload> {
  constructor(
    aggregateId: string,
    payload: InvitationCreatedPayload,
    actorType: ActorType,
    actorId?: string,
    metadata?: Record<string, unknown>,
  ) {
    super(aggregateId, 'Invitation', payload, actorType, actorId, metadata);
  }

  getEventType(): string {
    return 'invitation.created';
  }

  static fromJSON(data: {
    aggregateId: string;
    payload: InvitationCreatedPayload;
    actorType: ActorType;
    actorId?: string;
    metadata?: Record<string, unknown>;
  }): InvitationCreatedEvent {
    return new InvitationCreatedEvent(
      data.aggregateId,
      data.payload,
      data.actorType,
      data.actorId,
      data.metadata,
    );
  }
}
