import { DomainEvent } from 'src/common/events/base/domain-event.base';
import { ActorType } from 'src/common/events/types/actor-type.enum';

export interface UserCreatedPayload {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

export class UserCreatedEvent extends DomainEvent<UserCreatedPayload> {
  constructor(
    aggregateId: string,
    payload: UserCreatedPayload,
    actorType: ActorType,
    actorId?: string,
    metadata?: Record<string, unknown>,
  ) {
    super(aggregateId, 'User', payload, actorType, actorId, metadata);
  }

  getEventType(): string {
    return 'user.created';
  }

  static fromJSON(data: {
    aggregateId: string;
    payload: UserCreatedPayload;
    actorType: ActorType;
    actorId?: string;
    metadata?: Record<string, unknown>;
  }): UserCreatedEvent {
    return new UserCreatedEvent(
      data.aggregateId,
      data.payload,
      data.actorType,
      data.actorId,
      data.metadata,
    );
  }
}
