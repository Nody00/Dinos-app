# API Documentation Guide

This guide explains how to add OpenAPI documentation to this NestJS application.

## Overview

We use:
- **@nestjs/swagger** - OpenAPI specification generation
- **@scalar/nestjs-api-reference** - Modern API documentation UI (moon theme)
- **Swagger CLI Plugin** - Automatic property introspection from TypeScript

## Accessing Documentation

- **Scalar UI**: http://localhost:3000/reference
- **OpenAPI JSON**: http://localhost:3000/api-json

## Quick Start

### 1. Documenting a Controller

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('YourModule')  // Groups endpoints in the sidebar
@ApiBearerAuth('JWT-auth')  // Marks endpoints as requiring auth
@Controller('your-resource')
export class YourController {

  @Get()
  @ApiOperation({
    summary: 'Short description (shown in endpoint list)',
    description: 'Detailed description of what this endpoint does',
  })
  @ApiResponse({ status: 200, description: 'Success', type: YourResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {
    // ...
  }
}
```

### 2. Documenting DTOs

The Swagger CLI plugin automatically infers types from TypeScript. Add descriptions and examples with decorators:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Optional field',
    example: 'value',
  })
  @IsString()
  @IsOptional()
  optionalField?: string;
}
```

### 3. Documenting Path Parameters

```typescript
import { ApiParam } from '@nestjs/swagger';

@Get(':id')
@ApiParam({
  name: 'id',
  description: 'Unique identifier (UUID)',
  example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
})
async findById(@Param('id') id: string) {
  // ...
}
```

### 4. Documenting Query Parameters

```typescript
import { ApiQuery } from '@nestjs/swagger';

@Get()
@ApiQuery({
  name: 'search',
  description: 'Search term',
  required: false,
  example: 'john',
})
async findAll(@Query('search') search?: string) {
  // ...
}
```

## Common Decorators Reference

| Decorator | Purpose | Location |
|-----------|---------|----------|
| `@ApiTags('name')` | Groups endpoints under a section | Controller class |
| `@ApiBearerAuth('JWT-auth')` | Marks endpoints as requiring JWT auth | Controller class or method |
| `@ApiOperation({ summary, description })` | Describes the endpoint | Method |
| `@ApiResponse({ status, description, type })` | Documents response | Method |
| `@ApiParam({ name, description, example })` | Documents URL parameters | Method |
| `@ApiQuery({ name, description, required })` | Documents query parameters | Method |
| `@ApiBody({ type })` | Documents request body | Method |
| `@ApiProperty()` | Documents required DTO property | DTO property |
| `@ApiPropertyOptional()` | Documents optional DTO property | DTO property |
| `@ApiHideProperty()` | Hides a property from docs | DTO property |

## Documenting Error Responses

Use the shared `ApiErrorResponseDto` for consistent error documentation:

```typescript
import { ApiErrorResponseDto } from '../common/dto';

@Post()
@ApiResponse({
  status: 400,
  description: 'Validation error',
  type: ApiErrorResponseDto,
})
@ApiResponse({
  status: 404,
  description: 'Resource not found',
  type: ApiErrorResponseDto,
})
async create(@Body() dto: CreateDto) {
  // ...
}
```

## File Naming Conventions

- **DTOs**: `*.dto.ts` (e.g., `create-user.dto.ts`)
- **Response DTOs**: `*-response.dto.ts` (e.g., `user-response.dto.ts`)
- Keep DTOs in a `dto/` folder within each module
- Create an `index.ts` barrel export for clean imports

Example structure:
```
src/users/
  ├── dto/
  │   ├── index.ts
  │   ├── create-user.dto.ts
  │   ├── update-user.dto.ts
  │   └── user-response.dto.ts
  ├── users.controller.ts
  ├── users.service.ts
  └── users.module.ts
```

## Best Practices

1. **Always include examples** - Makes testing in Scalar UI easier
2. **Document all response codes** - Including error responses (400, 401, 404, etc.)
3. **Use consistent naming** - Match DTO names with operations
4. **Group related endpoints** - Use `@ApiTags` consistently per module
5. **Keep descriptions concise** - Use `summary` for short text, `description` for details
6. **Use proper formats** - `email`, `uuid`, `date-time`, `password` for better validation hints

## Configuration

### OpenAPI Settings

Edit `src/config/openapi.config.ts` to modify:
- API title, version, description
- Security schemes (JWT Bearer auth)
- Global tags

### Scalar UI Settings

Edit `src/config/scalar.config.ts` to modify:
- Theme (default: `moon`)
- Layout options

### Environment Variables

```env
API_TITLE=My API
API_VERSION=1.0.0
API_DESCRIPTION=My API Description
SCALAR_THEME=moon
```

Available themes: `default`, `alternate`, `moon`, `purple`, `solarized`, `bluePlanet`, `saturn`, `kepler`, `mars`, `deepSpace`

## Swagger CLI Plugin

The plugin is configured in `nest-cli.json` and automatically:
- Adds `@ApiProperty()` based on TypeScript types
- Uses JSDoc comments as descriptions
- Integrates with `class-validator` decorators

This reduces boilerplate - you only need explicit decorators for:
- Custom descriptions and examples
- Response types
- Operation summaries

**Important**: After changing DTOs, run `pnpm build` to regenerate metadata.

## Troubleshooting

### Types not showing in documentation
1. Ensure DTO files end with `.dto.ts`
2. Run `pnpm build` to regenerate metadata
3. Check `nest-cli.json` plugin configuration

### Decorators not working
1. Ensure `@nestjs/swagger` is imported correctly
2. Check decorator order (class decorators before method decorators)
3. Rebuild the project after changes

### Scalar UI not loading
1. Check that `@scalar/nestjs-api-reference` is installed
2. Verify `/api-json` returns valid JSON
3. Check browser console for errors

## Adding Documentation to a New Module

1. Create DTOs with `@ApiProperty` decorators
2. Create a barrel export (`dto/index.ts`)
3. Add `@ApiTags` to the controller
4. Add `@ApiOperation` to each method
5. Add `@ApiResponse` for success and error cases
6. Add `@ApiParam` for path parameters
7. Add `@ApiQuery` for query parameters
8. Test in Scalar UI at `/reference`

## Resources

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [Scalar API Reference](https://github.com/scalar/scalar)
- [OpenAPI Specification](https://swagger.io/specification/)
- [class-validator Decorators](https://github.com/typestack/class-validator)
