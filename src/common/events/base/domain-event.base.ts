import { randomUUID } from 'crypto';
import { ActorType } from '../types/actor-type.enum';

/**
 * Abstract base class for all domain events
 *
 * All events in the system extend this class and provide:
 * - Strongly-typed payload (T)
 * - Serialization to JSON (for database storage)
 * - Deserialization from JSON (for reconstructing events)
 * - Event type identifier (for routing to handlers)
 */
export abstract class DomainEvent<T = any> {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string, // ID of the  entity (user.id, order.id, etc.)
    public readonly aggregateType: string, // Type of the entity ("User", "Order", etc.)
    public readonly payload: T, // Strongly typed event data
    public readonly actorType: ActorType, // Who performed the action (SYSTEM, USER, API)
    public readonly actorId?: string, // User ID (optional, null for SYSTEM/API actors)
    public readonly metadata?: Record<string, any>, // Extra context (IP, user agent, etc.)
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }

  /**
   * Returns the event type name (e.g., "user.created", "order.shipped")
   * Each event class must implement this to identify itself
   */
  abstract getEventType(): string;

  /**
   * Serialize event to JSON for database storage
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      payload: this.payload,
      actorType: this.actorType,
      actorId: this.actorId,
      metadata: this.metadata,
      occurredAt: this.occurredAt.toISOString(),
    };
  }

  /**
   * Deserialize event from JSON (reconstruct from database)
   * Each event class must implement this static method
   */
  static fromJSON(data: any): DomainEvent {
    throw new Error('fromJSON method must be implemented in subclasses');
  }
}
