import { MicroserviceOptions, Transport } from '@nestjs/microservices';

export function getRabbitMQConfig(): MicroserviceOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
      queue: process.env.RABBITMQ_QUEUE ?? 'events_queue',
      queueOptions: {
        durable: true,
      },
      // Disable auto-acknowledge to ensure messages are only removed after successful processing
      noAck: false,
      // Prefetch only 1 message at a time for better error handling
      prefetchCount: 1,
    },
  };
}
