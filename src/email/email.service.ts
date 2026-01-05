import { Injectable, Logger } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import {
  EmailConfig,
  EmailOptions,
} from './interfaces/email-options.interface';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import createGenericTemplate from './templates/generic-template.factory';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly emailConfig: EmailConfig;

  constructor(private configService: ConfigService) {
    this.emailConfig = {
      host: this.configService.get<string>('SMTP_HOST') || 'localhost',
      port: this.configService.get<number>('SMTP_PORT') || 1025,
      secure: this.configService.get<boolean>('SMTP_SECURE') === true,
      auth: this.getAuthConfig(),
      from: {
        email:
          this.configService.get<string>('SMTP_FROM_EMAIL ') ||
          'noreply@dinoapp.com',
        name: this.configService.get<string>('SMTP_FROM_NAME') || 'Dino App',
      },
    };

    this.transporter = nodemailer.createTransport({
      host: this.emailConfig.host,
      port: this.emailConfig.port,
      secure: this.emailConfig.secure,
      auth: this.emailConfig.auth,
    });

    this.logger.log(
      `EmailService initialized with SMTP server at ${this.emailConfig.host}`,
    );
  }

  private getAuthConfig() {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    if (user && pass) {
      return { user, pass };
    }

    return undefined;
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const fromEmail =
        options.from || `${this.emailConfig.from.name} <${this.emailConfig.from.email}>`;
      const toEmail = Array.isArray(options.to) ? options.to[0] : options.to;

      const mailOptions = {
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: createGenericTemplate(
          options.values || {},
          this.emailConfig.from.email,
          toEmail,
        ),
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email ${options.subject}`, error);
    }
  }

  //   TODO: Implement this later
  //   async sendBulk(emails: EmailOptions[]): Promise<void> {
  //     try {
  //       await Promise.all(emails.map((email) => this.send(email)));
  //       this.logger.log(`Bulk email sent successfully. Count: ${emails.length}`);
  //     } catch (error) {
  //       this.logger.error('Failed to send bulk emails', error.stack);
  //       throw error;
  //     }
  //   }
}
