import { EmailOptions } from './email-options.interface';

/**
 * Email provider interface that all email providers must implement.
 * This allows the email service to work with different email providers
 * (SMTP, SendGrid, AWS SES, etc.) using the Strategy pattern.
 *
 * @example
 * ```typescript
 * // Implementing a custom email provider
 * @Injectable()
 * export class CustomEmailProvider implements IEmailProvider {
 *   async send(options: EmailOptions): Promise<void> {
 *     // Custom implementation for sending emails
 *     console.log(`Sending email to ${options.to}`);
 *     // ... your custom logic
 *   }
 * }
 * ```
 *
 * @see SmtpEmailProvider - SMTP/nodemailer implementation for development
 * @see SendGridEmailProvider - SendGrid implementation for production
 */
export interface IEmailProvider {
  /**
   * Sends an email using the provider's implementation.
   *
   * @param options - Email configuration options
   * @throws Error if email sending fails
   * @returns Promise that resolves when email is sent successfully
   *
   * @example
   * ```typescript
   * await emailProvider.send({
   *   to: 'user@example.com',
   *   from: 'noreply@dinoapp.com',
   *   subject: 'Welcome!',
   *   values: { userName: 'John' }
   * });
   * ```
   */
  send(options: EmailOptions): Promise<void>;
}
