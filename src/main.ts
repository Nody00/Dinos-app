import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { getRabbitMQConfig } from './config/rabbitmq.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // Connect RabbitMQ microservice for event handlers
  app.connectMicroservice(getRabbitMQConfig());

  // Start all microservices
  await app.startAllMicroservices();
  logger.log('Microservices started successfully');

  // Start HTTP server
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(
    `RabbitMQ connected on: ${process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'}`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
