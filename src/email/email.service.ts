import { Inject, Injectable, Logger } from '@nestjs/common';
import { EmailOptions } from './interfaces/email-options.interface';
import { ConfigService } from '@nestjs/config';

import type { IEmailProvider } from './interfaces/email-provider.interface';

/**
 * Email service that provides a unified interface for sending emails.
 * Uses the provider pattern to support multiple email providers (SMTP, SendGrid, etc.).
 *
 * The service automatically injects the correct provider based on the EMAIL_PROVIDER
 * environment variable and handles default sender configuration.
 *
 * @example
 * ```typescript
 * // In a controller or service
 * @Injectable()
 * export class UserService {
 *   constructor(private emailService: EmailService) {}
 *
 *   async sendWelcomeEmail(user: User) {
 *     await this.emailService.send({
 *       to: user.email,
 *       from: 'welcome@dinoapp.com',
 *       subject: 'Welcome to Dino App!',
 *       values: {
 *         userName: user.name,
 *         activationLink: `https://app.com/activate/${user.token}`
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // In an event handler
 * @Injectable()
 * export class UserEventHandler {
 *   constructor(private emailService: EmailService) {}
 *
 *   @OnEvent('user.invited')
 *   async handleUserInvited(payload: UserInvitedEvent) {
 *     await this.emailService.send({
 *       to: payload.email,
 *       from: 'invites@dinoapp.com',
 *       subject: `You've been invited to ${payload.organizationName}`,
 *       values: {
 *         inviterName: payload.inviterName,
 *         organizationName: payload.organizationName,
 *         inviteLink: payload.inviteLink
 *       }
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly defaultFrom: { email: string; name: string };

  /**
   * Initializes the email service with configuration and provider.
   *
   * @param configService - NestJS config service for environment variables
   * @param emailProvider - The email provider implementation (injected via factory)
   */
  constructor(
    private configService: ConfigService,
    @Inject('IEmailProvider') private emailProvider: IEmailProvider,
  ) {
    this.defaultFrom = {
      email: this.configService.get('SMTP_FROM_EMAIL', 'noreply@dinoapp.com'),
      name: this.configService.get('SMTP_FROM_NAME', 'Dino App'),
    };

    this.logger.log('EmailService initialized');
  }

  /**
   * Sends an email using the configured email provider.
   * If no 'from' address is provided, uses the default from configuration.
   *
   * @param options - Email configuration options
   * @throws Error if email sending fails
   * @returns Promise that resolves when email is sent successfully
   *
   * @example
   * ```typescript
   * // Simple email
   * await emailService.send({
   *   to: 'user@example.com',
   *   from: 'noreply@dinoapp.com',
   *   subject: 'Welcome!',
   *   text: 'Welcome to our platform',
   *   values: { userName: 'John Doe' }
   * });
   *
   * // Email with multiple recipients
   * await emailService.send({
   *   to: ['user1@example.com', 'user2@example.com'],
   *   from: 'team@dinoapp.com',
   *   subject: 'Team Update',
   *   values: {
   *     updateTitle: 'New Features Released',
   *     features: ['Feature A', 'Feature B']
   *   }
   * });
   *
   * // Email with CC and BCC
   * await emailService.send({
   *   to: 'customer@example.com',
   *   cc: 'manager@company.com',
   *   bcc: 'archive@company.com',
   *   from: 'support@dinoapp.com',
   *   subject: 'Support Ticket #12345',
   *   values: {
   *     ticketNumber: '12345',
   *     status: 'Resolved'
   *   }
   * });
   * ```
   */
  async send(options: EmailOptions): Promise<void> {
    // Ensure 'from' is set
    const emailOptions: EmailOptions = {
      ...options,
      from:
        options.from || `${this.defaultFrom.name} <${this.defaultFrom.email}>`,
    };

    try {
      await this.emailProvider.send(emailOptions);
      this.logger.log(`Email sent successfully: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${options.subject}`, error);
      throw error;
    }
  }
}
