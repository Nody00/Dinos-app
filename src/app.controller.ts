import { Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { EmailService } from './email/email.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test-email')
  async sendTestEmail(@Query('to') to: string) {
    if (!to) {
      return { error: 'Please provide a "to" query parameter' };
    }

    await this.emailService.send({
      to: to,
      subject: 'Test Email from NestJS',
      text: 'Hello! This is a test email from your NestJS application.',
      values: {
        welcomeMessage: 'Welcome to Dino App!',
        userName: 'Test User',
        accountStatus: 'Active',
        emailVerified: true,
        registrationDate: new Date().toLocaleDateString(),
        features: ['Email Notifications', 'User Dashboard', 'API Access'],
        supportLink: 'https://support.dinoapp.com',
      },
    });

    return {
      success: true,
      message: `Test email sent to ${to}`,
      note: 'Check MailHog at http://localhost:8025',
    };
  }
}
