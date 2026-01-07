import { DomainEvent } from '../../common/events/base/domain-event.base';
import { ActorType } from '../../common/events/types/actor-type.enum';

export interface UserDeletedPayload {
  email: string;
  firstName: string;
  lastName: string;
}

export class UserDeletedEvent extends DomainEvent<UserDeletedPayload> {
  constructor(
    aggregateId: string,
    payload: UserDeletedPayload,
    actorType: ActorType,
    actorId?: string,
    metadata?: Record<string, unknown>,
  ) {
    super(aggregateId, 'User', payload, actorType, actorId, metadata);
  }

  getEventType(): string {
    return 'user.deleted';
  }

  static fromJSON(data: {
    aggregateId: string;
    payload: UserDeletedPayload;
    actorType: ActorType;
    actorId?: string;
    metadata?: Record<string, unknown>;
  }): UserDeletedEvent {
    return new UserDeletedEvent(
      data.aggregateId,
      data.payload,
      data.actorType,
      data.actorId,
      data.metadata,
    );
  }
}
