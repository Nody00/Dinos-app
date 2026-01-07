import { DomainEvent } from '../../common/events/base/domain-event.base';
import { ActorType } from '../../common/events/types/actor-type.enum';

export interface UserUpdatedPayload {
  oldData: Record<string, unknown>;
  newData: Record<string, unknown>;
  changedFields: string[];
}

export class UserUpdatedEvent extends DomainEvent<UserUpdatedPayload> {
  constructor(
    aggregateId: string,
    payload: UserUpdatedPayload,
    actorType: ActorType,
    actorId?: string,
    metadata?: Record<string, unknown>,
  ) {
    super(aggregateId, 'User', payload, actorType, actorId, metadata);
  }

  getEventType(): string {
    return 'user.updated';
  }

  static fromJSON(data: {
    aggregateId: string;
    payload: UserUpdatedPayload;
    actorType: ActorType;
    actorId?: string;
    metadata?: Record<string, unknown>;
  }): UserUpdatedEvent {
    return new UserUpdatedEvent(
      data.aggregateId,
      data.payload,
      data.actorType,
      data.actorId,
      data.metadata,
    );
  }
}
