import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { EventOutboxRepository } from './event-outbox.repository';
import { EventOutbox, EventType } from '../../../../generated/prisma/client';
import { OnEvent } from '@nestjs/event-emitter';

type EventOutboxWithType = EventOutbox & {
  eventType: EventType;
};

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private client: ClientProxy;
  private pollingInterval: NodeJS.Timeout;
  private readonly POLLING_INTERVAL_MS = 5000; // 5 seconds
  private readonly MAX_RETRIES = 5;
  private isProcessing = false;

  constructor(
    private readonly repository: EventOutboxRepository,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Initialize RabbitMQ client
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [
          this.configService.get<string>(
            'RABBITMQ_URL',
            'amqp://guest:guest@localhost:5672',
          ),
        ],
        queue: this.configService.get<string>('RABBITMQ_QUEUE', 'events_queue'),
        queueOptions: {
          durable: true,
        },
      },
    });

    // Connect to RabbitMQ
    await this.client.connect();
    this.logger.log('Connected to RabbitMQ');

    // Start polling
    this.startPolling();
  }

  async onModuleDestroy() {
    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.logger.log('Stopped event polling');
    }

    // Disconnect from RabbitMQ
    await this.client.close();
    this.logger.log('Disconnected from RabbitMQ');
  }

  private startPolling() {
    this.logger.log(
      `Starting event polling every ${this.POLLING_INTERVAL_MS} ms`,
    );

    this.pollingInterval = setInterval(() => {
      void this.processOutbox();
    }, this.POLLING_INTERVAL_MS);
  }

  /**
   * Process unpublished events from the outbox
   * Protects against concurrent processing
   */
  async processOutbox(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      this.logger.log('Outbox is already being processed. Skipping.');
      return;
    }

    this.isProcessing = true;

    try {
      const unpublishedEvents = await this.repository.getUnpublishedEvents(50);

      if (unpublishedEvents.length === 0) {
        return;
      }

      this.logger.log(
        `Processing ${unpublishedEvents.length} unpublished events`,
      );

      for (const outboxEvent of unpublishedEvents) {
        await this.publishEvent(outboxEvent);
      }
    } catch (error) {
      this.logger.error('Error processing outbox', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Publish a single event to RabbitMQ
   */
  private async publishEvent(outboxEvent: EventOutboxWithType) {
    try {
      // Check if max retries exceeded
      if (outboxEvent.retryCount >= this.MAX_RETRIES) {
        this.logger.error(
          `Max retries exceeded for event ${outboxEvent.id}. Skipping.`,
        );
        return;
      }

      // Publish to RabbitMQ with event type as routing key
      await this.client
        .emit(outboxEvent.eventType.name, outboxEvent.eventData)
        .toPromise();

      this.logger.debug(
        `Published event ${outboxEvent.id} of type ${outboxEvent.eventType.name}`,
      );

      // Mark event as published
      await this.repository.markAsPublished(outboxEvent.id);
    } catch (error) {
      this.logger.error(`Failed to publish event ${outboxEvent.id}`, error);

      // Increment retry count
      await this.repository.incrementRetryCount(
        outboxEvent.id,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  @OnEvent('outbox.event.recorded')
  handleOutboxEventRecorded() {
    // Trigger polling for immediate processing
    void this.processOutbox();
  }
}
