import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppMailerService {
  constructor(private readonly mailerService: MailerService) { }
  
  async sendOtpEmail(receipientEmail: string, otp: string) {
    await this.mailerService.sendMail({
      to: receipientEmail,
      subject: 'Your Payment OTP',
      template: 'otp-page',
      context: {
        otp,
      },
    })
  }
}
