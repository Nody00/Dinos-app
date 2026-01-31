import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Request, Response } from 'express';
import { getRabbitMQConfig } from './config/rabbitmq.config';
import { getOpenApiConfig } from './config/openapi.config';
import { getScalarConfig } from './config/scalar.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // OpenAPI document generation
  const openApiConfig = getOpenApiConfig();
  const document = SwaggerModule.createDocument(app, openApiConfig);

  // Serve raw OpenAPI JSON spec
  app.getHttpAdapter().get('/api-json', (_req: Request, res: Response) => {
    res.json(document);
  });

  // Serve Scalar UI at /reference
  const scalarConfig = getScalarConfig();
  app.use('/reference', apiReference(scalarConfig));

  // Connect RabbitMQ microservice for event handlers
  app.connectMicroservice(getRabbitMQConfig());

  // Start all microservices
  await app.startAllMicroservices();
  logger.log('Microservices started successfully');

  // Start HTTP server
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API Documentation (Scalar): http://localhost:${port}/reference`);
  logger.log(`OpenAPI JSON: http://localhost:${port}/api-json`);
  logger.log(
    `RabbitMQ connected on: ${process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'}`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
