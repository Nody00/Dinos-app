import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AppService } from './app.service';
import { EmailService } from './email/email.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns a simple health check message to verify the API is running',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test-email')
  @ApiOperation({
    summary: 'Send test email',
    description: 'Sends a test email to the specified address (development only)',
  })
  @ApiQuery({
    name: 'to',
    description: 'Email address to send the test email to',
    example: 'test@example.com',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Test email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Test email sent to test@example.com' },
        note: { type: 'string', example: 'Check MailHog at http://localhost:8025' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing email parameter',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Please provide a "to" query parameter' },
      },
    },
  })
  async sendTestEmail(@Query('to') to: string) {
    if (!to) {
      return { error: 'Please provide a "to" query parameter' };
    }

    await this.emailService.send({
      to: 'dinokrcic2077@gmail.com',
      from: 'dinoapp@yourapp.com',
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
      templateId: 'd-fbf5d6cc201f4297a27bf00b10bee2d2',
    });

    return {
      success: true,
      message: `Test email sent to ${to}`,
      note: 'Check MailHog at http://localhost:8025',
    };
  }
}
