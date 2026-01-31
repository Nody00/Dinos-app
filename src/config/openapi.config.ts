import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export interface OpenApiConfigOptions {
  title?: string;
  description?: string;
  version?: string;
}

export function getOpenApiConfig(options?: OpenApiConfigOptions): Omit<OpenAPIObject, 'paths'> {
  const title = options?.title ?? process.env.API_TITLE ?? 'Backend API';
  const description = options?.description ?? process.env.API_DESCRIPTION ?? 'NestJS Backend API Documentation';
  const version = options?.version ?? process.env.API_VERSION ?? '1.0.0';

  return new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addTag('Health', 'Health check and system status endpoints')
    .addTag('Users', 'User management operations')
    .addTag('Auth', 'Authentication and authorization')
    .addTag('Invitations', 'User invitation management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
}
