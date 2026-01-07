import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { IEmailProvider } from '../interfaces/email-provider.interface';
import { EmailOptions } from '../interfaces/email-options.interface';
import createGenericTemplate from '../templates/generic-template.factory';

/**
 * SMTP email provider implementation using nodemailer.
 * Ideal for local development with MailHog or production SMTP servers.
 *
 * Automatically generates beautiful HTML emails from the values object
 * using the generic template factory.
 *
 * @example
 * ```typescript
 * // Environment configuration for MailHog (local development)
 * EMAIL_PROVIDER=smtp
 * SMTP_HOST=localhost
 * SMTP_PORT=1025
 * SMTP_SECURE=false
 * SMTP_USER=
 * SMTP_PASSWORD=
 * ```
 *
 * @example
 * ```typescript
 * // Environment configuration for Gmail SMTP (production)
 * EMAIL_PROVIDER=smtp
 * SMTP_HOST=smtp.gmail.com
 * SMTP_PORT=587
 * SMTP_SECURE=true
 * SMTP_USER=your-email@gmail.com
 * SMTP_PASSWORD=your-app-password
 * ```
 *
 * @implements {IEmailProvider}
 */
@Injectable()
export class SmtpEmailProvider implements IEmailProvider {
  private transporter: Transporter;
  private readonly logger = new Logger(SmtpEmailProvider.name);

  /**
   * Initializes the SMTP provider with nodemailer transport configuration.
   * Reads SMTP settings from environment variables via ConfigService.
   *
   * @param configService - NestJS config service for accessing environment variables
   */
  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      secure: this.configService.get<boolean>('SMTP_SECURE') === true,
      auth: this.getAuthConfig(),
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10, // Send max 10 emails
      rateDelta: 1000, // per 1 second (1000ms)
    });

    this.logger.log(
      `SMTP Provider initialized: ${this.configService.get('SMTP_HOST')}:${this.configService.get('SMTP_PORT')}`,
    );
  }

  /**
   * Gets SMTP authentication configuration from environment variables.
   * Returns undefined if no credentials are provided (e.g., for MailHog).
   *
   * @returns SMTP auth object or undefined
   * @private
   */
  private getAuthConfig() {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    if (user && pass) {
      return { user, pass };
    }

    return undefined;
  }

  /**
   * Sends an email via SMTP using nodemailer.
   * Automatically generates HTML content from the values object using the generic template.
   *
   * @param options - Email configuration options
   * @throws Error if SMTP sending fails
   * @returns Promise that resolves when email is sent successfully
   *
   * @example
   * ```typescript
   * await smtpProvider.send({
   *   to: 'user@example.com',
   *   from: 'noreply@dinoapp.com',
   *   subject: 'Welcome to Dino App',
   *   text: 'Welcome!',
   *   values: {
   *     userName: 'John Doe',
   *     accountType: 'Premium',
   *     activatedDate: '2024-01-15'
   *   }
   * });
   * ```
   */
  async send(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: createGenericTemplate(
          options.values || {},
          options.from,
          options.to,
        ),
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      });

      this.logger.log(`Email sent via SMTP: ${options.subject}`);
    } catch (error) {
      this.logger.error(`SMTP send failed: ${options.subject}`, error);
      throw error;
    }
  }
}
