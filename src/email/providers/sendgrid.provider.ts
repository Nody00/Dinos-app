import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { IEmailProvider } from '../interfaces/email-provider.interface';
import { EmailOptions } from '../interfaces/email-options.interface';

/**
 * SendGrid email provider implementation for production email sending.
 * Uses SendGrid's dynamic template system for professional email templates.
 *
 * Templates are created and managed in the SendGrid dashboard, and the
 * values object is passed as dynamicTemplateData to populate the template.
 *
 * @example
 * ```typescript
 * // Environment configuration
 * EMAIL_PROVIDER=sendgrid
 * SENDGRID_API_KEY=SG.your_api_key_here
 * ```
 *
 * @example
 * ```typescript
 * // Create a template in SendGrid dashboard with these variables:
 * // - {{userName}}
 * // - {{activationLink}}
 * // - {{companyName}}
 * //
 * // Then send an email using that template:
 * await sendGridProvider.send({
 *   to: 'user@example.com',
 *   from: 'noreply@dinoapp.com',
 *   subject: 'Welcome to Dino App',
 *   templateId: 'd-1234567890abcdef',
 *   values: {
 *     userName: 'John Doe',
 *     activationLink: 'https://app.com/activate/xyz',
 *     companyName: 'Dino App'
 *   }
 * });
 * ```
 *
 * @implements {IEmailProvider}
 * @see https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates
 */
@Injectable()
export class SendGridEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SendGridEmailProvider.name);

  /**
   * Initializes the SendGrid provider with API key from environment.
   * Logs a warning if SENDGRID_API_KEY is not found.
   *
   * @param configService - NestJS config service for accessing environment variables
   */
  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'SENDGRID_API_KEY not found. SendGrid provider will fail if used.',
      );
    } else {
      sgMail.setApiKey(apiKey);

      this.logger.log('SendGrid Provider initialized');
    }
  }

  /**
   * Sends an email via SendGrid using dynamic templates.
   * The values object is passed as dynamicTemplateData to populate template variables.
   *
   * @param options - Email configuration options
   * @param options.templateId - Required SendGrid template ID (e.g., 'd-1234567890abcdef')
   * @param options.values - Dynamic data to populate template variables
   * @throws Error if SendGrid API call fails or if SENDGRID_API_KEY is missing
   * @returns Promise that resolves when email is queued for sending
   *
   * @example
   * ```typescript
   * // Send with SendGrid template
   * await sendGridProvider.send({
   *   to: 'customer@example.com',
   *   from: 'sales@dinoapp.com',
   *   subject: 'Your Order Confirmation',
   *   templateId: 'd-abc123def456',
   *   values: {
   *     orderNumber: '12345',
   *     customerName: 'Jane Smith',
   *     items: ['Product A', 'Product B'],
   *     total: '$99.99',
   *     trackingLink: 'https://track.example.com/12345'
   *   }
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Send to multiple recipients
   * await sendGridProvider.send({
   *   to: ['user1@example.com', 'user2@example.com'],
   *   cc: 'manager@company.com',
   *   from: 'newsletter@dinoapp.com',
   *   subject: 'Monthly Newsletter',
   *   templateId: 'd-newsletter2024',
   *   values: {
   *     month: 'January',
   *     highlights: ['New Feature Launch', 'Customer Success Story']
   *   }
   * });
   * ```
   */
  async send(options: EmailOptions): Promise<void> {
    try {
      await sgMail.send({
        to: options.to,
        from: options.from,
        subject: options.subject,
        text: options.text || '',
        cc: options.cc as string | string[],
        bcc: options.bcc as string | string[],
        templateId: options.templateId || 'default-template-id',
        // SendGrid uses dynamic_template_data instead of inline HTML
        // Pass values as template data for SendGrid templates
        dynamicTemplateData: options.values || {},
      });

      this.logger.log(`Email sent via SendGrid: ${options.subject}`);
    } catch (error) {
      this.logger.error(`SendGrid send failed: ${options.subject}`, error);
      throw error;
    }
  }
}
