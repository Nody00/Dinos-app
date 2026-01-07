import { SetMetadata } from '@nestjs/common';
import { DomainEvent } from './domain-event.base';

// Metadata key to store event class
export const EVENT_HANDLER_METADATA = 'EVENT_HANDLER_METADATA';

/**
 * Decorator to mark a class as an event handler
 *
 * Usage:
 * @EventHandler(UserCreatedEvent)
 * export class UserCreatedHandler {
 *   @EventPattern('user.created')
 *   async handle(event: UserCreatedEvent) { ... }
 * }
 */
export const EventHandler = (eventClass: typeof DomainEvent) => {
  return SetMetadata(EVENT_HANDLER_METADATA, eventClass);
};
