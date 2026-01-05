import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { Module } from '@nestjs/common';
import { IEmailProvider } from './interfaces/email-provider.interface';
import { SendGridEmailProvider } from './providers/sendgrid.provider';
import { SmtpEmailProvider } from './providers/smtp.provider';

/**
 * Email module that provides email sending capabilities using the provider pattern.
 *
 * Features:
 * - Dynamic provider selection based on EMAIL_PROVIDER environment variable
 * - SMTP provider for local development (MailHog) or production SMTP servers
 * - SendGrid provider for production with dynamic templates
 * - Automatic provider initialization and dependency injection
 *
 * Usage:
 * 1. Import EmailModule in your feature module
 * 2. Inject EmailService into your services/controllers
 * 3. Configure EMAIL_PROVIDER in .env file
 *
 * @example
 * ```typescript
 * // In your feature module (e.g., users.module.ts)
 * @Module({
 *   imports: [EmailModule],
 *   controllers: [UsersController],
 *   providers: [UsersService],
 * })
 * export class UsersModule {}
 * ```
 *
 * @example
 * ```typescript
 * // In your service
 * @Injectable()
 * export class UsersService {
 *   constructor(private emailService: EmailService) {}
 *
 *   async sendWelcomeEmail(user: User) {
 *     await this.emailService.send({
 *       to: user.email,
 *       from: 'welcome@dinoapp.com',
 *       subject: 'Welcome!',
 *       values: { userName: user.name }
 *     });
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Environment configuration for SMTP (development)
 * EMAIL_PROVIDER=smtp
 * SMTP_HOST=localhost
 * SMTP_PORT=1025
 * SMTP_SECURE=false
 * ```
 *
 * @example
 * ```typescript
 * // Environment configuration for SendGrid (production)
 * EMAIL_PROVIDER=sendgrid
 * SENDGRID_API_KEY=SG.your_api_key_here
 * ```
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'IEmailProvider',
      useFactory: (configService: ConfigService): IEmailProvider => {
        const provider = configService.get<string>('EMAIL_PROVIDER', 'smtp');

        if (provider === 'smtp') return new SmtpEmailProvider(configService);

        if (provider === 'sendgrid')
          return new SendGridEmailProvider(configService);

        return new SmtpEmailProvider(configService);
      },
      inject: [ConfigService],
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
