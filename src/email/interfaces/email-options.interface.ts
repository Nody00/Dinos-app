import { Attachment } from 'nodemailer/lib/mailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  values?: Record<string, any>;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Attachment[];
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: {
    email: string;
    name: string;
  };
}
