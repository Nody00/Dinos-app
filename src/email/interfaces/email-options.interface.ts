import { Attachment } from 'nodemailer/lib/mailer';

/**
 * Email options for sending emails through the email service.
 *
 * @example
 * ```typescript
 * // Simple email with SMTP provider
 * const options: EmailOptions = {
 *   to: 'user@example.com',
 *   from: 'noreply@dinoapp.com',
 *   subject: 'Welcome to Dino App',
 *   text: 'Thank you for joining!',
 *   values: {
 *     userName: 'John Doe',
 *     activationLink: 'https://app.com/activate/123'
 *   }
 * };
 *
 * // Email with SendGrid template
 * const sendGridOptions: EmailOptions = {
 *   to: ['user1@example.com', 'user2@example.com'],
 *   from: 'noreply@dinoapp.com',
 *   subject: 'Monthly Newsletter',
 *   templateId: 'd-1234567890abcdef',
 *   values: {
 *     month: 'January',
 *     highlights: ['Feature 1', 'Feature 2']
 *   }
 * };
 *
 * // Email with attachments and CC
 * const advancedOptions: EmailOptions = {
 *   to: 'customer@example.com',
 *   from: 'support@dinoapp.com',
 *   subject: 'Invoice #12345',
 *   cc: 'accounting@dinoapp.com',
 *   bcc: 'archive@dinoapp.com',
 *   text: 'Please find your invoice attached.',
 *   attachments: [
 *     {
 *       filename: 'invoice.pdf',
 *       path: '/path/to/invoice.pdf'
 *     }
 *   ]
 * };
 * ```
 */
export interface EmailOptions {
  /** Recipient email address(es). Can be a single email or array of emails. */
  to: string | string[];

  /** Email subject line. */
  subject: string;

  /** Plain text version of the email content. Optional but recommended for accessibility. */
  text?: string;

  /**
   * Dynamic values to be used in email templates.
   * - For SMTP provider: Values are rendered in the generic HTML template
   * - For SendGrid provider: Values are passed as dynamicTemplateData
   *
   * @example
   * ```typescript
   * values: {
   *   userName: 'John Doe',
   *   orderNumber: '12345',
   *   orderDate: '2024-01-15',
   *   isVerified: true,
   *   items: ['Product A', 'Product B']
   * }
   * ```
   */
  values?: Record<string, any>;

  /** Sender email address. Will use default from config if not provided. */
  from: string;

  /** Carbon copy recipient(s). Can be a single email or array of emails. */
  cc?: string | string[];

  /** Blind carbon copy recipient(s). Recipients in 'to' and 'cc' won't see these addresses. */
  bcc?: string | string[];

  /** File attachments. Uses nodemailer's Attachment type. */
  attachments?: Attachment[];

  /**
   * SendGrid dynamic template ID. Only used when EMAIL_PROVIDER=sendgrid.
   * Create templates in SendGrid dashboard and reference them here.
   *
   * @example 'd-1234567890abcdef'
   */
  templateId?: string;
}

/**
 * SMTP configuration for the email service.
 * Used internally by the SmtpEmailProvider to configure nodemailer transport.
 *
 * @internal
 */
export interface EmailConfig {
  /** SMTP server hostname (e.g., 'localhost', 'smtp.gmail.com'). */
  host: string;

  /** SMTP server port (e.g., 1025 for MailHog, 587 for TLS, 465 for SSL). */
  port: number;

  /** Whether to use TLS/SSL encryption. Set to false for MailHog. */
  secure: boolean;

  /** SMTP authentication credentials. Optional for services like MailHog. */
  auth?: {
    /** SMTP username. */
    user: string;
    /** SMTP password. */
    pass: string;
  };

  /** Default sender information. */
  from: {
    /** Default sender email address. */
    email: string;
    /** Default sender display name. */
    name: string;
  };
}
